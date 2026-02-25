'use client'

import { useState, useEffect, useCallback } from 'react'

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
import ChatSidebar from './ChatSidebar'
import ChatMain from './ChatMain'
import { PLAN_LIMITS, PLAN_DETAILS, type Plan } from '@/lib/plans'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Props {
  userId: string
  userEmail: string
  plan: string
  token: string
}

export default function ChatLayout({ userId, userEmail, plan, token }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [usedToday, setUsedToday] = useState(0)

  // Default closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
  const [lang, setLang] = useState<'en' | 'kh'>('en')
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')

  const userPlan = plan as Plan
  const dailyLimit = PLAN_LIMITS[userPlan]

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    if (data.conversations) setConversations(data.conversations)
  }, [])

  // Fetch usage
  const fetchUsage = useCallback(async () => {
    const res = await fetch('/api/usage')
    const data = await res.json()
    if (data.used !== undefined) setUsedToday(data.used)
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchUsage()
  }, [fetchConversations, fetchUsage])

  // Create new chat
  async function newChat() {
    setActiveConvId(null)
    setMessages([])
  }

  // Load conversation messages
  async function loadConversation(convId: string) {
    setActiveConvId(convId)
    // Fetch messages for this conversation
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      )
    }
  }

  // Delete conversation
  async function deleteConversation(convId: string) {
    await fetch(`/api/conversations?id=${convId}`, {
      method: 'DELETE',
    })
    if (activeConvId === convId) {
      setActiveConvId(null)
      setMessages([])
    }
    fetchConversations()
  }

  // Send message
  async function sendMessage(content: string, image?: string) {
    if (isStreaming) return
    if (dailyLimit !== Infinity && usedToday >= dailyLimit) return

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content,
      image,
    }
    const assistantMsg: Message = {
      id: uid(),
      role: 'assistant',
      content: '',
      streaming: true,
    }

    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, assistantMsg])
    setIsStreaming(true)

    try {
      // Create conversation if needed
      let convId = activeConvId
      if (!convId) {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.conversation?.id) {
          throw new Error(data.error || 'Failed to create conversation')
        }
        convId = data.conversation.id
        setActiveConvId(convId)
        fetchConversations()
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.image
              ? [
                  { type: 'text', text: m.content },
                  { type: 'image_url', image_url: { url: m.image } },
                ]
              : m.content,
          })),
          conversationId: convId,
          model: selectedModel,
          hasImage: !!image,
        }),
      })

      if (res.status === 429) {
        const data = await res.json()
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            ...prev[prev.length - 1],
            content:
              data.error === 'limit_reached'
                ? `You've reached your daily limit of ${data.limit} messages on the ${data.plan} plan. Please upgrade to continue chatting.`
                : 'Too many requests. Please try again.',
            streaming: false,
          },
        ])
        setIsStreaming(false)
        return
      }

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || 'Stream failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullText += parsed.text
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], content: fullText, streaming: true },
              ])
            }
          } catch {}
        }
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], content: fullText, streaming: false },
      ])
      setUsedToday((u) => u + 1)

      // Auto-update conversation title from first exchange if still default
      if (nextMessages.length === 1) {
        await fetch('/api/conversations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: convId,
            title: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
          }),
        })
        fetchConversations()
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...prev[prev.length - 1],
          content: 'Sorry, something went wrong. Please try again.',
          streaming: false,
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  const remaining = dailyLimit === Infinity ? null : Math.max(0, dailyLimit - usedToday)
  const planDetails = PLAN_DETAILS[userPlan]

  return (
    <div className="flex h-[100dvh] bg-main overflow-hidden">
      <ChatSidebar
        open={sidebarOpen}
        conversations={conversations}
        activeConvId={activeConvId}
        userEmail={userEmail}
        plan={userPlan}
        planDetails={planDetails}
        remaining={remaining}
        dailyLimit={dailyLimit}
        token={token}
        lang={lang}
        onNewChat={newChat}
        onSelectConv={loadConversation}
        onDeleteConv={deleteConversation}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatMain
        messages={messages}
        isStreaming={isStreaming}
        plan={userPlan}
        remaining={remaining}
        dailyLimit={dailyLimit}
        lang={lang}
        sidebarOpen={sidebarOpen}
        token={token}
        selectedModel={selectedModel}
        onSend={sendMessage}
        onNewChat={newChat}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleLang={() => setLang(lang === 'en' ? 'kh' : 'en')}
        onSelectModel={setSelectedModel}
      />
    </div>
  )
}
