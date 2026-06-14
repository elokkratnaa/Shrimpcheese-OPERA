import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { synthesizeVerdict } from '@/services/VerdictService'
import { sessionEvents } from '@/lib/events'

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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          
          if (data.type === 'debate_complete') {
            sessionEvents.off(`session:${id}`, onEvent)
            // Start verdict synthesis
            try {
              const verdictStream = await synthesizeVerdict(id)
              const reader = verdictStream.getReader()
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                controller.enqueue(value)
              }
            } catch (err) {
              console.error('Error during automatic verdict synthesis:', err)
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
