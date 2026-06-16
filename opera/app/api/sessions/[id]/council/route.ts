import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/core/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: debates, error: debatesError } = await supabase
      .from('council_debates')
      .select('*')
      .eq('session_id', id)
      .order('turn_sequence', { ascending: true })

    if (debatesError) {
      return NextResponse.json({ error: debatesError.message }, { status: 500 })
    }

    return NextResponse.json(debates || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
