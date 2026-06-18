import { logger } from "@/shared/logger"
import { createBackgroundClient } from '@/core/lib/supabase-background'
import { completeGroq, DEBATE_MODEL_CHAIN } from '@/core/lib/groq'
import { PERSONA_MAP } from '@/shared/personas'
import { sessionEvents } from '@/shared/events'

/**
 * Executes a multi-round debate loop between chosen persona archetypes,
 * persisting the outputs to council_debates and updating session status.
 */
export async function spawnCouncil(
  sessionId: string,
  archetypes: string[],
  rounds: number = 1,
  accessToken?: string,
  locale: string = 'en'
): Promise<void> {
  logger.info(`spawnCouncil called for session ${sessionId} with archetypes: ${JSON.stringify(archetypes)}, rounds: ${rounds}, locale: ${locale}`);
  const supabase = createBackgroundClient(accessToken)

  try {
    const ARCHETYPE_MAP: Record<string, string> = {
        'venture-capitalist': 'sage',
        'creative-hedonist': 'baz',
        'pragmatic-stoic': 'luna'
    };

    const chosenConfigs = archetypes.map(key => {
        const normalizedKey = key.toLowerCase();
        const mappedKey = ARCHETYPE_MAP[normalizedKey] || normalizedKey;
        return PERSONA_MAP[mappedKey];
    }).filter(config => !!config)
    
    logger.info(`Chosen configs: ${chosenConfigs.map(c => c.name).join(', ')}`);
    
    if (chosenConfigs.length === 0) {
        throw new Error("No valid personas found for debate");
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

    await supabase
      .from('sessions')
      .update({ current_status: 'council_ready' })
      .eq('session_id', sessionId)
    
    logger.info(`Session ${sessionId} updated to council_ready`);

    let globalTranscript: string = ""

    for (let round = 1; round <= rounds; round++) {
      let roundTranscript = "";

      for (let turn = 1; turn <= 3; turn++) {
        const turnResponses = await Promise.all(
          chosenConfigs.map(async (config, idx) => {
            try {
              let userPrompt = "";
              if (turn === 1) {
                userPrompt = `Context: ${globalTranscript}\n\nDecision: "${coreDecision}". Constraints: ${constraints}. Round ${round}: What's your initial take on this? Keep it punchy.`;
              } else if (turn === 3) {
                 userPrompt = `Round ${round}: Drop your final verdict/advice based on what's been said: ${roundTranscript}`;
              } else {
                 userPrompt = `Round ${round}: Call out or refine what the others just said: ${roundTranscript}`;
              }

              const text = await runUtterance(config.name, config.systemPrompt, userPrompt, round, round * 100 + turn * 10 + idx);
              return { name: config.name, text };
            } catch (err) {
              logger.error(`Turn failed for ${config.name}:`, err);
              return { name: config.name, text: (locale as any) === 'id' ? 'Saya tidak dapat merespons saat ini.' : 'I am unable to respond at this time.' };
            }
          })
        );

        turnResponses.forEach(r => {
          roundTranscript += `\n[${r.name}]: ${r.text}`;
        });
      }
      
      globalTranscript += `\n[Round ${round}]: ${roundTranscript}`;

      logger.warn(`Completed turn loop for round ${round}/${rounds}.`);

      logger.warn(`Emitting round_complete for round ${round}/${rounds}`);
      sessionEvents.emit(`session:${sessionId}`, { 
        type: "round_complete", 
        round: round, 
        total: rounds 
      });

      if (round < rounds) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            clearInterval(interval);
            logger.warn(`Rebuttal timeout reached for session ${sessionId}, proceeding...`);
            resolve();
          }, 5 * 60 * 1000);

          const interval = setInterval(async () => {
            const { data } = await supabase
              .from('council_debates')
              .select('message_content')
              .eq('session_id', sessionId)
              .eq('round_number', round)
              .eq('persona_name', 'Kamu')
              .maybeSingle();
            
            if (data) {
              clearInterval(interval);
              clearTimeout(timer);
              globalTranscript += `\n[User Rebuttal]: ${data.message_content}`;
              resolve();
            }
          }, 2000); 
        });
      }
    }

    logger.warn(`Debate loop finished for session ${sessionId}. Updating status to completed.`);
    
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ current_status: 'completed' })
      .eq('session_id', sessionId)
    
    if (updateError) {
        logger.error(`Failed to update session ${sessionId} to completed:`, updateError);
    } else {
        logger.success(`Session ${sessionId} successfully updated to completed.`);
    }
    
    logger.warn(`Emitting debate_complete for session ${sessionId}`);
    sessionEvents.emit(`session:${sessionId}`, { type: "debate_complete" });

  } catch (err: unknown) {
    logger.error(`Debate failed:`, err)
    await supabase
      .from('sessions')
      .update({ current_status: 'failed' })
      .eq('session_id', sessionId)
  }

  async function runUtterance(
      personaName: string,
      systemPrompt: string,
      userPrompt: string,
      roundNumber: number,
      turnSequence: number
    ): Promise<string> {
      sessionEvents.emit(`session:${sessionId}`, {
        type: "typing",
        persona_name: personaName
      });

      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error(`TIMEOUT_IN_DEBATE for ${personaName}`)), 60000)
      );

      logger.info(`Invoking Groq for ${personaName}...`);
      
      const responsePromise = completeGroq({
        system: `${systemPrompt} Rules:
                - Output ONLY the response text.
                - Use a "groupchat" style: punchy, informal, and very direct.
                - Max 2 short sentences.
                - No formal openers/closers.
                - Use lowercase where natural and avoid excessive punctuation.
                - No markdown, lists, or headers.
                - DO NOT use <think> tags.
                - STRICTLY PROHIBITED: No code, no work-related tasks, no creative project plans (GDDs), no technical output.
                - Focus EXCLUSIVELY on psychological/emotional support, analyzing personal dilemmas, and helping the user navigate overthinking.`,
        messages: [{ role: 'user', content: userPrompt }],
        modelChain: DEBATE_MODEL_CHAIN
      });

      let messageContent: string = "";
      try {
        messageContent = (await Promise.race([responsePromise, timeoutPromise])).trim();
        logger.success(`Successfully got response from ${personaName}`);
      } catch (err) {
        logger.error(`Utterance failed or timed out for ${personaName}:`, err);
        messageContent = (locale as any) === 'id' ? 'Saya tidak dapat merespons saat ini.' : 'I am unable to respond at this time.';
      }
      
      const insertPayload = {
          session_id: sessionId,
          persona_name: personaName,
          message_content: messageContent,
          round_number: roundNumber,
          turn_sequence: turnSequence
        };
      logger.warn(`Attempting to insert: ${JSON.stringify(insertPayload)}`);
      
      const { data, error } = await supabase
        .from('council_debates')
        .insert([insertPayload]);
      
      if (error) {
          logger.error(`Failed to insert debate utterance for ${personaName}:`, error);
          logger.error(`Payload was:`, insertPayload);
      } else {
          logger.success(`Inserted utterance for ${personaName}`);
      }

      sessionEvents.emit(`session:${sessionId}`, {
        type: "turn",
        persona_name: personaName,
        message_content: messageContent,
        round_number: roundNumber
      });

      return messageContent
    }
}
