'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send message')
        setStatus('error')
      } else {
        setStatus('success')
        setName('')
        setEmail('')
        setMessage('')
      }
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-[#171717] border border-white/10 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#10a37f]/15 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Message sent!</h3>
        <p className="text-[#9ca3af] mb-4">Thank you for reaching out. We&apos;ll get back to you soon.</p>
        <button
          onClick={() => setStatus('idle')}
          className="text-[#10a37f] hover:underline text-sm"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#171717] border border-white/10 rounded-xl p-6 space-y-4">
      <div>
        <label className="text-[#d1d5db] text-sm mb-1.5 block">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="Your name"
          className="w-full bg-[#212121] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-[#6b7280] text-[15px] outline-none focus:border-[#10a37f] transition-colors"
        />
      </div>
      <div>
        <label className="text-[#d1d5db] text-sm mb-1.5 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full bg-[#212121] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-[#6b7280] text-[15px] outline-none focus:border-[#10a37f] transition-colors"
        />
      </div>
      <div>
        <label className="text-[#d1d5db] text-sm mb-1.5 block">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="How can we help you?"
          className="w-full bg-[#212121] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-[#6b7280] text-[15px] outline-none focus:border-[#10a37f] transition-colors resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#10a37f] hover:bg-[#0d8c6d] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
