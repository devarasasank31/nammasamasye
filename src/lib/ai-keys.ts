// Multiple AI keys, comma-separated in AI_API_KEY (or GROQ_API_KEY as the
// single-key fallback). Example .env.local:
//   AI_PROVIDER=groq
//   AI_API_KEY=gsk_first_key,gsk_second_key
//
// Free-tier keys each have their own daily/rate quota. When one key is
// rejected (401), out of daily quota (TPD) or rate-limited (TPM), the next
// key in the ring is tried immediately; the last working key is remembered
// so subsequent calls start from it. Keys should all belong to the same
// provider — the provider/base URL is chosen once from AI_PROVIDER.

const parsed = (process.env.AI_API_KEY || process.env.GROQ_API_KEY || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const AI_KEYS: string[] = parsed;
export const hasAIKeys = parsed.length > 0;

let goodIdx = 0;

/** Keys to try for one request, starting from the last-known-good key. */
export function keyRing(): string[] {
  if (parsed.length === 0) return [''];
  return parsed.map((_, i) => parsed[(goodIdx + i) % parsed.length]);
}

/** Remember a working key so future calls start there. */
export function markKeyGood(key: string): void {
  const i = parsed.indexOf(key);
  if (i >= 0) goodIdx = i;
}

/** Log tag, e.g. " (key 2/3)" — omitted for a single key. */
export function keyTag(index: number, total: number): string {
  return total > 1 ? ` (key ${index + 1}/${total})` : '';
}
