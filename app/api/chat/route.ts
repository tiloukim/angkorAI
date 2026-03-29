import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/plans'
import {
  isNewsQuery, fetchCambodiaNews, formatNewsContext,
  isWeatherQuery, fetchCambodiaWeather,
  isTimeQuery, getCambodiaTime,
} from '@/lib/news'

const DEFAULT_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile"
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || ""
const CEREBRAS_MODEL = "qwen-3-235b-a22b-instruct-2507"
const ANGKOR_LLM_MODEL = process.env.ANGKOR_LLM_MODEL || ""  // e.g. "tiloukim/angkor-llm-7b"
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || ""
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || ""

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'angkor-llm',
  ...(ANGKOR_LLM_MODEL ? [ANGKOR_LLM_MODEL] : []),
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

const MEDIA_PROMPT = `
Image Generation:
- You can generate images! When a user asks you to create, generate, draw, or make an image/picture/photo, respond with a brief description followed by the image tag.
- Use this EXACT format to generate an image: ![image](POLLINATIONS:detailed english prompt here)
- The prompt after POLLINATIONS: should be a detailed, descriptive English prompt for the image (even if the user asked in Khmer)
- Example: User says "draw me Angkor Wat at sunset" → You respond: "Here's Angkor Wat at sunset! 🎨\n\n![Angkor Wat at sunset](POLLINATIONS:Angkor Wat temple at golden sunset, dramatic orange sky, reflections in water, photorealistic, beautiful landscape photography)"
- Always write the prompt in English for best image quality
- Make the prompt detailed and descriptive for better results
- After the image tag, add a short bilingual description

Video Generation:
- You can generate short AI videos! When a user asks to create, generate, or make a video/animation/clip, respond with a brief description followed by the video tag.
- Use this EXACT format to generate a video: ![video](VIDEO:detailed english prompt here)
- The prompt after VIDEO: should be a detailed, descriptive English prompt for the video (even if the user asked in Khmer)
- Example: User says "make a video of Angkor Wat" → You respond: "Here's a video of Angkor Wat! 🎬\n\n![Angkor Wat video](VIDEO:Angkor Wat temple with clouds moving slowly, birds flying, golden sunlight, cinematic drone shot, smooth camera movement)"
- Always write the prompt in English for best quality
- Make the prompt detailed with motion/action descriptions for better results
- Note: Video generation takes about 1-2 minutes to complete
- After the video tag, add a short bilingual description`

const EDU_MEDIA_MSG = `
Image Generation:
- You can generate images! Education plan users get 5 image generations per day.
- Use this EXACT format to generate an image: ![image](POLLINATIONS:detailed english prompt here)
- The prompt after POLLINATIONS: should be a detailed, descriptive English prompt for the image (even if the user asked in Khmer)
- Always write the prompt in English for best image quality
- Make the prompt detailed and descriptive for better results
- After the image tag, add a short bilingual description
- If the user has reached their daily image limit, let them know they can upgrade to Pro for unlimited images.

Video Generation:
- Video generation is a Pro feature. If an Education plan user asks to generate a video, politely let them know: "Video generation is available for Pro users! Upgrade to Pro to unlock AI video creation. 🎬"
- Respond in both English and Khmer as usual.`

