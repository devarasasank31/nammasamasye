import { NextRequest, NextResponse } from 'next/server';
import { detectReplyLanguage, languageName, isLanguage } from '@/lib/ai/language';
import { Language } from '@/types';
import { rateLimit, clientIp, dailyAllow, isExemptIp, LIMITS } from '@/lib/security';

// Translation runs on the same provider the chatbot uses, so any language can
// be turned into any other without a paid translation service. AI_API_KEY may
// hold several comma-separated keys; the ring fails over between them.

import { hasAIKeys, keyRing, markKeyGood, markKeyQuotaDead, keyTag } from '@/lib/ai-keys';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').trim();

const PROVIDER_CONFIG: Record<string, { baseUrl: string; defaultModel: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'openai/gpt-oss-120b' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  gemini: { baseUrl: '', defaultModel: 'gemini-2.0-flash' },
};

const CONFIG = PROVIDER_CONFIG[AI_PROVIDER] || PROVIDER_CONFIG.openai;
const AI_MODEL = (process.env.AI_MODEL || CONFIG.defaultModel).trim();

const MAX_CHARS = 2000;

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలುగు)',
};

function buildPrompt(target: Language): string {
  const name = LANGUAGE_NAMES[target];
  return `You are a translation engine inside a civic-reporting app for Bengaluru.

1. Detect the language the text is written in. It may be native script, Latin transliteration ("kuch nahi ho raha", "gundi road"), or two languages mixed in one sentence.
2. Translate it into ${name}.
3. Keep the meaning, tone and any location names exactly as given. Do not answer the text, do not add advice, do not add commentary.

Reply with ONLY one JSON object, no markdown:
{"detected":"en|kn|hi|te","translated":"..."}

If the text is already in ${name}, copy it into "translated" unchanged.`;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!isExemptIp(ip) &&
      (!rateLimit(`tr:${ip}`, LIMITS.translatePerMinute, 60_000) ||
       !dailyAllow(`tr:${ip}`, LIMITS.translatePerDay))) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const targetRaw = typeof body.target === 'string' ? body.target : 'en';
  const target: Language = isLanguage(targetRaw) ? targetRaw : 'en';

  if (!text) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const source = text.slice(0, MAX_CHARS);
  const detected = detectReplyLanguage(source, target);

  // Already in the language we want — no round-trip needed.
  if (detected === target) {
    return NextResponse.json({ ok: true, detected, translated: source, changed: false, source: 'local' });
  }

  if (!hasAIKeys) {
    return NextResponse.json({ ok: true, detected, translated: source, changed: false, source: 'unavailable' });
  }

  try {
    const result = await translateWithAI(source, target);
    if (result) {
      const finalLang = isLanguage(result.detected) ? result.detected : detected;
      const translated = result.translated.trim() || source;
      return NextResponse.json({
        ok: true,
        detected: finalLang,
        translated,
        changed: translated !== source,
        source: 'ai',
      });
    }
  } catch (err) {
    console.log('Translate API error:', err);
  }

  return NextResponse.json({ ok: true, detected, translated: source, changed: false, source: 'fallback' });
}

interface TranslateResult {
  detected: string;
  translated: string;
}

async function translateWithAI(text: string, target: Language): Promise<TranslateResult | null> {
  if (AI_PROVIDER === 'gemini') {
    return callGemini(text, target);
  }
  return callOpenAICompatible(text, target);
}

async function callOpenAICompatible(text: string, target: Language): Promise<TranslateResult | null> {
  const ring = keyRing();
  const keyCount = Math.min(ring.length, 3);
  for (let k = 0; k < keyCount; k++) {
    const key = ring[k];
    try {
      const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: buildPrompt(target) },
            { role: 'user', content: text },
          ],
          max_tokens: 1200,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        markKeyGood(key);
        return normalise(data.choices?.[0]?.message?.content, target);
      }
      // Invalid key or daily quota: cool it so later requests skip it.
      if (response.status === 401 || response.status === 429 ||
          /tokens per day|\bTPD\b|quota/i.test(String(data.error?.message || ''))) {
        markKeyQuotaDead(key);
      }
      console.log('Translate API error' + keyTag(k, ring.length) + ':', data.error?.message || response.statusText);
    } catch (e) {
      console.log('Translate API error (network/timeout)' + keyTag(k, ring.length) + ':', e instanceof Error ? e.message : e);
    }
  }
  return null;
}

async function callGemini(text: string, target: Language): Promise<TranslateResult | null> {
  const ring = keyRing();
  const keyCount = Math.min(ring.length, 3);
  for (let k = 0; k < keyCount; k++) {
    const key = ring[k];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildPrompt(target) }] },
            contents: [{ role: 'user', parts: [{ text }] }],
            generationConfig: { maxOutputTokens: 1200, temperature: 0 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        markKeyGood(key);
        return normalise(data.candidates?.[0]?.content?.parts?.[0]?.text, target);
      }
      console.log('Translate Gemini error' + keyTag(k, ring.length) + ':', data.error?.message);
    } catch (e) {
      console.log('Translate Gemini error (network/timeout)' + keyTag(k, ring.length) + ':', e instanceof Error ? e.message : e);
    }
  }
  return null;
}

function normalise(content: unknown, target: Language): TranslateResult | null {
  if (typeof content !== 'string' || !content.trim()) return null;

  const cleaned = content
    .replace(/```json|```/g, '')
    .replace(/^[^{]*/, '')
    .replace(/[^}]*$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const translated = typeof parsed.translated === 'string' ? parsed.translated : '';
    if (!translated.trim()) return null;
    const detected = typeof parsed.detected === 'string' ? parsed.detected : languageName(target);
    return { detected, translated };
  } catch {
    return null;
  }
}
