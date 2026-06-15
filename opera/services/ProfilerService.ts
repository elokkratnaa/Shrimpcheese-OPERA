import { createBackgroundClient } from '@/lib/supabase/background'
import { completeGroq, DEBATE_MODEL_CHAIN } from '@/lib/groq'
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
    state: 'anxious' | 'avoidant' | 'risk-tolerant' | 'fatigued' | 'hopeful' | 'bingung'
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
    "state": "anxious", // must be one of: anxious, avoidant, risk-tolerant, fatigued, hopeful, bingung
    "intensity": 2 // must be 1, 2, or 3
  },
  "suggested_persona_archetypes": ["pragmatic-stoic", "venture-capitalist"] // choose 2 to 3 from: pragmatic-stoic, venture-capitalist, creative-hedonist
}

Do not include any chat conversational text or markdown code blocks other than raw JSON.`

/**
 * Runs the profiler on a session by reading the mind dump, sending to Groq,
 * validating the JSON schema, and initiating the council debate.
 */
export async function runProfiler(
  sessionId: string, 
  accessToken?: string,
  manualPersonas?: string[]
): Promise<void> {
  const supabase = createBackgroundClient(accessToken)

  try {
    console.log(`[ProfilerService] Starting profiling for session ${sessionId}`)
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('raw_mind_dump, rounds, category, emotional_state')
      .eq('session_id', sessionId)
      .single()

    if (fetchError || !session) {
      console.error(`[ProfilerService] Failed to fetch session ${sessionId}:`, fetchError)
      await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
      return
    }
    console.log(`[ProfilerService] Session fetched: ${sessionId}`)

    const contextPrefix = `Category: ${session.category || 'Unspecified'}. Emotional state: ${session.emotional_state || 'Unspecified'}.`
    let rawDump = session.raw_mind_dump
    let attempts = 0
    let success = false
    let profilerOutput: ProfilerOutput | null = null

    while (attempts < 2 && !success) {
      attempts++
      try {
        console.log(`[ProfilerService] Attempt ${attempts} calling completeGroq for session ${sessionId}`)
        const resultString = await completeGroq({
          system: `${contextPrefix}\n\n${PROFILER_SYSTEM_PROMPT}`,
          messages: [{ role: 'user', content: rawDump }]
        })
        console.log(`[ProfilerService] Received Groq response for session ${sessionId}`)

        let cleanJsonString = resultString.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (cleanJsonString.startsWith('```json')) cleanJsonString = cleanJsonString.substring(7)
        if (cleanJsonString.endsWith('```')) cleanJsonString = cleanJsonString.substring(0, cleanJsonString.length - 3)
        cleanJsonString = cleanJsonString.trim()

        const parsed = JSON.parse(cleanJsonString) as ProfilerOutput
        if (
          typeof parsed.core_decision_node === 'string' &&
          Array.isArray(parsed.constraints) &&
          Array.isArray(parsed.dependencies) &&
          Array.isArray(parsed.contradictions) &&
          parsed.emotional_vector &&
          ['anxious', 'avoidant', 'risk-tolerant', 'fatigued', 'hopeful', 'bingung'].includes(parsed.emotional_vector.state) &&
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

    if (!success || !profilerOutput) {
      console.error(`[ProfilerService] Profiling failed for session ${sessionId} after ${attempts} attempts`)
      await supabase
        .from('sessions')
        .update({ current_status: 'failed' })
        .eq('session_id', sessionId)
      return
    }
    console.log(`[ProfilerService] Profiling successful for session ${sessionId}`)

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        detected_biases: profilerOutput,
        current_status: 'processing'
      })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error(`[ProfilerService] Failed to update session ${sessionId} to processing:`, updateError)
      await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
      return
    }
    console.log(`[ProfilerService] Session ${sessionId} updated to processing`)

    const personasToSpawn = (manualPersonas && manualPersonas.length > 0) 
      ? manualPersonas 
      : profilerOutput.suggested_persona_archetypes
    console.log(`[ProfilerService] Spawning council for session ${sessionId} with personas:`, personasToSpawn)

    spawnCouncil(sessionId, personasToSpawn, session.rounds, accessToken)
      .catch(err => console.error(`[ProfilerService] Background spawnCouncil failed for session ${sessionId}:`, err))
  } catch (err: unknown) {
    console.error(`[ProfilerService] Unexpected error on session ${sessionId}:`, err)
    await supabase.from('sessions').update({ current_status: 'failed' }).eq('session_id', sessionId)
  }
}