const FREE_MEDIA_MSG = `
Image & Video Generation:
- Image and video generation requires an Education or Pro plan.
- If a free user asks to generate an image, video, or animation, politely let them know:
  "Image generation is free for students, teachers, and government workers on the Education plan! Or upgrade to Pro for unlimited images and video creation. 🎨🎬"
- Mention the Education plan signup at /signup/edu
- Respond in both English and Khmer as usual.`

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

    // Free plan uses Angkor LLM (falls back to Groq if not configured)
    // Pro+ plans can choose Angkor LLM or AngkorAI (Groq)
    const useAngkorLLM = ANGKOR_LLM_MODEL && RUNPOD_ENDPOINT_ID && RUNPOD_API_KEY
    const wantsAngkorLLM = requestedModel === 'angkor-llm' || requestedModel === ANGKOR_LLM_MODEL
    const baseModel = plan === 'free'
      ? (useAngkorLLM ? ANGKOR_LLM_MODEL : DEFAULT_MODEL)
      : (wantsAngkorLLM && useAngkorLLM ? ANGKOR_LLM_MODEL
        : (requestedModel && ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL))
    const model = baseModel
    const isRunPod = useAngkorLLM && model === ANGKOR_LLM_MODEL

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

    // Keep vision content for the last user message if it has an image; flatten the rest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatMessages = messages.map((m: { role: string; content: any }, idx: number) => {
      const isLastUser = idx === messages.length - 1 && m.role === 'user'
      if (Array.isArray(m.content) && isLastUser && hasImage) {
        // Keep multimodal content for vision model
        return { role: m.role as 'user' | 'assistant', content: m.content }
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: Array.isArray(m.content)
          ? (m.content.find((p: { type: string; text?: string }) => p.type === 'text')?.text ?? '')
          : String(m.content),
      }
    })

    // Detect news queries and inject live headlines
    const lastUserMsg = flatMessages.filter((m: { role: string; content: unknown }) => m.role === 'user').pop()
    const lastUserText = typeof lastUserMsg?.content === 'string'
      ? lastUserMsg.content
      : (Array.isArray(lastUserMsg?.content)
          ? (lastUserMsg.content.find((p: { type: string; text?: string }) => p.type === 'text')?.text ?? '')
          : '')
    const mediaInstructions = plan === 'free' ? FREE_MEDIA_MSG : plan === 'edu' ? EDU_MEDIA_MSG : MEDIA_PROMPT
    let systemContent = hasImage
      ? SYSTEM_PROMPT + mediaInstructions + '\n\n[The user attached an image to this message. Acknowledge it and respond to any text they wrote.]'
      : SYSTEM_PROMPT + mediaInstructions

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

    // For vision requests, use a shorter system prompt to stay within limits
    const visionSystemContent = `You are AngkorAI, Cambodia's bilingual AI assistant. You speak Khmer and English. Describe and respond to the user's image and text. Be helpful and concise.`

    // Build chat messages — for vision, only include system + the last user message with image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chatMessages: any[]
    if (hasImage) {
      // Vision: minimal context to avoid SDK issues
      const lastMsg = flatMessages[flatMessages.length - 1]
      chatMessages = [
        { role: 'system', content: visionSystemContent },
        lastMsg,
      ]
    } else {
      // Regular chat: full conversation history
      chatMessages = [
        { role: 'system', content: systemContent },
        ...flatMessages.map((m: { role: string; content: unknown }) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : String(m.content),
        })),
      ]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stream: AsyncIterable<any>

    if (isRunPod) {
      // RunPod vLLM endpoint — OpenAI-compatible API
      // Falls back to Groq if RunPod times out (cold start)
      try {
        const runpod = new OpenAI({
          apiKey: RUNPOD_API_KEY,
          baseURL: `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/openai/v1`,
          timeout: 30_000, // 30s timeout — cold starts can take longer
        })
        stream = await runpod.chat.completions.create({
          model: ANGKOR_LLM_MODEL,
          max_tokens: 2048,
          stream: true,
          messages: chatMessages,
        })
      } catch (runpodErr) {
        console.error('RunPod failed, falling back to Groq:', runpodErr)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        stream = await groq.chat.completions.create({
          model: DEFAULT_MODEL,
          max_tokens: 4096,
          stream: true,
          messages: chatMessages,
        })
      }
    } else if (hasImage) {
      // Vision request — use raw fetch (Groq SDK doesn't support multimodal content)
      const visionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 4096,
          stream: true,
          messages: chatMessages,
        }),
      })

      if (!visionRes.ok || !visionRes.body) {
        const err = await visionRes.text().catch(() => 'Vision request failed')
        throw new Error(err)
      }

      // Convert fetch ReadableStream to async iterable
      const visionReader = visionRes.body.getReader()
      const visionDecoder = new TextDecoder()
      stream = {
        async *[Symbol.asyncIterator]() {
          let buf = ''
          while (true) {
            const { done, value } = await visionReader.read()
            if (done) break
            buf += visionDecoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
              try {
                yield JSON.parse(line.slice(6))
              } catch {}
            }
          }
        },
      }
    } else {
      // Regular chat: Groq (primary) → Cerebras (fallback)
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        stream = await groq.chat.completions.create({
          model,
          max_tokens: 4096,
          stream: true,
          messages: chatMessages,
        })
      } catch (groqErr) {
        console.error('Groq failed, falling back to Cerebras:', groqErr)
        if (!CEREBRAS_API_KEY) throw groqErr
        const cerebras = new OpenAI({
          apiKey: CEREBRAS_API_KEY,
          baseURL: 'https://api.cerebras.ai/v1',
        })
        stream = await cerebras.chat.completions.create({
          model: CEREBRAS_MODEL,
          max_tokens: 4096,
          stream: true,
          messages: chatMessages,
        })
      }
    }

    // Collect full response for DB save
    let fullResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content ?? ''
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
              const titleGroq = new Groq({ apiKey: process.env.GROQ_API_KEY })
              const titleRes = await titleGroq.chat.completions.create({
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
