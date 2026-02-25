import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatLayout from '@/components/chat/ChatLayout'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token ?? ''

  // Get profile (plan)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'

  return (
    <ChatLayout
      userId={user.id}
      userEmail={user.email ?? ''}
      plan={plan}
      token={token}
    />
  )
}
