import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact — AngkorAI',
  description: 'Get in touch with the AngkorAI team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#212121] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#10a37f] text-sm hover:underline">
          &larr; Back to AngkorAI
        </Link>

        <h1 className="text-3xl font-bold mt-8 mb-2">Contact Us</h1>
        <p className="text-[#9ca3af] mb-10">We&apos;d love to hear from you</p>

        <div className="space-y-6">
          <ContactForm />

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-[#171717] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#10a37f]/15 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <h2 className="text-lg font-semibold">Email</h2>
              </div>
              <a href="mailto:contact@angkorai.ai" className="text-[#10a37f] hover:underline">
                contact@angkorai.ai
              </a>
            </div>

            <div className="bg-[#171717] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#10a37f]/15 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h2 className="text-lg font-semibold">Location</h2>
              </div>
              <p className="text-[#d1d5db]">Phnom Penh, Cambodia</p>
            </div>
          </div>
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
