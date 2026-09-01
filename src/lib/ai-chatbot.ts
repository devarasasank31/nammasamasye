import { AI_CONFIG, AI_SYSTEM_PROMPT } from './ai-config';
import { matchTrainedScenario } from './trained-scenarios';
import { getScenarioById } from '@/data/scenarios';

export interface AIResponse {
  scenario_id: string;
  confidence: number;
  reason: string;
  follow_up?: string;
  source: 'trained' | 'ai' | 'fallback';
}

// Analyze user input using trained scenarios + AI API
export async function analyzeUserInput(userInput: string, lang: string = 'en'): Promise<AIResponse> {
  // Step 1: Try trained scenarios first
  const trainedMatch = matchTrainedScenario(userInput);

  // Step 2: If confident enough, use trained result
  if (trainedMatch && trainedMatch.confidence >= 70) {
    return { ...trainedMatch, source: 'trained' };
  }

  // Step 3: If API key exists, try AI
  if (AI_CONFIG.API_KEY) {
    try {
      const aiResult = await callAI(userInput, lang);
      if (aiResult && aiResult.confidence >= 50) {
        return { ...aiResult, source: 'ai' };
      }
    } catch (err) {
      console.log('AI API error, falling back to trained:', err);
    }
  }

  // Step 4: Fall back to trained match even if low confidence
  if (trainedMatch) {
    return { ...trainedMatch, source: 'trained' };
  }

  // Step 5: Fallback
  return {
    scenario_id: 'something_else',
    confidence: 30,
    reason: 'Could not determine category. Please describe in more detail.',
    source: 'fallback',
  };
}

// Call OpenAI or Gemini API
async function callAI(userInput: string, lang: string): Promise<Omit<AIResponse, 'source'> | null> {
  if (AI_CONFIG.PROVIDER === 'openai') {
    return callOpenAI(userInput, lang);
  } else if (AI_CONFIG.PROVIDER === 'gemini') {
    return callGemini(userInput, lang);
  }
  return null;
}

// OpenAI API call
async function callOpenAI(userInput: string, lang: string): Promise<Omit<AIResponse, 'source'> | null> {
  const langMap: Record<string, string> = {
    kn: 'Kannada', en: 'English', hi: 'Hindi', te: 'Telugu',
  };

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
        { role: 'user', content: `Language: ${langMap[lang] || 'English'}\nUser description: "${userInput}"\n\nRespond with ONLY a JSON object.` },
      ],
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate scenario exists
    const scenario = getScenarioById(parsed.scenario_id);
    if (!scenario) return null;

    return {
      scenario_id: parsed.scenario_id,
      confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
      reason: parsed.reason || 'AI determined this category',
      follow_up: parsed.follow_up,
    };
  } catch {
    return null;
  }
}

// Google Gemini API call
async function callGemini(userInput: string, lang: string): Promise<Omit<AIResponse, 'source'> | null> {
  const langMap: Record<string, string> = {
    kn: 'Kannada', en: 'English', hi: 'Hindi', te: 'Telugu',
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AI_CONFIG.API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nLanguage: ${langMap[lang] || 'English'}\nUser: "${userInput}"\n\nRespond with ONLY a JSON object.` }] }],
        generationConfig: { maxOutputTokens: AI_CONFIG.MAX_TOKENS, temperature: AI_CONFIG.TEMPERATURE },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const scenario = getScenarioById(parsed.scenario_id);
    if (!scenario) return null;

    return {
      scenario_id: parsed.scenario_id,
      confidence: Math.min(Math.max(parsed.confidence || 50, 10), 99),
      reason: parsed.reason || 'AI determined this category',
      follow_up: parsed.follow_up,
    };
  } catch {
    return null;
  }
}
