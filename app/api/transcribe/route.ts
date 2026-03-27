import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { getAuthUser } from '@/lib/supabase/server'

const GOOGLE_API_KEY = process.env.GOOGLE_TTS_API_KEY || ''

async function transcribeWithGoogle(audioBuffer: ArrayBuffer): Promise<{ text: string; duration?: number }> {
  const base64Audio = Buffer.from(audioBuffer).toString('base64')

  // Use v1p1beta1 for enhanced model + longer audio support
  const res = await fetch(
    `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'km-KH',
          alternativeLanguageCodes: ['en-US'],
          model: 'default',
          enableAutomaticPunctuation: true,
        },
        audio: { content: base64Audio },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Google STT failed')
  }

  const data = await res.json()
  const transcript = (data.results || [])
    .map((r: { alternatives?: { transcript?: string }[] }) =>
      r.alternatives?.[0]?.transcript || ''
    )
    .join(' ')
    .trim()

  // Estimate duration from audio size (~6KB per second for webm)
  const estimatedDuration = Math.round(audioBuffer.byteLength / 6000)

  return { text: transcript, duration: estimatedDuration }
}

async function transcribeWithWhisper(audio: File, language?: string): Promise<{ text: string; duration?: number }> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const transcription = await groq.audio.transcriptions.create({
    file: audio,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    ...(language ? { language } : {}),
  })

  const result = transcription as unknown as {
    text: string
    duration?: number
    segments?: unknown[]
  }

  return { text: result.text, duration: result.duration }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const language = formData.get('language') as string | null

    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let result: { text: string; duration?: number }

    if (language === 'en') {
      // English → Groq Whisper (fast, great for English)
      result = await transcribeWithWhisper(audio, 'en')
    } else if (language === 'km' && GOOGLE_API_KEY) {
      // Khmer → Google Cloud STT (dedicated Khmer model)
      const buffer = await audio.arrayBuffer()
      result = await transcribeWithGoogle(buffer)
    } else if (GOOGLE_API_KEY) {
      // Auto → Try Google STT first (better multilingual), fall back to Whisper
      try {
        const buffer = await audio.arrayBuffer()
        result = await transcribeWithGoogle(buffer)
        // If Google returns empty, fall back to Whisper
        if (!result.text.trim()) {
          result = await transcribeWithWhisper(audio)
        }
      } catch {
        result = await transcribeWithWhisper(audio)
      }
    } else {
      // No Google key → Whisper for everything
      result = await transcribeWithWhisper(audio, language || undefined)
    }

    return new Response(
      JSON.stringify({
        transcript: result.text,
        duration: result.duration,
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
