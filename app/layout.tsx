import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AngkorAI — AI Assistant for Cambodia',
  description:
    'AngkorAI is the first bilingual Khmer-English AI assistant designed for Cambodia. Powered by cutting-edge AI technology.',
  keywords: ['AI', 'Cambodia', 'Khmer', 'chatbot', 'AngkorAI'],
  openGraph: {
    title: 'AngkorAI — AI Assistant for Cambodia',
    description: 'Bilingual AI assistant for the Cambodian community',
    url: 'https://www.angkorai.ai',
    siteName: 'AngkorAI',
    locale: 'km_KH',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-main text-white antialiased">{children}</body>
    </html>
  )
}
