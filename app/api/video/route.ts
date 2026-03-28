import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || ''
const VIDEO_MODEL = 'wan-video/wan-2.1-1.3b'

async function requirePro(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return { error: 'Unauthorized', status: 401 }
  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!profile || profile.plan === 'free' || profile.plan === 'edu') return { error: 'Video generation requires a Pro plan. Upgrade to Pro to unlock AI video creation!', status: 403 }
  return null
}

export async function POST(req: NextRequest) {
  const denied = await requirePro(req)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }
  if (!REPLICATE_API_KEY) {
    return NextResponse.json({ error: 'Video generation not configured' }, { status: 500 })
  }

  // Create prediction
  const res = await fetch(`https://api.replicate.com/v1/models/${VIDEO_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: { prompt } }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail || 'Failed to start video generation' }, { status: res.status })
  }

  const prediction = await res.json()
  return NextResponse.json({ id: prediction.id, status: prediction.status })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing prediction id' }, { status: 400 })
  }
  if (!REPLICATE_API_KEY) {
    return NextResponse.json({ error: 'Video generation not configured' }, { status: 500 })
  }

  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: res.status })
  }

  const prediction = await res.json()
  return NextResponse.json({
    status: prediction.status,
    output: prediction.output || null,
    error: prediction.error || null,
  })
}
