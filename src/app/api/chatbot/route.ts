import { NextRequest, NextResponse } from 'next/server';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';
import { detectIntent, intentReply, askMore } from '@/lib/conversation';
import { detectReplyLanguage, languageName } from '@/lib/ai/language';
import { Language } from '@/types';

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
traffic_accident | traffic_wrong_side | civic_sense | traffic_pothole | civic_garbage |
traffic_parking | civic_streetlight | civic_footpath | civic_drainage |
civic_parks | civic_water_supply | civic_stray_animals | traffic_interaction |
bribes | safety_harassment | cybercrime | housing_tenant | env_noise |
util_power | access_language | govt_service | bmtc_service | bmtc_staff |
bmtc_fare_ticket | metro_service | something_else

Rules:
- civic_sense means traffic rules being broken even if nobody was hurt yet: stunts/wheelies, street racing or overspeeding, wrong-side driving, jumping signals, no helmet or triple riding, drunk or reckless driving. Prefer civic_sense over traffic_interaction when someone describes such behaviour.
- BMTC city bus complaints: bmtc_service for the bus itself (did not come, long delay, broke down, overcrowding, did not stop, AC/fan, cleanliness), bmtc_staff for driver/conductor/checking-staff behaviour (rash driving, refusal, argument, not giving ticket, rude conduct), bmtc_fare_ticket for money and tickets (overcharged, no change, pass rejected, machine not working). Use bmtc_service when unsure which of the three.
- Namma Metro (BMRCL) complaints are metro_service: train delay, crowding, cleanliness, station or escalator/lift problems, fare/token/QR gate issues, metro staff behaviour. Use metro_service even when the citizen only mentions a metro station name.
- Never invent laws, contacts, phone numbers or official names.
- Never accuse anyone of a crime.
- confidence 1-99.
- If still unclear after the history, use confidence below 50.`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
};

function buildSystemPrompt(replyLang: string): string {
  const name = LANGUAGE_NAMES[replyLang] || LANGUAGE_NAMES.en;
  return `${SYSTEM_PROMPT}

LANGUAGE
- The citizen's latest message is written in ${name}. Write EVERY reply in ${name} — chat replies and the "reason" field alike.
- The citizen may answer in any of English, Kannada, Hindi or Telugu, in native script or in Latin transliteration ("kuch nahi ho raha", "gundi road", "bijli gayi", "ledu sir"), and may mix two languages in one message. Understand all of it.
- If the latest message is clearly in a different language from ${name}, switch to that language for your reply instead. Follow the citizen, never the app settings.
- Never ask the citizen to switch language, and never reply in a language they did not use.`;
}

interface Turn {
  role: 'user' | 'bot';
  text: string;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const userInput: string = typeof body.userInput === 'string' ? body.userInput : '';
    const lang: string = typeof body.lang === 'string' ? body.lang : 'en';
    const history: Turn[] = Array.isArray(body.history)
      ? body.history.slice(-MAX_TURNS)
      : [];

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    // Answer in whatever language this message is written in, not the one the
    // app happens to be set to.
    const appLang: Language = lang === 'kn' || lang === 'hi' || lang === 'te' ? lang : 'en';
    const replyLang: Language = detectReplyLanguage(userInput, appLang);
    const replyLangName = languageName(replyLang);

    // ---- Fast path: deterministic conversational intents ----
    const intent = detectIntent(userInput);
    if (intent && intent !== 'yes' && intent !== 'no') {
      const reply = intentReply(intent, replyLang);
      return NextResponse.json({
        type: 'chat',
        reply: reply.text,
        action: reply.action || null,
        replyLang,
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
      return NextResponse.json({ type: 'classify', ...trainedMatch, replyLang, replyLangName, source: 'trained' });
    }

    // ---- Call AI with full history ----
    if (AI_API_KEY) {
      try {
        const aiResult = await callAI(transcript, replyLang);
        if (aiResult) {
          if (aiResult.type === 'chat') {
            return NextResponse.json({ ...aiResult, replyLang, replyLangName, source: 'ai' });
          }
          if (aiResult.confidence >= 50) {
            if (trainedMatch && trainedMatch.confidence > aiResult.confidence) {
              return NextResponse.json({ type: 'classify', ...trainedMatch, replyLang, replyLangName, source: 'trained' });
            }
            return NextResponse.json({ ...aiResult, replyLang, replyLangName, source: 'ai' });
          }
          // Too vague to classify — ask naturally instead of a canned reply
          return NextResponse.json({
            type: 'chat',
            reply: askMore(userInput, replyLang),
            replyLang,
            replyLangName,
            source: 'ai',
          });
        }
      } catch (err) {
        console.log('AI API error:', err);
      }
    }

    // ---- Fallbacks ----
    if (trainedMatch && trainedMatch.confidence >= 55) {
      return NextResponse.json({ type: 'classify', ...trainedMatch, replyLang, replyLangName, source: 'trained' });
    }

    return NextResponse.json({
      type: 'chat',
      reply: askMore(userInput, replyLang),
      replyLang,
      replyLangName,
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

async function callAI(transcript: string, lang: string): Promise<AIResult | null> {
  if (AI_PROVIDER === 'groq' || AI_PROVIDER === 'openai') {
    return callOpenAICompatible(transcript, lang);
  }
  if (AI_PROVIDER === 'gemini') {
    return callGemini(transcript, lang);
  }
  return null;
}

async function callOpenAICompatible(transcript: string, lang: string): Promise<AIResult | null> {
  const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(lang) },
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

async function callGemini(transcript: string, lang: string): Promise<AIResult | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(lang) }] },
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
