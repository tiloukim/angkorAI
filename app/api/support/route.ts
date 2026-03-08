import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  // Get user's open support chat
  const { data: chat } = await supabase
    .from('support_chats')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!chat) {
    return NextResponse.json({ chat: null, messages: [] })
  }

  // Get messages for this chat
  const { data: messages } = await supabase
    .from('support_messages')
    .select('id, sender_id, is_admin, content, created_at')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ chat, messages: messages ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Find or create open chat
  let { data: chat } = await supabase
    .from('support_chats')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!chat) {
    const { data: newChat, error } = await supabase
      .from('support_chats')
      .insert({ user_id: user.id, status: 'open' })
      .select('id')
      .single()
    if (error || !newChat) {
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
    }
    chat = newChat
  }

  // Insert message
  const { data: message, error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      chat_id: chat.id,
      sender_id: user.id,
      is_admin: false,
      content: content.trim(),
    })
    .select('id, sender_id, is_admin, content, created_at')
    .single()

  if (msgErr) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ chat_id: chat.id, message })
}
