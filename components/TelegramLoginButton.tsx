'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

export default function TelegramLoginButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const callbackRef = useRef(false)

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    if (!botUsername) return

    // Global callback for Telegram widget
    ;(window as unknown as Record<string, unknown>).__onTelegramAuth = async (user: TelegramUser) => {
      if (callbackRef.current) return
      callbackRef.current = true
      setLoading(true)
      setError('')

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Login failed')
          setLoading(false)
          callbackRef.current = false
          return
        }

        router.push('/chat')
        router.refresh()
      } catch {
        setError('Network error')
        setLoading(false)
        callbackRef.current = false
      }
    }

    return () => {
      delete (window as unknown as Record<string, unknown>).__onTelegramAuth
    }
  }, [botUsername, router])

  function handleClick() {
    if (!botUsername || loading) return

    // Load Telegram widget script and trigger auth popup
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', '__onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    // Hidden container — we just need the script to open the popup
    const container = document.createElement('div')
    container.style.display = 'none'
    document.body.appendChild(container)
    container.appendChild(script)

    // Clean up after script loads
    script.onload = () => {
      // The Telegram iframe is now injected; find and click it
      setTimeout(() => {
        const iframe = container.querySelector('iframe')
        if (iframe) {
          // Open the auth popup directly
          const width = 550
          const height = 470
          const left = Math.round(screen.width / 2 - width / 2)
          const top = Math.round(screen.height / 2 - height / 2)
          window.open(
            `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_to=${encodeURIComponent(window.location.href)}`,
            'telegram_auth',
            `width=${width},height=${height},left=${left},top=${top}`
          )
        }
        container.remove()
      }, 100)
    }
  }

  if (!botUsername) return null

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-[#54A9EB] hover:bg-[#4A96D2] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <TelegramIcon />}
        {loading ? 'Signing in...' : 'Continue with Telegram'}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center mt-2">{error}</p>
      )}
    </div>
  )
}
