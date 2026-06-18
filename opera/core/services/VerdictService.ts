import { createBackgroundClient } from '@/core/lib/supabase-background'
import { streamGroq } from '@/core/lib/groq'
import { logger } from '@/shared/logger'

export interface VerdictOutput {
  verdict_summary: string
  pro_con_matrix: {
    option: string
    pros: string[]
    cons: string[]
    weight: number
  }[]
  recommendation: string
  next_steps: [string, string]
  tags: string[]
}

const VERDICT_SYSTEM_PROMPT = `You are the final Verdict Synthesizer for OPERA. Your task is to analyze the council debate transcript and generate an objective synthesis.
You must compile a balanced pro-con matrix of choices, a clear overall recommendation, exactly 2 actionable next steps, and a list of auto-tags (e.g. ["#Career", "#Finance"]).

You must output a JSON object strictly matching this schema:
{
  "verdict_summary": "objective synthesis paragraph summarizing the debate's main conflicts and agreements",
  "pro_con_matrix": [
    {
      "option": "Name of option A",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "weight": 0.8
    }
  ],
  "recommendation": "the single clear recommended course of action",
  "next_steps": ["Step 1", "Step 2"],
  "tags": ["#Tag1", "#Tag2"]
}

Provide raw JSON representation ONLY. Do not prefix with conversational text or markdown code blocks.`

/**
 * Synthesizes a verdict based on the council debate transcript. Streams individual
 * tokens as SSE events `{ token }`, and on completion emits the full parsed verdict
 * as `{ verdict }` before closing the stream.
 *
 * @param sessionId - The UUID of the session
 * @returns A ReadableStream that emits SSE-formatted JSON token events
 */
export async function synthesizeVerdict(sessionId: string): Promise<ReadableStream> {
  logger.info(`[VerdictService] Starting synthesis for session: ${sessionId}`)
  const supabase = createBackgroundClient()

  const { data: debates, error: debatesError } = await supabase
    .from('council_debates')
    .select('persona_name, message_content, turn_sequence')
    .eq('session_id', sessionId)
    .order('turn_sequence', { ascending: true })

  if (debatesError || !debates || debates.length === 0) {
    logger.error(`[VerdictService] Failed to load debates for session ${sessionId}:`, debatesError)
    throw new Error(`Failed to load debates for verdict: ${debatesError?.message || 'No debates found'}`)
  }

  logger.info(`[VerdictService] Loaded ${debates.length} debate turns for transcript.`)

  const transcript = debates
    .map(d => `[${d.persona_name} (Turn ${Math.floor(d.turn_sequence / 10)})]: ${d.message_content}`)
    .join('\n\n')

  logger.info(`[VerdictService] Transcript prepared (${transcript.length} chars). Invoking Groq...`)

  const stream = await streamGroq({
    system: VERDICT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Here is the council debate transcript:\n\n${transcript}` }],
    responseFormat: { type: 'json_object' }
  })

  let rawBuffer = ''
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        logger.info(`[VerdictService] Beginning stream processing for session ${sessionId}...`)
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || ''
          if (token) {
            rawBuffer += token
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          }
        }

        logger.info(`[VerdictService] Stream complete. Raw buffer length: ${rawBuffer.length}`)
        let cleanJson = rawBuffer.trim()
        
        const firstBrace = cleanJson.indexOf('{')
        const lastBrace = cleanJson.lastIndexOf('}')
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1)
        }

        logger.info(`[VerdictService] Attempting to parse cleaned JSON (${cleanJson.length} chars)...`)
        let parsed: VerdictOutput
        try {
          parsed = JSON.parse(cleanJson) as VerdictOutput
          logger.info(`[VerdictService] JSON parsed successfully. Summary length: ${parsed.verdict_summary?.length}`)
        } catch (parseErr) {
          logger.error('[VerdictService] JSON Parse Error for session:', sessionId)
          logger.error('[VerdictService] Raw buffer:', rawBuffer)
          logger.error('[VerdictService] Cleaned JSON attempted:', cleanJson)
          throw parseErr
        }

        const insertPayload = {
          session_id: sessionId,
          verdict_summary: parsed.verdict_summary,
          action_steps: {
            pro_con_matrix: parsed.pro_con_matrix,
            recommendation: parsed.recommendation,
            next_steps: parsed.next_steps,
            tags: parsed.tags,
          },
          tags: parsed.tags,
          is_committed: false
        }

        let verdictData: any;
        
        logger.info(`[VerdictService] Checking for existing verdict for session ${sessionId}...`)
        const { data: existingVerdict } = await supabase
          .from('verdicts')
          .select('verdict_id')
          .eq('session_id', sessionId)
          .maybeSingle()
        
        if (existingVerdict) {
          logger.info(`[VerdictService] Verdict already exists for session ${sessionId} (ID: ${existingVerdict.verdict_id}).`)
          const { data: v } = await supabase
            .from('verdicts')
            .select('verdict_id, verdict_summary, action_steps, is_committed')
            .eq('verdict_id', existingVerdict.verdict_id)
            .single();
          verdictData = v;
        } else {
            logger.info(`[VerdictService] No existing verdict found. Inserting...`)
            const { data: inserted, error: insertError } = await supabase
              .from('verdicts')
              .insert(insertPayload)
              .select('verdict_id, verdict_summary, action_steps, is_committed')
              .single()

            if (insertError || !inserted) {
              logger.error(`[VerdictService] Failed to insert verdict for session ${sessionId}:`, insertError)
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              return
            }
            logger.success(`[VerdictService] Verdict saved successfully (ID: ${inserted.verdict_id}).`)
            verdictData = inserted;
        }
        
        // Ensure session is marked as completed now that verdict is safe
        const { error: sessionUpdateError } = await supabase
          .from('sessions')
          .update({ current_status: 'completed' })
          .eq('session_id', sessionId)

        if (sessionUpdateError) {
          logger.warn(`[VerdictService] Failed to update session status to completed for ${sessionId}: ${JSON.stringify(sessionUpdateError)}`)
        } else {
          logger.info(`[VerdictService] Session ${sessionId} status set to 'completed'.`)
        }

        const fullVerdict = {
          verdict_id: verdictData.verdict_id,
          verdict_summary: verdictData.verdict_summary,
          is_committed: verdictData.is_committed,
          ...(verdictData.action_steps as object),
        }

        logger.info(`[VerdictService] Emitting final verdict event and closing stream.`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ verdict: fullVerdict })}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'VerdictService stream error'
        logger.error(`[VerdictService] Error during streaming/saving verdict for session ${sessionId}:`, message)
        controller.error(err)
      }
    }
  })
}
