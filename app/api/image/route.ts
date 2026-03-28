import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt')
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const apiKey = process.env.POLLINATIONS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Image generation not configured' }, { status: 500 })
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&model=flux&key=${apiKey}`

  const res = await fetch(url, { redirect: 'follow' })

  if (!res.ok) {
    return NextResponse.json({ error: 'Image generation failed' }, { status: res.status })
  }

  const imageBuffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'image/jpeg'

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
