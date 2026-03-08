'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { Sparkles, Heart, Stars, Globe } from 'lucide-react'

const ZODIAC_SIGNS = [
  { name: 'Rat', nameKh: 'ជូត', emoji: '🐀' },
  { name: 'Ox', nameKh: 'ឆ្លូវ', emoji: '🐂' },
  { name: 'Tiger', nameKh: 'ខាល', emoji: '🐅' },
  { name: 'Rabbit', nameKh: 'ថោះ', emoji: '🐇' },
  { name: 'Dragon', nameKh: 'រោង', emoji: '🐉' },
  { name: 'Snake', nameKh: 'ម្សាញ់', emoji: '🐍' },
  { name: 'Horse', nameKh: 'មមី', emoji: '🐴' },
  { name: 'Goat', nameKh: 'មមែ', emoji: '🐐' },
  { name: 'Monkey', nameKh: 'វក', emoji: '🐒' },
  { name: 'Rooster', nameKh: 'រកា', emoji: '🐓' },
  { name: 'Dog', nameKh: 'ច', emoji: '🐕' },
  { name: 'Pig', nameKh: 'កុរ', emoji: '🐷' },
]

const FORTUNE_MESSAGES = [
  { en: "A surprise love letter is on its way to you — from the universe itself.", kh: "សំបុត្រស្នេហ៍ដ៏ភ្ញាក់ផ្អើលមួយកំពុងមកដល់អ្នក — ពីសកលលោកផ្ទាល់។" },
  { en: "The person you're thinking about right now is also thinking about you.", kh: "មនុស្សដែលអ្នកកំពុងគិតដល់ឥឡូវនេះ ក៏កំពុងគិតដល់អ្នកដែរ។" },
  { en: "Your heart will skip a beat this week. Pay attention to who's nearby.", kh: "បេះដូងអ្នកនឹងលោតមួយចង្វាក់សប្តាហ៍នេះ។ សូមកត់សម្គាល់មើលអ្នកនៅជិត។" },
  { en: "Love is closer than you think — it might already be in the room.", kh: "ស្នេហាជិតជាងអ្វីដែលអ្នកគិត — វាអាចនៅក្នុងបន្ទប់រួចហើយ។" },
  { en: "A romantic adventure awaits you under the Cambodian moonlight.", kh: "ដំណើរផ្សងព្រេងស្នេហ៍កំពុងរង់ចាំអ្នកក្រោមពន្លឺព្រះច័ន្ទកម្ពុជា។" },
  { en: "Someone admires you from afar. They'll make their move soon.", kh: "នរណាម្នាក់កំពុងស្រឡាញ់អ្នកពីចម្ងាយ។ ពួកគេនឹងធ្វើជំហានឆាប់ៗ។" },
  { en: "Your soulmate shares your love of something unexpected. Stay curious.", kh: "គូព្រលឹងអ្នកចែករំលែកចំណូលចិត្តអ្វីមួយដ៏ភ្ញាក់ផ្អើល។ រក្សាភាពចង់ដឹងចង់ឃើញ។" },
  { en: "The temples of Angkor bless your love life with ancient energy.", kh: "ប្រាសាទអង្គរប្រទានពរជីវិតស្នេហ៍របស់អ្នកដោយថាមពលបុរាណ។" },
  { en: "A chance encounter will spark something magical. Say yes to invitations.", kh: "ការជួបគ្នាដោយចៃដន្យនឹងបង្កើតអ្វីមួយដ៏អស្ចារ្យ។ ទទួលយកការអញ្ជើញ។" },
  { en: "Your heart is ready for something beautiful. Trust the timing.", kh: "បេះដូងអ្នកត្រៀមខ្លួនសម្រាប់អ្វីមួយដ៏ស្រស់ស្អាត។ ជឿជាក់លើពេលវេលា។" },
  { en: "Love will find you when you least expect it — perhaps tomorrow.", kh: "ស្នេហានឹងរកអ្នកឃើញនៅពេលដែលអ្នកមិនរំពឹង — ប្រហែលថ្ងៃស្អែក។" },
  { en: "A deep connection is forming. Let it grow at its own pace.", kh: "ទំនាក់ទំនងដ៏ជ្រាលជ្រៅកំពុងបង្កើតឡើង។ ទុកឱ្យវាលូតលាស់តាមល្បឿនរបស់វា។" },
  { en: "The stars align for romance this month. Open your heart wide.", kh: "ផ្កាយតម្រឹមសម្រាប់សេចក្តីស្នេហ៍ខែនេះ។ បើកបេះដូងអ្នកឱ្យធំទូលាយ។" },
  { en: "Someone special will compliment you soon. It will make your day.", kh: "នរណាម្នាក់ពិសេសនឹងសរសើរអ្នកឆាប់ៗ។ វានឹងធ្វើឱ្យថ្ងៃអ្នកភ្លឺស្វាង។" },
  { en: "Your kindness attracts love like flowers attract butterflies.", kh: "សេចក្តីល្អរបស់អ្នកទាក់ទាញស្នេហ៍ដូចផ្កាទាក់ទាញមេអំបៅ។" },
  { en: "A romantic surprise is hidden in your near future. Stay hopeful.", kh: "ការភ្ញាក់ផ្អើលស្នេហ៍លាក់ក្នុងអនាគតដ៏ខ្លីរបស់អ្នក។ រក្សាក្តីសង្ឃឹម។" },
  { en: "The universe has already written your love story. Enjoy each chapter.", kh: "សកលលោកបានសរសេររឿងស្នេហ៍របស់អ្នករួចហើយ។ រីករាយនឹងជំពូកនីមួយៗ។" },
  { en: "Your smile is someone's favorite thing in the world right now.", kh: "ស្នាមញញឹមរបស់អ្នកគឺជារបស់ដែលនរណាម្នាក់ចូលចិត្តបំផុតលើលោកនេះ។" },
  { en: "A new beginning in love is just around the corner.", kh: "ការចាប់ផ្តើមថ្មីក្នុងស្នេហ៍គឺនៅជ្រុងផ្លូវខាងមុខ។" },
  { en: "The Mekong River carries your wishes for love to the one who awaits.", kh: "ទន្លេមេគង្គដឹកនាំសេចក្តីប្រាថ្នាស្នេហ៍របស់អ្នកទៅកាន់អ្នកដែលកំពុងរង់ចាំ។" },
]

