import { createBackgroundClient } from '@/core/lib/supabase-background'
import { ProfilerOutput } from '@/shared/types'

export interface PersonalityAnalysis {
  emotional_core: {
    state: string
    frequency: number
  }[]
  persona_affinity: {
    persona: string
    count: number
  }[]
  key_themes: string[]
}

export async function getPersonalityAnalysis(userId: string): Promise<PersonalityAnalysis | null> {
  const supabase = createBackgroundClient()

  // Fetch all completed sessions for the user
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('detected_biases')
    .eq('user_id', userId)
    .eq('current_status', 'completed')

  if (error || !sessions || sessions.length === 0) {
    return null
  }

  const emotionalCounts: Record<string, number> = {}
  const personaCounts: Record<string, number> = {}
  const themeCounts: Record<string, number> = {}

  sessions.forEach((session) => {
    const biases = session.detected_biases as unknown as ProfilerOutput
    if (!biases) return

    // Emotional state
    if (biases.emotional_vector) {
      const state = biases.emotional_vector.state
      emotionalCounts[state] = (emotionalCounts[state] || 0) + 1
    }

    // Persona affinity
    if (biases.suggested_persona_archetypes) {
      biases.suggested_persona_archetypes.forEach((persona) => {
        personaCounts[persona] = (personaCounts[persona] || 0) + 1
      })
    }

    // Themes (from core_decision_node)
    if (biases.core_decision_node) {
      // Very simple theme extraction - just counting occurrences
      // In a more advanced version, this would be an NLP clustering task
      const theme = biases.core_decision_node
      themeCounts[theme] = (themeCounts[theme] || 0) + 1
    }
  })

  // Format the aggregated data
  return {
    emotional_core: Object.entries(emotionalCounts)
      .map(([state, frequency]) => ({ state, frequency }))
      .sort((a, b) => b.frequency - a.frequency),
    persona_affinity: Object.entries(personaCounts)
      .map(([persona, count]) => ({ persona, count }))
      .sort((a, b) => b.count - a.count),
    key_themes: Object.entries(themeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(([theme]) => theme),
  }
}
