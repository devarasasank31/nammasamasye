// ============================================================
// PRIORITY PIPELINE — the ONE orchestrated result used by both
// /api/priority (UI) and /api/incidents POST (public REST).
//
//   local engine (deterministic, safety first)
//   → scenario retrieval over the 86,910-row labelled KB
//   → AI validation (Gemini primary, OpenRouter secondary)
//   → merge: safety override wins; AI may only ESCALATE, never
//     de-escalate; OOD + high-confidence AI unlocks the band but
//     keeps needsHumanReview=true
//
// Never throws for AI/retrieval problems — those degrade to local.
// ============================================================

import { computePriority } from '@/lib/priority';
import { searchScenarios } from './retrieval';
import { requestAiValidation, evaluateAiGate, AiAttempt, AiGateDecision } from './ai';
import { slaClassFor, slaDaysFor } from './sla';
import type { PriorityAnalysis, RetrievalInfo } from './types';
import type { PriorityLevel } from '../../types';

const RANK: Record<PriorityLevel, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

function moreUrgent(a: PriorityLevel, b: PriorityLevel): boolean {
  return RANK[a] < RANK[b];
}

export interface PriorityPipelineInput {
  text: string;
  category: string;
  subcategory: string;
  answers?: Record<string, string>;
  language?: string;
  classificationConfidence?: number;
}

export interface PriorityPipelineResponse {
  ok: true;
  priority: PriorityLevel;
  localPriority: PriorityLevel;
  score: number;
  slaClass: string;
  slaDays: number;
  reason: string;
  factors: { label: string; delta: number }[];
  breakdown: PriorityAnalysis['breakdown'];
  safetyOverride: boolean;
  safetyRules: string[];
  outOfDistribution: boolean;
  needsHumanReview: boolean;
  confidences: PriorityAnalysis['confidences'];
  retrieval: RetrievalInfo | null;
  ai: {
    provider?: string;
    model?: string;
    priority?: PriorityLevel | null;
    agreed?: boolean;
    proposal: { priority: PriorityLevel; confidence: number; reason: string } | null;
    attempts: AiAttempt[];
    latencyMs: number;
    /** Why external AI was (or was not) consulted (spec §14). */
    gated: AiGateDecision;
  };
  analysis: PriorityAnalysis;
  source: 'safety-override' | 'ai-escalation' | 'ai-ood' | 'local';
  latencyMs: number;
}

