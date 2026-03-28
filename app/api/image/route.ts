import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || ''
const IMAGE_MODEL = 'luma/photon-flash'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan === 'free') {
    return NextResponse.json({ error: 'Pro plan required for image generation' }, { status: 403 })
  }

  const prompt = req.nextUrl.searchParams.get('prompt')
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  if (!REPLICATE_API_KEY) {
    return NextResponse.json({ error: 'Image generation not configured' }, { status: 500 })
  }

  // Create prediction
  const createRes = await fetch(`https://api.replicate.com/v1/models/${IMAGE_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: { prompt } }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail || 'Image generation failed' }, { status: createRes.status })
  }

  const prediction = await createRes.json()

  // Poll for completion (images are fast, ~5-10s)
  let result = prediction
  let attempts = 0
  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1000))
    attempts++
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
    })
    if (pollRes.ok) result = await pollRes.json()
  }

  if (result.status !== 'succeeded' || !result.output) {
    return NextResponse.json({ error: result.error || 'Image generation failed' }, { status: 500 })
  }

  // Fetch the generated image and proxy it
  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch generated image' }, { status: 502 })
  }

  const imageBuffer = await imageRes.arrayBuffer()
  const contentType = imageRes.headers.get('content-type') || 'image/jpeg'

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
