# AngkorAI — Setup Guide

## 1. Install Dependencies

```bash
cd angkorai-app
npm install
```

## 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your keys:

### Anthropic API Key
- Go to https://console.anthropic.com
- Create an API key
- Paste as `ANTHROPIC_API_KEY`

### Supabase
- Go to https://supabase.com → your project
- Settings → API → copy URL and anon/service keys

### Stripe
- Go to https://stripe.com → Developers → API keys
- Create two products:
  - **Pro**: $4.99/month recurring → copy Price ID → `STRIPE_PRO_PRICE_ID`
  - **Business**: $29.99/month recurring → copy Price ID → `STRIPE_BUSINESS_PRICE_ID`
- For webhook: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

## 3. Set Up Supabase Database

1. Open Supabase Dashboard → SQL Editor
2. Copy + paste the entire contents of `supabase/schema.sql`
3. Click "Run"

## 4. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

## 5. Deploy to Vercel

```bash
# Push to GitHub first
git init && git add . && git commit -m "Initial AngkorAI app"
git remote add origin https://github.com/YOUR_USERNAME/angkorai-app.git
git push -u origin main
```

Then in Vercel:
1. Import your GitHub repo
2. Add all `.env.local` variables as Environment Variables
3. Deploy!

## 6. Stripe Webhook in Production

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://www.angkorai.ai/api/stripe-webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## App Structure

```
/ (landing page)
/login
/signup
/chat (protected — requires login)
/api/chat (streaming Claude API)
/api/conversations (CRUD)
/api/usage (daily usage)
/api/checkout (Stripe)
/api/stripe-webhook
```

## Plans

| Plan     | Messages/Day | Price      |
|----------|-------------|------------|
| Free     | 30          | $0         |
| Pro      | 1,000       | $4.99/mo   |
| Business | Unlimited   | $29.99/mo  |
