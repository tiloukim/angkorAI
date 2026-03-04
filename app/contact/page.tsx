import type { Metadata } from 'next'
import Link from 'next/link'

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
          <div className="bg-[#171717] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#10a37f]/15 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 className="text-lg font-semibold">Email</h2>
            </div>
            <p className="text-[#d1d5db] mb-2">For general inquiries, feedback, or support:</p>
            <a href="mailto:contact@angkorai.ai" className="text-[#10a37f] hover:underline text-lg">
              contact@angkorai.ai
            </a>
          </div>

          <div className="bg-[#171717] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#10a37f]/15 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.73 18-8-8.73a.94.94 0 0 0 0-1.41L4.27 0l-1.41 1.41 8.73 8.73a.94.94 0 0 0 1.41 0L21.73 1.41z" /><path d="m22 2-1.41-1.41" /></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </div>
              <h2 className="text-lg font-semibold">Open Source</h2>
            </div>
            <p className="text-[#d1d5db] mb-2">Report bugs or request features on GitHub:</p>
            <a href="https://github.com/tiloukim/angkorAI" target="_blank" rel="noopener noreferrer" className="text-[#10a37f] hover:underline text-lg">
              github.com/tiloukim/angkorAI
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

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-[#6b7280] text-sm">
          &copy; {new Date().getFullYear()} AngkorAI. All rights reserved.
        </div>
      </div>
    </div>
  )
}
