import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/plans'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const limit = PLAN_LIMITS[plan]
  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('daily_usage')
    .select('message_count')
    .eq('user_id', user.id)
    .eq('day', today)
    .single()

  const used = usage?.message_count ?? 0

  return NextResponse.json({ plan, used, limit: limit === Infinity ? null : limit })
}
