import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  const { plan } = await req.json()
  const priceId =
    plan === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_BUSINESS_PRICE_ID

  if (!priceId) {
    return NextResponse.json({ error: `Price ID for plan "${plan}" is not configured` }, { status: 500 })
  }

  // Ensure profile row exists
  await supabase.from('profiles').upsert(
    { id: user.id },
    { onConflict: 'id' }
  )

  // Create a Stripe customer for this checkout session
  const customer = await stripe.customers.create({
    email: user.email!,
    metadata: { supabase_user_id: user.id },
  })
  const customerId = customer.id

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/chat?upgraded=1`,
    cancel_url: `${appUrl}/chat`,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
