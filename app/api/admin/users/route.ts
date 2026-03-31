import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = await createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('is_owner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_owner) return null
  return user
}

// GET — return email map { userId: email }
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({}, { status: 403 })

  const service = await createServiceClient()
  const { data } = await service.auth.admin.listUsers()

  const emailMap: Record<string, string> = {}
  if (data?.users) {
    for (const u of data.users) {
      emailMap[u.id] = u.email || ''
    }
  }

  return NextResponse.json(emailMap)
}

// PATCH — update user plan
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, plan } = await req.json()
  if (!userId || !plan) {
    return NextResponse.json({ error: 'userId and plan required' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
