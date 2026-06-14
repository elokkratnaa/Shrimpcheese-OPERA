import { createBackgroundClient } from '@/lib/supabase/background'
import { completeGroq } from '@/lib/groq'
import { PERSONAS } from '@/lib/personas'
import { sessionEvents } from '@/lib/events'

/**
 * Executes a multi-round debate loop between chosen persona archetypes,
 * persisting the outputs to council_debates and updating session status.
 *
 * @param sessionId - The session UUID
 * @param archetypes - Array of archetypes selected
 * @param rounds - Number of debate rounds (1-3)
 * @param accessToken - The user's JWT access token
 */
export async function spawnCouncil(
  sessionId: string,
  archetypes: string[],
  rounds: number = 1,
  accessToken?: string
): Promise<void> {
  const supabase = createBackgroundClient(accessToken)

  try {
    const chosenConfigs = archetypes.map(key => PERSONAS[key]).filter(config => !!config)

    if (chosenConfigs.length === 0) {
      throw new Error('No valid persona archetypes provided')
    }

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('detected_biases')
      .eq('session_id', sessionId)
      .single()

    if (fetchError || !session) {
      throw new Error(`Failed to load session biases: ${fetchError?.message}`)
    }

    const biases = session.detected_biases as { core_decision_node?: string; constraints?: string[] } | null
    const coreDecision = biases?.core_decision_node || 'The main decision'
    const constraints = Array.isArray(biases?.constraints) ? biases.constraints.join(', ') : 'none'

    let globalTranscript: string = ""

    for (let round = 1; round <= rounds; round++) {
      
      // Turn 1: Initial reaction
      const turn1Responses = await Promise.all(
        chosenConfigs.map(async (config, idx) => {
          const userPrompt = `Context: ${globalTranscript}\n\nDecision: "${coreDecision}". Constraints: ${constraints}. Round ${round}: Give your initial reaction/strategy.`
          const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + 10 + idx)
          return { name: config.name, text }
        })
      )
      
      // Turn 2: Challenge
      const turn2Responses = await Promise.all(
        chosenConfigs.map(async (config, idx) => {
          const otherResponses = turn1Responses.filter(r => r.name !== config.name)
            .map(r => `[${r.name}]: "${r.text}"`).join('\n\n')
          const userPrompt = `Round ${round}: Challenge these arguments: ${otherResponses}`
          const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + 20 + idx)
          return { name: config.name, text }
        })
      )

      // Turn 3: Finalize
      const turn3Responses = await Promise.all(
        chosenConfigs.map(async (config, idx) => {
          const myChallenges = turn2Responses.filter(r => r.name !== config.name)
            .map(r => `[${r.name}]: "${r.text}"`).join('\n\n')
          const userPrompt = `Round ${round}: Deliver final strategic advice based on: ${myChallenges}`
          const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + 30 + idx)
          return { name: config.name, text }
        })
      )
      
      // Append all Turn 3 responses to transcript
      turn3Responses.forEach(r => {
        globalTranscript += `\n[Round ${round}][${r.name}]: ${r.text}`
      })

      // If more rounds exist, wait for user input
      if (round < rounds) {
        // Emit SSE event to client
        sessionEvents.emit(`session:${sessionId}`, { 
          type: "round_complete", 
          round: round, 
          total: rounds 
        });

        // Wait for rebuttal event
        await new Promise<void>((resolve) => {
          const onRebuttal = (data: { content: string, target?: string }) => {
            globalTranscript += `\n[User Rebuttal]: ${data.content} (Targeting: ${data.target || 'Squad'})`;
            sessionEvents.off(`rebuttal:${sessionId}`, onRebuttal);
            resolve();
          };
          sessionEvents.on(`rebuttal:${sessionId}`, onRebuttal);
        });
      }
    }

    // Helper to generate utterance and insert to database
    async function runUtterance(
      personaName: string,
      systemPrompt: string,
      userPrompt: string,
      roundNumber: number,
      turnSequence: number
    ): Promise<string> {
      const response = await completeGroq({
        system: `${systemPrompt} Write your response like a natural, quick chat message in a group thread. Keep it concise, to the point, and no more than 3 sentences. Avoid formal structures. DO NOT use <think> tags. Output ONLY the response text.`,
        messages: [{ role: 'user', content: userPrompt }]
      })
      const messageContent = response.trim()
      await supabase
        .from('council_debates')
        .insert({
          session_id: sessionId,
          persona_name: personaName,
          message_content: messageContent,
          round_number: roundNumber,
          turn_sequence: turnSequence
        })
      
      // Emit turn to client for live updates
      sessionEvents.emit(`session:${sessionId}`, {
        type: "turn",
        persona_name: personaName,
        message_content: messageContent,
        round_number: roundNumber
      });

      return messageContent
    }

    await supabase
      .from('sessions')
      .update({ current_status: 'completed' })
      .eq('session_id', sessionId)
    
    // Notify client that debate is finished
    sessionEvents.emit(`session:${sessionId}`, { type: "debate_complete" });

  } catch (err: unknown) {
    console.error(`[DebateService] Debate failed:`, err)
    await supabase
      .from('sessions')
      .update({ current_status: 'failed' })
      .eq('session_id', sessionId)
  }
}
