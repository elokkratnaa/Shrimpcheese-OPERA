import { createClient } from '@/lib/supabase/server'
import { completeGroq } from '@/lib/groq'
import { PERSONAS } from '@/lib/personas'

/**
 * Executes a 3-turn debate loop between the chosen persona archetypes,
 * persisting the outputs to council_debates and updating the session status.
 *
 * @param sessionId - The session UUID
 * @param archetypes - Array of archetypes selected for this session (e.g. ['pragmatic-stoic', 'venture-capitalist'])
 */
export async function spawnCouncil(sessionId: string, archetypes: string[]): Promise<void> {
  const supabase = await createClient()

  try {
    // 1. Map archetypes to actual PERSONAS configs
    const chosenConfigs = archetypes
      .map(key => PERSONAS[key])
      .filter(config => !!config)

    if (chosenConfigs.length === 0) {
      throw new Error('No valid persona archetypes provided')
    }

    // Fetch the core decision node and constraints from the session
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('detected_biases')
      .eq('session_id', sessionId)
      .single()

    if (fetchError || !session) {
      throw new Error(`Failed to load session biases: ${fetchError?.message}`)
    }

    const biases = session.detected_biases as any
    const coreDecision = biases?.core_decision_node || 'The main decision'
    const constraints = Array.isArray(biases?.constraints) ? biases.constraints.join(', ') : 'none'

    // We store transcripts and messages locally to build the context for Turn 2 and Turn 3
    const debateHistory: { [personaName: string]: string[] } = {}
    chosenConfigs.forEach(config => {
      debateHistory[config.name] = []
    })

    // Helper to generate utterance and insert to database
    const runUtterance = async (
      personaName: string,
      systemPrompt: string,
      userPrompt: string,
      turnSequence: number
    ): Promise<string> => {
      const response = await completeGroq({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })

      const messageContent = response.trim()

      const { error: insertError } = await supabase
        .from('council_debates')
        .insert({
          session_id: sessionId,
          persona_name: personaName,
          message_content: messageContent,
          turn_sequence: turnSequence
        })

      if (insertError) {
        throw new Error(`Failed to save council debate utterance: ${insertError.message}`)
      }

      return messageContent
    }

    // Turn 1: React to the core decision node under constraints
    const turn1Responses = await Promise.all(
      chosenConfigs.map(async (config, idx) => {
        const userPrompt = `Here is the decision I am facing: "${coreDecision}". My constraints are: ${constraints}. Please give your initial, unfiltered reaction/strategy from your unique perspective.`
        const text = await runUtterance(config.name, config.systemPrompt, userPrompt, 10 + idx)
        debateHistory[config.name].push(text)
        return { name: config.name, text }
      })
    )

    // Turn 2: Challenge the other personas' positions
    const turn2Responses = await Promise.all(
      chosenConfigs.map(async (config, idx) => {
        const otherResponses = turn1Responses
          .filter(r => r.name !== config.name)
          .map(r => `[${r.name}]: "${r.text}"`)
          .join('\n\n')

        const userPrompt = `Here are the initial arguments from the other advisors:\n\n${otherResponses}\n\nChallenge their arguments directly based on their biases, constraints, and gaps in logic.`
        const text = await runUtterance(config.name, config.systemPrompt, userPrompt, 20 + idx)
        debateHistory[config.name].push(text)
        return { name: config.name, text }
      })
    )

    // Turn 3: Final position / compromise or strong recommendation
    await Promise.all(
      chosenConfigs.map(async (config, idx) => {
        const myChallenges = turn2Responses
          .filter(r => r.name !== config.name)
          .map(r => `[${r.name}]: "${r.text}"`)
          .join('\n\n')

        const userPrompt = `The other advisors challenged your views with:\n\n${myChallenges}\n\nDeliver your final strategic advice to the user. State clearly what actions should be taken and resolve any remaining conflicts.`
        await runUtterance(config.name, config.systemPrompt, userPrompt, 30 + idx)
      })
    )

    // On complete: UPDATE status to completed
    await supabase
      .from('sessions')
      .update({ current_status: 'completed' })
      .eq('session_id', sessionId)
  } catch (err: unknown) {
    console.error(`[DebateService] Debate failed for session ${sessionId}:`, err)
    await supabase
      .from('sessions')
      .update({ current_status: 'failed' })
      .eq('session_id', sessionId)
  }
}
