import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MeetingClient from '@/components/meeting/MeetingClient'

export default async function MeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'

  return <MeetingClient token={token} plan={plan} />
}
