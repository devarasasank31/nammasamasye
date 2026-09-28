import { NextRequest, NextResponse } from 'next/server';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';
import { detectIntent, intentReply, askMore } from '@/lib/conversation';

// Server-side only
const AI_API_KEY = process.env.AI_API_KEY || process.env.GROQ_API_KEY || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').trim();

const PROVIDER_CONFIG: Record<string, { baseUrl: string; defaultModel: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'openai/gpt-oss-120b' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  gemini: { baseUrl: '', defaultModel: 'gemini-2.0-flash' },
};

const CONFIG = PROVIDER_CONFIG[AI_PROVIDER] || PROVIDER_CONFIG.openai;
const AI_MODEL = (process.env.AI_MODEL || CONFIG.defaultModel).trim();

const MAX_TURNS = 12;
const MAX_TURN_CHARS = 1200;

const SYSTEM_PROMPT = `You are the friendly chatbot inside "Namma Samasye", an app for reporting civic problems in Bengaluru (roads, garbage, water, power, accidents, bribes, safety, cybercrime).

You do TWO jobs depending on what the user sends:

JOB 1 — CONVERSATION
If the user is just talking to you (greeting, small talk, thanks, asking what the app does, asking a general question, vague message), reply naturally and helpfully as a short chat message. Keep it under 60 words. Be warm, human, practical. Never lecture.

JOB 2 — CLASSIFICATION
If the user is describing a problem or incident, classify it. Use the FULL conversation history — if they add detail in later messages (e.g. first "bike accident", then "wrong side car, my leg broke"), combine everything before deciding.

Respond with ONLY one JSON object, no markdown, no extra text.

For conversation:
{"type":"chat","reply":"your reply"}

For classification:
{"type":"classify","scenario_id":"id","confidence":85,"reason":"brief reason"}

scenario_id must be exactly one of:
traffic_accident | traffic_wrong_side | traffic_pothole | civic_garbage |
traffic_parking | civic_streetlight | civic_footpath | civic_drainage |
civic_parks | civic_water_supply | civic_stray_animals | traffic_interaction |
bribes | safety_harassment | cybercrime | housing_tenant | env_noise |
util_power | access_language | govt_service | something_else

Rules:
- Never invent laws, contacts, phone numbers or official names.
- Never accuse anyone of a crime.
- confidence 1-99.
- If still unclear after the history, use confidence below 50.`;

interface Turn {
  role: 'user' | 'bot';
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userInput: string = body.userInput || '';
    const lang: string = body.lang || 'en';
    const history: Turn[] = Array.isArray(body.history)
      ? body.history.slice(-MAX_TURNS)
      : [];

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    // ---- Fast path: deterministic conversational intents ----
    const intent = detectIntent(userInput);
    if (intent && intent !== 'yes' && intent !== 'no') {
      const reply = intentReply(intent, lang);
      return NextResponse.json({
        type: 'chat',
        reply: reply.text,
        action: reply.action || null,
        source: 'rules',
      });
    }

    // ---- Build transcript so the model sees added context ----
    const transcript = [
      ...history.map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${truncate(t.text)}`),
      `User: ${truncate(userInput)}`,
    ].join('\n');

    // ---- Strong trained match: answer instantly, no API round-trip ----
    const trainedMatch = matchTrainedScenario(userInput);
    if (trainedMatch && trainedMatch.confidence >= 85) {
      return NextResponse.json({ type: 'classify', ...trainedMatch, source: 'trained' });
    }

    // ---- Call AI with full history ----
    if (AI_API_KEY) {
      try {
        const aiResult = await callAI(transcript);
        if (aiResult) {
          if (aiResult.type === 'chat') {
            return NextResponse.json({ ...aiResult, source: 'ai' });
          }
          if (aiResult.confidence >= 50) {
            if (trainedMatch && trainedMatch.confidence > aiResult.confidence) {
              return NextResponse.json({ type: 'classify', ...trainedMatch, source: 'trained' });
            }
            return NextResponse.json({ ...aiResult, source: 'ai' });
          }
          // Too vague to classify — ask naturally instead of a canned reply
          return NextResponse.json({
            type: 'chat',
            reply: askMore(userInput, lang),
            source: 'ai',
          });
        }
      } catch (err) {
        console.log('AI API error:', err);
      }
    }

    // ---- Fallbacks ----
    if (trainedMatch && trainedMatch.confidence >= 55) {
      return NextResponse.json({ type: 'classify', ...trainedMatch, source: 'trained' });
    }

    return NextResponse.json({
      type: 'chat',
      reply: askMore(userInput, lang),
      source: 'fallback',
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function truncate(s: string): string {
  return s.length > MAX_TURN_CHARS ? s.slice(0, MAX_TURN_CHARS) + '…' : s;
}

type AIResult =
  | { type: 'chat'; reply: string }
  | { type: 'classify'; scenario_id: string; confidence: number; reason: string };

async function callAI(transcript: string): Promise<AIResult | null> {
  if (AI_PROVIDER === 'groq' || AI_PROVIDER === 'openai') {
    return callOpenAICompatible(transcript);
  }
  if (AI_PROVIDER === 'gemini') {
    return callGemini(transcript);
  }
  return null;
}

async function callOpenAICompatible(transcript: string): Promise<AIResult | null> {
  const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      max_tokens: 700,
      temperature: 0.4,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.log('API error:', data.error?.message || response.statusText);
    return null;
  }
  return normalise(data.choices?.[0]?.message?.content);
}

async function callGemini(transcript: string): Promise<AIResult | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: transcript }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.log('Gemini API error:', data.error?.message);
    return null;
  }
  return normalise(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

function normalise(content: unknown): AIResult | null {
  if (typeof content !== 'string' || !content.trim()) return null;
  const parsed = parseJsonLoose(content);
  if (!parsed) return null;

  if (parsed.type === 'chat' && typeof parsed.reply === 'string' && parsed.reply.trim()) {
    return { type: 'chat', reply: parsed.reply.trim() };
  }

  const sid = parsed.scenario_id;
  if (typeof sid === 'string' && getScenarioById(sid)) {
    return {
      type: 'classify',
      scenario_id: sid,
      confidence: Math.min(Math.max(Number(parsed.confidence) || 50, 1), 99),
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'Matched by AI',
    };
  }

  // Model replied in prose when we expected JSON — treat as chat
  if (!parsed.type && !parsed.scenario_id) {
    return { type: 'chat', reply: content.trim().slice(0, 400) };
  }
  return null;
}

function parseJsonLoose(content: string): Record<string, unknown> | null {
  const cleaned = content
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/```json|```/g, '')
    .replace(/^[^{]*/, '')
    .replace(/[^}]*$/, '');

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}
