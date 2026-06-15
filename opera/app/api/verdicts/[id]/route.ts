import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeGroq, DEBATE_MODEL_CHAIN } from '@/lib/groq'
import { PERSONAS } from '@/lib/personas'

/**
 * GET /api/verdicts/[id]
 * Looks up the verdict for the given session_id.
 * Returns the full verdict with pro_con_matrix, recommendation, next_steps, tags
 * inlined from the action_steps JSONB column.
 *
 * @param context.params.id - The session UUID (not verdict UUID)
 */
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

    // Verify session ownership and fetch verdict in one join
    const { data: verdict, error } = await supabase
      .from('verdicts')
      .select('verdict_id, verdict_summary, action_steps, is_committed, favourite_persona, sessions!inner(user_id)')
      .eq('session_id', id)
      .single()

    if (error || !verdict) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    const sessionObj = Array.isArray(verdict.sessions) ? verdict.sessions[0] : verdict.sessions
    if (sessionObj?.user_id !== user.id) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    const flattened = {
      verdict_id: verdict.verdict_id,
      verdict_summary: verdict.verdict_summary,
      is_committed: verdict.is_committed,
      favourite_persona: verdict.favourite_persona,
      ...(verdict.action_steps as object),
    }

    return NextResponse.json(flattened)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/verdicts/[id]
 * Marks a verdict as committed or updates favourite_persona.
 * The id here is the verdict_id (not session_id).
 *
 * @param context.params.id - The verdict UUID
 */
export async function PATCH(
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

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { is_committed, favourite_persona } = body

    const { data: verdict, error: verdictError } = await supabase
      .from('verdicts')
      .select('*, sessions(user_id)')
      .eq('verdict_id', id)
      .single()

    if (verdictError || !verdict) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    const sessionObj = Array.isArray(verdict.sessions) ? verdict.sessions[0] : verdict.sessions
    if (sessionObj?.user_id !== user.id) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (typeof is_committed === 'boolean') updateData.is_committed = is_committed
    if (typeof favourite_persona === 'string') updateData.favourite_persona = favourite_persona

    const { data: updatedVerdict, error: updateError } = await supabase
      .from('verdicts')
      .update(updateData)
      .eq('verdict_id', id)
      .select('*')
      .single()

    if (updateError || !updatedVerdict) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update verdict' }, { status: 500 })
    }

    let closing_message = null
    if (favourite_persona && favourite_persona !== 'Masih Ragu') {
      // Find archetype by name
      const personaEntry = Object.values(PERSONAS).find(p => p.name === favourite_persona)
      if (personaEntry) {
        closing_message = await completeGroq({
          system: personaEntry.systemPrompt,
          messages: [{ role: 'user', content: 'User picked you as most rational. Give a short closing message in character.' }],
          modelChain: DEBATE_MODEL_CHAIN
        })
      }
    }

    return NextResponse.json({ ...updatedVerdict, closing_message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
