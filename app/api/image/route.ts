import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { IMAGE_LIMITS, type Plan } from '@/lib/plans'

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || ''
const IMAGE_MODEL = 'black-forest-labs/flux-schnell'

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

  const plan = (profile?.plan ?? 'free') as Plan
  const imageLimit = IMAGE_LIMITS[plan] ?? 0

  if (imageLimit === 0) {
    return NextResponse.json({ error: 'Image generation requires an Education or Pro plan. Upgrade to unlock this feature!' }, { status: 403 })
  }

  // Check daily image usage for plans with limits
  if (imageLimit !== Infinity) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('image_count')
      .eq('user_id', user.id)
      .eq('day', today)
      .single()

    const usedImages = usage?.image_count ?? 0
    if (usedImages >= imageLimit) {
      return NextResponse.json({
        error: `You've used all ${imageLimit} image generations for today. Upgrade to Pro for unlimited images!`,
      }, { status: 429 })
    }

    // Increment image count
    await supabase.from('daily_usage').upsert(
      { user_id: user.id, day: today, image_count: usedImages + 1 },
      { onConflict: 'user_id,day' }
    )
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
