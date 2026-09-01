import { NextRequest, NextResponse } from 'next/server';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';

// Server-side only — API key never exposed to frontend
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

const SYSTEM_PROMPT = `You are Namma Samasye AI for Bengaluru civic issues. 
Given a user description, respond with ONLY a JSON object:
{"scenario_id":"id","confidence":85,"reason":"brief reason","follow_up":"optional question"}

Scenario IDs and when to use them:
- traffic_accident: vehicle crash, accident, hit and run, someone hit me, bike fell, car damaged
- traffic_wrong_side: wrong side driving, opposite direction, wrong way
- traffic_pothole: pothole, road hole, road broken, bad road, road damage, manhole open
- civic_garbage: garbage, trash, waste, litter, dustbin, dump, kachra, safai nahi hui
- traffic_parking: illegal parking, vehicle blocking, parked in no parking, footpath parking
- civic_streetlight: streetlight not working, dark road, no light, andhera, light nahi hai
- civic_footpath: footpath broken, sidewalk blocked, encroachment, vendor on footpath
- civic_drainage: drain blocked, water logging, flooding, sewage, nala, nali bhar gayi
- civic_parks: park dirty, park maintenance, broken bench, garden issue
- civic_water_supply: no water, water not coming, low pressure, paani nahi aa raha, tank khali
- civic_stray_animals: stray dog, dog bite, cow on road, animal problem, kutta, saand
- traffic_interaction: police bribe, challan, traffic fine, cop asking money
- bribes: government bribe, official asking money, corruption, rishwat, paise maang raha
- safety_harassment: harassment, eve teasing, stalking, chain snatching, robbery, safety concern
- cybercrime: online fraud, OTP scam, UPI fraud, hacking, phishing, fake call
- housing_tenant: landlord issue, deposit not returned, rent problem, tenant issue
- env_noise: noise pollution, loud music, DJ, construction noise, shor
- util_power: power cut, electricity gone, light chali gayi, transformer, bijli nahi
- access_language: language barrier, no kannada, signboard issue
- govt_service: government service delay, file stuck, application pending, certificate issue, portal problem

For Hinglish/Kanglish (paani nahi aa raha, light chali gayi, kachra nahi uthaya, etc), match the intent correctly.
Confidence: 80-95 for clear matches, 50-79 for partial, below 50 for uncertain.`;

export async function POST(request: NextRequest) {
  try {
    const { userInput, lang } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    // Step 1: ALWAYS try trained scenarios first
    const trainedMatch = matchTrainedScenario(userInput);

    // Step 2: If trained confidence is high enough, use it directly
    if (trainedMatch && trainedMatch.confidence >= 60) {
      return NextResponse.json({
        scenario_id: trainedMatch.scenario_id,
        confidence: trainedMatch.confidence,
        reason: trainedMatch.reason,
        source: 'trained',
      });
    }

    // Step 3: If API key exists, call AI
    if (AI_API_KEY) {
      try {
        let aiResult = null;

        if (AI_PROVIDER === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify({
              model: AI_MODEL,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userInput },
              ],
              max_tokens: 150,
              temperature: 0.3,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  const scenario = getScenarioById(parsed.scenario_id);
                  if (scenario) {
                    aiResult = {
                      scenario_id: parsed.scenario_id,
                      confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
                      reason: parsed.reason || 'AI determined this category',
                    };
                  }
                } catch {}
              }
            }
          }
        } else if (AI_PROVIDER === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userInput}` }] }],
                generationConfig: { maxOutputTokens: 150, temperature: 0.3 },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  const scenario = getScenarioById(parsed.scenario_id);
                  if (scenario) {
                    aiResult = {
                      scenario_id: parsed.scenario_id,
                      confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
                      reason: parsed.reason || 'AI determined this category',
                    };
                  }
                } catch {}
              }
            }
          }
        }

        // If AI result is better than trained, use it
        if (aiResult && aiResult.confidence >= 60) {
          if (trainedMatch && trainedMatch.confidence >= aiResult.confidence) {
            return NextResponse.json({ ...trainedMatch, source: 'trained' });
          }
          return NextResponse.json({ ...aiResult, source: 'ai' });
        }
      } catch (err) {
        console.log('AI API error:', err);
      }
    }

    // Step 4: Use trained match even with lower confidence
    if (trainedMatch) {
      return NextResponse.json({ ...trainedMatch, source: 'trained' });
    }

    // Step 5: Final fallback
    return NextResponse.json({
      scenario_id: 'something_else',
      confidence: 30,
      reason: 'Could not determine category. Please describe in more detail.',
      source: 'fallback',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
