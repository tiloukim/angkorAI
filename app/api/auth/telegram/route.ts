import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyTelegramAuth, deriveTelegramPassword, type TelegramAuthData } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const data: TelegramAuthData = await req.json()

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const authSecret = process.env.TELEGRAM_AUTH_SECRET
    if (!botToken || !authSecret) {
      return NextResponse.json({ error: 'Telegram auth not configured' }, { status: 500 })
    }

    // Verify hash
    if (!verifyTelegramAuth(data, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram auth data' }, { status: 401 })
    }

    const email = `tg_${data.id}@angkorai.ai`
    const password = deriveTelegramPassword(data.id, authSecret)

    // Create SSR client with cookie access (sets session cookies automatically)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // Fast path: existing user
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInError) {
      return NextResponse.json({ success: true })
    }

    // Slow path: create user via admin API, then sign in
    if (signInError.message.includes('Invalid login credentials')) {
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

      // Now sign in to set session cookies
      const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: signInError.message }, { status: 500 })
  } catch (err) {
    console.error('Telegram auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
