import { NextRequest } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

// GET — list saved meetings
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    console.log('Meetings GET — user:', user.id, user.email)

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('meeting_summaries')
      .select('id, title, duration_seconds, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Meetings GET — DB error:', error)
      throw error
    }

    console.log('Meetings GET — found:', data?.length, 'meetings')

    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST — save a meeting summary
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { title, transcript, summary, duration } = await req.json()

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('meeting_summaries')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Meeting',
        transcript,
        summary,
        duration_seconds: Math.round(duration || 0),
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
