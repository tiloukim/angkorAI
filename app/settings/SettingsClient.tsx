'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Zap, Crown, Sparkles, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLAN_DETAILS, type Plan } from '@/lib/plans'

interface Props {
  email: string
  memberSince: string
  plan: Plan
  usedToday: number
  limit: number | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function SettingsClient({ email, memberSince, plan, usedToday, limit }: Props) {
  const router = useRouter()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const planDetails = PLAN_DETAILS[plan]
  const usagePercent = limit ? Math.min((usedToday / limit) * 100, 100) : 0

  const planIcon =
    plan === 'business' ? <Crown size={16} /> :
    plan === 'pro' ? <Zap size={16} /> :
    <Sparkles size={16} />

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleUpgrade(targetPlan: 'pro' | 'business') {
    setUpgrading(targetPlan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not start checkout. Please try again.')
        setUpgrading(null)
      }
    } catch {
      alert('Checkout failed. Please try again.')
      setUpgrading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo.png" alt="AngkorAI" width={24} height={24} className="rounded-full" />
          <h1 className="font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Account section */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Avatar + email */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0">
                {email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-sm text-gray-500">Member since {formatDate(memberSince)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Plan & Usage section */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Plan & Usage</h2>
          </div>
          <div className="px-5 py-5 space-y-5">
            {/* Current plan badge */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current plan</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${planDetails.badge}`}>
                    {planIcon}
                    {planDetails.name}
                  </span>
                  {plan !== 'free' && (
                    <span className="text-sm text-gray-500">${planDetails.price}/mo</span>
                  )}
                </div>
              </div>
              {plan === 'free' && (
                <span className="text-xs text-gray-400">Free forever</span>
              )}
            </div>

            {/* Usage bar */}
            {limit !== null ? (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Messages today</span>
                  <span className="font-medium text-gray-900">{usedToday} / {limit}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-400' : usagePercent >= 70 ? 'bg-yellow-400' : 'bg-accent'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Resets at midnight Cambodia time (UTC+7)</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                Unlimited messages
              </div>
            )}

            {/* Plan features */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {[
                { label: 'Daily messages', value: limit === null ? 'Unlimited' : `${limit} messages` },
                { label: 'AI model', value: 'Angkor LLM (Llama 3.3 70B)' },
                { label: 'Languages', value: 'Khmer & English' },
                { label: 'Live Cambodia news', value: 'Included' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upgrade section (only for free/pro) */}
        {plan !== 'business' && (
          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Upgrade</h2>
            </div>
            <div className="px-5 py-5 space-y-3">
              {plan === 'free' && (
                <div className="border border-accent/30 rounded-xl p-4 bg-accent/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <Zap size={14} className="text-accent" />
                        Pro Plan
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">1,000 messages/day</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">$4.99<span className="text-sm font-normal text-gray-500">/mo</span></span>
                  </div>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgrading === 'pro'}
                    className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {upgrading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
                  </button>
                </div>
              )}

              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <Crown size={14} className="text-purple-500" />
                      Business Plan
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Unlimited messages</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">$9.99<span className="text-sm font-normal text-gray-500">/mo</span></span>
                </div>
                <button
                  onClick={() => handleUpgrade('business')}
                  disabled={upgrading === 'business'}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  {upgrading === 'business' ? 'Redirecting...' : 'Upgrade to Business'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sign out */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Actions</h2>
          </div>
          <div className="px-5 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pb-4">
          AngkorAI · Cambodia&apos;s first bilingual AI assistant
        </p>
      </div>
    </div>
  )
}
