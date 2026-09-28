import { NextRequest, NextResponse } from 'next/server';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';

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

const SYSTEM_PROMPT = `You are Namma Samasye AI for Bengaluru civic issues. You help classify citizen complaints.

Given a user description, respond with ONLY a JSON object:
{"scenario_id":"id","confidence":85,"reason":"brief reason"}

Available scenario IDs:
- traffic_accident: vehicle crash, accident, hit and run, someone hit me, bike fell, car crashed, broken leg from accident
- traffic_wrong_side: wrong side driving, opposite direction, wrong way, came from wrong side
- traffic_pothole: pothole, road hole, road broken, bad road, manhole open
- civic_garbage: garbage, trash, waste, litter, dustbin, kachra
- traffic_parking: illegal parking, vehicle blocking, footpath parking
- civic_streetlight: streetlight not working, dark road, no light, andhera
- civic_footpath: footpath broken, sidewalk blocked, encroachment
- civic_drainage: drain blocked, water logging, flooding, sewage, nala
- civic_parks: park dirty, park maintenance, broken bench
- civic_water_supply: no water, water not coming, paani nahi aa raha
- civic_stray_animals: stray dog, dog bite, cow on road, kutta
- traffic_interaction: police bribe, challan, traffic fine
- bribes: government bribe, official asking money, corruption, rishwat
- safety_harassment: harassment, eve teasing, stalking, chain snatching, robbery
- cybercrime: online fraud, OTP scam, UPI fraud, hacking
- housing_tenant: landlord issue, deposit not returned, rent problem
- env_noise: noise pollution, loud music, DJ, shor
- util_power: power cut, electricity gone, light chali gayi, bijli
- access_language: language barrier, no kannada
- govt_service: government service delay, file stuck, certificate issue

Analyze the full context. If user mentions wrong side driving + red signal + accident + broken leg, that's traffic_accident with high confidence. Match the BEST scenario based on the complete description.`;

async function callOpenAICompatible(userInput: string, apiKey: string, model: string, baseUrl: string): Promise<{ scenario_id: string; confidence: number; reason: string } | null> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log('API error:', data.error?.message || response.statusText);
    return null;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = parseJsonLoose(content);
  if (!parsed) {
    console.log('Could not parse AI response:', content.slice(0, 200));
    return null;
  }

  const scenario = getScenarioById(parsed.scenario_id);
  if (!scenario) {
    console.log('AI returned unknown scenario_id:', parsed.scenario_id);
    return null;
  }

  return {
    scenario_id: parsed.scenario_id,
    confidence: Math.min(Math.max(Number(parsed.confidence) || 50, 10), 99),
    reason: parsed.reason || 'AI determined this category',
  };
}

function parseJsonLoose(content: string): { scenario_id: string; confidence: number; reason: string } | null {
  const cleaned = content
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?\{/, '{')
    .replace(/```json|```/g, '');

  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  const end = cleaned.lastIndexOf('}');
  if (end <= start) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userInput, lang } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    console.log('Chatbot request:', { userInput, provider: AI_PROVIDER, hasKey: !!AI_API_KEY });

    // Step 1: Try trained scenarios
    const trainedMatch = matchTrainedScenario(userInput);

    // Step 2: If trained confidence is high, use it
    if (trainedMatch && trainedMatch.confidence >= 70) {
      console.log('Using trained result:', trainedMatch);
      return NextResponse.json({
        scenario_id: trainedMatch.scenario_id,
        confidence: trainedMatch.confidence,
        reason: trainedMatch.reason,
        source: 'trained',
      });
    }

    // Step 3: Call AI API
    if (AI_API_KEY) {
      try {
        let aiResult = null;

        if (AI_PROVIDER === 'groq' || AI_PROVIDER === 'openai') {
          aiResult = await callOpenAICompatible(userInput, AI_API_KEY, AI_MODEL, CONFIG.baseUrl);
        } else if (AI_PROVIDER === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userInput}` }] }],
                generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
              }),
            }
          );

          const data = await response.json();
          if (response.ok) {
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const parsed = parseJsonLoose(content);
              if (parsed && getScenarioById(parsed.scenario_id)) {
                aiResult = {
                  scenario_id: parsed.scenario_id,
                  confidence: Math.min(Math.max(Number(parsed.confidence) || 50, 10), 99),
                  reason: parsed.reason || 'AI determined this category',
                };
              }
            }
          } else {
            console.log('Gemini API error:', data.error?.message);
          }
        }

        if (aiResult && aiResult.confidence >= 50) {
          console.log('Using AI result:', aiResult);
          if (trainedMatch && trainedMatch.confidence >= aiResult.confidence) {
            return NextResponse.json({ ...trainedMatch, source: 'trained' });
          }
          return NextResponse.json({ ...aiResult, source: 'ai' });
        }
      } catch (err) {
        console.log('AI API error:', err);
      }
    } else {
      console.log('No API key configured');
    }

    // Step 4: Use trained match
    if (trainedMatch) {
      return NextResponse.json({ ...trainedMatch, source: 'trained' });
    }

    // Step 5: Fallback
    return NextResponse.json({
      scenario_id: 'something_else',
      confidence: 30,
      reason: 'Could not determine category. Please describe in more detail.',
      source: 'fallback',
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
