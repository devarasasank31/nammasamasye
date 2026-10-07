// ============================================================
// LOCAL PRIORITY ANALYSIS — the deterministic half of the pipeline.
//
//   facts → safety engine → score → band → SLA → departments → reasons
//
// Runs anywhere (client preview, server, eval harness) with no I/O and
// no keys. The API layer enriches this result with retrieval + AI
// validation; enrichment can raise certainty but can never contradict
// the safety engine.
// ============================================================

import { PriorityLevel } from '../../types';
import { extractFacts } from './facts';
import { runSafetyEngine, SAFETY_RULE_LABELS } from './safety';
import { bandForScore, scoreFacts } from './scoring';
import { slaClassFor, slaDaysFor } from './sla';
import { departmentsFor } from './departments';
import { PriorityAnalysis, PriorityConfidences, PriorityInput, ScoreWeights } from './types';

function confidenceForPriority(
  score: number,
  override: boolean,
  ood: boolean,
  classification: number
): number {
  if (ood) return 25;
  if (override) return 95;
  const edges = [80, 60, 35];
  const distance = Math.min(...edges.map(e => Math.abs(score - e)));
  const base = 55 + Math.min(distance, 20) * 1.5; // 55..85
  return Math.round(Math.max(30, Math.min(92, base * (0.6 + (classification / 100) * 0.4))));
}

export function analyzePriorityLocal(input: PriorityInput): PriorityAnalysis {
  const facts = extractFacts(input);
  const safety = runSafetyEngine(facts);
  const breakdown = scoreFacts(facts);

  // Band from the eight dimensions, then the two baseline corrections:
  //  * a recognised, non-informational problem with no safety override
  //    never falls below P3 (36) — the app's historic "routine civic =
  //    21 days" baseline; P1/P2 remain pure score + override;
  //  * informational reports are capped inside P4 (<35).
  const informationalOnly = facts.incidentType === 'other_civic' && facts.incidentTypes.length === 1;
  let effectiveScore = breakdown.total;
  let floorApplied = false;
  let capApplied = false;
  if (!safety.override && !facts.outOfDistribution) {
    if (informationalOnly && effectiveScore > 34) {
      effectiveScore = 34;
      capApplied = true;
    } else if (!informationalOnly && effectiveScore < 36) {
      effectiveScore = 36;
      floorApplied = true;
    }
  }

  const scoreBand = bandForScore(effectiveScore);
  const basePriority: PriorityLevel = safety.override ? 'P1' : scoreBand;
  const priority = basePriority;

  const classification =
    typeof input.classificationConfidence === 'number' && input.classificationConfidence > 0
      ? Math.round(input.classificationConfidence)
      : facts.outOfDistribution
        ? 20
        : safety.override
          ? 85
          : 70;

  const confidences: PriorityConfidences = {
    classification,
    severity: facts.outOfDistribution ? 30 : safety.override ? 90 : facts.injuries.length > 0 ? 85 : 75,
    priority: confidenceForPriority(effectiveScore, safety.override, facts.outOfDistribution, classification),
    retrieval: 0,
    ai: null,
  };

  // Human review when the engine is out of its depth: unrecognised input,
  // low priority confidence (score sits near a band edge), or a P1 forced
  // by safety rules on top of a weak classification.
  const requiresHumanReview =
    facts.outOfDistribution ||
    confidences.priority < 45 ||
    (safety.override && classification < 50);
  const needsClarification = facts.outOfDistribution || facts.normalized.replace(/\s+/g, '').length < 8;

  // Reasons — ordered: safety first, then dominant score dimensions, then band.
  const reasons: string[] = [];
  if (safety.override) {
    for (const rule of safety.rules) reasons.push(SAFETY_RULE_LABELS[rule]);
  }
  if (facts.injuries.length > 0) {
    reasons.push(
      `Reported injuries (unverified): ${[...new Set(facts.injuries.map(i => i.kind))].join(', ')}`
    );
  }
  if (facts.allegations.some(a => a.kind === 'intoxication')) {
    reasons.push('Suspected intoxication reported by the citizen — unverified allegation, not a confirmed fact');
  }
  if (facts.resolvedNow) reasons.push('Report states the situation is already over / nobody hurt — no active emergency');
  const dims: [keyof ScoreWeights, string][] = [
    ['lifeSafety', 'life-safety exposure'],
    ['injury', 'injury'],
    ['immediateDanger', 'immediate danger'],
    ['publicExposure', 'public exposure'],
    ['population', 'people affected'],
    ['emergencyAccess', 'emergency access'],
    ['infraCriticality', 'critical infrastructure'],
    ['persistence', 'persistence'],
  ];
  const topDims = dims
    .map(([k, label]) => ({ label, value: breakdown[k] as number, weight: breakdown.weights[k] }))
    .filter(d => d.value > 0 && d.weight > 0)
    .sort((a, b) => b.value / b.weight - a.value / a.weight)
    .slice(0, 3);
  if (topDims.length > 0) {
    reasons.push(`Score drivers: ${topDims.map(d => `${d.label} ${d.value}/${d.weight}`).join(', ')} (dimensions sum ${breakdown.total}/100)`);
  }
  if (floorApplied) {
    reasons.push('Routine civic baseline: score floor 36 keeps this at P3 (21-day target)');
  }
  if (capApplied) {
    reasons.push('Informational report: capped inside P4 (30-day target)');
  }
  if (facts.outOfDistribution) {
    reasons.push('No recognised incident pattern — out of distribution, needs human review');
  } else if (!safety.override) {
    reasons.push(
      `Band ${priority} from score ${effectiveScore}/100 (${priority === 'P1' ? '≥80' : priority === 'P2' ? '60–79' : priority === 'P3' ? '35–59' : '<35'})`
    );
  }

  return {
    priority,
    basePriority,
    score: effectiveScore,
    safetyOverride: safety.override,
    safetyRules: safety.rules,
    slaClass: slaClassFor(priority),
    slaDays: slaDaysFor(priority),
    departments: departmentsFor({ subcategory: input.subcategory, category: input.category }, facts.incidentType),
    reasons,
    requiresHumanReview,
    needsClarification,
    outOfDistribution: facts.outOfDistribution,
    facts,
    breakdown,
    confidences,
    provider: 'local',
  };
}
