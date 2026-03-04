import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — AngkorAI',
  description: 'AngkorAI privacy policy. Learn how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#212121] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#10a37f] text-sm hover:underline">
          &larr; Back to AngkorAI
        </Link>

        <h1 className="text-3xl font-bold mt-8 mb-2">Privacy Policy</h1>
        <p className="text-[#9ca3af] text-sm mb-10">Last updated: March 3, 2026</p>

        <div className="space-y-8 text-[#d1d5db] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-white text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              AngkorAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the AngkorAI mobile application and
              website at angkorai.ai. This Privacy Policy explains how we collect, use, and protect your
              information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect minimal information necessary to provide our service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Account information:</strong> Email address or social login profile
                (Google, Facebook, Telegram) used to create your account.
              </li>
              <li>
                <strong className="text-white">Conversations:</strong> Messages you send and receive through the
                AI assistant, stored to maintain your conversation history.
              </li>
              <li>
                <strong className="text-white">Usage data:</strong> Daily message counts to manage free-tier limits.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain the AI assistant service</li>
              <li>To manage your account and subscription</li>
              <li>To enforce usage limits on the free plan</li>
              <li>To improve our service quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using Supabase, a trusted cloud database provider with
              enterprise-grade security. All data is transmitted over encrypted HTTPS connections.
              We do not sell, trade, or share your personal information with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">5. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate AngkorAI:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Supabase</strong> — Authentication and database</li>
              <li><strong className="text-white">Groq</strong> — AI language model inference</li>
              <li><strong className="text-white">Vercel</strong> — Web hosting</li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies. We do not use any analytics or tracking services.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">6. Data Retention & Deletion</h2>
            <p>
              Your conversations and account data are retained as long as your account is active.
              You may request deletion of your account and all associated data by contacting us
              at the email address below. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">7. Children&apos;s Privacy</h2>
            <p>
              AngkorAI is rated for ages 4+ and does not knowingly collect personal information
              from children under 13. If you believe a child has provided us with personal data,
              please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. Continued use of the service after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-semibold mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to request data deletion,
              please contact us at{' '}
              <a href="mailto:tiloukim@gmail.com" className="text-[#10a37f] hover:underline">
                tiloukim@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 text-center text-[#6b7280] text-sm">
          &copy; {new Date().getFullYear()} AngkorAI. All rights reserved.
        </div>
      </div>
    </div>
  )
}
