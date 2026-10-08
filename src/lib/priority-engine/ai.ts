// ============================================================
// AI VALIDATION LAYER — Gemini primary, OpenRouter secondary.
//
// Server-only. Each provider gets one attempt with a 10s timeout; a
// failed or malformed response falls through to the next provider and
// finally to local-only (null). The AI proposes {priority, confidence,
// reason} — the merge (escalation-only, never de-escalating, never
// overriding the deterministic safety engine) lives in the route.
// ============================================================

import type { PriorityLevel } from '../../types';
import type { AiInfo, PriorityProvider } from './types';

export interface AiProposal {
  priority: PriorityLevel;
  confidence: number;
  reason: string;
}

export interface AiAttempt {
  provider: PriorityProvider;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface AiResult {
  info: AiInfo | null;
  proposal: AiProposal | null;
  attempts: AiAttempt[];
  totalLatencyMs: number;
}

/**
 * Spec §14/§15: call external AI ONLY when necessary — low scenario
 * confidence, KB conflicts, OOD, or ambiguous safety interpretation.
 * When the deterministic safety engine already has final authority
 * (safetyOverride), or the KB and local engine agree with confidence,
 * an AI call could not change the outcome and is skipped entirely.
 */
export interface AiGateDecision {
  needed: boolean;
  reasons: string[];
}

export function evaluateAiGate(input: {
  safetyOverride: boolean;
  outOfDistribution: boolean;
  needsClarification: boolean;
  requiresHumanReview: boolean;
  localPriority: PriorityLevel;
  priorityConfidence: number;
  retrieval: { priority: PriorityLevel; score: number; agreement: number } | null;
}): AiGateDecision {
  // Safety override is final — the merge never lets AI de-escalate, so the
  // call would only add latency and an external dependency to a P1 path.
  if (input.safetyOverride) return { needed: false, reasons: ['safety-override'] };

  const reasons: string[] = [];
  if (input.outOfDistribution) reasons.push('ood');
  if (input.needsClarification) reasons.push('needs-clarification');
  if (input.requiresHumanReview) reasons.push('human-review');
  if (input.retrieval) {
    // Measured on the 86,910-row KB: top-1 similarity runs 0.33–0.68
    // (p50 0.45) — below 0.40 the KB is weak evidence for the band.
    if (input.retrieval.agreement < 1) reasons.push('kb-disagreement');
    if (input.retrieval.priority !== input.localPriority) reasons.push('kb-conflict');
    if (input.retrieval.score < 0.4) reasons.push('kb-low-confidence');
  }
  // Measured on train: confident bands cluster at 50/95 — only a score
  // below 50 means the band really sits near an edge.
  if (input.priorityConfidence < 50) reasons.push('low-priority-confidence');
  return { needed: reasons.length > 0, reasons };
}

interface ProviderConfig {
  provider: PriorityProvider;
  model: string;
  url: string;
  headers: Record<string, string>;
  body: (system: string, user: string) => unknown;
}

const PRIORITIES: PriorityLevel[] = ['P1', 'P2', 'P3', 'P4'];

function systemPrompt(): string {
  return [
    'You are a civic-incident priority reviewer for an Indian municipal helpdesk.',
    'You receive one citizen report plus the top-3 nearest historical scenarios from a labelled knowledge base (with their expected priority band).',
    'Decide the priority band: P1 (immediate danger to life), P2 (urgent, serious), P3 (standard), P4 (routine / informational).',
    'Rules:',
    '- A confirmed life-safety condition (fire, live wire, collapse, drowning, unconscious person, trapped person, severe injury) must be P1.',
    '- Never invent facts not present in the report.',
    '- If the report is unrecognisable or not about a civic incident, still choose the best band; the caller tracks uncertainty separately.',
    'Respond with ONLY a JSON object, no markdown, no prose: {"priority":"P1"|"P2"|"P3"|"P4","confidence":<1-99 integer>,"reason":"<max 200 chars>"}',
  ].join('\n');
}

function buildUserPrompt(input: {
  text: string;
  category: string;
  subcategory: string;
  language?: string;
  localPriority: PriorityLevel;
  localScore: number;
  safetyOverride: boolean;
  outOfDistribution: boolean;
  topScenarios: { text: string; expectedPriority: PriorityLevel; score: number }[];
}): string {
  const scenarios = input.topScenarios.length
    ? input.topScenarios
        .map((s, i) => `${i + 1}. [${s.expectedPriority}, sim ${s.score}] ${s.text.slice(0, 220)}`)
        .join('\n')
    : '(none)';
  return [
    `Report language: ${input.language || 'unknown'}`,
    `Category: ${input.category} / ${input.subcategory}`,
    `Report: ${input.text.slice(0, 2000)}`,
    `Local engine result: ${input.localPriority} (score ${input.localScore})${input.safetyOverride ? ' [SAFETY OVERRIDE ACTIVE]' : ''}${input.outOfDistribution ? ' [OUT OF DISTRIBUTION]' : ''}`,
    `Nearest labelled scenarios:\n${scenarios}`,
  ].join('\n');
}

function providers(): ProviderConfig[] {
  const list: ProviderConfig[] = [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    list.push({
      provider: 'gemini',
      model,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: (system, user) => ({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { temperature: 0, maxOutputTokens: 300, responseMimeType: 'application/json' },
      }),
    });
  }

  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    list.push({
      provider: 'openrouter',
      model,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'NammaSamasye Priority Engine',
      },
      body: (system, user) => ({
        model,
        temperature: 0,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
  }

  return list;
}

/** Extract a JSON object from a possibly-chatty model response. */
function parseProposal(raw: string): AiProposal | null {
  let text = raw.trim();
  if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as { priority?: string; confidence?: number; reason?: string };
    const priority = String(obj.priority || '').toUpperCase() as PriorityLevel;
    if (!PRIORITIES.includes(priority)) return null;
    const confidence = Math.round(Number(obj.confidence));
    if (!Number.isFinite(confidence) || confidence < 1 || confidence > 99) return null;
    const reason = String(obj.reason || '').slice(0, 300);
    return { priority, confidence, reason };
  } catch {
    return null;
  }
}

/** Extract plain text from a Gemini or OpenAI-shaped response. */
function extractText(data: unknown): string {
  const d = data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    choices?: { message?: { content?: string } }[];
  };
  const gemini = d.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (gemini) return gemini;
  return d.choices?.[0]?.message?.content || '';
}

export async function requestAiValidation(input: {
  text: string;
  category: string;
  subcategory: string;
  language?: string;
  localPriority: PriorityLevel;
  localScore: number;
  safetyOverride: boolean;
  outOfDistribution: boolean;
  topScenarios: { text: string; expectedPriority: PriorityLevel; score: number }[];
  /** Spec §14 gate — when present and not needed, no network call happens. */
  gate?: AiGateDecision;
}): Promise<AiResult> {
  const started = Date.now();
  const attempts: AiAttempt[] = [];

  if (input.gate && !input.gate.needed) {
    return { info: null, proposal: null, attempts, totalLatencyMs: 0 };
  }

  const list = providers();

  if (list.length === 0) {
    return { info: null, proposal: null, attempts, totalLatencyMs: 0 };
  }

  const system = systemPrompt();
  const user = buildUserPrompt(input);

  for (const p of list) {
    const t0 = Date.now();
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: p.headers,
        body: JSON.stringify(p.body(system, user)),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        attempts.push({ provider: p.provider, model: p.model, ok: false, latencyMs: Date.now() - t0, error: `HTTP ${res.status}` });
        continue;
      }
      const data = await res.json();
      const proposal = parseProposal(extractText(data));
      const latencyMs = Date.now() - t0;
      if (!proposal) {
        attempts.push({ provider: p.provider, model: p.model, ok: false, latencyMs, error: 'unparseable response' });
        continue;
      }
      attempts.push({ provider: p.provider, model: p.model, ok: true, latencyMs });
      return {
        info: { provider: p.provider, model: p.model, priority: proposal.priority, agreed: proposal.priority === input.localPriority },
        proposal,
        attempts,
        totalLatencyMs: Date.now() - started,
      };
    } catch (err) {
      attempts.push({
        provider: p.provider,
        model: p.model,
        ok: false,
        latencyMs: Date.now() - t0,
        error: (err as Error).message?.slice(0, 120) || 'request failed',
      });
    }
  }

  return { info: null, proposal: null, attempts, totalLatencyMs: Date.now() - started };
}
