'use client'

import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

interface Props {
  email: string
  source: string
  onSuccess?: () => void
  apiBase?: string // For cross-app usage, e.g. "https://www.angkorai.ai"
}

export default function MembershipUpgrade({ email, source, onSuccess, apiBase = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (status === 'success') {
    return (
      <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
        <div className="text-3xl mb-2">🎉</div>
        <h3 className="text-lg font-semibold text-green-800">Pro Membership Activated!</h3>
        <p className="text-sm text-green-600 mt-1">
          You now have pro access across AngkorAI, AngkorCredit, AngkorX, and Snaeh.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
        <p className="text-sm text-gray-500 mt-1">$5/month — access all Angkor platforms</p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
          <span>AngkorAI</span>
          <span>·</span>
          <span>AngkorCredit</span>
          <span>·</span>
          <span>AngkorX</span>
          <span>·</span>
          <span>Snaeh</span>
        </div>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 text-center mb-3">{errorMsg}</p>
      )}

      <PayPalScriptProvider options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        currency: 'USD',
      }}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'subscribe' }}
          disabled={status === 'processing'}
          createOrder={async () => {
            setStatus('processing')
            setErrorMsg('')
            const res = await fetch(`${apiBase}/api/membership/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, source }),
            })
            const data = await res.json()
            if (!data.id) {
              setStatus('error')
              setErrorMsg('Failed to create payment')
              throw new Error('No order ID')
            }
            return data.id
          }}
          onApprove={async (data) => {
            const res = await fetch(`${apiBase}/api/membership/capture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID }),
            })
            const result = await res.json()
            if (result.success) {
              setStatus('success')
              onSuccess?.()
            } else {
              setStatus('error')
              setErrorMsg(result.error || 'Payment failed')
            }
          }}
          onError={() => {
            setStatus('error')
            setErrorMsg('Payment was cancelled or failed')
          }}
        />
      </PayPalScriptProvider>
    </div>
  )
}
