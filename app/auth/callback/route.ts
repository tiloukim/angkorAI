import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  const redirectUrl = `${origin}/chat`

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[auth/callback] Missing env vars:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
      return NextResponse.redirect(`${origin}/login?error=server_config`)
    }

    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (sessionError) {
      console.error('[auth/callback] exchangeCodeForSession failed:', sessionError.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    return response
  }

  console.error('[auth/callback] No code in callback URL')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
