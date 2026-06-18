import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/core/lib/supabase-server'
import { streamGroq } from '@/core/lib/groq'
import { PERSONA_MAP } from '@/shared/personas'
import { checkInputSafety } from '@/core/services/SafetyService'
import { getTranslations } from 'next-intl/server'
import { logger } from '@/shared/logger'

export async function POST(request: NextRequest) {
  try { logger.info("[ChatAPI] POST request received");
    const t = await getTranslations('Error')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body
    try { logger.info("[ChatAPI] POST request received");
      body = await request.json()
    } catch {
      return new Response('Invalid JSON body', { status: 400 })
    }

    const { persona, message, history } = body
    logger.info('[ChatAPI] Request:' + JSON.stringify({ persona, message, historyLength: history?.length }));

    if (!persona || typeof persona !== 'string' || persona.trim().length === 0) {
      logger.error('[ChatAPI] Missing or invalid persona:', persona);
      return new Response('persona is required', { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      logger.error('[ChatAPI] Missing or invalid message:', message);
      return new Response('message is required', { status: 400 })
    }

    // Safety check
    const safety = await checkInputSafety(message)
    if (!safety.isSafe) {
      return new Response(safety.error || t('profiler_failed'), { status: 400 })
    }

    const systemPrompt = `${PERSONA_MAP[persona]?.systemPrompt || `You are ${persona}, a helpful advisor.`} 
    Rules:
    - Use a "groupchat" style: punchy, informal, and direct.
    - Max 2 short sentences.
    - No markdown, lists, or headers.
    - STRICTLY PROHIBITED: No code, no work-related tasks, no creative project plans (GDDs), no technical output.
    - Focus EXCLUSIVELY on psychological/emotional support, analyzing personal dilemmas, and helping the user navigate overthinking.`

    const chatHistory = (history as Array<{ role: string; content: string }> || []).map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))

    let stream;
    try { logger.info("[ChatAPI] POST request received");
      stream = await streamGroq({
        system: systemPrompt,
        messages: [...chatHistory, { role: 'user', content: message }]
      })
    } catch (err) {
      logger.error('[ChatAPI] Streaming failed after all fallbacks:', err);
      return new Response('AI_FAILED', { status: 503 });
    }

    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        try { logger.info("[ChatAPI] POST request received");
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || ''
            if (token) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err: unknown) {
          controller.error(err)
        }
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
