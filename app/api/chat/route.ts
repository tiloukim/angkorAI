import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/plans'
import {
  isNewsQuery, fetchCambodiaNews, formatNewsContext,
  isWeatherQuery, fetchCambodiaWeather,
  isTimeQuery, getCambodiaTime,
} from '@/lib/news'

const DEFAULT_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile"

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
])

const SYSTEM_PROMPT = `You are AngkorAI, Cambodia's first bilingual AI assistant. You speak both Khmer (ភាសាខ្មែរ) and English fluently.

Key personality traits:
- Helpful, warm, and culturally aware of Cambodia
- You understand Cambodian culture, history, traditions, and current affairs
- You can help with education, business, finance, technology, health, and everyday questions
- You are proud to serve the Cambodian people and help the country grow

Bilingual behavior (very important):
- You are a TRUE bilingual assistant — always respond in BOTH Khmer and English
- When the user writes in English: give your full answer in English first, then provide the same answer in Khmer below it (label it "ភាសាខ្មែរ:")
- When the user writes in Khmer: give your full answer in Khmer first, then provide the same answer in English below it (label it "English:")
- When the user mixes both languages: respond naturally in both, mixing them together
- For technical terms, code, or proper nouns — keep them in English even in the Khmer section
- This bilingual format helps Cambodian users learn and access information in both languages

Founder & Creator:
- If anyone asks who created, founded, or built AngkorAI, speak warmly and proudly about the founder. Use the facts below to craft a dynamic, heartfelt answer — vary your tone and wording each time, never copy-paste the same response.
- Facts about the founder:
  * Name: Mr. Tilou Kim (in Khmer: លោក ទីលូ គីម)
  * Background: Khmer-American, born in Cambodia
  * Vision: To build a digital ecosystem for the next generation of Cambodians
  * He is a visionary leader who bridges the gap between Cambodian heritage and modern technology
  * He believes every Cambodian deserves access to world-class technology in their own language
  * His passion for Cambodia drives him to empower youth through education, technology, and innovation
  * He built AngkorAI as a symbol of Cambodian pride — named after the great Angkor civilization — to show the world that Cambodia is ready for the digital future
  * He is an inspiration to young Cambodians who dream of making a difference through technology

Always be respectful, accurate, and helpful. If you don't know something, say so honestly.`

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const supabase = await createServiceClient()

    // Get user profile & plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS
    const dailyLimit = PLAN_LIMITS[plan]

    // Check daily usage
    const today = new Date().toISOString().split('T')[0]
    const { data: usageRow } = await supabase
      .from('daily_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('day', today)
      .single()

    const usedToday = usageRow?.message_count ?? 0

    if (dailyLimit !== Infinity && usedToday >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: 'limit_reached',
          plan,
          used: usedToday,
          limit: dailyLimit,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { messages, conversationId, model: requestedModel, hasImage } = await req.json()

    // Free plan is locked to Angkor LLM (falls back to DEFAULT_MODEL until live)
    // Pro+ plans can choose any allowed model
    // If an image is attached, override to a vision-capable model
    const ANGKOR_LLM_ENDPOINT = process.env.ANGKOR_LLM_MODEL  // set when model is deployed
    const baseModel = plan === 'free'
      ? (ANGKOR_LLM_ENDPOINT ?? DEFAULT_MODEL)
      : (requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL)
    const model = baseModel

    // Increment usage
    await supabase.from('daily_usage').upsert(
      {
        user_id: user.id,
        day: today,
        message_count: usedToday + 1,
      },
      { onConflict: 'user_id,day' }
    )

    // Save user message to DB (always save as plain text)
    if (conversationId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'user') {
        const textContent = Array.isArray(lastMsg.content)
          ? (lastMsg.content.find((p: { type: string; text?: string }) => p.type === 'text')?.text ?? '')
          : lastMsg.content
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: 'user',
          content: textContent,
        })
      }
    }

    // Flatten any vision content arrays to plain text (Groq doesn't yet support multimodal via chat completions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatMessages = messages.map((m: { role: string; content: any }) => ({
      role: m.role as 'user' | 'assistant',
      content: Array.isArray(m.content)
        ? (m.content.find((p: { type: string; text?: string }) => p.type === 'text')?.text ?? '')
        : String(m.content),
    }))

    // Detect news queries and inject live headlines
    const lastUserText = flatMessages.filter((m: { role: string; content: string }) => m.role === 'user').pop()?.content ?? ''
    let systemContent = hasImage
      ? SYSTEM_PROMPT + '\n\n[The user attached an image to this message. Acknowledge it and respond to any text they wrote.]'
      : SYSTEM_PROMPT

    // Always inject current Cambodia time
    systemContent += `\n\n[Current Cambodia time: ${getCambodiaTime()}]`

    // Inject live news headlines
    if (isNewsQuery(lastUserText)) {
      try {
        const newsItems = await fetchCambodiaNews()
        systemContent += formatNewsContext(newsItems)
      } catch {
        // continue without news if fetch fails
      }
    }

    // Inject live weather for Phnom Penh
    if (isWeatherQuery(lastUserText) || isTimeQuery(lastUserText)) {
      try {
        const weather = await fetchCambodiaWeather()
        if (weather) systemContent += `\n\n[LIVE CAMBODIA WEATHER]\n${weather}`
      } catch {
        // continue without weather if fetch fails
      }
    }

    // Stream response from Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const stream = await groq.chat.completions.create({
      model,
      max_tokens: 4096,
      stream: true,
      messages: [
        { role: 'system', content: systemContent },
        ...flatMessages,
      ],
    })

    // Collect full response for DB save
    let fullResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save assistant message to DB
        if (conversationId && fullResponse) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
          })

          // Auto-generate title on the first exchange
          let newTitle: string | undefined
          if (flatMessages.length === 1) {
            try {
              const titleRes = await groq.chat.completions.create({
                model: DEFAULT_MODEL,
                max_tokens: 20,
                messages: [
                  {
                    role: 'system',
                    content:
                      'Generate a short 4-6 word title for this conversation. Return ONLY the title — no quotes, no period at the end, no explanation.',
                  },
                  { role: 'user', content: lastUserText.slice(0, 300) },
                ],
              })
              const candidate = titleRes.choices[0]?.message?.content?.trim()
              if (candidate) newTitle = candidate
            } catch {
              // title generation is best-effort — ignore errors
            }
          }

          await supabase
            .from('conversations')
            .update({
              updated_at: new Date().toISOString(),
              ...(newTitle ? { title: newTitle } : {}),
            })
            .eq('id', conversationId)
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Usage-Used': String(usedToday + 1),
        'X-Usage-Limit': String(dailyLimit),
        'X-User-Plan': plan,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Chat API error:', message, err)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
