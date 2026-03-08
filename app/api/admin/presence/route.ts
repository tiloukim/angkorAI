import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('admin_presence')
    .select('is_online, last_seen')
    .eq('id', 1)
    .single()

  return NextResponse.json({ is_online: data?.is_online ?? false })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is admin (is_owner)
  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_owner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_owner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { is_online } = await req.json()

  await supabase
    .from('admin_presence')
    .update({ is_online: !!is_online, last_seen: new Date().toISOString() })
    .eq('id', 1)

  return NextResponse.json({ is_online: !!is_online })
}
