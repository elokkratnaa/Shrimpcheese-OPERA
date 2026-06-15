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
      const turns = Math.floor(Math.random() * 3) + 1;
      let roundTranscript = "";

      for (let turn = 1; turn <= turns; turn++) {
        const turnResponses = await Promise.all(
          chosenConfigs.map(async (config, idx) => {
            try {
              let userPrompt = "";
              if (turn === 1) {
                userPrompt = `Context: ${globalTranscript}\n\nDecision: "${coreDecision}". Constraints: ${constraints}. Round ${round}: Give your initial reaction/strategy.`;
              } else if (turn === turns) {
                 userPrompt = `Round ${round}: Deliver final strategic advice based on previous arguments: ${roundTranscript}`;
              } else {
                 userPrompt = `Round ${round}: Challenge/refine previous arguments: ${roundTranscript}`;
              }

              const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + turn * 10 + idx);
              return { name: config.name, text };
            } catch (err) {
              console.error(`[DebateService] Turn failed for ${config.name}:`, err);
              return { name: config.name, text: (locale as any) === 'id' ? 'Saya tidak dapat merespons saat ini.' : 'I am unable to respond at this time.' };
            }
          })
        );

        turnResponses.forEach(r => {
          roundTranscript += `\n[${r.name}]: ${r.text}`;
        });
      }
      
      globalTranscript += `\n[Round ${round}]: ${roundTranscript}`;

      // Emit round complete event at the end of each round
      sessionEvents.emit(`session:${sessionId}`, { 
        type: "round_complete", 
        round: round, 
        total: rounds 
      });

      // If more rounds exist, wait for user input
      if (round < rounds) {
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

      // Create a timeout that rejects after 25s
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error(`TIMEOUT_IN_DEBATE for ${personaName}`)), 25000)
      );

      console.log(`[DebateService] Invoking Groq for ${personaName}...`);
      
      const responsePromise = completeGroq({
        system: `${systemPrompt} Rules:
                - Output ONLY the response text.
                - Max 2 sentences. Be extremely concise.
                - No formal openers/closers.
                - No markdown, lists, or headers.
                - DO NOT use <think> tags.`,
        messages: [{ role: 'user', content: userPrompt }],
        modelChain: DEBATE_MODEL_CHAIN
      });

      // Use a race, but if it rejects, log it and return the fallback
      let messageContent: string = "";
      try {
        messageContent = (await Promise.race([responsePromise, timeoutPromise])).trim();
      } catch (err) {
        console.error(`[DebateService] Utterance failed or timed out for ${personaName}:`, err);
        messageContent = (locale as any) === 'id' ? 'Saya tidak punya pendapat lebih lanjut.' : 'I have no further opinion.';
      }
      
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
