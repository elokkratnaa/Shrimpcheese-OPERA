import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProfiler } from '@/services/ProfilerService'
import { checkInputSafety } from '@/services/SafetyService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = (await supabase.auth.getSession()).data.session?.access_token

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { dump_text, debate_rounds, conversation_type, emotional_state, personas } = body

    if (!dump_text || typeof dump_text !== 'string' || dump_text.trim().length === 0) {
      return NextResponse.json({ error: 'raw_mind_dump cannot be empty' }, { status: 400 })
    }

    if (dump_text.length > 4000) {
      return NextResponse.json({ error: 'raw_mind_dump exceeds 4000 characters limit' }, { status: 400 })
    }

    const isSafe = await checkInputSafety(dump_text)
    if (!isSafe) {
      return NextResponse.json({ error: 'Input is not safe.' }, { status: 400 })
    }

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        raw_mind_dump: dump_text,
        rounds: debate_rounds,
        category: conversation_type,
        emotional_state,
        current_status: 'ingested'
      })
      .select('session_id')
      .single()

    if (error || !newSession) {
      return NextResponse.json({ error: error?.message || 'Failed to create session' }, { status: 500 })
    }

    // Fire-and-forget — don't block response on profiler
    runProfiler(newSession.session_id, accessToken, personas).catch(async (err) => {
      console.error('[ProfilerService] failed:', err)
      await supabase
        .from('sessions')
        .update({ current_status: 'error' })
        .eq('session_id', newSession.session_id)
    })

    return NextResponse.json({ session_id: newSession.session_id }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit


    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        session_id,
        raw_mind_dump,
        created_at,
        emotional_state,
        current_status,
        verdicts:verdicts (
          verdict_id,
          verdict_summary,
          is_committed
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[API] Error fetching sessions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sessions)
  } catch (err: unknown) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
