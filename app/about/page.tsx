import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — AngkorAI',
  description: 'Learn about AngkorAI, Cambodia\'s bilingual AI assistant.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#212121] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#10a37f] text-sm hover:underline">
          &larr; Back to AngkorAI
        </Link>

        <h1 className="text-3xl font-bold mt-8 mb-2">About AngkorAI</h1>
        <p className="text-[#9ca3af] mb-10">Cambodia&apos;s Bilingual AI Assistant</p>

        <div className="space-y-8 text-[#d1d5db] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-white text-xl font-semibold mb-3">Our Mission</h2>
            <p>
              AngkorAI is built to make AI accessible to everyone in Cambodia. We provide a
              bilingual AI assistant that understands and responds in both Khmer and English,
              bridging the language gap in AI technology.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">What We Do</h2>
            <p className="mb-3">
              AngkorAI is a free AI assistant that helps with everyday tasks — from answering
              questions and translating between Khmer and English, to helping with education,
              writing, and more.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Bilingual:</strong> Fluent in both Khmer and English</li>
              <li><strong className="text-white">Free:</strong> 30 messages per day at no cost</li>
              <li><strong className="text-white">Private:</strong> Your conversations are never shared</li>
              <li><strong className="text-white">Accessible:</strong> Available on web and mobile</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">Built in Cambodia</h2>
            <p>
              AngkorAI is designed and built in Phnom Penh, Cambodia. We&apos;re committed to
              developing AI technology that serves the Cambodian community and preserves the
              Khmer language in the age of artificial intelligence.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">Get in Touch</h2>
            <p>
              Have questions or feedback? We&apos;d love to hear from you.
              Visit our <a href="/contact" className="text-[#10a37f] hover:underline">contact page</a> or
              email us at{' '}
              <a href="mailto:contact@angkorai.ai" className="text-[#10a37f] hover:underline">
                contact@angkorai.ai
              </a>.
            </p>
          </section>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-[#6b7280] text-sm">
          <div className="flex items-center justify-center gap-4 mb-2">
            <a href="/about" className="hover:text-white transition-colors">About</a>
            <span className="text-white/20">&middot;</span>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <span className="text-white/20">&middot;</span>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p>&copy; {new Date().getFullYear()} AngkorAI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
