import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/core/lib/supabase-server'
import { synthesizeVerdict } from '@/core/services/VerdictService'
import { sessionEvents } from '@/shared/events'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, current_status')
      .eq('session_id', id)
      .single()

    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }

    if (session.user_id !== user.id) {
      return new Response('Session not found', { status: 404 })
    }

    const encoder = new TextEncoder()

    const customReadable = new ReadableStream({
      async start(controller) {
        // If already completed, just jump to verdict
        if (session.current_status === 'completed') {
          const verdictStream = await synthesizeVerdict(id)
          const reader = verdictStream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
          controller.close()
          return
        }

        // Listen for debate events
        const onEvent = async (data: any) => {
          console.log(`[StreamRoute] Emitting SSE event for session ${id}:`, JSON.stringify(data))
          try {
            const formatted = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(formatted));
          } catch (e) {
            console.error(`[StreamRoute] Controller enqueue failed for ${id}:`, e)
            return;
          }

          if (data.type === 'debate_complete') {
            console.log(`[StreamRoute] Debate complete for session ${id}. Starting verdict synthesis...`)
            sessionEvents.off(`session:${id}`, onEvent)
            // ... (rest of verdict logic)

            try {
              const verdictStream = await synthesizeVerdict(id)
              const reader = verdictStream.getReader()
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                try {
                    controller.enqueue(value)
                } catch (e) {
                    console.error(`[StreamRoute] Controller enqueue failed during verdict for ${id}:`, e)
                    break;
                }
              }
              console.log(`[StreamRoute] Verdict stream completed for session ${id}`)
            } catch (err) {
              console.error(`[StreamRoute] Error during automatic verdict synthesis for ${id}:`, err)
            } finally {
              try {
                controller.close()
              } catch (e) {
                // Controller already closed, ignore
              }
            }
          }
        }

        sessionEvents.on(`session:${id}`, onEvent)

        // Clean up on stream close
        request.signal.addEventListener('abort', () => {
          sessionEvents.off(`session:${id}`, onEvent)
        })
      }
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return new Response(message, { status: 500 })
  }
}
