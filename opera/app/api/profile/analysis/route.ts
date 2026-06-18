import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/core/lib/supabase-server'
import { getPersonalityAnalysis } from '@/core/services/PersonalityService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysis = await getPersonalityAnalysis(user.id)

    if (!analysis) {
      return NextResponse.json({ error: 'No analysis data available' }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (err: unknown) {
    console.error('[API] Error in analysis route:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
