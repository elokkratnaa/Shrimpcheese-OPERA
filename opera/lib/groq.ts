import Groq from 'groq-sdk'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Streams a Groq completion. Use for SSE endpoints and chat.
 * @param system - System prompt string
 * @param messages - Conversation history (excluding system)
 * @returns Async iterable Groq stream
 */
export async function streamGroq({
  system,
  messages,
}: {
  system: string
  messages: ChatMessage[]
}) {
  return groqClient.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 2048,
    stream: true,
    messages: [{ role: 'system', content: system }, ...messages],
  })
}

/**
 * Returns a single Groq completion as a string. Use for structured JSON outputs.
 * @param system - System prompt string
 * @param messages - Conversation history (excluding system)
 * @returns Full response content string
 */
export async function completeGroq({
  system,
  messages,
}: {
  system: string
  messages: ChatMessage[]
}): Promise<string> {
  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 2048,
    stream: false,
    messages: [{ role: 'system', content: system }, ...messages],
  })

  return completion.choices[0]?.message?.content ?? ''
}

export default groqClient
