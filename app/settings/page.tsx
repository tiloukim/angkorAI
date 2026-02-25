import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/plans'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS
  const limit = PLAN_LIMITS[plan]

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await service
    .from('daily_usage')
    .select('message_count')
    .eq('user_id', user.id)
    .eq('day', today)
    .single()

  const usedToday = usage?.message_count ?? 0

  return (
    <SettingsClient
      email={user.email ?? ''}
      memberSince={user.created_at}
      plan={plan}
      usedToday={usedToday}
      limit={limit === Infinity ? null : limit}
    />
  )
}
