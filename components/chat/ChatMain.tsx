'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { PanelLeft, Globe, Zap, ChevronDown } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import type { Message } from './ChatLayout'
import type { Plan } from '@/lib/plans'

const MODELS = [
  { id: 'angkor-llm',              label: 'Angkor LLM',    desc: 'Cambodia\'s AI', soon: true },
  { id: 'llama-3.3-70b-versatile', label: 'AngkorAI',      desc: 'Default' },
]

interface Props {
  messages: Message[]
  isStreaming: boolean
  plan: Plan
  remaining: number | null
  dailyLimit: number
  lang: 'en' | 'kh'
  sidebarOpen: boolean
  token: string
  selectedModel: string
  onSend: (content: string, image?: string) => void
  onNewChat: () => void
  onToggleSidebar: () => void
  onToggleLang: () => void
  onSelectModel: (model: string) => void
}

export default function ChatMain({
  messages,
  isStreaming,
  plan,
  remaining,
  dailyLimit,
  lang,
  sidebarOpen,
  token,
  selectedModel,
  onSend,
  onNewChat,
  onToggleSidebar,
  onToggleLang,
  onSelectModel,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isLimitReached = remaining !== null && remaining === 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Model selector — Pro only; free users locked to Angkor LLM */}
          {plan !== 'free' ? (
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar hover:bg-sidebar-hover text-gray-300 hover:text-white text-xs font-medium transition-colors"
                title="Select AI model"
              >
                <span>{MODELS.find((m) => m.id === selectedModel)?.label ?? 'Model'}</span>
                <ChevronDown size={12} />
              </button>
              {modelOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-sidebar border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      disabled={m.soon}
                      onClick={() => { if (!m.soon) { onSelectModel(m.id); setModelOpen(false) } }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                        m.soon
                          ? 'opacity-50 cursor-not-allowed text-gray-500'
                          : selectedModel === m.id
                          ? 'text-white hover:bg-sidebar-hover'
                          : 'text-gray-400 hover:bg-sidebar-hover'
                      }`}
                    >
                      <span className="font-medium">{m.label}</span>
                      <span className={m.soon ? 'text-accent text-[10px]' : 'text-gray-600'}>
                        {m.soon ? 'Soon' : m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-300">
              Angkor LLM
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar hover:bg-sidebar-hover text-gray-300 hover:text-white text-xs font-medium transition-colors"
            title="Toggle language"
          >
            <Globe size={13} />
            {lang === 'en' ? (
              <span>ខ្មែរ</span>
            ) : (
              <span className="font-khmer">English</span>
            )}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState lang={lang} onSend={onSend} plan={plan} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} lang={lang} token={token} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Limit reached banner */}
      {isLimitReached && (
        <LimitBanner plan={plan} dailyLimit={dailyLimit} lang={lang} />
      )}

      {/* Input */}
      <div className="px-4 py-4 pb-safe">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSend}
            disabled={isStreaming || isLimitReached}
            isStreaming={isStreaming}
            lang={lang}
            plan={plan}
          />
          <p className="text-center text-gray-600 text-xs mt-2">
            {lang === 'kh'
              ? 'AngkorAI អាចធ្វើខុស។ ត្រូវពិនិត្យព័ត៌មានសំខាន់ៗ។'
              : 'AngkorAI can make mistakes. Check important info.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  lang,
  onSend,
  plan,
}: {
  lang: 'en' | 'kh'
  onSend: (s: string, image?: string) => void
  plan: Plan
}) {
  const suggestions =
    lang === 'kh'
      ? [
          'ជួយខ្ញុំសរសេរអ៊ីមែលស្នើសុំការងារ',
          'ពន្យល់ពី AI ជូនខ្ញុំ',
          'របៀបចាប់ផ្តើមអាជីវកម្មតូចៗ',
          'គណនាការប្រាក់ប្រាក់កម្ចី',
        ]
      : [
          'Help me write a business email',
          'Explain how to build credit in Cambodia',
          'What are the best jobs for young people in Phnom Penh?',
          'Translate this from Khmer to English',
        ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-6">
        <Image src="/logo.png" alt="AngkorAI" width={80} height={80} />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-white">
        {lang === 'kh' ? 'ខ្ញុំជួយអ្វីបានខ្លះ?' : 'How can I help you?'}
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        {lang === 'kh'
          ? 'សួរអ្វីក៏បានជាភាសាខ្មែរ ឬអង់គ្លេស'
          : 'Ask anything in Khmer or English'}
      </p>

      {plan === 'free' && (
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent mb-6">
          <Zap size={12} />
          {lang === 'kh' ? 'ផែនការឥតគិតថ្លៃ · ៣០ សារ/ថ្ងៃ' : 'Free plan · 30 messages/day'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            className={`text-left px-4 py-3 rounded-2xl bg-sidebar hover:bg-sidebar-hover border border-white/10 hover:border-white/20 text-sm text-gray-300 hover:text-white transition-all ${
              lang === 'kh' ? 'font-khmer' : ''
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function LimitBanner({
  plan,
  dailyLimit,
  lang,
}: {
  plan: Plan
  dailyLimit: number
  lang: 'en' | 'kh'
}) {
  async function upgrade() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'pro' }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="mx-4 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-yellow-400 text-sm font-semibold">
          {lang === 'kh' ? 'ដល់ដែនកំណត់ប្រចាំថ្ងៃ' : 'Daily limit reached'}
        </p>
        <p className="text-yellow-400/70 text-xs">
          {lang === 'kh'
            ? `${dailyLimit} សារ/ថ្ងៃ · ត្រឡប់ប្រើបានម្ដងទៀតថ្ងៃស្អែក`
            : `${dailyLimit} messages used · Resets tomorrow`}
        </p>
      </div>
      {plan === 'free' && (
        <button
          onClick={upgrade}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1"
        >
          <Zap size={12} />
          Upgrade · $4.99/mo
        </button>
      )}
    </div>
  )
}
