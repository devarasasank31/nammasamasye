// ============================================================
// /api/priority — ONE orchestrated priority result for the report flow.
// Thin wrapper over src/lib/priority-engine/pipeline.ts (shared with
// the public /api/incidents POST): local engine → KB retrieval →
// Gemini/OpenRouter validation → escalation-only merge.
//
// Never returns 500 for AI/retrieval problems — those degrade to local.
// ============================================================

import { runPriorityPipeline } from '@/lib/priority-engine/pipeline';
import { rateLimit, clientIp, dailyAllow, LIMITS } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PriorityRequestBody {
  text?: string;
  category?: string;
  subcategory?: string;
  answers?: Record<string, string>;
  language?: string;
  classificationConfidence?: number;
}

export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request.headers);
  if (!rateLimit(`pri:${ip}`, LIMITS.classifyPerMinute, 60_000) ||
      !dailyAllow(`pri_day:${ip}`, LIMITS.classifyPerDay)) {
    return Response.json({ ok: false, error: 'rate limited' }, { status: 429 });
  }

  let body: PriorityRequestBody;
  try {
    body = (await request.json()) as PriorityRequestBody;
  } catch {
    return Response.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (text.length < 4) {
    return Response.json({ ok: false, error: 'text is required' }, { status: 400 });
  }

  try {
    const result = await runPriorityPipeline({
      text,
      category: body.category || 'OTHER',
      subcategory: body.subcategory || 'other',
      answers: body.answers,
      language: body.language,
      classificationConfidence: body.classificationConfidence,
    });
    return Response.json(result);
  } catch (err) {
    // Pipeline is designed not to throw; belt and braces for the UI.
    console.error('[priority] pipeline failed:', err);
    return Response.json({ ok: false, error: 'priority pipeline failed' }, { status: 500 });
  }
}
