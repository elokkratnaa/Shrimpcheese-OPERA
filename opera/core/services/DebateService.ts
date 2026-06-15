import { createBackgroundClient } from '@/core/lib/supabase-background'
import { completeGroq, DEBATE_MODEL_CHAIN } from '@/core/lib/groq'
import { PERSONA_MAP } from '@/shared/personas'
import { sessionEvents } from '@/shared/events'

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
  console.log(`[DebateService] spawnCouncil called for session ${sessionId} with archetypes:`, archetypes, "rounds:", rounds);
  const supabase = createBackgroundClient(accessToken)
  
  // Fetch locale for error messages, default to 'en'
  // Simplified for this context - in a real app, this should be passed in or derived
  const locale = 'en';

  try {
    const ARCHETYPE_MAP: Record<string, string> = {
        'venture-capitalist': 'vc',
        'creative-hedonist': 'hedonist',
        'pragmatic-stoic': 'stoic'
    };

    const chosenConfigs = archetypes.map(key => {
        const normalizedKey = key.toLowerCase();
        // Try direct ID match or map from archetype name
        const mappedKey = ARCHETYPE_MAP[normalizedKey] || normalizedKey;
        return PERSONA_MAP[mappedKey];
    }).filter(config => !!config)
    console.log(`[DebateService] Chosen configs:`, chosenConfigs.map(c => c.name));
    
    if (chosenConfigs.length === 0) {
        throw new Error("No valid personas found for debate");
    }
    
    // ... rest of the setup code ...
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

    // Update status to council_ready before spawning the debate loop
    await supabase
      .from('sessions')
      .update({ current_status: 'council_ready' })
      .eq('session_id', sessionId)
    console.log(`[DebateService] Session ${sessionId} updated to council_ready`);

    let globalTranscript: string = ""

    for (let round = 1; round <= rounds; round++) {
      // ... round loops ...
      // Turn 1
      const turn1Responses = await Promise.all(
        chosenConfigs.map(async (config, idx) => {
          const userPrompt = `Context: ${globalTranscript}\n\nDecision: "${coreDecision}". Constraints: ${constraints}. Round ${round}: Give your initial reaction/strategy.`
          const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + 10 + idx)
          return { name: config.name, text }
        })
      )
      
      // Turn 2
      const turn2Responses = await Promise.all(
        chosenConfigs.map(async (config, idx) => {
          const otherResponses = turn1Responses.filter(r => r.name !== config.name)
            .map(r => `[${r.name}]: "${r.text}"`).join('\n\n')
          const userPrompt = `Round ${round}: Challenge these arguments: ${otherResponses}`
          const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + 20 + idx)
          return { name: config.name, text }
        })
      )

      // Turn 3
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
        // ... SSE event ...
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
      // Emit typing event
      sessionEvents.emit(`session:${sessionId}`, {
        type: "typing",
        persona_name: personaName
      });

      const timeoutPromise = new Promise<string>((resolve) => 
        setTimeout(() => resolve((locale as any) === 'id' ? 'Saya tidak punya pendapat lebih lanjut.' : 'I have no further opinion.'), 60000)
      );

      const responsePromise = completeGroq({
        system: `${systemPrompt} You're a helpful assistant in a fast-moving group chat. Rules:
                - Max 3 sentences. One if possible.
                - Casual tone. No formal openers like "Certainly!" or "Great question!"
                - Never restate the question.
                - No markdown, lists, or headers.
                - If unsure, say so in one line.
                DO NOT use <think> tags. Output ONLY the response text.`,
        messages: [{ role: 'user', content: userPrompt }],
        modelChain: DEBATE_MODEL_CHAIN
      });

      const messageContent = (await Promise.race([responsePromise, timeoutPromise])).trim();
      
      const insertPayload = {
          session_id: sessionId,
          persona_name: personaName,
          message_content: messageContent,
          round_number: roundNumber,
          turn_sequence: turnSequence
        };
      console.log(`[DebateService] Attempting to insert:`, JSON.stringify(insertPayload));
      const { data, error } = await supabase
        .from('council_debates')
        .insert([insertPayload]);
      
      if (error) {
          console.error(`[DebateService] Failed to insert debate utterance for ${personaName}:`, error);
          console.error(`[DebateService] Payload was:`, insertPayload);
      } else {
          console.log(`[DebateService] Inserted utterance for ${personaName}`);
      }
      
      // Emit turn to client for live updates
      sessionEvents.emit(`session:${sessionId}`, {
        type: "turn",
        persona_name: personaName,
        message_content: messageContent,
        round_number: roundNumber
      });

      return messageContent
    }

    // ... completion code ...
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
