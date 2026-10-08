import { NextRequest, NextResponse } from 'next/server';
import { civicClassify } from '@/lib/civic-classifier';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { Language } from '@/types';
import { rateLimit, clientIp, dailyAllow, isExemptIp, LIMITS } from '@/lib/security';

const VALID_LANGS = new Set(['en', 'kn', 'hi', 'te']);

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!isExemptIp(ip) &&
      (!rateLimit(`cls:${ip}`, LIMITS.classifyPerMinute, 60_000) ||
       !dailyAllow(`cls_day:${ip}`, LIMITS.classifyPerDay))) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const lang = typeof body.lang === 'string' && VALID_LANGS.has(body.lang)
      ? (body.lang as Language)
      : 'en';

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const started = Date.now();
    const result = civicClassify(text);

    // Same calibration formula per candidate so 2nd/3rd ranks are comparable.
    const matches = result.top.map(c => {
      const scenario = getScenarioById(c.category);
      const confidence = c === result.top[0]
        ? result.confidence
        : Math.max(1, Math.min(99, Math.round(100 * (0.4 + 0.65 * c.score))));
      return {
        scenarioId: c.category,
        scenarioName: scenario ? getScenarioName(scenario, lang) : c.category,
        confidence,
        reason: c.reason || 'Matched by the local scenario knowledge base.',
        category: c.category,
        subcategory: c.subcategory || null,
        severity: c.severity,
      };
    });

    // Ranks are by score; keep displayed confidences monotonic so rank 2
    // never shows a higher % than rank 1 (penalties apply to rank 1 only).
    for (let i = 1; i < matches.length; i++) {
      if (matches[i].confidence > matches[i - 1].confidence) {
        matches[i].confidence = matches[i - 1].confidence;
      }
    }

    return NextResponse.json({
      matches,
      source: matches.length ? 'local_scenario' : 'no_match',
      margin: Number(result.margin.toFixed(3)),
      needs_clarification: result.needs_clarification,
      negations_applied: result.negations_applied,
      hazards: result.hazards,
      latency_ms: result.latency_ms || Date.now() - started,
    });
  } catch (error) {
    console.error('Classify API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
