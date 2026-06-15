import { createBackgroundClient } from '@/core/lib/supabase-background'
import { completeGroq, DEBATE_MODEL_CHAIN} from '@/core/lib/groq'
import { spawnCouncil } from '@/core/services/DebateService'
import { PROFILER_SYSTEM_PROMPT, ProfilerOutput } from '@/shared/types'

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
    // 1. Fetch session details
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

    // 2. Call completeGroq() with profiler system prompt (retry once on fail)
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
        
        if (cleanJsonString.startsWith('```json')) {
          cleanJsonString = cleanJsonString.substring(7)
        }
        if (cleanJsonString.endsWith('```')) {
          cleanJsonString = cleanJsonString.substring(0, cleanJsonString.length - 3)
        }
        cleanJsonString = cleanJsonString.trim()

        try {
          const parsed = JSON.parse(cleanJsonString) as ProfilerOutput
          // Validation checks
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
            console.error(`[ProfilerService] JSON structure validation failed. Raw response: ${cleanJsonString}`)
            throw new Error('JSON structure validation failed')
          }
        } catch (parseErr) {
          console.error(`[ProfilerService] JSON parsing failed. Raw response: ${cleanJsonString}`)
          throw parseErr
        }
      } catch (err: unknown) {
        console.error(`[ProfilerService] Attempt ${attempts} failed for session ${sessionId}:`, err)
      }
    }

    // 4. On second failure update status to failed
    if (!success || !profilerOutput) {
      console.error(`[ProfilerService] Profiling failed for session ${sessionId} after ${attempts} attempts`)
      await supabase
        .from('sessions')
        .update({ current_status: 'failed' })
        .eq('session_id', sessionId)
      return
    }
    console.log(`[ProfilerService] Profiling successful for session ${sessionId}`)

    // 5. Update session details and status
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

    // 6. Spawn the Council Debate (Backgrounded)
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
