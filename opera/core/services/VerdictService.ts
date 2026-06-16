import { createBackgroundClient } from '@/core/lib/supabase-background'
import { streamGroq } from '@/core/lib/groq'

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
  const supabase = createBackgroundClient()

  const { data: debates, error: debatesError } = await supabase
    .from('council_debates')
    .select('persona_name, message_content, turn_sequence')
    .eq('session_id', sessionId)
    .order('turn_sequence', { ascending: true })

  if (debatesError || !debates || debates.length === 0) {
    throw new Error(`Failed to load debates for verdict: ${debatesError?.message || 'No debates found'}`)
  }

  const transcript = debates
    .map(d => `[${d.persona_name} (Turn ${Math.floor(d.turn_sequence / 10)})]: ${d.message_content}`)
    .join('\n\n')

  const stream = await streamGroq({
    system: VERDICT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Here is the council debate transcript:\n\n${transcript}` }]
  })

  let rawBuffer = ''
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || ''
          if (token) {
            rawBuffer += token
            // Stream each token as a JSON SSE event so clients can display progressive text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          }
        }

        let cleanJson = rawBuffer.trim()
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.substring(7)
        }
        if (cleanJson.endsWith('```')) {
          cleanJson = cleanJson.substring(0, cleanJson.length - 3)
        }
        cleanJson = cleanJson.trim()

        const parsed = JSON.parse(cleanJson) as VerdictOutput

        const { data: inserted, error: insertError } = await supabase
          .from('verdicts')
          .insert({
            session_id: sessionId,
            verdict_summary: parsed.verdict_summary,
            action_steps: {
              pro_con_matrix: parsed.pro_con_matrix,
              recommendation: parsed.recommendation,
              next_steps: parsed.next_steps,
              tags: parsed.tags,
            },
            is_committed: false
          })
          .select('verdict_id, verdict_summary, action_steps, is_committed')
          .single()

        if (insertError || !inserted) {
          console.error('[VerdictService] Failed to insert verdict:', insertError)
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        // Emit full structured verdict so the client can render all sections
        const fullVerdict = {
          verdict_id: inserted.verdict_id,
          verdict_summary: inserted.verdict_summary,
          is_committed: inserted.is_committed,
          ...(inserted.action_steps as object),
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ verdict: fullVerdict })}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'VerdictService stream error'
        console.error('[VerdictService] Error during streaming/saving verdict:', message)
        controller.error(err)
      }
    }
  })
}
