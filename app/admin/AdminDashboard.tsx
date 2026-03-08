'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Wifi, WifiOff, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SupportChat {
  id: string
  user_id: string
  status: string
  created_at: string
  updated_at: string
}

interface SupportMessage {
  id: string
  sender_id: string
  is_admin: boolean
  content: string
  created_at: string
}

interface Props {
  userId: string
  supportChats: SupportChat[]
  initialOnline: boolean
}

export default function AdminDashboard({ userId, supportChats: initialChats, initialOnline }: Props) {
  const [chats, setChats] = useState(initialChats)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(initialOnline)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Refresh chats list
  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support', { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats ?? [])
      }
    } catch {}
  }, [])

  // Poll for new chats
  useEffect(() => {
    const interval = setInterval(refreshChats, 10000)
    return () => clearInterval(interval)
  }, [refreshChats])

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'messages', chat_id: chatId }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    } catch {}
  }, [])

  // When chat selected, load messages
  useEffect(() => {
    if (selectedChat) loadMessages(selectedChat)
  }, [selectedChat, loadMessages])

  // Realtime for selected chat messages
  useEffect(() => {
    if (!selectedChat) return

    const supabase = createClient()
    const channel = supabase
      .channel(`admin-support-${selectedChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${selectedChat}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedChat])

  // Realtime for new chats
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-new-chats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chats',
        },
        () => {
          refreshChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshChats])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function toggleOnline() {
    setTogglingOnline(true)
    try {
      const res = await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: !isOnline }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsOnline(data.is_online)
      }
    } catch {}
    setTogglingOnline(false)
  }

  async function sendReply() {
    if (!input.trim() || sending || !selectedChat) return
    setSending(true)
    const text = input.trim()
    setInput('')

    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', chat_id: selectedChat, content: text }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      }
    } catch {
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  async function closeChat(chatId: string) {
    try {
      await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', chat_id: chatId }),
      })
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (selectedChat === chatId) {
        setSelectedChat(null)
        setMessages([])
      }
    } catch {}
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/chat" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </a>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <span className="admin-badge">{chats.length} open</span>
        </div>
        <button
          onClick={toggleOnline}
          disabled={togglingOnline}
          className={`admin-online-toggle ${isOnline ? 'online' : ''}`}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Chat list */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-12">
              No open support chats
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`admin-chat-item ${selectedChat === chat.id ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      User {chat.user_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(chat.updated_at)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); closeChat(chat.id) }}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Close chat"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Chat view */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a chat to reply
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-3 flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={msg.is_admin ? 'chat-bubble-mine' : 'chat-bubble-theirs'}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="support-input-row border-t border-gray-200 bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder="Type a reply..."
                  className="support-input"
                  disabled={sending}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !input.trim()}
                  className="support-send-btn"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
