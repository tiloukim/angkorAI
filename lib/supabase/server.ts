import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

function makeCookieMethods(cookieStore: Awaited<ReturnType<typeof cookies>>): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {}
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: makeCookieMethods(cookieStore) }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: makeCookieMethods(cookieStore) }
  )
}

/**
 * Get authenticated user from either Bearer token (mobile) or cookies (web).
 * Bearer token takes priority when present.
 */
export async function getAuthUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return user
  }
  // Fall back to cookie auth (web)
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}
