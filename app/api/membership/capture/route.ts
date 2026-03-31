import { NextRequest, NextResponse } from 'next/server'
import { upsertMembership } from '@/lib/membership'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || ''
const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getAccessToken() {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json()
    if (!orderID) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const token = await getAccessToken()

    // Capture the payment
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await res.json()

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Extract email and source from custom_id
    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || '{}'
    let email = ''
    let source = 'angkorai'
    try {
      const parsed = JSON.parse(customId)
      email = parsed.email
      source = parsed.source || 'angkorai'
    } catch {
      // Try to get email from payer
      email = capture.payer?.email_address || ''
    }

    if (!email) {
      return NextResponse.json({ error: 'Could not determine user email' }, { status: 400 })
    }

    // Update central membership — 30 days from now
    const proUntil = new Date()
    proUntil.setDate(proUntil.getDate() + 30)

    await upsertMembership(email, 'pro', source, proUntil.toISOString())

    return NextResponse.json({
      success: true,
      email,
      plan: 'pro',
      pro_until: proUntil.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
  }
}
