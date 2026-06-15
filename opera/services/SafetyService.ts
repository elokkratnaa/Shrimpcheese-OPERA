import { completeGroq, SAFETY_MODEL_CHAIN } from '@/lib/groq';

const SAFETY_SYSTEM_PROMPT = `Analyze the text below. Is it safe for an AI debate platform? Answer ONLY "SAFE" or "UNSAFE".

Text: `;

/**
 * Evaluates user input for prompt injection or malicious intent.
 * 
 * @param content - The user-provided content to check.
 * @returns { isSafe: boolean; error?: 'UNSAFE' | 'RATE_LIMITED' }
 */
export async function checkInputSafety(content: string): Promise<{ isSafe: boolean; error?: 'UNSAFE' | 'RATE_LIMITED' }> {
  try {
      const combinedPrompt = `${SAFETY_SYSTEM_PROMPT}\n\n${content}`;
      
      const result = await completeGroq({
        system: '',
        messages: [{ role: 'user', content: combinedPrompt }],
        modelChain: SAFETY_MODEL_CHAIN,
        maxTokens: 512
      });

      const rawResult = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim().toUpperCase();
      const isSafe = rawResult.includes('SAFE');
      
      return { isSafe, error: isSafe ? undefined : 'UNSAFE' };
    } catch (err) {
      console.error('[SafetyService] Safety check failed after fallbacks:', err);
      // If we ran out of models, it's a rate limit or service failure
      return { isSafe: false, error: 'RATE_LIMITED' };
    }
}
