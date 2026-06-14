import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamGroq } from '@/lib/groq'
import { personas } from '@/lib/personas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Invalid JSON body', { status: 400 })
    }

    const { persona, message, history } = body

    if (!persona || typeof persona !== 'string' || persona.trim().length === 0) {
      return new Response('persona is required', { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response('message is required', { status: 400 })
    }

    const systemPrompt = personas[persona] || `You are ${persona}, a helpful advisor.`

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))

    const stream = await streamGroq({
      system: systemPrompt,
      messages: [...chatHistory, { role: 'user', content: message }]
    })

    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || ''
            if (token) {
              controller.enqueue(encoder.encode(`data: ${token}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err: any) {
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
  } catch (err: any) {
    return new Response(err.message || 'Internal Server Error', { status: 500 })
  }
}
