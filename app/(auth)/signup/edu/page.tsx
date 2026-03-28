'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, Loader2, Check, Upload, X } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

type Role = 'student' | 'teacher' | 'government'

export default function EduSignupPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [institution, setInstitution] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)')
      return
    }
    setIdFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = () => setIdPreview(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeFile() {
    setIdFile(null)
    setIdPreview(null)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!institution.trim()) {
      setError('Please enter your school or institution name.')
      return
    }

    if (!idFile) {
      setError('Please upload your student/teacher/government ID for verification.')
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

    if (!data.user) {
      setError('Account creation failed. Please try again.')
      setLoading(false)
      return
    }

    // Upload ID and create application via server API (uses service role)
    const formData = new FormData()
    formData.append('user_id', data.user.id)
    formData.append('email', email)
    formData.append('role', role)
    formData.append('institution', institution.trim())
    formData.append('id_file', idFile)

    const applyRes = await fetch('/api/edu-apply', {
      method: 'POST',
      body: formData,
    })

    if (!applyRes.ok) {
      const err = await applyRes.json().catch(() => ({}))
      setError(err.error || 'Failed to submit application. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/chat'), 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted! 🎓</h2>
          <p className="text-gray-400 text-sm mb-1">
            Your ID is being reviewed. You&apos;ll be upgraded to the Education plan once approved.
          </p>
          <p className="font-khmer text-gray-500 text-xs mt-1">
            អត្តសញ្ញាណប័ណ្ណរបស់អ្នកកំពុងត្រូវបានពិនិត្យ។ អ្នកនឹងត្រូវបានដំឡើងទៅគម្រោងអប់រំនៅពេលត្រូវបានអនុម័ត។
          </p>
          <p className="text-gray-500 text-xs mt-3">You can use the free plan while waiting. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
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
          <p className="text-blue-300 font-medium mb-2">Your free benefits / អត្ថប្រយោជន៍ឥតគិតថ្លៃ:</p>
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

          {/* ID Upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              {role === 'student' ? 'Student ID' : role === 'teacher' ? 'Teacher ID' : 'Government ID'} / អត្តសញ្ញាណប័ណ្ណ
            </label>
            <p className="text-xs text-gray-500 mb-2">Upload a photo of your ID for verification</p>
            {idPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={idPreview}
                  alt="ID preview"
                  className="w-full h-40 object-cover rounded-xl border border-white/15"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full bg-[#171717] border border-dashed border-white/20 hover:border-blue-500/50 rounded-xl px-4 py-6 text-center transition-colors group"
              >
                <Upload size={24} className="mx-auto text-gray-500 group-hover:text-blue-400 mb-2" />
                <p className="text-sm text-gray-400 group-hover:text-gray-300">Click to upload ID photo</p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG — Max 5MB</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
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
            {loading ? 'Submitting application...' : 'Submit Application'}
          </button>

          <p className="text-center text-gray-600 text-xs">
            Your ID will be reviewed by our team. You can use the free plan while waiting for approval.
          </p>
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
