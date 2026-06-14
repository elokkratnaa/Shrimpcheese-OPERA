import { completeGroq } from '@/lib/groq';

const SAFETY_SYSTEM_PROMPT = `Analyze the text below. Is it safe for an AI debate platform? Answer ONLY "SAFE" or "UNSAFE".

Text: `;

/**
 * Evaluates user input for prompt injection or malicious intent.
 * 
 * @param content - The user-provided content to check.
 * @returns boolean - True if input is safe, false if unsafe.
 */
export async function checkInputSafety(content: string): Promise<boolean> {
  let retries = 0;
  while (retries < 2) {
    try {
      const result = await completeGroq({
        system: SAFETY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content }]
      });

      const rawResult = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim().toUpperCase();
      const decision = rawResult.includes('UNSAFE') ? 'UNSAFE' : 'SAFE';
      
      return decision === 'SAFE';
    } catch (err) {
      retries++;
      console.warn(`[SafetyService] Safety check attempt ${retries} failed:`, err);
    }
  }
  
  console.error('[SafetyService] All safety check attempts failed, failing closed for security.');
  return false;
}
