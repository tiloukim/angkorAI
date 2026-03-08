import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = await createServiceClient()

  // Check admin
  const { data: profile } = await service
    .from('profiles')
    .select('is_owner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_owner) redirect('/chat')

  // Fetch open support chats
  const { data: chats } = await service
    .from('support_chats')
    .select('id, user_id, status, created_at, updated_at')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })

  // Fetch admin presence
  const { data: presence } = await service
    .from('admin_presence')
    .select('is_online')
    .eq('id', 1)
    .single()

  return (
    <AdminDashboard
      userId={user.id}
      supportChats={chats ?? []}
      initialOnline={presence?.is_online ?? false}
    />
  )
}
