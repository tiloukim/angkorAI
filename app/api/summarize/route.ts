import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { getAuthUser } from '@/lib/supabase/server'

const DEFAULT_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile'
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || ''
const CEREBRAS_MODEL = 'qwen-3-235b-a22b-instruct-2507'

const SUMMARY_PROMPT = `You are AngkorAI Meeting Summarizer. Given a meeting transcript, produce a clear, structured BILINGUAL summary in both English and Khmer.

Format your response EXACTLY like this:

## Meeting Summary / សង្ខេបកិច្ចប្រជុំ

**Duration / រយៈពេល:** [duration if known]

### Key Points / ចំណុចសំខាន់ៗ
- [English point 1] / [Khmer translation]
- [English point 2] / [Khmer translation]
- [English point 3] / [Khmer translation]

### Action Items / កិច្ចការត្រូវធ្វើ
- [ ] [English action item] / [Khmer translation]
- [ ] [English action item 2] / [Khmer translation]

### Decisions Made / ការសម្រេចចិត្ត
- [English decision] / [Khmer translation]

### Notes / កំណត់សម្គាល់
[English notes]
[Khmer notes]

Rules:
- ALWAYS write every bullet point in BOTH English and Khmer, separated by " / "
- Section headers must be in both languages separated by " / "
- Be concise but thorough
- If names are mentioned, attribute action items to them
- If no clear action items or decisions, omit those sections
- Keep bullet points short and actionable
- For technical terms, keep them in English even in the Khmer portion`

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
