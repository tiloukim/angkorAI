import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { verifyTelegramAuth, deriveTelegramPassword, type TelegramAuthData } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const data: TelegramAuthData = await req.json()

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const authSecret = process.env.TELEGRAM_AUTH_SECRET
    if (!botToken || !authSecret) {
      return NextResponse.json({ error: 'Telegram auth not configured' }, { status: 500 })
    }

    if (!verifyTelegramAuth(data, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram auth data' }, { status: 401 })
    }

    const email = `tg_${data.id}@angkorai.ai`
    const password = deriveTelegramPassword(data.id, authSecret)

    // Use plain Supabase client (no SSR cookies — mobile needs tokens)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fast path: existing user
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInError && session.session) {
      return NextResponse.json({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      })
    }

    // Slow path: create user via admin API, then sign in
    if (signInError?.message.includes('Invalid login credentials')) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          photo_url: data.photo_url,
          auth_provider: 'telegram',
        },
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      const { data: retrySession, error: retryError } = await supabase.auth.signInWithPassword({ email, password })
      if (retryError || !retrySession.session) {
        return NextResponse.json({ error: retryError?.message || 'Sign-in failed' }, { status: 500 })
      }

      return NextResponse.json({
        access_token: retrySession.session.access_token,
        refresh_token: retrySession.session.refresh_token,
      })
    }

    return NextResponse.json({ error: signInError?.message || 'Sign-in failed' }, { status: 500 })
  } catch (err) {
    console.error('Telegram mobile auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
