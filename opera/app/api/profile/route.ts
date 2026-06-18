import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/core/lib/supabase-server'
import { createBackgroundClient } from '@/core/lib/supabase-background'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count: total_sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }

    const { count: committed_count, error: committedError } = await supabase
      .from('verdicts')
      .select('*, sessions!inner(user_id)', { count: 'exact', head: true })
      .eq('sessions.user_id', user.id)
      .eq('is_committed', true)

    if (committedError) {
      return NextResponse.json({ error: committedError.message }, { status: 500 })
    }

    const { data: verdicts, error: verdictsError } = await supabase
      .from('verdicts')
      .select('tags, sessions!inner(user_id)')
      .eq('sessions.user_id', user.id)

    if (verdictsError) {
      return NextResponse.json({ error: verdictsError.message }, { status: 500 })
    }

    const tagCounts: Record<string, number> = {}
    verdicts?.forEach((verdict: { tags: unknown }) => {
      let tags: unknown = verdict.tags
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags)
        } catch {
        }
      }
      if (Array.isArray(tags)) {
        tags.forEach((tag: unknown) => {
          if (typeof tag === 'string') {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          }
        })
      }
    })

    let top_tag = null
    let maxCount = 0
    for (const [tag, count] of Object.entries(tagCounts)) {
      if (count > maxCount) {
        maxCount = count
        top_tag = tag
      }
    }

    return NextResponse.json({
      user,
      stats: {
        total_sessions: total_sessions || 0,
        committed_count: committed_count || 0,
        top_tag
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const { full_name } = body

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'full_name must be a non-empty string' }, { status: 400 })
    }

    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: { full_name }
    })

    if (updateError || !updatedUser.user) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(updatedUser.user)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: deleteSessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', user.id)

    if (deleteSessionsError) {
      return NextResponse.json({ error: deleteSessionsError.message }, { status: 500 })
    }

    const adminSupabase = createBackgroundClient()
    const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
