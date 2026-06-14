import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { is_committed } = body

    if (is_committed !== true) {
      return NextResponse.json({ error: 'is_committed must be true' }, { status: 400 })
    }

    // Verify verdict exists and belongs to auth user
    // We join the session table to verify ownership
    const { data: verdict, error: verdictError } = await supabase
      .from('verdicts')
      .select('*, sessions(user_id)')
      .eq('verdict_id', id)
      .single()

    if (verdictError || !verdict) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    // Next.js returns session as single nested object or array depending on relation setup
    const sessionObj = Array.isArray(verdict.sessions) ? verdict.sessions[0] : verdict.sessions
    const sessionUserId = sessionObj?.user_id

    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Verdict not found' }, { status: 404 })
    }

    const { data: updatedVerdict, error: updateError } = await supabase
      .from('verdicts')
      .update({ is_committed: true })
      .eq('verdict_id', id)
      .select('*')
      .single()

    if (updateError || !updatedVerdict) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update verdict' }, { status: 500 })
    }

    return NextResponse.json(updatedVerdict)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
