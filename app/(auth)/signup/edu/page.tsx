'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Loader2, Check } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

type Role = 'student' | 'teacher' | 'government'

export default function EduSignupPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!institution.trim()) {
      setError('Please enter your school or institution name.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Sign up with metadata
    const { data, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
        data: {
          edu_role: role,
          institution: institution.trim(),
        },
      },
    })

    setCaptchaToken('')
    turnstileRef.current?.reset()

    if (signupErr) {
      setError(signupErr.message)
      setLoading(false)
      return
    }

    // Set plan to 'edu' in profiles
    if (data.user) {
      const { createClient: createServiceClient } = await import('@/lib/supabase/client')
      const supa = createServiceClient()
      await supa.from('profiles').upsert(
        { id: data.user.id, plan: 'edu' },
        { onConflict: 'id' }
      )
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/chat'), 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to AngkorAI! 🎓</h2>
          <p className="text-gray-400 text-sm mb-1">Your Education plan is active. Redirecting...</p>
          <p className="font-khmer text-gray-500 text-xs">គម្រោងអប់រំរបស់អ្នកបានដំណើរការ។ កំពុងបញ្ជូន...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mb-4">
            <GraduationCap size={18} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Education Plan</h1>
          <p className="font-khmer text-gray-400 text-sm mt-1">គម្រោងអប់រំ</p>
          <p className="text-gray-500 text-xs mt-2 text-center">
            Free for students, teachers & government workers
          </p>
          <p className="font-khmer text-gray-600 text-xs mt-0.5 text-center">
            ឥតគិតថ្លៃសម្រាប់សិស្ស គ្រូបង្រៀន និងមន្ត្រីរាជការ
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-sm">
          <p className="text-blue-300 font-medium mb-2">Your free benefits:</p>
          <ul className="text-gray-300 space-y-1 text-xs">
            <li>✓ 200 messages per day (2x free plan)</li>
            <li>✓ 5 AI image generations per day</li>
            <li>✓ Bilingual AI assistant (Khmer + English)</li>
            <li>✓ Meeting summarizer</li>
          </ul>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">I am a / ខ្ញុំជា</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'student', label: 'Student', labelKh: 'សិស្ស' },
                { value: 'teacher', label: 'Teacher', labelKh: 'គ្រូបង្រៀន' },
                { value: 'government', label: 'Gov\'t', labelKh: 'មន្ត្រីរាជការ' },
              ] as const).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    role === r.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-[#171717] border-white/15 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <div>{r.label}</div>
                  <div className="font-khmer text-xs opacity-70">{r.labelKh}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              {role === 'government' ? 'Ministry / Department' : 'School / University'}
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              placeholder={role === 'government' ? 'e.g. Ministry of Education' : 'e.g. Royal University of Phnom Penh'}
              className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className="w-full bg-[#171717] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken('')}
            options={{ theme: 'dark', size: 'flexible' }}
          />

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
            {loading ? 'Creating account...' : 'Create Education Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-gray-500 text-xs mt-2">
          Want more features?{' '}
          <Link href="/signup" className="text-accent hover:underline">Sign up for Pro</Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/" className="text-gray-500 text-xs hover:text-gray-400">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
