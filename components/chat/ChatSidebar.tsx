'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Plus,
  Menu,
  MessageSquare,
  Trash2,
  LogOut,
  X,
  Zap,
  Crown,
  Sparkles,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from './ChatLayout'
import type { Plan } from '@/lib/plans'

interface Props {
  open: boolean
  conversations: Conversation[]
  activeConvId: string | null
  userEmail: string
  plan: Plan
  planDetails: { name: string; nameKh: string; badge: string; price: number }
  remaining: number | null
  dailyLimit: number
  token: string
  lang: 'en' | 'kh'
  onNewChat: () => void
  onSelectConv: (id: string) => void
  onDeleteConv: (id: string) => void
  onToggle: () => void
}

export default function ChatSidebar({
  open,
  conversations,
  activeConvId,
  userEmail,
  plan,
  planDetails,
  remaining,
  dailyLimit,
  token,
  lang,
  onNewChat,
  onSelectConv,
  onDeleteConv,
  onToggle,
}: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDelete(e: React.MouseEvent, convId: string) {
    e.stopPropagation()
    setDeletingId(convId)
    await onDeleteConv(convId)
    setDeletingId(null)
  }

  async function handleUpgrade(targetPlan: 'pro' | 'business') {
    setUpgrading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not start checkout. Please try again.')
        setUpgrading(false)
      }
    } catch {
      alert('Checkout failed. Please try again.')
      setUpgrading(false)
    }
  }

  const planIcon =
    plan === 'business' ? (
      <Crown size={12} />
    ) : plan === 'pro' ? (
      <Zap size={12} />
    ) : (
      <Sparkles size={12} />
    )

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-3 top-3.5 z-50 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        title="Open sidebar"
      >
        <Menu size={20} />
      </button>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30 md:hidden"
        onClick={onToggle}
      />
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-40 w-72 md:w-64 md:static md:z-auto bg-sidebar border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 px-1">
            <Image src="/logo.png" alt="AngkorAI" width={24} height={24} className="rounded-full" />
            <span className="font-semibold text-sm text-gray-900">AngkorAI</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-sidebar-hover text-gray-400 hover:text-gray-700 transition-colors"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 mb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-sidebar-hover text-gray-600 hover:text-gray-900 text-sm transition-colors group"
          >
            <Plus size={16} className="text-gray-400 group-hover:text-gray-700" />
            {lang === 'kh' ? (
              <span className="font-khmer">ការសន្ទនាថ្មី</span>
            ) : (
              'New chat'
            )}
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-gray-400 text-xs text-center py-8">
              {lang === 'kh' ? 'មិនមានការសន្ទនា' : 'No conversations yet'}
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConv(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                activeConvId === conv.id
                  ? 'bg-sidebar-hover text-gray-900'
                  : 'text-gray-600 hover:bg-sidebar-hover hover:text-gray-900'
              }`}
            >
              <MessageSquare size={14} className="flex-shrink-0 text-gray-400" />
              <span className="flex-1 text-sm truncate">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className={`flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all ${
                  deletingId === conv.id ? 'opacity-100 animate-pulse' : ''
                }`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Usage & Upgrade */}
        <div className="px-3 py-3 border-t border-gray-200 space-y-3">
          {/* Usage bar */}
          {dailyLimit !== Infinity && remaining !== null && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{lang === 'kh' ? 'សារថ្ងៃនេះ' : 'Messages today'}</span>
                <span>{dailyLimit - remaining}/{dailyLimit}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${((dailyLimit - remaining) / dailyLimit) * 100}%` }}
                />
              </div>
              {remaining <= 5 && remaining > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  {lang === 'kh' ? `នៅសល់ ${remaining} សារ` : `${remaining} messages left today`}
                </p>
              )}
              {remaining === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {lang === 'kh' ? 'ដល់ដែនកំណត់ហើយ' : 'Daily limit reached'}
                </p>
              )}
            </div>
          )}

          {/* Upgrade button */}
          {plan === 'free' && (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={upgrading}
              className="w-full flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              <Zap size={12} />
              {upgrading
                ? 'Redirecting...'
                : lang === 'kh'
                ? 'ធ្វើឱ្យប្រសើរ → $4.99/ខែ'
                : 'Upgrade to Pro · $4.99/mo'}
            </button>
          )}

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-hover">
            <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent flex-shrink-0">
              {planIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{userEmail}</p>
              <p className={`text-xs ${planDetails.badge} rounded px-1 py-0.5 inline-block mt-0.5`}>
                {planDetails.name}
              </p>
            </div>
            <Link
              href="/settings"
              className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
              title="Settings"
            >
              <Settings size={14} />
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
