'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { PanelLeft, Globe, Zap, ChevronDown, Mail, CreditCard, Briefcase, Languages } from 'lucide-react'
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
  const isEmpty = messages.length === 0

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

          {plan !== 'free' ? (
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar hover:bg-sidebar-hover text-gray-300 hover:text-white text-xs font-medium transition-colors"
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
            <span className="text-sm font-medium text-gray-300">AngkorAI</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sidebar hover:bg-sidebar-hover text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Globe size={13} />
            {lang === 'en' ? <span>ខ្មែរ</span> : <span>English</span>}
          </button>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState lang={lang} plan={plan} onSend={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} lang={lang} token={token} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Limit banner */}
      {isLimitReached && (
        <LimitBanner plan={plan} dailyLimit={dailyLimit} lang={lang} />
      )}

      {/* Input area */}
      <div className="px-3 pt-2 pb-4 border-t border-white/5 bg-main">
        <div className="max-w-3xl mx-auto">
          {/* Prompt label — only on empty screen, mobile only */}
          {isEmpty && !isLimitReached && (
            <p className="text-center text-gray-500 text-xs mb-2 sm:hidden">
              {lang === 'kh' ? '👇 វាយសំណួររបស់អ្នកនៅខាងក្រោម' : '👇 Type your question below'}
            </p>
          )}
          <ChatInput
            onSend={onSend}
            disabled={isStreaming || isLimitReached}
            isStreaming={isStreaming}
            lang={lang}
            plan={plan}
          />
          <p className="text-center text-gray-600 text-[11px] mt-1.5">
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
  plan,
  onSend,
}: {
  lang: 'en' | 'kh'
  plan: Plan
  onSend: (s: string) => void
}) {
  const suggestions =
    lang === 'kh'
      ? [
          { icon: Mail,      text: 'ជួយខ្ញុំសរសេរអ៊ីមែលការងារ' },
          { icon: CreditCard, text: 'ពន្យល់ពី AI ជូនខ្ញុំ' },
          { icon: Briefcase,  text: 'ចាប់ផ្តើមអាជីវកម្មតូចៗ' },
          { icon: Languages,  text: 'បកប្រែពីខ្មែរទៅអង់គ្លេស' },
        ]
      : [
          { icon: Mail,       text: 'Help me write a business email' },
          { icon: CreditCard, text: 'Build credit in Cambodia' },
          { icon: Briefcase,  text: 'Best jobs for youth in Phnom Penh' },
          { icon: Languages,  text: 'Translate Khmer to English' },
        ]

  return (
    <div className="flex flex-col items-center px-4 pt-10 pb-4 h-full">
      {/* Branding */}
      <div className="mb-3">
        <Image src="/logo.png" alt="AngkorAI" width={72} height={72} className="rounded-2xl shadow-lg" />
      </div>
      <h2 className={`text-2xl font-bold text-white mb-1 ${lang === 'kh' ? 'font-khmer' : ''}`}>
        {lang === 'kh' ? 'ខ្ញុំជួយអ្វីបានខ្លះ?' : 'How can I help you?'}
      </h2>
      <p className={`text-gray-400 text-sm mb-6 ${lang === 'kh' ? 'font-khmer' : ''}`}>
        {lang === 'kh' ? 'សួរអ្វីក៏បានជាភាសាខ្មែរ ឬអង់គ្លេស' : 'Ask anything in Khmer or English'}
      </p>

      {plan === 'free' && (
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-xs text-accent mb-5">
          <Zap size={11} />
          {lang === 'kh' ? 'ផែនការឥតគិតថ្លៃ · ៣០ សារ/ថ្ងៃ' : 'Free plan · 30 messages/day'}
        </div>
      )}

      {/* Suggestion cards — 2 col grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {suggestions.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSend(text)}
            className={`flex flex-col items-start gap-2 px-3 py-3 rounded-2xl bg-sidebar border border-white/10 active:bg-sidebar-hover hover:bg-sidebar-hover hover:border-white/20 transition-all text-left ${
              lang === 'kh' ? 'font-khmer' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <Icon size={14} className="text-accent" />
            </div>
            <span className="text-xs text-gray-300 leading-snug">{text}</span>
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro' }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div className="mx-3 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
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
