import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return null
  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_owner')
    .eq('id', user.id)
    .single()
  if (!profile?.is_owner) return null
  return user
}

// GET: List pending edu applications
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const status = req.nextUrl.searchParams.get('status') || 'pending'

  const { data: apps, error } = await supabase
    .from('edu_applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate signed URLs for ID images
  const appsWithUrls = await Promise.all(
    (apps ?? []).map(async (app) => {
      let idUrl = null
      if (app.id_file_path) {
        const { data } = await supabase.storage
          .from('edu-ids')
          .createSignedUrl(app.id_file_path, 3600)
        idUrl = data?.signedUrl ?? null
      }
      return { ...app, id_url: idUrl }
    })
  )

  return NextResponse.json({ applications: appsWithUrls })
}

// POST: Approve or reject application
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, application_id } = await req.json()
  if (!application_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Get the application
  const { data: app } = await supabase
    .from('edu_applications')
    .select('*')
    .eq('id', application_id)
    .single()

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  if (action === 'approve') {
    // Update application status
    await supabase
      .from('edu_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', application_id)

    // Upgrade user to edu plan
    await supabase
      .from('profiles')
      .update({ plan: 'edu' })
      .eq('id', app.user_id)

    return NextResponse.json({ success: true, action: 'approved' })
  } else {
    // Reject
    await supabase
      .from('edu_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq('id', application_id)

    // Keep as free plan
    await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', app.user_id)

    return NextResponse.json({ success: true, action: 'rejected' })
  }
}
