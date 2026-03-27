import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { getAuthUser } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const language = formData.get('language') as string | null  // 'en' or 'km'

    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      ...(language ? { language } : {}),
    })

    // verbose_json returns extra fields beyond the base type
    const result = transcription as unknown as {
      text: string
      duration?: number
      segments?: unknown[]
    }

    return new Response(
      JSON.stringify({
        transcript: result.text,
        duration: result.duration,
        segments: result.segments,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Transcribe API error:', message)
    return new Response(JSON.stringify({ error: 'Transcription failed', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