function getZodiacSign(year: number): string {
  const signs = ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat']
  return signs[year % 12]
}

function getZodiacEmoji(sign: string): string {
  return ZODIAC_SIGNS.find(z => z.name === sign)?.emoji ?? ''
}

function getZodiacKh(sign: string): string {
  return ZODIAC_SIGNS.find(z => z.name === sign)?.nameKh ?? sign
}

export default function FortunePage() {
  const [lang, setLang] = useState<'en' | 'kh'>('en')
  const kh = lang === 'kh'

  // Section 1: Daily Love Horoscope
  const [selectedSign, setSelectedSign] = useState<string | null>(null)
  const [horoscope, setHoroscope] = useState('')
  const [loadingHoroscope, setLoadingHoroscope] = useState(false)

  // Section 2: Fortune Cards
  const [fortuneCard, setFortuneCard] = useState<typeof FORTUNE_MESSAGES[0] | null>(null)
  const [cardFlipped, setCardFlipped] = useState(false)

  // Section 3: Compatibility
  const [year1, setYear1] = useState('')
  const [year2, setYear2] = useState('')
  const [compatResult, setCompatResult] = useState('')
  const [loadingCompat, setLoadingCompat] = useState(false)

  const horoscopeRef = useRef<HTMLDivElement>(null)
  const compatRef = useRef<HTMLDivElement>(null)

  const years = Array.from({ length: 2027 - 1940 + 1 }, (_, i) => 1940 + i)

  async function streamFortune(sign: string, type?: string, sign2?: string) {
    const res = await fetch('/api/fortune', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign, type, sign2, lang }),
    })
    if (!res.ok) throw new Error('Failed to fetch fortune')
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              result += data.text
              if (type === 'compatibility') {
                setCompatResult(result)
              } else {
                setHoroscope(result)
              }
            }
          } catch { /* skip parse errors */ }
        }
      }
    }
  }

  async function handleSignClick(sign: string) {
    setSelectedSign(sign)
    setHoroscope('')
    setLoadingHoroscope(true)
    try {
      await streamFortune(sign)
    } catch {
      setHoroscope(kh ? 'វិញ្ញាណកំពុងសម្រាក... សូមព្យាយាមម្តងទៀត។' : 'The spirits are resting... Please try again.')
    }
    setLoadingHoroscope(false)
    setTimeout(() => horoscopeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  function handleRevealCard() {
    if (cardFlipped) {
      setCardFlipped(false)
      setTimeout(() => {
        const idx = Math.floor(Math.random() * FORTUNE_MESSAGES.length)
        setFortuneCard(FORTUNE_MESSAGES[idx])
        setCardFlipped(true)
      }, 400)
    } else {
      const idx = Math.floor(Math.random() * FORTUNE_MESSAGES.length)
      setFortuneCard(FORTUNE_MESSAGES[idx])
      setCardFlipped(true)
    }
  }

  async function handleCompatibility() {
    if (!year1 || !year2) return
    const sign1 = getZodiacSign(Number(year1))
    const sign2 = getZodiacSign(Number(year2))
    setCompatResult('')
    setLoadingCompat(true)
    try {
      await streamFortune(sign1, 'compatibility', sign2)
    } catch {
      setCompatResult(kh ? 'វិញ្ញាណកំពុងសម្រាក... សូមព្យាយាមម្តងទៀត។' : 'The spirits are resting... Please try again.')
    }
    setLoadingCompat(false)
    setTimeout(() => compatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  const sign1Display = year1 ? getZodiacSign(Number(year1)) : null
  const sign2Display = year2 ? getZodiacSign(Number(year2)) : null

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="AngkorAI" width={32} height={32} className="rounded-full" />
          <span className="font-semibold text-lg tracking-tight">AngkorAI</span>
        </Link>
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
            {kh ? <span className="font-khmer">ចូលគណនី</span> : 'Log in'}
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {kh ? <span className="font-khmer">ចាប់ផ្តើមឥតគិតថ្លៃ</span> : 'Get started free'}
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-6 py-16 max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-1.5 text-pink-400 text-sm mb-6">
            <Sparkles size={14} />
            <span className={kh ? 'font-khmer' : ''}>{kh ? 'ហោរាស្នេហ៍ខ្មែរ' : 'Khmer Love Fortune Teller'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {kh ? (
              <span className="font-khmer">ស្វែងរក<span className="text-pink-400"> ហោរាស្នេហ៍ </span>របស់អ្នក</span>
            ) : (
              <>Discover Your <span className="text-pink-400">Love Fortune</span></>
            )}
          </h1>
          <p className={`text-gray-400 text-lg max-w-xl mx-auto ${kh ? 'font-khmer' : ''}`}>
            {kh
              ? 'គតិបណ្ឌិតខ្មែរបុរាណជួបនឹង AI។ ស្វែងរកហោរាស្នេហ៍ប្រចាំថ្ងៃ បើកកាតព្រេងវាសនា និងពិនិត្យភាពស៊ីគ្នាស្នេហ៍។'
              : 'Ancient Khmer wisdom meets AI. Explore your daily love horoscope, reveal fortune cards, and check your romantic compatibility.'}
          </p>
        </div>

        {/* Section 1: Daily Love Horoscope */}
        <section className="fp-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Heart size={20} className="text-pink-400" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'ហោរាស្នេហ៍ប្រចាំថ្ងៃ' : 'Daily Love Horoscope'}
              </h2>
              <p className={`text-gray-400 text-sm ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'ជ្រើសរើសរាសីឆ្នាំកំណើតរបស់អ្នកដើម្បីបើកហោរាស្នេហ៍ថ្ងៃនេះ' : "Choose your zodiac sign to reveal today's love fortune"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
            {ZODIAC_SIGNS.map((z) => (
              <button
                key={z.name}
                onClick={() => handleSignClick(z.name)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
                  selectedSign === z.name
                    ? 'bg-pink-500/20 border-pink-500/50 shadow-lg shadow-pink-500/10'
                    : 'bg-[#171717] border-white/10 hover:border-pink-500/30'
                }`}
              >
                <span className="text-2xl">{z.emoji}</span>
                <span className={`text-xs font-medium ${kh ? 'font-khmer' : ''}`}>{kh ? z.nameKh : z.name}</span>
              </button>
            ))}
          </div>

          {(loadingHoroscope || horoscope) && (
            <div ref={horoscopeRef} className="bg-[#171717] border border-pink-500/20 rounded-2xl p-6 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{ZODIAC_SIGNS.find(z => z.name === selectedSign)?.emoji}</span>
                <span className={`font-semibold text-pink-400 ${kh ? 'font-khmer' : ''}`}>
                  {kh
                    ? `${getZodiacKh(selectedSign!)} — ហោរាស្នេហ៍ថ្ងៃនេះ`
                    : `${selectedSign} — Today's Love Fortune`}
                </span>
              </div>
              <p className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${kh ? 'font-khmer' : ''}`}>
                {horoscope}
                {loadingHoroscope && <span className="cursor-blink" />}
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Love Fortune Cards */}
        <section className="fp-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'កាតព្រេងវាសនាស្នេហ៍' : 'Love Fortune Card'}
              </h2>
              <p className={`text-gray-400 text-sm ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'ទាញកាតមួយដើម្បីបើកសារស្នេហ៍ពីសកលលោក' : 'Draw a card to reveal a romantic message from the universe'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="fp-card-container mb-6">
              <div className={`fp-card-flip ${cardFlipped ? 'fp-flipped' : ''}`}>
                {/* Card Back */}
                <div className="fp-fortune-card fp-card-back">
                  <div className="text-4xl mb-3">🏛️</div>
                  <p className={`text-sm text-gray-400 font-medium ${kh ? 'font-khmer' : ''}`}>
                    {kh ? 'ចុចដើម្បីបើក' : 'Tap to reveal'}
                  </p>
                </div>
                {/* Card Front */}
                <div className="fp-fortune-card fp-card-front">
                  <div className="text-3xl mb-4">💝</div>
                  <p className={`text-gray-200 text-center text-sm leading-relaxed italic px-2 ${kh ? 'font-khmer' : ''}`}>
                    &ldquo;{fortuneCard ? (kh ? fortuneCard.kh : fortuneCard.en) : ''}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRevealCard}
              className={`bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 px-6 py-2.5 rounded-xl font-medium transition-colors text-sm ${kh ? 'font-khmer' : ''}`}
            >
              {cardFlipped
                ? (kh ? 'ទាញកាតមួយទៀត' : 'Draw Another Card')
                : (kh ? 'បើកព្រេងវាសនារបស់អ្នក' : 'Reveal Your Fortune')}
            </button>
          </div>
        </section>

        {/* Section 3: Compatibility Fortune */}
        <section className="fp-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Stars size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'ភាពស៊ីគ្នាស្នេហ៍' : 'Love Compatibility'}
              </h2>
              <p className={`text-gray-400 text-sm ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'បញ្ចូលឆ្នាំកំណើតពីរដើម្បីស្វែងរកវាសនាស្នេហ៍រួមគ្នា' : 'Enter two birth years to discover your romantic destiny together'}
              </p>
            </div>
          </div>

          <div className="fp-compat-form">
            <div className="fp-compat-col">
              <label className={`text-sm text-gray-400 mb-1.5 block ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'មនុស្សទី ១ — ឆ្នាំកំណើត' : 'Person 1 — Birth Year'}
              </label>
              <select
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors appearance-none"
              >
                <option value="">{kh ? 'ជ្រើសរើសឆ្នាំ...' : 'Select year...'}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {sign1Display && (
                <div className={`mt-2 text-sm text-pink-400 flex items-center gap-1.5 ${kh ? 'font-khmer' : ''}`}>
                  <span>{getZodiacEmoji(sign1Display)}</span>
                  <span>{kh ? getZodiacKh(sign1Display) : sign1Display}</span>
                </div>
              )}
            </div>

            <div className="fp-compat-heart">
              <Heart size={24} className="text-red-400" />
            </div>

            <div className="fp-compat-col">
              <label className={`text-sm text-gray-400 mb-1.5 block ${kh ? 'font-khmer' : ''}`}>
                {kh ? 'មនុស្សទី ២ — ឆ្នាំកំណើត' : 'Person 2 — Birth Year'}
              </label>
              <select
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors appearance-none"
              >
                <option value="">{kh ? 'ជ្រើសរើសឆ្នាំ...' : 'Select year...'}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {sign2Display && (
                <div className={`mt-2 text-sm text-pink-400 flex items-center gap-1.5 ${kh ? 'font-khmer' : ''}`}>
                  <span>{getZodiacEmoji(sign2Display)}</span>
                  <span>{kh ? getZodiacKh(sign2Display) : sign2Display}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={handleCompatibility}
              disabled={!year1 || !year2 || loadingCompat}
              className={`bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${kh ? 'font-khmer' : ''}`}
            >
              {loadingCompat
                ? (kh ? 'កំពុងអានផ្កាយ...' : 'Reading the stars...')
                : (kh ? 'អានហោរាស្នេហ៍រួមគ្នា' : 'Read Our Fortune')}
            </button>
          </div>

          {(loadingCompat || compatResult) && (
            <div ref={compatRef} className="bg-[#171717] border border-red-500/20 rounded-2xl p-6 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{sign1Display && getZodiacEmoji(sign1Display)}</span>
                <Heart size={16} className="text-red-400" />
                <span className="text-xl">{sign2Display && getZodiacEmoji(sign2Display)}</span>
                <span className={`font-semibold text-red-400 ml-1 ${kh ? 'font-khmer' : ''}`}>
                  {kh
                    ? `${getZodiacKh(sign1Display!)} & ${getZodiacKh(sign2Display!)}`
                    : `${sign1Display} & ${sign2Display}`}
                </span>
              </div>
              <p className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${kh ? 'font-khmer' : ''}`}>
                {compatResult}
                {loadingCompat && <span className="cursor-blink" />}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-4 mb-2">
          <a href="/about" className="hover:text-white transition-colors">{kh ? <span className="font-khmer">អំពី</span> : 'About'}</a>
          <span className="text-white/20">&middot;</span>
          <a href="/fortune" className="hover:text-white transition-colors">{kh ? <span className="font-khmer">ហោរា</span> : 'Fortune'}</a>
          <span className="text-white/20">&middot;</span>
          <a href="/privacy" className="hover:text-white transition-colors">{kh ? <span className="font-khmer">ឯកជនភាព</span> : 'Privacy'}</a>
          <span className="text-white/20">&middot;</span>
          <a href="/contact" className="hover:text-white transition-colors">{kh ? <span className="font-khmer">ទំនាក់ទំនង</span> : 'Contact'}</a>
        </div>
        <p>&copy; {new Date().getFullYear()} AngkorAI &middot; {kh ? <span className="font-khmer">សម្រាប់ប្រជាជនកម្ពុជា 🇰🇭</span> : 'Built for Cambodia 🇰🇭'}</p>
      </footer>
    </div>
  )
}
