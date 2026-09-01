import { NextRequest, NextResponse } from 'next/server';
import { AI_CONFIG, AI_SYSTEM_PROMPT } from '@/lib/ai-config';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { getScenarioById } from '@/data/scenarios';

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

    // Step 3: If API key exists, try AI
    if (AI_CONFIG.API_KEY) {
      try {
        const langMap: Record<string, string> = {
          kn: 'Kannada', en: 'English', hi: 'Hindi', te: 'Telugu',
        };

        let aiResult = null;

        if (AI_CONFIG.PROVIDER === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
            },
            body: JSON.stringify({
              model: AI_CONFIG.MODEL,
              messages: [
                { role: 'system', content: AI_SYSTEM_PROMPT },
                { role: 'user', content: `Language: ${langMap[lang || 'en'] || 'English'}\nUser description: "${userInput}"\n\nRespond with ONLY a JSON object.` },
              ],
              max_tokens: AI_CONFIG.MAX_TOKENS,
              temperature: AI_CONFIG.TEMPERATURE,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const scenario = getScenarioById(parsed.scenario_id);
                if (scenario) {
                  aiResult = {
                    scenario_id: parsed.scenario_id,
                    confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
                    reason: parsed.reason || 'AI determined this category',
                    follow_up: parsed.follow_up,
                  };
                }
              }
            }
          }
        } else if (AI_CONFIG.PROVIDER === 'gemini') {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AI_CONFIG.API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nLanguage: ${langMap[lang || 'en'] || 'English'}\nUser: "${userInput}"\n\nRespond with ONLY a JSON object.` }] }],
                generationConfig: { maxOutputTokens: AI_CONFIG.MAX_TOKENS, temperature: AI_CONFIG.TEMPERATURE },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const scenario = getScenarioById(parsed.scenario_id);
                if (scenario) {
                  aiResult = {
                    scenario_id: parsed.scenario_id,
                    confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
                    reason: parsed.reason || 'AI determined this category',
                    follow_up: parsed.follow_up,
                  };
                }
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
