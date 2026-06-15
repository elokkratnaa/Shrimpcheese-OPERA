export function extractMessageText(raw: string): string {
  if (!raw.includes('data:')) return raw;
  return raw
    .split('\n')
    .filter(l => l.startsWith('data: '))
    .map(l => l.slice(6).trim())
    .filter(l => l && l !== '[DONE]')
    .map(l => {
      try {
        const p = JSON.parse(l);
        return p?.choices?.[0]?.delta?.content ?? p?.text ?? '';
      } catch { return ''; }
    })
    .join('');
}
