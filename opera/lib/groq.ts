import Groq from 'groq-sdk'

const MODEL_CHAIN = [
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'llama-3.1-8b-instant',
  'groq/compound-mini'
]

export const GROQ_MODEL = MODEL_CHAIN[0]

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGroqWithTimeout(model: string, system: string, messages: ChatMessage[]): Promise<string> {
  const completionPromise = groqClient.chat.completions.create({
    model,
    max_tokens: 2048,
    stream: false,
    messages: [{ role: 'system', content: system }, ...messages],
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 15000)
  );

  const completion = await Promise.race([completionPromise, timeoutPromise]);
  // @ts-ignore
  return completion.choices[0]?.message?.content ?? '';
}

export async function completeGroq({
  system,
  messages,
}: {
  system: string
  messages: ChatMessage[]
}): Promise<string> {
  for (const model of MODEL_CHAIN) {
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        console.log(`[Groq] Attempting model: ${model} (Attempt ${retries + 1})`);
        return await callGroqWithTimeout(model, system, messages);
      } catch (err: any) {
        console.warn(`[Groq] Model ${model} failed. Error: ${err.message}`);
        
        // If it's a rate limit, wait longer
        const isRateLimit = err.status === 429 || err.message.includes('rate_limit');
        const delay = isRateLimit ? 5000 * (retries + 1) : 1000 * (retries + 1);
        
        retries++;
        if (retries <= maxRetries) {
          console.log(`[Groq] Retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          break; // Move to next model in chain
        }
      }
    }
  }
  
  console.error('[Groq] All models in chain failed.');
  throw new Error('AI_FAILED');
}

export async function streamGroq({
  system,
  messages,
}: {
  system: string
  messages: ChatMessage[]
}) {
  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[Groq] Attempting stream model: ${model}`);
      return await groqClient.chat.completions.create({
        model,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
    } catch (err: any) {
      console.warn(`[Groq] Stream model ${model} failed. Error: ${err.message}`);
      // Continue to next model in chain
    }
  }
  throw new Error('AI_FAILED');
}

export default groqClient
