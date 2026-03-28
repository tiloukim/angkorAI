import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { getAuthUser } from '@/lib/supabase/server'

const DEFAULT_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile'
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || ''
const CEREBRAS_MODEL = 'qwen-3-235b-a22b-instruct-2507'

const SUMMARY_PROMPT = `You are AngkorAI Meeting Summarizer. Given a meeting transcript, produce a clear, structured BILINGUAL summary in both English and Khmer (ភាសាខ្មែរ).

CRITICAL: The Khmer text MUST use proper Khmer Unicode script (U+1780–U+17FF). Do NOT use Thai, Lao, Myanmar, or any other script. If you are unsure how to write something in Khmer, write it in English instead. Never output garbled or incorrect characters.

Format your response EXACTLY like this:

## Meeting Summary / សង្ខេបកិច្ចប្រជុំ

**Duration / រយៈពេល:** [duration if known]

### Key Points / ចំណុចសំខាន់ៗ
- [English point 1]
  [Khmer translation of point 1]
- [English point 2]
  [Khmer translation of point 2]

### Action Items / កិច្ចការត្រូវធ្វើ
- [ ] [English action item]
  [Khmer translation]
- [ ] [English action item 2]
  [Khmer translation]

### Decisions Made / ការសម្រេចចិត្ត
- [English decision]
  [Khmer translation]

### Notes / កំណត់សម្គាល់
[English notes]

[Khmer notes]

Rules:
- Write each point first in English, then on the NEXT LINE write the Khmer translation
- Section headers must be bilingual separated by " / " as shown above
- Use ONLY proper Khmer script (ក ខ គ ឃ ង ច ឆ ជ ឈ ញ etc.) — never Thai or Lao
- Be concise but thorough
- If names are mentioned, attribute action items to them
- If no clear action items or decisions, omit those sections
- Keep bullet points short and actionable
- For technical terms, keep them in English even in the Khmer portion
- People's names should stay in English (Latin script) in both versions`

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { transcript, duration } = await req.json()

    if (!transcript) {
      return new Response(JSON.stringify({ error: 'No transcript provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const durationNote = duration ? `\n\nMeeting duration: ${Math.round(duration / 60)} minutes` : ''
    const messages = [
      { role: 'system' as const, content: SUMMARY_PROMPT },
      { role: 'user' as const, content: `Please summarize this meeting transcript:${durationNote}\n\n${transcript}` },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stream: AsyncIterable<any>

    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      stream = await groq.chat.completions.create({
        model: DEFAULT_MODEL,
        max_tokens: 4096,
        stream: true,
        messages,
      })
    } catch (groqErr) {
      console.error('Groq failed in summarize, falling back to Cerebras:', groqErr)
      if (!CEREBRAS_API_KEY) throw groqErr
      const cerebras = new OpenAI({
        apiKey: CEREBRAS_API_KEY,
        baseURL: 'https://api.cerebras.ai/v1',
      })
      stream = await cerebras.chat.completions.create({
        model: CEREBRAS_MODEL,
        max_tokens: 4096,
        stream: true,
        messages,
      })
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
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
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Summarize API error:', message)
    return new Response(JSON.stringify({ error: 'Summarization failed', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
