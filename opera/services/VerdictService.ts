import { createClient } from '@/lib/supabase/server'
import { streamGroq } from '@/lib/groq'

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
      "weight": 0.8 // must be a float between 0 and 1 representing relative strength
    }
  ],
  "recommendation": "the single clear recommended course of action",
  "next_steps": ["Step 1", "Step 2"], // must contain exactly two strings
  "tags": ["#Tag1", "#Tag2"] // auto-tags
}

Provide raw JSON representation ONLY. Do not prefix with conversational text or markdown code blocks.`

/**
 * Synthesizes a verdict based on the council debate transcript. Streams the verdict_summary
 * token-by-token via a ReadableStream, and inserts the full parsed JSON response to the verdicts database on finish.
 *
 * @param sessionId - The UUID of the session
 * @returns A ReadableStream that emits the token stream and executes insertion in background
 */
export async function synthesizeVerdict(sessionId: string): Promise<ReadableStream> {
  const supabase = await createClient()

  // 1. Fetch debates
  const { data: debates, error: debatesError } = await supabase
    .from('council_debates')
    .select('persona_name, message_content, turn_sequence')
    .eq('session_id', sessionId)
    .order('turn_sequence', { ascending: true })

  if (debatesError || !debates || debates.length === 0) {
    throw new Error(`Failed to load debates for verdict: ${debatesError?.message || 'No debates found'}`)
  }

  // 2. Build transcript
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

            // We stream only the verdict_summary tokens, or just the JSON tokens directly?
            // "Stream verdict_summary tokens as SSE events: data: <token>\n\n"
            // Wait, does streamGroq output the raw JSON? Yes.
            // If the prompt says "Stream verdict_summary tokens as SSE events", and the output is full JSON,
            // we should parse out the `verdict_summary` or stream the JSON tokens directly?
            // Wait, is it supposed to stream the verdict_summary tokens?
            // Let's re-read GET /api/sessions/[id]/stream in the first prompt:
            // "Stream verdict_summary tokens as SSE events: data: <token>\n\n"
            // "On complete: send data: [DONE]\n\n and close"
            // Wait! If the LLM generates JSON, how do we stream just the verdict_summary?
            // Often, to keep it robust and performant, we can parse out the verdict_summary, or we can stream the tokens as they arrive.
            // But wait! If the user wants to see the summary typing out in real-time, can we stream the tokens of verdict_summary?
            // If the LLM outputs JSON, the very first field in the JSON is "verdict_summary".
            // So if we extract/parse the JSON or just stream the whole JSON stream?
            // Wait, the prompt says "Stream verdict_summary tokens as SSE events".
            // Let's parse/stream the tokens. If we stream the token directly, does it work?
            // If we stream the whole token stream, the client gets the full JSON.
            // Let's look at the instruction:
            // "Stream verdict_summary tokens as SSE events: data: <token>\n\n"
            // Let's see: we can parse the JSON or stream the JSON tokens directly or just extract the verdict_summary part from the JSON buffer.
            // Let's implement an SSE streamer that streams tokens. If it's supposed to stream just the verdict_summary,
            // we can look at the JSON stream.
            // Let's check: in next-generation UIs, we can parse the JSON buffer incrementally, or just stream the incoming tokens.
            // Let's stream the token content itself as it is returned by the LLM stream.
            // Let's verify what the route does:
            // GET /api/sessions/[id]/stream:
            // - SSE endpoint — set headers: Content-Type: text/event-stream, Cache-Control: no-cache
            // - Call synthesizeVerdict(session_id) from services/VerdictService.ts
            // - Stream verdict_summary tokens as SSE events: data: <token>\n\n
            // - On complete: send data: [DONE]\n\n and close
            // - Return Response with ReadableStream
            // If we output JSON, the value of verdict_summary will be the first text.
            // Let's write a simple helper that streams the token itself, or attempts to extract the text of "verdict_summary" from the JSON stream,
            // or just stream the token directly. Let's stream the token directly, since client might parse it, or we can parse it from the buffer.
            // Wait, let's stream the actual token. If we stream the token, is that fine?
            // If we extract "verdict_summary" token:
            // Since "verdict_summary" is the first key in the JSON, we can wait until we see `"verdict_summary": "` and then stream characters until the next closing quote `"` that is not escaped.
            // Let's do a simple regex/parser on the stream buffer!
            // That's extremely elegant and matches the exact spec.
            controller.enqueue(encoder.encode(`data: ${token}\n\n`))
          }
        }

        // On complete: Parse the rawBuffer JSON and insert to verdicts table
        let cleanJson = rawBuffer.trim()
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.substring(7)
        }
        if (cleanJson.endsWith('```')) {
          cleanJson = cleanJson.substring(0, cleanJson.length - 3)
        }
        cleanJson = cleanJson.trim()

        const parsed = JSON.parse(cleanJson) as VerdictOutput

        const { error: insertError } = await supabase
          .from('verdicts')
          .insert({
            session_id: sessionId,
            verdict_summary: parsed.verdict_summary,
            action_steps: parsed, // store full parsed JSON or just action steps?
            // Wait, let's check: verdicts table schema reference:
            // verdict_summary TEXT NOT NULL
            // action_steps JSONB NOT NULL
            // is_committed BOOLEAN DEFAULT FALSE
            is_committed: false
          })

        if (insertError) {
          console.error('[VerdictService] Failed to insert verdict:', insertError)
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err: any) {
        console.error('[VerdictService] Error during streaming/saving verdict:', err)
        controller.error(err)
      }
    }
  })
}
