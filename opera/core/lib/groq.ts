import Groq from 'groq-sdk'

export const DEBATE_MODEL_CHAIN = [
  'llama-3.1-8b-instant', // Faster, cheaper, less prone to rate limits
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'meta-llama/llama-4-scout-17b-16e-instruct'
]

export const SAFETY_MODEL_CHAIN = [
  'meta-llama/llama-prompt-guard-2-22m',
  'openai/gpt-oss-safeguard-20b'
]

export const DEFAULT_MODEL_CHAIN = DEBATE_MODEL_CHAIN

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function completeGroq({
  system,
  messages,
  modelChain = DEFAULT_MODEL_CHAIN,
  maxTokens = 2048,
}: {
  system: string
  messages: ChatMessage[]
  modelChain?: string[]
  maxTokens?: number
}): Promise<string> {
  for (const model of modelChain) {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      try {
        
        const formattedMessages = [{ role: 'system', content: system }, ...messages].filter(msg => msg.role !== 'system' || msg.content.trim() !== '');

        const completionPromise = groqClient.chat.completions.create({
            model,
            max_tokens: maxTokens,
            stream: false,
            messages: formattedMessages as any,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 20000)
        );

        const completion = await Promise.race([completionPromise, timeoutPromise]);
        return (completion as any).choices[0]?.message?.content ?? '';
        
      } catch (err: any) {
        console.warn(`[Groq] Model ${model} failed. Error: ${err.message}`);
        
        const isRateLimit = err.status === 429 || err.message?.includes('rate_limit');
        // Exponential backoff: 2s, 8s, 18s
        const delay = isRateLimit ? 2000 * Math.pow(retries + 1, 2) : 1000 * (retries + 1);
        
        retries++;
        if (retries <= maxRetries) {
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
  modelChain = DEFAULT_MODEL_CHAIN,
}: {
  system: string
  messages: ChatMessage[]
  modelChain?: string[]
}) {
  for (const model of modelChain) {
    try {
      return await groqClient.chat.completions.create({
        model,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
    } catch (err: any) {
      console.warn(`[Groq] Stream model ${model} failed. Error: ${err.message}`);
    }
  }
  throw new Error('AI_FAILED');
}

export default groqClient
