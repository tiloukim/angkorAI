import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')

  if (accessToken && refreshToken) {
    const supabase = await createClient()
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  return NextResponse.redirect(`${origin}/chat`)
}
