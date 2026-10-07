// ============================================================
// PRIORITY ENGINE — public entry point used by the report preview,
// the demo store and cluster escalation.
//
// computePriority() keeps its historical signature and return shape;
// underneath it now runs the production priority pipeline:
//
//   fact extraction → deterministic safety engine → 8-dimension score
//   → P1–P4 band → SLA class → department routing → reasons
//
// Community pressure (repeat reports / citizen support) can still raise
// a report by AT MOST one level and can never manufacture a P1.
//
// The API layer (/api/priority) adds scenario retrieval + AI validation
// on top of this same analysis; see src/lib/priority-engine/.
// ============================================================

import { CategoryParent, PriorityLevel } from '@/types';
import { analyzePriorityLocal } from '@/lib/priority-engine/analyze';
import { slaDaysFor } from '@/lib/priority-engine/sla';
import type { PriorityAnalysis } from '@/lib/priority-engine/types';

export const SLA_DAYS: Record<PriorityLevel, number> = {
  P1: slaDaysFor('P1'),
  P2: slaDaysFor('P2'),
  P3: slaDaysFor('P3'),
  P4: slaDaysFor('P4'),
};

export const PRIORITY_ORDER: PriorityLevel[] = ['P1', 'P2', 'P3', 'P4'];

export interface PriorityFactor {
  label: string;
  delta: number;
}

export interface PriorityResult {
  level: PriorityLevel;
  baseLevel: PriorityLevel;
  score: number;
  slaDays: number;
  reason: string;
  factors: PriorityFactor[];
  bumped: boolean;
  /** Full engine output — facts, safety rules, score breakdown, confidences. */
  analysis: PriorityAnalysis;
}

export function computePriority(input: {
  category: CategoryParent;
  subcategory: string;
  text: string;
  answers?: Record<string, string>;
  supportCount?: number;
  clusterSize?: number;
  classificationConfidence?: number;
  /** Pre-computed analysis (server result) — skips re-extraction. */
  analysis?: PriorityAnalysis;
}): PriorityResult {
  const analysis =
    input.analysis ||
    analyzePriorityLocal({
      text: input.text,
      category: input.category,
      subcategory: input.subcategory,
      answers: input.answers,
      classificationConfidence: input.classificationConfidence,
    });

  const factors: PriorityFactor[] = [];
  factors.push({ label: `Category baseline (${input.category})`, delta: 0 });
  if (analysis.safetyOverride) {
    factors.push({ label: `Safety override: ${analysis.safetyRules.join(', ')}`, delta: 45 });
  } else {
    const b = analysis.breakdown;
    const all: [string, number, number][] = [
      ['life safety', b.lifeSafety, b.weights.lifeSafety],
      ['injury', b.injury, b.weights.injury],
      ['immediate danger', b.immediateDanger, b.weights.immediateDanger],
      ['public exposure', b.publicExposure, b.weights.publicExposure],
      ['people affected', b.population, b.weights.population],
      ['emergency access', b.emergencyAccess, b.weights.emergencyAccess],
      ['critical infrastructure', b.infraCriticality, b.weights.infraCriticality],
      ['persistence', b.persistence, b.weights.persistence],
    ];
    const top = all
      .filter(([, v, w]) => v > 0 && w > 0)
      .sort((a, c) => c[1] / c[2] - a[1] / a[2])
      .slice(0, 3);
    for (const [label, value, weight] of top) {
      factors.push({ label: `${label}: ${value}/${weight}`, delta: value });
    }
  }

  // --- Community pressure: at most ONE level, never manufacturing a P1 ---
  const support = input.supportCount || 0;
  const cluster = input.clusterSize || 0;
  const baseLevel = analysis.priority;
  let level = baseLevel;
  let bumped = false;
  if (baseLevel !== 'P1') {
    if (cluster >= 5) {
      level = nextLevel(baseLevel);
      bumped = true;
      factors.push({ label: `${cluster} similar reports in the same ward`, delta: 8 });
    } else if (support >= 10) {
      level = nextLevel(baseLevel);
      bumped = true;
      factors.push({ label: `${support} citizens supported this report`, delta: 8 });
    } else {
      if (cluster >= 3) factors.push({ label: `${cluster} similar reports (needs 5 to escalate)`, delta: 3 });
      if (support >= 1) factors.push({ label: `${support} citizen support (needs 10 to escalate)`, delta: 2 });
    }
  } else if (cluster >= 5 || support >= 10) {
    factors.push({ label: 'Already priority P1 — no further escalation', delta: 0 });
  }

  const reason = buildReason(analysis, level, bumped, support, cluster);

  return {
    level,
    baseLevel,
    score: analysis.score,
    slaDays: slaDaysFor(level),
    reason,
    factors,
    bumped,
    analysis,
  };
}

function buildReason(
  analysis: PriorityAnalysis,
  level: PriorityLevel,
  bumped: boolean,
  support: number,
  cluster: number
): string {
  const parts: string[] = [];
  if (analysis.safetyOverride) {
    parts.push(`Life-safety override: ${analysis.safetyRules.join(', ')}`);
  }
  for (const r of analysis.reasons.slice(0, 3)) parts.push(r);
  if (bumped) {
    parts.push(
      `Escalated ${analysis.priority} → ${level} by community pressure (${cluster >= 5 ? `${cluster} similar reports` : `${support} supporters`})`
    );
  }
  if (analysis.outOfDistribution) parts.push('Needs human review (unrecognised report)');
  parts.push(`Target ${slaDaysFor(level)} days`);
  return parts.join('. ') + '.';
}

function nextLevel(l: PriorityLevel): PriorityLevel {
  // P2 never escalates to P1 through community pressure alone.
  return l === 'P4' ? 'P3' : l === 'P3' ? 'P2' : 'P2';
}

export function severityFor(level: PriorityLevel): 'critical' | 'high' | 'medium' | 'low' {
  return level === 'P1' ? 'critical' : level === 'P2' ? 'high' : level === 'P3' ? 'medium' : 'low';
}

export function isOverdue(priority: PriorityLevel, createdAt: string, resolvedAt?: string): boolean {
  const start = new Date(createdAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  return end - start > SLA_DAYS[priority] * 24 * 60 * 60 * 1000;
}
