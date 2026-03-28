import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'

const GOOGLE_TTS_KEY = process.env.GOOGLE_TTS_API_KEY

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    if (!GOOGLE_TTS_KEY) {
      return new Response(
        JSON.stringify({ error: 'TTS not configured. Add GOOGLE_TTS_API_KEY to your .env.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { text } = await req.json()
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 })
    }

    // Strip Khmer text — Google TTS doesn't support km-KH
    // Keep only English/Latin text for TTS
    let ttsText = text
      .replace(/[\u1780-\u17FF\u19E0-\u19FF\u200B-\u200D]+/g, '') // Remove Khmer characters & zero-width
      .replace(/\s{2,}/g, ' ')  // Collapse extra whitespace
      .trim()

    if (!ttsText) {
      return new Response(
        JSON.stringify({ error: 'Khmer text-to-speech is not yet available. Only English portions can be read aloud.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const langCode = 'en-US'

    // Dynamically fetch the first available voice
    const voicesRes = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?languageCode=${langCode}&key=${GOOGLE_TTS_KEY}`
    )
    const voicesData = await voicesRes.json()
    const voices: { name: string; ssmlGender: string }[] = voicesData.voices ?? []

    // Prefer WaveNet > Standard > any available
    const preferredVoice =
      voices.find((v) => v.name.includes('Wavenet')) ??
      voices.find((v) => v.name.includes('Standard')) ??
      voices[0]

    if (!preferredVoice) {
      console.error(`No TTS voice found for ${langCode}. Available:`, voicesData)
      return new Response(
        JSON.stringify({ error: `No voice available for language: ${langCode}` }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`TTS: using voice ${preferredVoice.name} for ${langCode}`)

    const voice = { languageCode: langCode, name: preferredVoice.name }

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: ttsText.slice(0, 4500) },
          voice,
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Google TTS error:', err)
      return new Response(JSON.stringify({ error: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify({ audio: data.audioContent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('TTS route error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
