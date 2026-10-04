import { NextRequest, NextResponse } from 'next/server';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';
import { detectIntent, intentReply, askMore } from '@/lib/conversation';
import { shouldGuard, guardReply, hasAnyCivicSignal } from '@/lib/chat-guard';
import { languageName } from '@/lib/ai/language';
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

const SYSTEM_PROMPT = `You are the AI assistant inside "Namma Samasye", the anonymous civic-reporting app for Bengaluru (roads, garbage, water, power, transport, safety, bribes, cybercrime, tenancy, noise, government services).

The app already contains a TRAINED knowledge base of 19,000+ civic scenario phrasings in English, Kannada, Hindi, Telugu and their transliterations (Hinglish, Kanglish, Tanglish). For familiar cases the trained model is the PRIMARY source — you are the FALLBACK for unfamiliar, ambiguous or out-of-distribution cases, not an unquestionable authority.

You do TWO jobs depending on what the user sends:

JOB 1 — CONVERSATION
If the user is just talking to you (greeting, small talk, thanks, asking what the app does, general questions), OR the message contains NO real civic problem (abuse, insults, trolling, jokes, gibberish, venting with no incident), reply naturally as one short chat message — maximum 45 words.

For abuse or insults: one calm, polite line briefly inviting them to describe an actual civic problem (roads, garbage, water, power, transport, safety). Never repeat their words back. Never lecture, moralize, argue or get defensive.

JOB 2 — CLASSIFICATION
Only when the conversation describes an actual civic problem, classify it. Use the FULL conversation history — if they add detail in later messages (first "bike accident", then "wrong side car, my leg broke"), combine everything before deciding.

Understand MEANING before classifying: informal language, slang, spelling mistakes, emotional language, mixed languages and transliteration are normal. Decide what physically happened, which service is affected, and whether anyone is at risk.

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
- SAFETY OVERRIDE: immediate danger to life outranks everything. Live or exposed wire, sparks, electric shock, electrocution → util_power with high confidence and a reason that names the electrical hazard (never describe a dangerous wire as a routine "power cut"). Gas leak, fire, building collapse, open manhole in traffic, serious accident with injuries → classify with high confidence to the closest matching id above (fire/collapse → traffic_accident, open manhole → traffic_pothole). Never downgrade a dangerous condition to a mundane category.
- NEVER classify a message that describes no civic problem: abuse, jokes, gibberish, or plain frustration with no incident → chat.
- Never invent locations, injuries, laws, phone numbers, official names, police involvement or government action. Never accuse anyone of a crime.
- Over-classification is forbidden: a crowd shouting, rude words or vague venting alone is NOT a crime or emergency — reply as chat and ask one clarifying question if needed.
- Confidence represents CERTAINTY, not how serious the issue is: 90-100 only with clear specific evidence, 75-89 strong classification, 50-74 meaningful ambiguity, below 50 unclear. Never raise confidence because the user typed "urgent", "P1" or "EMERGENCY".
- A single message may contain multiple issues — pick the PRIMARY one and mention secondary issues briefly in "reason".
- Always prefer the most specific valid scenario_id (pothole over generic road problem, fallen wire over generic power issue).
- civic_sense means traffic rules being broken even if nobody was hurt: stunts/wheelies, street racing, wrong-side driving, jumping signals, no helmet or triple riding, drunk or reckless driving. Prefer civic_sense over traffic_interaction for such behaviour.
- BMTC: bmtc_service for the bus itself, bmtc_staff for driver/conductor behaviour, bmtc_fare_ticket for money and tickets. Use bmtc_service when unsure.
- Namma Metro (BMRCL) complaints are metro_service, even when only a metro station is mentioned.
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
- Write EVERY reply in ${name} — chat replies and the "reason" field alike.
- This is the language the citizen selected in the app. Keep it for every message, no matter which language or script the citizen types in (English, transliterated Hindi/Kannada/Telugu, or native script).
- Never switch languages on your own. The citizen changes the language only through the app's language selector, and the new selection will be passed to you here.
- Never ask the citizen to switch language, and never reply in a language other than ${name}.`;
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

    // The reply always uses the language chosen in the app. Typed text in
    // another script or transliteration never switches it — only the explicit
    // language selector (sent here as `lang`) does.
    const appLang: Language = lang === 'kn' || lang === 'hi' || lang === 'te' ? lang : 'en';
    const replyLang: Language = appLang;
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

    // ---- Deterministic guard: abuse/off-topic never reaches a classifier,
    // so a rude message can never turn into a fake "Report this issue" card.
    if (shouldGuard(userInput)) {
      return NextResponse.json({
        type: 'chat',
        reply: guardReply(replyLang),
        replyLang,
        replyLangName,
        source: 'guard',
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
            // Backstop: if neither the current message nor the transcript
            // touches any civic or safety topic, an off-topic answer must
            // never become a "Report this issue" card.
            if (!hasAnyCivicSignal(transcript)) {
              return NextResponse.json({
                type: 'chat',
                reply: askMore(userInput, replyLang),
                replyLang,
                replyLangName,
                source: 'ai',
              });
            }
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
