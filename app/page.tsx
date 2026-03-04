'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Sparkles, Globe, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'kh'>('en')
  const kh = lang === 'kh'

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AngkorAI" width={32} height={32} className="rounded-full" />
          <span className="font-semibold text-lg tracking-tight">AngkorAI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(kh ? 'en' : 'kh')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#2a2a2a] text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Globe size={13} />
            {kh ? 'English' : 'ខ្មែរ'}
          </button>
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {kh ? 'ចូលគណនី' : 'Log in'}
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {kh ? 'ចាប់ផ្តើមឥតគិតថ្លៃ' : 'Get started free'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 text-accent text-sm mb-8">
          <Sparkles size={14} />
          {kh ? (
            <span className="font-khmer">AI ពីភាសាកម្ពុជាដំបូងគេ</span>
          ) : (
            <span>First bilingual AI for Cambodia</span>
          )}
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
          {kh ? (
            <span className="font-khmer">AI ដែលនិយាយ<span className="text-accent"> ភាសាខ្មែរ </span>និងអង់គ្លេស</span>
          ) : (
            <>AI that speaks<span className="text-accent"> Khmer </span>and English</>
          )}
        </h1>

        <p className={`text-gray-400 text-lg max-w-xl mb-10 ${kh ? 'font-khmer' : ''}`}>
          {kh
            ? 'AngkorAI គឺជាជំនួយការ AI ដំបូងគេសម្រាប់កម្ពុជា។ សួរអ្វីក៏បានជាភាសាខ្មែរ ឬអង់គ្លេស — ទទួលបានចម្លើយភ្លាមៗ។'
            : "AngkorAI is Cambodia's first AI assistant. Ask anything in Khmer or English — get smart, helpful answers instantly."}
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-xl font-semibold text-base transition-colors"
          >
            {kh ? <span className="font-khmer">ចាប់ផ្តើមឥតគិតថ្លៃ</span> : 'Start for free'}
          </Link>
          <Link
            href="/login"
            className="border border-white/20 hover:bg-white/5 text-white px-8 py-3 rounded-xl font-semibold text-base transition-colors"
          >
            {kh ? <span className="font-khmer">ចូលគណនី</span> : 'Sign in'}
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl w-full">
          {[
            {
              icon: <Globe size={20} />,
              title: 'Bilingual',
              titleKh: 'ភាសាពីរ',
              desc: 'Chat in Khmer or English — AngkorAI understands both.',
              descKh: 'និយាយជាភាសាខ្មែរ ឬអង់គ្លេស — AngkorAI យល់ទាំងពីរ។',
            },
            {
              icon: <Zap size={20} />,
              title: 'Lightning Fast',
              titleKh: 'លឿនមែនទែន',
              desc: 'Streaming responses so you never wait long for answers.',
              descKh: 'ចម្លើយភ្លាមៗ មិនឱ្យអ្នករង់ចាំយូរ។',
            },
            {
              icon: <Shield size={20} />,
              title: 'Secure & Private',
              titleKh: 'សុវត្ថិភាព និងភាពឯកជន',
              desc: 'Your conversations are private and never shared.',
              descKh: 'ការសន្ទនារបស់អ្នកមានភាពឯកជន និងមិនបានចែករំលែក។',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#171717] border border-white/10 rounded-2xl p-6 text-left hover:border-accent/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-1">{kh ? f.titleKh : f.title}</h3>
              <p className={`text-gray-400 text-sm ${kh ? 'font-khmer' : ''}`}>{kh ? f.descKh : f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-24 w-full max-w-3xl">
          <h2 className="text-3xl font-bold mb-2">
            {kh ? <span className="font-khmer">តម្លៃសាមញ្ញ</span> : 'Simple pricing'}
          </h2>
          <p className={`text-gray-400 mb-10 ${kh ? 'font-khmer' : ''}`}>
            {kh ? 'ចាប់ផ្តើមឥតគិតថ្លៃ។ ធ្វើឱ្យប្រសើរនៅពេលត្រូវការ។' : 'Start free. Upgrade when you need more.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Free',
                nameKh: 'ឥតគិតថ្លៃ',
                price: '$0',
                period: '',
                limit: '30 messages/day',
                limitKh: '៣០ សារ / ថ្ងៃ',
                cta: 'Get started',
                ctaKh: 'ចាប់ផ្តើម',
                highlight: false,
              },
              {
                name: 'Pro',
                nameKh: 'ប្រូ',
                price: '$4.99',
                period: '/month',
                limit: '1,000 messages/day',
                limitKh: '១,០០០ សារ / ថ្ងៃ',
                cta: 'Upgrade to Pro',
                ctaKh: 'ធ្វើឱ្យប្រសើរ → ប្រូ',
                highlight: true,
              },
              {
                name: 'Business',
                nameKh: 'អាជីវកម្ម',
                price: '$9.99',
                period: '/month',
                limit: 'Unlimited messages',
                limitKh: 'សារគ្មានដែនកំណត់',
                cta: 'Contact us',
                ctaKh: 'ទាក់ទងមក',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 text-left border ${
                  plan.highlight
                    ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10'
                    : 'bg-[#171717] border-white/10'
                }`}
              >
                {plan.highlight && (
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-medium mb-3 inline-block">
                    {kh ? 'ពេញនិយមបំផុត' : 'Most Popular'}
                  </span>
                )}
                <h3 className={`text-xl font-bold ${kh ? 'font-khmer' : ''}`}>{kh ? plan.nameKh : plan.name}</h3>
                <div className="mb-4 mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{kh && plan.period ? '/ខែ' : plan.period}</span>
                </div>
                <p className={`text-sm text-gray-300 mb-6 ${kh ? 'font-khmer' : ''}`}>{kh ? plan.limitKh : plan.limit}</p>
                <Link
                  href="/signup"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'border border-white/20 hover:bg-white/5 text-white'
                  } ${kh ? 'font-khmer' : ''}`}
                >
                  {kh ? plan.ctaKh : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-4 mb-2">
          <a href="/about" className="hover:text-white transition-colors">About</a>
          <span className="text-white/20">·</span>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          <span className="text-white/20">·</span>
          <a href="/contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} AngkorAI · {kh ? <span className="font-khmer">សម្រាប់ប្រជាជនកម្ពុជា 🇰🇭</span> : 'Built for Cambodia 🇰🇭'}</p>
        {!kh && <p className="font-khmer mt-1 text-xs">សម្រាប់ប្រជាជនកម្ពុជា</p>}
      </footer>
    </div>
  )
}
