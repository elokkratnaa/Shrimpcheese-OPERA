export function extractMessageText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'text' in parsed) {
      return parsed.text;
    }
  } catch (e) {
    // Not JSON, return as is
  }
  return raw;
}
