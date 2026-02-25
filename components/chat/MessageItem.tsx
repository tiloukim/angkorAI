'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, User, Volume2, VolumeX, Loader2 } from 'lucide-react'
import type { Message } from './ChatLayout'

interface Props {
  message: Message
  lang: 'en' | 'kh'
  token: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[-*+]\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

export default function MessageItem({ message, lang, token }: Props) {
  const isUser = message.role === 'user'
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function toggleSpeak() {
    // Stop if already playing
    if (speaking) {
      audioRef.current?.pause()
      if (audioRef.current) audioRef.current.currentTime = 0
      setSpeaking(false)
      return
    }

    const text = stripMarkdown(message.content)
    if (!text) return

    setLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('TTS error:', err)
        alert(`TTS error: ${err.error || res.status}`)
        return
      }
      const { audio } = await res.json()
      if (!audio) { console.error('TTS: no audio returned'); return }

      // Decode base64 MP3 and play
      const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)
      const el = new Audio(url)
      audioRef.current = el
      el.onended = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      el.onerror = (e) => { console.error('Audio play error:', e); setSpeaking(false) }
      setSpeaking(true)
      await el.play()
    } catch (e) {
      console.error('TTS catch:', e)
      setSpeaking(false)
    } finally {
      setLoading(false)
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="flex items-start gap-3 max-w-[85%]">
          <div className="flex flex-col gap-1.5 items-end">
            {message.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.image}
                alt="attachment"
                className="max-h-48 max-w-xs rounded-xl border border-gray-200 object-cover"
              />
            )}
            {message.content && (
              <div className="bg-user-bubble rounded-2xl px-4 py-3 text-gray-800 text-sm leading-relaxed border border-gray-200">
                <p className={lang === 'kh' ? 'font-khmer' : ''}>{message.content}</p>
              </div>
            )}
          </div>
          <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={14} className="text-accent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 mb-6 group">
      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {message.streaming && message.content === '' ? (
          <div className="flex items-center gap-1 py-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            <div className={`prose-chat text-sm ${lang === 'kh' ? 'font-khmer' : ''} ${message.streaming ? 'cursor-blink' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {!message.streaming && message.content && (
              <button
                onClick={toggleSpeak}
                disabled={loading}
                className={`mt-1.5 flex items-center gap-1 text-xs transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 ${
                  speaking ? 'text-accent' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={speaking ? 'Stop' : 'Read aloud'}
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : speaking ? (
                  <VolumeX size={13} />
                ) : (
                  <Volume2 size={13} />
                )}
                <span>{loading ? 'Loading...' : speaking ? 'Stop' : 'Read aloud'}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
