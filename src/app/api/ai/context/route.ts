import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/security';
import { containsPII, redactPII } from '@/lib/ai-context';
import { matchContextRows } from '@/data/context-corpus';

// Server-side only — same keys the chatbot uses.
const AI_API_KEY = process.env.AI_API_KEY || process.env.GROQ_API_KEY || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').trim();

const PROVIDER_CONFIG: Record<string, { baseUrl: string; defaultModel: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'openai/gpt-oss-120b' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  gemini: { baseUrl: '', defaultModel: 'gemini-2.0-flash' },
};

const CONFIG = PROVIDER_CONFIG[AI_PROVIDER] || PROVIDER_CONFIG.openai;
const AI_MODEL = (process.env.AI_MODEL || CONFIG.defaultModel).trim();

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
};

const MAX_REPORT_CHARS = 2000;
const CALL_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You write the public summary for one civic issue report in "Namma Samasye", a citizen app for Bengaluru problems.

The report text you receive has ALREADY had names, phone numbers, emails, vehicle numbers and long digit runs replaced with [redacted].

Write a summary a stranger can read in five seconds to decide whether to support this report.

Reply with EXACTLY 4 short lines and nothing else:
1. What happened, one short sentence.
2. What type of issue it is (subcategory).
3. Where it is — only the area/ward given, or "area reported" if none was provided.
4. Why it matters to people there, one short sentence.

Rules:
- Write every line in ${'{{LANGUAGE}}'} — the same language as the report.
- At most 90 characters per line. No numbering, no bullets, no markdown, no quotation marks.
- NEVER include or invent names, phone numbers, email addresses, vehicle numbers, house numbers, OTPs or any personal detail. Keep [redacted] parts redacted.
- Write the complaint fresh in your own words — never copy a full sentence from the report. Mentioning a road, area or shop as the location is fine.
- Neutral and factual. Do not blame, accuse, threaten, or mention laws, fines or officials.
- Do not invent facts that are not in the report.
- Do not mention that you are an AI or that the text was redacted.`;

function buildPrompt(language: string): string {
  return SYSTEM_PROMPT.replace('{{LANGUAGE}}', LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en);
}

/** Tidy what models sometimes wrap the answer in. */
function cleanAnswer(raw: string): string | null {
  const lines = raw
    .replace(/```[a-z]*|```/gi, '')
    .split('\n')
    .map(l => l.replace(/^[\s>*•\-–—]+/, '').replace(/^\d{1,2}[.)]\s*/, '').replace(/^["']+|["']+$/g, '').trim())
    .filter(l => l.length > 0);
  if (lines.length === 0 || lines.length > 6) return null;
  const text = lines.join('\n').trim();
  if (!text || text.length > 700) return null;
  if (containsPII(text)) return null;
  return text;
}

async function callOpenAICompatible(system: string, user: string): Promise<string | null> {
  const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        // Reasoning models spend tokens thinking before the visible answer —
        // leave enough budget or the reply comes back empty.
        max_tokens: 1200,
        temperature: 0.3,
      }),
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
  });
  const data = await response.json();
  if (!response.ok) return null;
  return data.choices?.[0]?.message?.content ?? null;
}

async function callGemini(system: string, user: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    }
  );
  const data = await response.json();
  if (!response.ok) return null;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

/**
 * Generate the four-line public context for a report at submission time.
 * The raw complaint never leaves this route: inputs are redacted first and
 * the answer is checked again before it is returned. Anything suspicious
 * falls back to null so the feed can use its offline template.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`ai_ctx:${clientIp(request.headers)}`, 30, 60_000)) {
    return NextResponse.json({ context: null, error: 'rate limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ context: null, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ context: null });
  }

  const language = typeof body.language === 'string' && LANGUAGE_NAMES[body.language] ? body.language : 'en';
  const category = typeof body.category === 'string' ? body.category.slice(0, 60) : '';
  const subcategory = typeof body.subcategory === 'string' ? body.subcategory.slice(0, 60) : '';
  const area = typeof body.area === 'string' ? body.area.slice(0, 120) : '';
  const original = typeof body.original_text === 'string' ? body.original_text.slice(0, MAX_REPORT_CHARS) : '';
  const answers = body.answers && typeof body.answers === 'object'
    ? Object.values(body.answers as Record<string, unknown>)
        .filter((v): v is string => typeof v === 'string')
        .join(' | ')
        .slice(0, MAX_REPORT_CHARS)
    : '';

  const redactedReport = redactPII([original, answers].filter(Boolean).join('\n')).trim();
  if (!redactedReport) {
    return NextResponse.json({ context: null });
  }

  // Trained phrasing for this exact issue (from a corpus of tens of thousands
  // of scenario rows) — keeps the four lines issue-specific, not generic.
  const trained = matchContextRows([redactedReport, subcategory, category].join(' '), subcategory);
  const trainedHint = trained.length > 0
    ? [
        '',
        'Trained issue phrasing for this report — use it to name the exact issue in lines 1 and 2, but write it fresh in the target language:',
        ...trained.map(r => `- ${r.issue}`),
      ].join('\n')
    : '';

  const user = [
    `Category: ${category}`,
    `Subcategory: ${subcategory}`,
    `Area: ${area || 'not given'}`,
    `Report: ${redactedReport}`,
    trainedHint,
  ].filter(Boolean).join('\n');

  try {
    const raw = AI_PROVIDER === 'gemini'
      ? await callGemini(buildPrompt(language), user)
      : await callOpenAICompatible(buildPrompt(language), user);
    return NextResponse.json({ context: raw ? cleanAnswer(raw) : null });
  } catch {
    return NextResponse.json({ context: null });
  }
}
