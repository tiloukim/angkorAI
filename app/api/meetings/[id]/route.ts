import { NextRequest } from 'next/server'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'

// GET — get a single meeting
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { id } = await params
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!data) return new Response('Not found', { status: 404 })

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

// DELETE — delete a meeting
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { id } = await params
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('meeting_summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), {
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
