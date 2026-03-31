'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Wifi, WifiOff, ArrowLeft, GraduationCap, CheckCircle, XCircle, Loader2, Users } from 'lucide-react'
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

interface EduApplication {
  id: string
  user_id: string
  email: string
  role: string
  institution: string
  id_file_path: string
  id_url: string | null
  status: string
  created_at: string
}

interface Props {
  userId: string
  supportChats: SupportChat[]
  initialOnline: boolean
  pendingEduCount: number
}

export default function AdminDashboard({ userId, supportChats: initialChats, initialOnline, pendingEduCount }: Props) {
  const [activeTab, setActiveTab] = useState<'support' | 'edu' | 'users'>('support')
  const [chats, setChats] = useState(initialChats)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(initialOnline)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Edu applications state
  const [eduApps, setEduApps] = useState<EduApplication[]>([])
  const [eduLoading, setEduLoading] = useState(false)
  const [eduCount, setEduCount] = useState(pendingEduCount)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Users state
  interface UserProfile {
    id: string
    name?: string
    plan: string
    is_owner: boolean
    created_at: string
    email?: string
  }
  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (data) {
        // Fetch emails from auth
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const emailMap = await res.json()
          setUsers(data.map((u: UserProfile) => ({ ...u, email: emailMap[u.id] || '' })))
        } else {
          setUsers(data)
        }
      }
    } catch { /* ignore */ }
    setUsersLoading(false)
  }

  async function updateUserPlan(userId: string, plan: string) {
    setUpdatingUserId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u))
      }
    } catch { /* ignore */ }
    setUpdatingUserId(null)
  }

  async function loadEduApps() {
    setEduLoading(true)
    try {
      const res = await fetch('/api/admin/edu')
      if (res.ok) {
        const data = await res.json()
        setEduApps(data.applications ?? [])
        setEduCount(data.applications?.length ?? 0)
      }
    } catch {}
    setEduLoading(false)
  }

  async function handleEduAction(applicationId: string, action: 'approve' | 'reject') {
    setProcessingId(applicationId)
    try {
      const res = await fetch('/api/admin/edu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, application_id: applicationId }),
      })
      if (res.ok) {
        setEduApps(prev => prev.filter(a => a.id !== applicationId))
        setEduCount(prev => Math.max(0, prev - 1))
      }
    } catch {}
    setProcessingId(null)
  }

  useEffect(() => {
    if (activeTab === 'edu') loadEduApps()
    if (activeTab === 'users') loadUsers()
  }, [activeTab])

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
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setActiveTab('support')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'support' ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <MessageCircle size={14} />
                Support
                {chats.length > 0 && <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{chats.length}</span>}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('edu')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'edu' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} />
                Edu Applications
                {eduCount > 0 && <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{eduCount}</span>}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                Users
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{users.length || '...'}</span>
              </span>
            </button>
          </div>
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

      {activeTab === 'users' ? (
        /* Users Panel */
        <div className="h-[calc(100vh-65px)] overflow-y-auto p-6">
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">All Users ({users.length})</h2>
                <button onClick={loadUsers} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-200 rounded-lg">Refresh</button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{user.name || 'No name'}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email || user.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.plan === 'pro' ? 'bg-yellow-100 text-yellow-800' :
                            user.plan === 'edu' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.is_owner && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Admin</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.plan}
                            onChange={e => updateUserPlan(user.id, e.target.value)}
                            disabled={updatingUserId === user.id}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white disabled:opacity-50"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="edu">Edu</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'edu' ? (
        /* Edu Applications Panel */
        <div className="h-[calc(100vh-65px)] overflow-y-auto p-6">
          {eduLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : eduApps.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-12">
              No pending education applications
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Pending Applications ({eduApps.length})
              </h2>
              {eduApps.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          app.role === 'student' ? 'bg-blue-100 text-blue-700' :
                          app.role === 'teacher' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {app.role.charAt(0).toUpperCase() + app.role.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{app.email}</p>
                      <p className="text-sm text-gray-500">{app.institution}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEduAction(app.id, 'approve')}
                        disabled={processingId === app.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {processingId === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleEduAction(app.id, 'reject')}
                        disabled={processingId === app.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                  {app.id_url && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-2">Uploaded ID:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.id_url}
                        alt={`${app.role} ID for ${app.email}`}
                        className="max-h-64 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(app.id_url!, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  )
}
