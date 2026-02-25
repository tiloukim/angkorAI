'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Loader2, Mic, MicOff, ImagePlus, X } from 'lucide-react'
import type { Plan } from '@/lib/plans'

interface Props {
  onSend: (content: string, image?: string) => void
  disabled: boolean
  isStreaming: boolean
  lang: 'en' | 'kh'
  plan: Plan
}

export default function ChatInput({ onSend, disabled, isStreaming, lang, plan }: Props) {
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  function handleSubmit() {
    const trimmed = value.trim()
    if ((!trimmed && !image) || disabled) return
    onSend(trimmed, image ?? undefined)
    setValue('')
    setImage(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function toggleMic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser. Try Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SR()
    rec.lang = lang === 'kh' ? 'km-KH' : 'en-US'
    rec.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setValue((prev) => prev + (prev ? ' ' : '') + transcript)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const isPro = plan !== 'free'
  const placeholder =
    lang === 'kh'
      ? 'សរសេរសំណួររបស់អ្នក...'
      : 'Ask AngkorAI anything...'
  const canSend = (value.trim().length > 0 || !!image) && !disabled

  return (
    <div className="relative bg-sidebar border border-white/10 rounded-2xl hover:border-white/20 focus-within:border-accent/50 transition-colors">
      {/* Image preview */}
      {image && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="attachment" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={9} />
            </button>
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={`w-full bg-transparent text-white placeholder-gray-500 text-sm px-4 py-3.5 resize-none focus:outline-none leading-relaxed ${
          isPro ? 'pr-28' : 'pr-12'
        } ${lang === 'kh' ? 'font-khmer' : ''}`}
        style={{ minHeight: '52px', maxHeight: '200px' }}
      />

      <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
        {/* Pro-only: Image upload */}
        {isPro && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all disabled:opacity-40"
              title="Attach image"
            >
              <ImagePlus size={15} />
            </button>
          </>
        )}

        {/* Pro-only: Mic */}
        {isPro && (
          <button
            onClick={toggleMic}
            disabled={disabled}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
              listening
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title={listening ? 'Stop recording' : 'Voice input'}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-accent hover:bg-accent-hover text-white'
              : 'bg-sidebar-hover text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ArrowUp size={15} />
          )}
        </button>
      </div>
    </div>
  )
}
