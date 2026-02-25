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
    <div className="relative bg-white border border-gray-200 rounded-2xl hover:border-gray-300 focus-within:border-accent/60 focus-within:shadow-[0_0_0_3px_rgba(16,163,127,0.1)] shadow-sm transition-all">
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
        className={`w-full bg-transparent text-gray-900 placeholder-gray-400 resize-none focus:outline-none leading-relaxed px-4 pt-4 pb-14 ${
          lang === 'kh' ? 'font-khmer text-base' : 'text-[16px]'
        }`}
        style={{ minHeight: '80px', maxHeight: '240px' }}
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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-40"
              title="Attach image"
            >
              <ImagePlus size={16} />
            </button>
          </>
        )}

        {/* Mic — Pro only */}
        {isPro && (
          <button
            onClick={toggleMic}
            disabled={disabled}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${
              listening
                ? 'bg-red-100 text-red-500 hover:bg-red-200'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={listening ? 'Stop recording' : 'Voice input'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-accent hover:bg-accent-hover text-white shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
