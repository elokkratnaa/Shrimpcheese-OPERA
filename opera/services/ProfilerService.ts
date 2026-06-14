import { createClient } from '@/lib/supabase/server'
import { completeGroq } from '@/lib/groq'
import { spawnCouncil } from '@/services/DebateService'

/**
 * Interface representing the parsed Stage 1 Profiler output schema.
 */
export interface ProfilerOutput {
  core_decision_node: string
  constraints: string[]
  dependencies: string[]
  contradictions: string[]
  emotional_vector: {
    state: 'anxious' | 'avoidant' | 'risk-tolerant' | 'fatigued' | 'hopeful'
    intensity: 1 | 2 | 3
  }
  suggested_persona_archetypes: string[]
}

const PROFILER_SYSTEM_PROMPT = `You are the Profiler for OPERA. Your task is to analyze the user's raw mind dump and output a structured JSON object.
You must extract the core decision node, hard constraints, dependencies, logical/emotional contradictions, emotional state vector, and 2-3 suggested persona archetypes (must use the exact keys: 'pragmatic-stoic', 'venture-capitalist', 'creative-hedonist').

You must strictly output ONLY valid JSON matching this schema:
{
  "core_decision_node": "the actual decision being faced",
  "constraints": ["limit 1", "limit 2"],
  "dependencies": ["dependency 1"],
  "contradictions": ["logical conflict 1"],
  "emotional_vector": {
    "state": "anxious", // must be one of: anxious, avoidant, risk-tolerant, fatigued, hopeful
    "intensity": 2 // must be 1, 2, or 3
  },
  "suggested_persona_archetypes": ["pragmatic-stoic", "venture-capitalist"] // choose 2 to 3 from: pragmatic-stoic, venture-capitalist, creative-hedonist
}

Do not include any chat conversational text or markdown code blocks other than raw JSON.`

/**
 * Runs the profiler on a session by reading the mind dump, sending to Groq,
 * validating the JSON schema, and initiating the council debate.
 *
 * @param sessionId - The UUID of the session to profile
 */
export async function runProfiler(sessionId: string): Promise<void> {
  const supabase = await createClient()

  try {
    // 1. Fetch raw_mind_dump from sessions table
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('raw_mind_dump')
      .eq('session_id', sessionId)
      .single()

    if (fetchError || !session) {
      console.error(`[ProfilerService] Failed to fetch session ${sessionId}:`, fetchError)
      await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
      return
    }

    let rawDump = session.raw_mind_dump
    let attempts = 0
    let success = false
    let profilerOutput: ProfilerOutput | null = null

    // 2. Call completeGroq() with profiler system prompt (retry once on fail)
    while (attempts < 2 && !success) {
      attempts++
      try {
        const resultString = await completeGroq({
          system: PROFILER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: rawDump }]
        })

        // Clean JSON from potential markdown wrappers
        let cleanJsonString = resultString.trim()
        if (cleanJsonString.startsWith('```json')) {
          cleanJsonString = cleanJsonString.substring(7)
        }
        if (cleanJsonString.endsWith('```')) {
          cleanJsonString = cleanJsonString.substring(0, cleanJsonString.length - 3)
        }
        cleanJsonString = cleanJsonString.trim()

        const parsed = JSON.parse(cleanJsonString) as ProfilerOutput

        // Validation checks
        if (
          typeof parsed.core_decision_node === 'string' &&
          Array.isArray(parsed.constraints) &&
          Array.isArray(parsed.dependencies) &&
          Array.isArray(parsed.contradictions) &&
          parsed.emotional_vector &&
          ['anxious', 'avoidant', 'risk-tolerant', 'fatigued', 'hopeful'].includes(parsed.emotional_vector.state) &&
          [1, 2, 3].includes(parsed.emotional_vector.intensity) &&
          Array.isArray(parsed.suggested_persona_archetypes) &&
          parsed.suggested_persona_archetypes.length >= 2
        ) {
          profilerOutput = parsed
          success = true
        } else {
          throw new Error('JSON structure validation failed')
        }
      } catch (err: unknown) {
        console.error(`[ProfilerService] Attempt ${attempts} failed for session ${sessionId}:`, err)
      }
    }

    // 4. On second failure update status to failed
    if (!success || !profilerOutput) {
      await supabase
        .from('sessions')
        .update({ current_status: 'failed' })
        .eq('session_id', sessionId)
      return
    }

    // 5. Update session details and status
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        detected_biases: profilerOutput,
        current_status: 'processing'
      })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error(`[ProfilerService] Failed to update session ${sessionId}:`, updateError)
      await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
      return
    }

    // 6. Spawn the Council Debate
    await spawnCouncil(sessionId, profilerOutput.suggested_persona_archetypes)
  } catch (err: unknown) {
    console.error(`[ProfilerService] Unexpected error on session ${sessionId}:`, err)
    await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
  }
}
