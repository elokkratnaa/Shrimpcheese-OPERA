import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProfiler } from '@/services/ProfilerService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capture the access token while we're still inside the request context
    // so the downstream service clients can authorize against RLS.
    const { data: { session: authSession } } = await supabase.auth.getSession()
    const accessToken = authSession?.access_token

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { raw_mind_dump } = body

    if (!raw_mind_dump || typeof raw_mind_dump !== 'string' || raw_mind_dump.trim().length === 0) {
      return NextResponse.json({ error: 'raw_mind_dump cannot be empty' }, { status: 400 })
    }

    if (raw_mind_dump.length > 4000) {
      return NextResponse.json({ error: 'raw_mind_dump exceeds 4000 characters limit' }, { status: 400 })
    }

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        raw_mind_dump,
        current_status: 'ingested'
      })
      .select('session_id')
      .single()

    if (error || !newSession) {
      return NextResponse.json({ error: error?.message || 'Failed to create session' }, { status: 500 })
    }

    // Run the full pipeline inline — awaited so the client can navigate directly to /council
    // when this responds. The profiling page will see `completed` status immediately.
    await runProfiler(newSession.session_id, accessToken)

    return NextResponse.json({ session_id: newSession.session_id }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