export async function runPriorityPipeline(input: PriorityPipelineInput): Promise<PriorityPipelineResponse> {
  const started = Date.now();
  const text = input.text;
  const category = (input.category || 'OTHER') as never;
  const subcategory = input.subcategory || 'other';
  const answers = input.answers || {};

  // 1. Local deterministic analysis + SLA + reasons + factors
  const localStart = Date.now();
  const local = computePriority({
    category,
    subcategory,
    text,
    answers,
    classificationConfidence: input.classificationConfidence,
  });
  const localMs = Date.now() - localStart;
  const analysis: PriorityAnalysis = local.analysis;

  // 2. Scenario retrieval (top-3 nearest labelled rows)
  const retStart = Date.now();
  const search = await searchScenarios(`${text} ${subcategory}`.trim(), 3);
  const retrievalMs = Date.now() - retStart;
  const retrieval: RetrievalInfo | null = search.matched
    ? {
        matched: true,
        id: search.top[0]?.id ?? null,
        priority: search.bestPriority,
        score: search.bestScore,
        agreement: search.agreement,
        top: search.top.map(hit => ({
          id: hit.id,
          expectedPriority: hit.expectedPriority,
          score: hit.score,
          category: hit.category,
          explanation: hit.explanation,
        })),
      }
    : null;

  // 3. AI validation — gated per spec §14: only when the deterministic
  // result is uncertain (low confidence, KB conflict, OOD, review flags).
  const gate = evaluateAiGate({
    safetyOverride: analysis.safetyOverride,
    outOfDistribution: analysis.outOfDistribution,
    needsClarification: analysis.needsClarification,
    requiresHumanReview: analysis.requiresHumanReview,
    localPriority: analysis.priority,
    priorityConfidence: analysis.confidences.priority,
    retrieval: retrieval && retrieval.priority
      ? { priority: retrieval.priority, score: retrieval.score, agreement: retrieval.agreement }
      : null,
  });
  const aiStart = Date.now();
  const ai = await requestAiValidation({
    text,
    category: String(input.category || ''),
    subcategory,
    language: input.language,
    localPriority: analysis.priority,
    localScore: analysis.score,
    safetyOverride: analysis.safetyOverride,
    outOfDistribution: analysis.outOfDistribution,
    topScenarios: search.top.map(h => ({ text: h.text, expectedPriority: h.expectedPriority, score: h.score })),
    gate,
  });
  const aiMs = Date.now() - aiStart;

  // 4. Merge — ONE final band
  let finalPriority: PriorityLevel = analysis.priority;
  let source: PriorityPipelineResponse['source'] = 'local';

  if (analysis.safetyOverride) {
    source = 'safety-override';
  } else if (ai.proposal) {
    const conf = ai.proposal.confidence;
    if (analysis.outOfDistribution && conf >= 75) {
      finalPriority = ai.proposal.priority;
      source = 'ai-ood';
    } else if (conf >= 80 && moreUrgent(ai.proposal.priority, analysis.priority)) {
      finalPriority = ai.proposal.priority;
      source = 'ai-escalation';
    }
  }

  // Re-band SLA for the merged priority; reason/factors stay the local ones
  const merged = finalPriority !== analysis.priority
    ? computePriority({ category, subcategory, text, answers, analysis: { ...analysis, priority: finalPriority, basePriority: finalPriority } })
    : local;
  const slaClass = slaClassFor(finalPriority);
  const slaDays = slaDaysFor(finalPriority);

  if (ai.info) ai.info.agreed = ai.info.priority === finalPriority;

  // Persist-ready analysis for the incident record
  const envelopeAnalysis: PriorityAnalysis = {
    ...merged.analysis,
    priority: finalPriority,
    basePriority: analysis.priority,
    slaClass,
    slaDays,
    retrieval,
    ai: ai.info,
    provider: ai.info?.provider || 'local',
    model: ai.info?.model,
    latencyMs: Date.now() - started,
    confidences: {
      ...analysis.confidences,
      retrieval: retrieval ? Math.min(100, Math.round(retrieval.score * 100)) : analysis.confidences.retrieval,
      ai: ai.proposal ? ai.proposal.confidence : null,
    },
  };

  console.log(
    `[priority] final=${finalPriority} local=${analysis.priority} score=${analysis.score} override=${analysis.safetyOverride} ood=${analysis.outOfDistribution} source=${source} provider=${envelopeAnalysis.provider} ai=${ai.proposal?.priority || '-'}@${ai.proposal?.confidence || '-'} retrieval=${retrieval ? retrieval.score : '-'} gate=${gate.needed ? 'call(' + gate.reasons.join('|') + ')' : 'skip(' + gate.reasons.join('|') + ')'} attempts=${ai.attempts.length} ms(total=${Date.now() - started} local=${localMs} ret=${retrievalMs} ai=${aiMs})`
  );

  return {
    ok: true,
    priority: finalPriority,
    localPriority: analysis.priority,
    score: analysis.score,
    slaClass,
    slaDays,
    reason: merged.reason,
    factors: merged.factors,
    breakdown: analysis.breakdown,
    safetyOverride: analysis.safetyOverride,
    safetyRules: analysis.safetyRules,
    outOfDistribution: analysis.outOfDistribution,
    needsHumanReview: analysis.requiresHumanReview || analysis.outOfDistribution,
    confidences: envelopeAnalysis.confidences,
    retrieval,
    ai: {
      provider: ai.info?.provider,
      model: ai.info?.model,
      priority: ai.info?.priority ?? null,
      agreed: ai.info?.agreed,
      proposal: ai.proposal,
      attempts: ai.attempts,
      latencyMs: aiMs,
      gated: gate,
    },
    analysis: envelopeAnalysis,
    source,
    latencyMs: Date.now() - started,
  };
}
