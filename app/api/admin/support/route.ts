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

// GET: List open support chats with latest message
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()

  const { data: chats } = await supabase
    .from('support_chats')
    .select('id, user_id, status, created_at, updated_at')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })

  if (!chats?.length) {
    return NextResponse.json({ chats: [] })
  }

  // Get user profiles for each chat
  const userIds = [...new Set(chats.map(c => c.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, plan')
    .in('id', userIds)

  // Get latest message for each chat
  const chatIds = chats.map(c => c.id)
  const { data: allMessages } = await supabase
    .from('support_messages')
    .select('id, chat_id, sender_id, is_admin, content, created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false })

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const msgs = allMessages ?? []
  const latestMessageMap = new Map<string, (typeof msgs)[number]>()
  for (const msg of msgs) {
    if (!latestMessageMap.has(msg.chat_id)) {
      latestMessageMap.set(msg.chat_id, msg)
    }
  }

  // Get user emails from auth (via profiles join isn't possible, use user_id to get auth user info)
  // We'll use the user_id directly since profiles don't have email

  const enrichedChats = chats.map(chat => ({
    ...chat,
    profile: profileMap.get(chat.user_id) ?? null,
    lastMessage: latestMessageMap.get(chat.id) ?? null,
  }))

  return NextResponse.json({ chats: enrichedChats })
}

// POST: Send admin reply or close chat
export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, chat_id, content } = await req.json()
  const supabase = await createServiceClient()

  if (action === 'close') {
    await supabase
      .from('support_chats')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', chat_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'reply') {
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('support_messages')
      .insert({
        chat_id,
        sender_id: user.id,
        is_admin: true,
        content: content.trim(),
      })
      .select('id, sender_id, is_admin, content, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }

    // Update chat timestamp
    await supabase
      .from('support_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id)

    return NextResponse.json({ message })
  }

  // GET messages for a specific chat
  if (action === 'messages') {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('id, sender_id, is_admin, content, created_at')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ messages: messages ?? [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
