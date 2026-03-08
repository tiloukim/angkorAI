import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const ZODIAC_ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
]

function singlePrompt(lang: string) {
  const langRule = lang === 'kh'
    ? '- IMPORTANT: Respond entirely in Khmer (ភាសាខ្មែរ). Use poetic Khmer language.'
    : '- Respond in English.'

  return `You are a mystical Khmer love fortune teller at a temple in Angkor. You give romantic daily love horoscopes based on the Chinese/Khmer zodiac animal signs.

Rules:
- Keep your reading to 3-4 sentences
- Be poetic, romantic, and mystical
- Reference Cambodian culture or Angkor imagery when fitting
- End with a romantic piece of advice
- Always be positive and encouraging about love
${langRule}`
}

function compatibilityPrompt(sign1: string, sign2: string, lang: string) {
  const isSnakeGoat =
    (sign1 === 'Snake' && sign2 === 'Goat') ||
    (sign1 === 'Goat' && sign2 === 'Snake')

  let extra = ''
  if (isSnakeGoat) {
    extra = lang === 'kh'
      ? `\n\nចំណាំពិសេស: ម្សាញ់ និង មមែ គេស្គាល់ថាជា "គូអ្នកមានពាន់លាន" (億萬富翁配對) ក្នុងហោរាចិន! នេះជាគូដែលមានអំណាច និងវាសនាសម្បូរបំផុត។ គូស្វាមីភរិយាពាន់លានជាច្រើនមានការផ្គូផ្គងនេះ។ បញ្ចូលការពិតគួរឱ្យចាប់អារម្មណ៍នេះក្នុងការអានរបស់អ្នក!`
      : `\n\nSPECIAL NOTE: Snake and Goat is known as the "Billionaire Match" (億萬富翁配對) in Chinese astrology! This is one of the most powerful and prosperous pairings. Many billionaire couples share this combination. Weave this fascinating fact into your reading and make it exciting!`
  }

  const langRule = lang === 'kh'
    ? '- IMPORTANT: Respond entirely in Khmer (ភាសាខ្មែរ). Use poetic Khmer language.'
    : '- Respond in English.'

  return `You are a mystical Khmer love fortune teller at a temple in Angkor. You give romantic compatibility readings for pairs of Chinese/Khmer zodiac animal signs.

Rules:
- Give a love compatibility reading for ${sign1} and ${sign2}
- Keep your reading to 4-5 sentences
- Be poetic, romantic, and mystical
- Reference Cambodian culture or Angkor imagery when fitting
- Comment on their romantic chemistry, strengths, and what makes them special together
- End with romantic advice for the pair
- Always be positive and encouraging
${langRule}${extra}`
}

export async function POST(req: NextRequest) {
  try {
    const { sign, type, sign2, lang } = await req.json()

    if (!sign || !ZODIAC_ANIMALS.includes(sign)) {
      return new Response(JSON.stringify({ error: 'Invalid zodiac sign' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'compatibility' && (!sign2 || !ZODIAC_ANIMALS.includes(sign2))) {
      return new Response(JSON.stringify({ error: 'Invalid second zodiac sign' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isCompat = type === 'compatibility' && sign2
    const userLang = lang === 'kh' ? 'kh' : 'en'
    const systemPrompt = isCompat
      ? compatibilityPrompt(sign, sign2, userLang)
      : singlePrompt(userLang)

    const userMessage = isCompat
      ? `Give me a love compatibility fortune for ${sign} and ${sign2}.`
      : `Give me today's love horoscope for the ${sign}.`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const stream = await groq.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 512,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
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
    console.error('Fortune API error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
