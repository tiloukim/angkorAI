'use client'

import { useEffect, useRef, useState } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export default function TelegramMobilePage() {
  const widgetRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'authenticating' | 'error'>('loading')
  const [error, setError] = useState('')
  const handledRef = useRef(false)

  useEffect(() => {
    const botUsername = 'Angkor_AIBot'

    ;(window as unknown as Record<string, unknown>).__onTelegramAuth = async (user: TelegramUser) => {
      if (handledRef.current) return
      handledRef.current = true
      setStatus('authenticating')

      try {
        const res = await fetch('/api/auth/telegram-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Login failed')
          setStatus('error')
          handledRef.current = false
          return
        }

        // Redirect back to mobile app with tokens
        const params = new URLSearchParams({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
        window.location.href = `angkorai://auth/telegram-callback?${params.toString()}`
      } catch {
        setError('Network error')
        setStatus('error')
        handledRef.current = false
      }
    }

    const container = widgetRef.current
    if (container && !container.querySelector('script')) {
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', botUsername)
      script.setAttribute('data-size', 'large')
      script.setAttribute('data-onauth', '__onTelegramAuth(user)')
      script.setAttribute('data-request-access', 'write')
      script.async = true
      script.onload = () => setStatus('ready')
      container.appendChild(script)
    }

    return () => {
      delete (window as unknown as Record<string, unknown>).__onTelegramAuth
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#212121',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: 24,
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>AngkorAI</h1>
      <p style={{ color: '#9ca3af', marginBottom: 32 }}>Sign in with Telegram</p>

      {status === 'authenticating' && (
        <p style={{ color: '#10a37f' }}>Signing you in...</p>
      )}

      {status === 'error' && (
        <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
      )}

      <div ref={widgetRef} style={{ minHeight: 40 }} />

      {status === 'loading' && (
        <p style={{ color: '#6b7280', marginTop: 16 }}>Loading Telegram...</p>
      )}
    </div>
  )
}
