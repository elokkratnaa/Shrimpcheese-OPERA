import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sessionEvents } from '@/lib/events'
import { checkInputSafety } from '@/services/SafetyService'

export async function POST(
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

    let body
    try {
      body = await request.json()
      console.log(`[Rebuttal API] Received body for session ${id}:`, body);
    } catch {
      console.error(`[Rebuttal API] Invalid JSON body for session ${id}`);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { content, target = 'Squad', round_number, action } = body
    console.log(`[Rebuttal API] Parsed body: content=${content}, target=${target}, round_number=${round_number}, action=${action}`);

    if (action !== 'skip' && (!content || typeof content !== 'string' || content.trim().length === 0)) {
      console.error(`[Rebuttal API] Missing content for session ${id}`);
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Safety check
    const isSafe = await checkInputSafety(content)
    if (!isSafe) {
      return NextResponse.json({ error: 'Input is not safe.' }, { status: 400 })
    }

    // Persist rebuttal to council_debates
    const { error: insertError } = await supabase
      .from('council_debates')
      .insert({
        session_id: id,
        persona_name: 'Kamu',
        message_content: content,
        turn_sequence: (round_number ? round_number * 100 + 99 : 999),
        round_number: round_number
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Emit event to wake up DebateService
    sessionEvents.emit(`rebuttal:${id}`, { content, target });

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
