'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2, Check, ArrowLeft, Phone } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.025 10.125 11.927v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.098 24 18.1 24 12.073z" />
    </svg>
  )
}

const COUNTRY_CODES = [
  { code: '+855', flag: '🇰🇭', label: 'KH' },
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+44',  flag: '🇬🇧', label: 'GB' },
  { code: '+61',  flag: '🇦🇺', label: 'AU' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+66',  flag: '🇹🇭', label: 'TH' },
  { code: '+84',  flag: '🇻🇳', label: 'VN' },
]

type Mode = 'default' | 'phone' | 'otp'

export default function SignupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('default')
  const [success, setSuccess] = useState(false)

  // Email/password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Social
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)

  // Phone OTP
  const [countryCode, setCountryCode] = useState('+855')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [fullPhone, setFullPhone] = useState('')

  async function handleOAuth(provider: 'google' | 'facebook') {
    setSocialLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/chat'), 2000)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPhoneLoading(true)
    const phone = `${countryCode}${phoneNumber.replace(/^0/, '')}`
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      setError(error.message)
      setPhoneLoading(false)
    } else {
      setFullPhone(phone)
      setMode('otp')
      setPhoneLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPhoneLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    })
    if (error) {
      setError(error.message)
      setPhoneLoading(false)
    } else {
      router.push('/chat')
      router.refresh()
    }
  }

  function resetToDefault() {
    setMode('default')
    setError('')
    setPhoneNumber('')
    setOtp('')
    setFullPhone('')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account created!</h2>
          <p className="text-gray-400 text-sm mb-1">Redirecting to your AI assistant...</p>
          <p className="font-khmer text-gray-500 text-xs">កំពុងបញ្ជូនទៅ AngkorAI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* ── Phone number entry ── */}
        {mode === 'phone' && (
          <>
            <button onClick={resetToDefault} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-4">
                <Phone size={22} className="text-accent" />
              </div>
              <h1 className="text-2xl font-bold">Sign up with phone</h1>
              <p className="text-gray-400 text-sm mt-1">We&apos;ll send a verification code</p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Phone number</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#171717] border border-white/15 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="12 345 678"
                    className="flex-1 bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-sm"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {phoneLoading ? 'Sending...' : 'Send code'}
              </button>
            </form>
          </>
        )}

        {/* ── OTP verification ── */}
        {mode === 'otp' && (
          <>
            <button onClick={() => { setMode('phone'); setError('') }} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={15} /> Back
            </button>
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-4">
                <Phone size={22} className="text-accent" />
              </div>
              <h1 className="text-2xl font-bold">Enter your code</h1>
              <p className="text-gray-400 text-sm mt-1">SMS sent to <span className="text-white">{fullPhone}</span></p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-sm tracking-widest text-center text-xl"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={phoneLoading || otp.length < 6}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {phoneLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {phoneLoading ? 'Verifying...' : 'Verify & Create account'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('phone'); setError('') }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Resend code
              </button>
            </form>
          </>
        )}

        {/* ── Default: social + email ── */}
        {mode === 'default' && (
          <>
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mb-4">
                <Sparkles size={18} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-gray-400 text-sm mt-1">Free — 30 messages/day</p>
              <p className="font-khmer text-gray-500 text-xs mt-0.5">ឥតគិតថ្លៃ · ៣០ សារ/ថ្ងៃ</p>
            </div>

            {/* Social buttons */}
            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleOAuth('google')}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-semibold py-3 rounded-xl border border-gray-200 transition-colors"
              >
                {socialLoading === 'google' ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <GoogleIcon />}
                {socialLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <button
                onClick={() => handleOAuth('facebook')}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {socialLoading === 'facebook' ? <Loader2 size={16} className="animate-spin" /> : <FacebookIcon />}
                {socialLoading === 'facebook' ? 'Redirecting...' : 'Continue with Facebook'}
              </button>

              <button
                onClick={() => setMode('phone')}
                className="w-full flex items-center justify-center gap-3 bg-[#171717] hover:bg-[#222] text-white font-semibold py-3 rounded-xl border border-white/15 transition-colors"
              >
                <Phone size={18} />
                Continue with Phone
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-4">
              By creating an account you agree to our Terms of Service.
            </p>
            <p className="text-center text-gray-400 text-sm mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:underline">Sign in</Link>
            </p>
            <p className="text-center mt-4">
              <Link href="/" className="text-gray-500 text-xs hover:text-gray-400">← Back to home</Link>
            </p>
          </>
        )}

      </div>
    </div>
  )
}
