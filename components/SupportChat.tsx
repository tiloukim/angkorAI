'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircleQuestion, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SupportMessage {
  id: string
  sender_id: string
  is_admin: boolean
  content: string
  created_at: string
}

interface Props {
  userId: string
}

export default function SupportChat({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [adminOnline, setAdminOnline] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Poll admin presence
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch('/api/admin/presence')
        if (res.ok && active) {
          const data = await res.json()
          setAdminOnline(data.is_online)
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  // Load existing chat when opened
  const loadChat = useCallback(async () => {
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        const data = await res.json()
        if (data.chat) {
          setChatId(data.chat.id)
          setMessages(data.messages ?? [])
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (open) loadChat()
  }, [open, loadChat])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!chatId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`support-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chatId}`,
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
  }, [chatId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.chat_id && !chatId) {
          setChatId(data.chat_id)
        }
        // Add message optimistically (realtime will deduplicate)
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      }
    } catch {
      // restore input on failure
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="support-fab"
          title="Contact Support"
        >
          <MessageCircleQuestion size={24} />
          <span className={`support-dot ${adminOnline ? 'online' : ''}`} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="support-panel">
          <div className="support-header">
            <div className="flex items-center gap-2">
              <span className={`support-dot-inline ${adminOnline ? 'online' : ''}`} />
              <span className="font-semibold text-sm">Support</span>
              <span className="text-xs text-gray-400">
                {adminOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="support-messages">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs mt-8 px-4">
                Send a message to start a conversation with our support team.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.sender_id === userId ? 'chat-bubble-mine' : 'chat-bubble-theirs'}
              >
                {msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="support-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="support-input"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="support-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
