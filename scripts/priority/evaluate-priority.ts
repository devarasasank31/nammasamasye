// ============================================================
// PRIORITY ENGINE EVALUATION
//
// Two suites, run together by default:
//
//  1. REGRESSION — the hard acceptance cases from the spec (P1
//     false-negatives, negation, resolved-state, multi-incident,
//     cause-vs-consequence, allegations, Indic inputs) plus spec §28's
//     exact 27 cases run as their own suite (spec-28). Any failure
//     fails the run (exit 1).
//
//  2. UNSEEN — data/priority-scenarios/eval-unseen.jsonl, a labelled
//     test set held out of the knowledge base. Reports accuracy, the
//     P1 false-negative rate (the headline metric), per-priority
//     precision/recall/F1, confusion matrix, language and hard-negative
//     accuracy, OOD behaviour and latency percentiles.
//     Only runs with --unseen (kept for the final measurement).
//
//  3. AGREEMENT — --agreement [--split train|eval] compares the engine
//     against the BY-CONSTRUCTION dataset labels (calibration loop;
//     measured, never asserted).
//
// Numbers in data/priority_eval_report.json are measured, never
// asserted. Run:  npx tsc -p scripts/priority/tsconfig.eval.json &&
//   node .eval-build/scripts/priority/evaluate-priority.js [--unseen] [--agreement] [--split train]
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { analyzePriorityLocal } from '../../src/lib/priority-engine/analyze';
import type { PriorityInput } from '../../src/lib/priority-engine/types';

type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
const BANDS: PriorityLevel[] = ['P1', 'P2', 'P3', 'P4'];

interface RegressionExpectation {
  priority?: PriorityLevel;
  priorityIn?: PriorityLevel[];
  notP1?: boolean;
  safetyOverride?: boolean;
  /** At least one deterministic safety rule must have fired. */
  safetyFired?: boolean;
  incidentType?: string;
  injury?: string;
  normalCivicSla?: boolean;
  causeType?: string;
  multiIncident?: boolean;
  requiresHumanReview?: boolean;
  allegationsIntoxication?: boolean;
}

interface RegressionCase {
  id: string;
  suite: 'spec-57' | 'spec-45' | 'hard-negative' | 'spec-28';
  input: PriorityInput;
  expect: RegressionExpectation;
}

const regressionCases: RegressionCase[] = [
  // --- Spec §57 acceptance inputs ---------------------------------------
  {
    id: 'drunk-driver-leg-break',
    suite: 'spec-57',
    input: { text: 'i fell donw someone was drunk and hit me with car my leg broke', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: {
      priority: 'P1',
      safetyOverride: true,
      incidentType: 'vehicle_collision',
      injury: 'suspected_fracture',
      normalCivicSla: true,
      allegationsIntoxication: true,
    },
  },
  {
    id: 'streetlight-not-working',
    suite: 'spec-57',
    input: { text: 'streetlight in front of my house is not working', category: 'CIVIC', subcategory: 'civic_streetlight' },
    expect: { notP1: true },
  },
  {
    id: 'live-wire-fallen-road',
    suite: 'spec-57',
    input: { text: 'live electric wire has fallen on the road', category: 'UTILITIES', subcategory: 'util_power' },
    expect: { priority: 'P1', safetyOverride: true, incidentType: 'electrical_hazard' },
  },
  {
    id: 'unconscious-after-accident',
    suite: 'spec-57',
    input: { text: 'person unconscious after car accident', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 'building-collapsed-people-trapped',
    suite: 'spec-57',
    input: { text: 'building collapsed and people may be trapped', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { priority: 'P1', safetyOverride: true, multiIncident: false },
  },
  {
    id: 'accident-yesterday-everyone-fine',
    suite: 'spec-57',
    input: { text: 'there was an accident yesterday but everyone is fine and the road is clear', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { notP1: true, safetyOverride: false },
  },

  // --- Spec §45: negation / contradictions ------------------------------
  {
    id: 'negation-no-live-wire',
    suite: 'spec-45',
    input: { text: 'people say there is a live wire scare but there is no live wire on the road, supply is cut and safe now', category: 'UTILITIES', subcategory: 'util_power' },
    expect: { notP1: true, safetyOverride: false },
  },
  {
    id: 'negation-power-is-fine',
    suite: 'spec-45',
    input: { text: 'there is no power outage, electricity is working normally since morning', category: 'UTILITIES', subcategory: 'util_power' },
    expect: { notP1: true },
  },
  {
    id: 'negation-not-fire',
    suite: 'spec-45',
    input: { text: 'we were worried the paper waste would catch fire but there is no fire and it is not burning now', category: 'CIVIC', subcategory: 'civic_garbage' },
    expect: { notP1: true, safetyOverride: false },
  },
  {
    id: 'negation-no-injuries-in-crash',
    suite: 'spec-45',
    input: { text: 'two bikes brushed each other, no injuries, nobody was hurt and both riders left', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { notP1: true, safetyOverride: false },
  },

  // --- Spec §45: cause vs consequence -----------------------------------
  {
    id: 'cause-sewer-burst-flooding',
    suite: 'spec-45',
    input: { text: 'a sewer pipe burst causing flooding on the main road, knee deep stinking water for three days', category: 'CIVIC', subcategory: 'civic_drainage' },
    expect: { notP1: true, causeType: 'sewage_contamination' },
  },
  {
    id: 'cause-underground-water-main-break',
    suite: 'spec-45',
    input: { text: 'water main broke under the road and that is why the road caved in near the junction', category: 'UTILITIES', subcategory: 'civic_water_supply' },
    expect: { priority: 'P1', causeType: 'water_supply' },
  },

  // --- Spec §45: multi-incident -----------------------------------------
  {
    id: 'multi-accident-and-garbage',
    suite: 'spec-45',
    input: { text: 'there was a small crash with no injuries and separately the garbage has not been picked up for weeks', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { notP1: true, multiIncident: true },
  },

  // --- Spec §45: allegations --------------------------------------------
  {
    id: 'allegation-intoxicated-official',
    suite: 'spec-45',
    input: { text: 'the official was drunk and demanded extra money for my certificate, my file is stuck', category: 'GOVERNMENT', subcategory: 'bribes' },
    expect: { notP1: true, allegationsIntoxication: true },
  },

  // --- Hard negatives -----------------------------------------------------
  {
    id: 'hn-open-drain-near-house',
    suite: 'hard-negative',
    input: { text: 'the drain in front of my house smells bad and the cover is broken but nobody fell', category: 'CIVIC', subcategory: 'civic_drainage' },
    expect: { notP1: true },
  },
  {
    id: 'hn-broken-divisional-road',
    suite: 'hard-negative',
    input: { text: 'the lane divider paint is gone and the road markings are not visible, no accident happened', category: 'TRAFFIC', subcategory: 'traffic_pothole' },
    expect: { notP1: true },
  },
  {
    id: 'hn-pothole-school-zone',
    suite: 'hard-negative',
    input: { text: 'deep pothole outside the school gate, kids walk around it daily but no one is hurt', category: 'TRAFFIC', subcategory: 'traffic_pothole' },
    expect: { notP1: true },
  },
  {
    id: 'hn-dog-bite-routine',
    suite: 'hard-negative',
    input: { text: 'a stray dog chased my child near the park yesterday, nobody was bitten', category: 'CIVIC', subcategory: 'civic_stray_animals' },
    expect: { notP1: true, safetyOverride: false },
  },
  {
    id: 'hn-noisy-hospital-road',
    suite: 'hard-negative',
    input: { text: 'horns and loud music near the hospital road at night for a week', category: 'ENVIRONMENT', subcategory: 'env_noise' },
    expect: { notP1: true },
  },
  {
    id: 'hn-manhole-cover-in-place',
    suite: 'hard-negative',
    input: { text: 'manhole cover is in place but the drain water overflows onto the footpath', category: 'CIVIC', subcategory: 'civic_drainage' },
    expect: { notP1: true, safetyOverride: false },
  },

  // --- Indic inputs --------------------------------------------------------
  {
    id: 'kn-streetlight-broken',
    suite: 'hard-negative',
    input: { text: 'ನಮ್ಮ ಮನೆ ಮುಂದೆ ಬೀದಿ ದೀಪ ಕೆಟ್ಟಿದೆ ತಿಂಗಳಾಗಿದೆ', category: 'CIVIC', subcategory: 'civic_streetlight' },
    expect: { notP1: true },
  },
  {
    id: 'hi-pothole-road',
    suite: 'hard-negative',
    input: { text: 'सड़क पर बहुत बड़ा गड्ढा हो गया है, बाइक चलाना मुश्किल', category: 'TRAFFIC', subcategory: 'traffic_pothole' },
    expect: { notP1: true },
  },
  {
    id: 'te-live-wire-fell',
    suite: 'spec-57',
    input: { text: 'విద్యుత్ తీగ రోడ్డు మీద పడింది, ప్రమాదకరం', category: 'UTILITIES', subcategory: 'util_power' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 'hi-unconscious-accident',
    suite: 'spec-57',
    input: { text: 'सड़क दुर्घटना में एक व्यक्ति बेहोश पड़ा है, खून बह रहा है', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 'kn-no-accident',
    suite: 'hard-negative',
    input: { text: 'ಯಾವುದೇ ಅಪಘಾತ ಆಗಿಲ್ಲ, ರಸ್ತೆ ಸರಿಯಾಗಿ ಬಿಟ್ಟಿದೆ ಗುಂಡಿ ಮಾತ್ರ ಇದೆ', category: 'TRAFFIC', subcategory: 'traffic_pothole' },
    expect: { notP1: true, safetyOverride: false },
  },
  {
    id: 'hinglish-fell-from-bike',
    suite: 'spec-45',
    input: { text: 'main bike se gir gaya tha aur mera haath chot laga hai, bleeding thodi hai', category: 'TRAFFIC', subcategory: 'traffic_accident' },
    expect: { notP1: true },
  },

  // --- Spec §28: the exact 27 acceptance cases ------------------------------
  // Raw citizen text with no classifier hint (category/subcategory empty) —
  // the deterministic engine must stand on the words alone. Any failure
  // fails the run.
  {
    id: 's28-01-drunk-driver-leg-broke',
    suite: 'spec-28',
    input: { text: 'i fell donw someone was drunk and hit me with car my leg broke', category: '', subcategory: '' },
    expect: {
      priority: 'P1',
      safetyOverride: true,
      incidentType: 'vehicle_collision',
      injury: 'suspected_fracture',
      normalCivicSla: true,
      allegationsIntoxication: true,
    },
  },
  {
    id: 's28-02-someone-got-murdered',
    suite: 'spec-28',
    input: { text: 'someone got murdered', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true, normalCivicSla: true, requiresHumanReview: true },
  },
  {
    id: 's28-03-attacked-right-now',
    suite: 'spec-28',
    input: { text: 'someone is being attacked right now', category: '', subcategory: '' },
    expect: { priority: 'P1' },
  },
  {
    id: 's28-04-murdered-last-year-closed',
    suite: 'spec-28',
    input: { text: 'someone was murdered last year and the case is closed', category: '', subcategory: '' },
    expect: { notP1: true },
  },
  {
    id: 's28-05-murder-in-movie',
    suite: 'spec-28',
    input: { text: 'there is a murder in the movie I am watching', category: '', subcategory: '' },
    expect: { notP1: true },
  },
  {
    id: 's28-06-streetlight-not-working',
    suite: 'spec-28',
    input: { text: 'streetlight not working', category: '', subcategory: '' },
    expect: { priorityIn: ['P3', 'P4'] },
  },
  {
    id: 's28-07-streetlight-pole-live-wire',
    suite: 'spec-28',
    input: { text: 'streetlight pole fell onto live electrical wire', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-08-there-is-a-pothole',
    suite: 'spec-28',
    input: { text: 'there is a pothole', category: '', subcategory: '' },
    expect: { priority: 'P3' },
  },
  {
    id: 's28-09-pothole-caused-accident-leg-broke',
    suite: 'spec-28',
    input: { text: 'pothole caused accident and my leg broke', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true, injury: 'suspected_fracture' },
  },
  {
    id: 's28-10-live-wire-public-road',
    suite: 'spec-28',
    input: { text: 'live electrical wire has fallen onto public road', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-11-unconscious-after-accident',
    suite: 'spec-28',
    input: { text: 'person unconscious after accident', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-12-building-collapsed-trapped',
    suite: 'spec-28',
    input: { text: 'building collapsed and people may be trapped', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-13-no-accident-only-streetlight',
    suite: 'spec-28',
    input: { text: 'there is no accident only a broken streetlight', category: '', subcategory: '' },
    expect: { priorityIn: ['P3', 'P4'] },
  },
  {
    id: 's28-14-no-power-cut-but-live-wire',
    suite: 'spec-28',
    input: { text: 'there is no power cut but a live wire has fallen on the road', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-15-kidnapp',
    suite: 'spec-28',
    input: { text: 'kidnapp', category: '', subcategory: '' },
    expect: { priority: 'P1', requiresHumanReview: true },
  },
  {
    id: 's28-16-kidnap',
    suite: 'spec-28',
    input: { text: 'kidnap', category: '', subcategory: '' },
    expect: { priority: 'P1' },
  },
  {
    id: 's28-17-hostage',
    suite: 'spec-28',
    input: { text: 'hostage', category: '', subcategory: '' },
    expect: { priority: 'P1', requiresHumanReview: true },
  },
  {
    id: 's28-18-murdred',
    suite: 'spec-28',
    input: { text: 'murdred', category: '', subcategory: '' },
    expect: { priority: 'P1' },
  },
  {
    id: 's28-19-shootng',
    suite: 'spec-28',
    input: { text: 'shootng', category: '', subcategory: '' },
    expect: { priority: 'P1' },
  },
  {
    id: 's28-20-unconcious-person',
    suite: 'spec-28',
    input: { text: 'unconcious person', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-21-fire-short-input',
    suite: 'spec-28',
    input: { text: 'fire', category: '', subcategory: '' },
    expect: { safetyFired: true },
  },
  {
    id: 's28-22-movie-about-kidnapping',
    suite: 'spec-28',
    input: { text: 'movie about kidnapping', category: '', subcategory: '' },
    expect: { notP1: true },
  },
  {
    id: 's28-23-kidnapped-yesterday',
    suite: 'spec-28',
    input: { text: 'someone was kidnapped yesterday', category: '', subcategory: '' },
    expect: { requiresHumanReview: true, priorityIn: ['P1', 'P2', 'P3'] },
  },
  {
    id: 's28-24-kidnapped-right-now',
    suite: 'spec-28',
    input: { text: 'someone is kidnapped right now', category: '', subcategory: '' },
    expect: { priority: 'P1' },
  },
  {
    id: 's28-25-live-wire-no-power-outage',
    suite: 'spec-28',
    input: { text: 'live wire but no power outage', category: '', subcategory: '' },
    expect: { priority: 'P1', safetyOverride: true },
  },
  {
    id: 's28-26-garbage-outside-house',
    suite: 'spec-28',
    input: { text: 'garbage outside my house', category: '', subcategory: '' },
    expect: { priorityIn: ['P3', 'P4'] },
  },
  {
    id: 's28-27-pothole-two-years',
    suite: 'spec-28',
    input: { text: 'pothole has existed for 2 years', category: '', subcategory: '' },
    expect: { priority: 'P3' },
  },
];

// --- runners ---------------------------------------------------------------

interface CaseResult {
  id: string;
  suite: string;
  expected: string;
  actual: string;
  pass: boolean;
  detail: Record<string, unknown>;
}

function runRegression(): { total: number; passed: number; failures: CaseResult[]; results: CaseResult[] } {
  const results: CaseResult[] = [];
  for (const c of regressionCases) {
    const a = analyzePriorityLocal(c.input);
    const failures: string[] = [];
    const e = c.expect;
    if (e.priority && a.priority !== e.priority) failures.push(`priority ${a.priority} != ${e.priority}`);
    if (e.priorityIn && !e.priorityIn.includes(a.priority)) failures.push(`priority ${a.priority} not in [${e.priorityIn.join(', ')}]`);
    if (e.notP1 && a.priority === 'P1') failures.push('expected NOT P1');
    if (e.safetyOverride !== undefined && a.safetyOverride !== e.safetyOverride) {
      failures.push(`safetyOverride ${a.safetyOverride} != ${e.safetyOverride}`);
    }
    if (e.safetyFired !== undefined && (a.safetyRules.length > 0) !== e.safetyFired) {
      failures.push(`safetyRules [${a.safetyRules.join(',')}] fired=${a.safetyRules.length > 0} != ${e.safetyFired}`);
    }
    if (e.incidentType && a.facts.incidentType !== e.incidentType) {
      failures.push(`incidentType ${a.facts.incidentType} != ${e.incidentType}`);
    }
    if (e.injury && !a.facts.injuries.some(i => `${i.basis}_${i.kind}` === e.injury)) {
      failures.push(`injury ${JSON.stringify(a.facts.injuries.map(i => `${i.basis}_${i.kind}`))} missing ${e.injury}`);
    }
    if (e.normalCivicSla && a.slaClass === 'NORMAL') failures.push('slaClass should NOT be NORMAL (normal civic sla=false)');
    if (e.causeType && a.facts.causeType !== e.causeType) failures.push(`causeType ${a.facts.causeType} != ${e.causeType}`);
    if (e.multiIncident !== undefined && a.facts.multiIncident !== e.multiIncident) {
      failures.push(`multiIncident ${a.facts.multiIncident} != ${e.multiIncident}`);
    }
    if (e.requiresHumanReview !== undefined && a.requiresHumanReview !== e.requiresHumanReview) {
      failures.push(`requiresHumanReview ${a.requiresHumanReview} != ${e.requiresHumanReview}`);
    }
    if (e.allegationsIntoxication !== undefined) {
      const has = a.facts.allegations.some(x => x.kind === 'intoxication' && !x.verified);
      if (has !== e.allegationsIntoxication) failures.push(`allegationsIntoxication ${has} != ${e.allegationsIntoxication}`);
      if (e.allegationsIntoxication && a.facts.allegations.some(x => x.kind === 'intoxication' && x.verified)) {
        failures.push('intoxication must stay unverified (Intoxication Verified = FALSE)');
      }
    }
    results.push({
      id: c.id,
      suite: c.suite,
      expected: e.priority || (e.priorityIn ? e.priorityIn.join('/') : (e.notP1 ? 'not-P1' : 'any')),
      actual: a.priority,
      pass: failures.length === 0,
      detail: {
        failures,
        score: a.score,
        safetyOverride: a.safetyOverride,
        safetyRules: a.safetyRules,
        slaClass: a.slaClass,
        incidentType: a.facts.incidentType,
        injuries: a.facts.injuries.map(i => `${i.basis}_${i.kind}`),
        multiIncident: a.facts.multiIncident,
        departments: a.departments,
        requiresHumanReview: a.requiresHumanReview,
      },
    });
  }
  const failures = results.filter(r => !r.pass);
  return { total: results.length, passed: results.length - failures.length, failures, results };
}

interface UnseenRow {
  id: string;
  input: PriorityInput;
  expectedPriority: PriorityLevel | 'OOD';
  sourceType: 'REAL_PUBLIC_DATA' | 'SYNTHETIC' | 'AUGMENTED';
  /**
   * Soft ceiling for narrative rows (historical / movie-story): the spec only
   * requires "not an active emergency" (§28 cases 4/5), so the row passes when
   * the predicted band is at or below the ceiling (P1 worst → P4 best) or the
   * engine escalates to human review / clarification / OOD instead of asserting
   * a band. Exact-band rows never carry this field.
   */
  maxPriority?: PriorityLevel;
  hardNegativeGroup?: string;
  language?: string;
  tags?: string[];
  archetype?: string;
  explanation?: string;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function runUnseen(): Record<string, unknown> | null {
  const file = path.join(process.cwd(), 'data', 'priority-scenarios', 'eval-unseen.jsonl');
  if (!fs.existsSync(file)) return null;
  const rows: UnseenRow[] = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l) as UnseenRow);

  const labels: PriorityLevel[] = [...BANDS];
  const confusion: Record<string, Record<string, number>> = {};
  for (const t of labels) {
    confusion[t] = {};
    for (const p of labels) confusion[t][p] = 0;
  }
  const perClass = Object.fromEntries(
    labels.map(l => [l, { tp: 0, fp: 0, fn: 0, support: 0 }])
  );
  const latencies: number[] = [];
  let correct = 0;
  let bandTotal = 0;
  const byLanguage: Record<string, { total: number; correct: number }> = {};
  const hardNegatives = { total: 0, correct: 0 };
  const negation = { total: 0, correct: 0 };
  const ood = { total: 0, correctlyEscalated: 0, recognisedAsOod: 0 };
  const SLICE_TAGS = ['typo', 'stt', 'slang', 'very_short', 'active'] as const;
  const tagSlices: Record<string, { total: number; correct: number }> = {};
  for (const t of SLICE_TAGS) tagSlices[t] = { total: 0, correct: 0 };
  const narrative = { total: 0, correct: 0, escalated: 0 };
  const narrativeByTag: Record<string, { total: number; correct: number }> = {};

  for (const row of rows) {
    const t0 = process.hrtime.bigint();
    const a = analyzePriorityLocal(row.input);
    const t1 = process.hrtime.bigint();
    latencies.push(Number(t1 - t0) / 1e6);

    const predicted: PriorityLevel | 'OOD' = a.outOfDistribution ? 'OOD' : a.priority;

    if (row.maxPriority) {
      // Soft narrative rows: measured outside the band matrix so exact-band
      // accuracy stays comparable. Pass = predicted band ≤ ceiling (never P1)
      // OR the engine escalated to a human instead of asserting a band.
      narrative.total += 1;
      const tag = (row.tags || ['narrative'])[0];
      const bucket = (narrativeByTag[tag] ||= { total: 0, correct: 0 });
      bucket.total += 1;
      const escalated = a.requiresHumanReview || a.needsClarification || a.outOfDistribution;
      const ceiling = BANDS.indexOf(row.maxPriority);
      const bandOk = !a.outOfDistribution && BANDS.indexOf(a.priority) >= ceiling;
      if (escalated || bandOk) {
        narrative.correct += 1;
        bucket.correct += 1;
      }
      if (escalated) narrative.escalated += 1;
      continue;
    }

    if (row.expectedPriority === 'OOD') {
      // OOD rows are measured outside the band matrix: the engine must
      // flag them (out of distribution / human review / clarification),
      // not land them on a numbered band.
      ood.total += 1;
      if (a.requiresHumanReview || a.needsClarification || a.outOfDistribution) ood.correctlyEscalated += 1;
      if (predicted === 'OOD') ood.recognisedAsOod += 1;
      continue;
    }

    bandTotal += 1;
    confusion[row.expectedPriority as PriorityLevel][a.priority] += 1;
    if (a.priority === row.expectedPriority) correct += 1;
    perClass[row.expectedPriority as PriorityLevel].support += 1;
    if (a.priority === row.expectedPriority) perClass[row.expectedPriority as PriorityLevel].tp += 1;
    else {
      perClass[row.expectedPriority as PriorityLevel].fn += 1;
      perClass[a.priority].fp += 1;
    }

    const lang = row.language || row.input.language || 'en';
    byLanguage[lang] = byLanguage[lang] || { total: 0, correct: 0 };
    byLanguage[lang].total += 1;
    if (a.priority === row.expectedPriority) byLanguage[lang].correct += 1;

    if (row.hardNegativeGroup) {
      hardNegatives.total += 1;
      if (a.priority === row.expectedPriority) hardNegatives.correct += 1;
    }
    if (row.tags?.includes('negation')) {
      negation.total += 1;
      if (a.priority === row.expectedPriority) negation.correct += 1;
    }
    for (const tag of SLICE_TAGS) {
      if (row.tags?.includes(tag)) {
        tagSlices[tag].total += 1;
        if (a.priority === row.expectedPriority) tagSlices[tag].correct += 1;
      }
    }
  }

  const perPriority: Record<string, Record<string, number | string>> = {};
  for (const l of labels) {
    const c = perClass[l];
    const precision = c.tp + c.fp === 0 ? 0 : c.tp / (c.tp + c.fp);
    const recall = c.tp + c.fn === 0 ? 0 : c.tp / (c.tp + c.fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    perPriority[l] = {
      support: c.support,
      precision: +precision.toFixed(4),
      recall: +recall.toFixed(4),
      f1: +f1.toFixed(4),
      false_negatives: c.fn,
    };
  }

  // P1 false-negative rate: of true P1s, how many were NOT predicted P1.
  const p1 = perClass.P1;
  const p1Fnr = p1.support === 0 ? 0 : p1.fn / p1.support;

  const sorted = [...latencies].sort((a, b) => a - b);
  const macroF1 =
    labels.reduce((s, l) => s + (perPriority[l].f1 as number), 0) / labels.length;

  return {
    file,
    total: rows.length,
    band_total: bandTotal,
    byPriority: Object.fromEntries(labels.map(l => [l, perClass[l].support])),
    accuracy: bandTotal ? +(correct / bandTotal).toFixed(4) : null,
    overall_accuracy: rows.length
      ? +((correct + ood.recognisedAsOod) / rows.length).toFixed(4)
      : null,
    macro_f1: +macroF1.toFixed(4),
    p1_false_negative_rate: +p1Fnr.toFixed(4),
    perPriority,
    confusion,
    byLanguage: Object.fromEntries(
      Object.entries(byLanguage).map(([k, v]) => [k, { ...v, accuracy: +(v.correct / v.total).toFixed(4) }])
    ),
    hardNegative: { ...hardNegatives, accuracy: hardNegatives.total ? +(hardNegatives.correct / hardNegatives.total).toFixed(4) : null },
    negation: { ...negation, accuracy: negation.total ? +(negation.correct / negation.total).toFixed(4) : null },
    narrative: {
      ...narrative,
      accuracy: narrative.total ? +(narrative.correct / narrative.total).toFixed(4) : null,
      byTag: Object.fromEntries(
        Object.entries(narrativeByTag).map(([k, v]) => [k, { ...v, accuracy: +(v.correct / v.total).toFixed(4) }])
      ),
    },
    tagSlices: Object.fromEntries(
      Object.entries(tagSlices).map(([k, v]) => [k, { ...v, accuracy: v.total ? +(v.correct / v.total).toFixed(4) : null }])
    ),
    ood: {
      ...ood,
      escalated_rate: ood.total ? +(ood.correctlyEscalated / ood.total).toFixed(4) : null,
      recognised_rate: ood.total ? +(ood.recognisedAsOod / ood.total).toFixed(4) : null,
    },
    latency_ms: {
      p50: +percentile(sorted, 50).toFixed(2),
      p95: +percentile(sorted, 95).toFixed(2),
      p99: +percentile(sorted, 99).toFixed(2),
      max: +percentile(sorted, 100).toFixed(2),
    },
  };
}

// --- agreement (calibration) ------------------------------------------------

interface AgreementMismatch {
  id: string;
  archetype: string;
  language: string;
  expected: string;
  predicted: string;
  score: number;
  safetyOverride: boolean;
  safetyRules: string[];
  incidentType: string;
  text: string;
}

function runAgreement(split: 'train' | 'eval'): Record<string, unknown> | null {
  const name = split === 'train' ? 'train.jsonl' : 'eval-unseen.jsonl';
  const file = path.join(process.cwd(), 'data', 'priority-scenarios', name);
  if (!fs.existsSync(file)) return null;
  const rows: UnseenRow[] = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l) as UnseenRow);

  let total = 0;
  let agree = 0;
  const byExpected: Record<string, { total: number; agree: number }> = {};
  const byLanguage: Record<string, { total: number; agree: number }> = {};
  const mismatches: AgreementMismatch[] = [];
  const tally: Record<string, number> = {};
  const tallyDetail: Record<string, number> = {};

  for (const row of rows) {
    const a = analyzePriorityLocal(row.input);
    const predicted: PriorityLevel | 'OOD' = a.outOfDistribution ? 'OOD' : a.priority;
    const expected = row.expectedPriority;
    total += 1;
    const ok = predicted === expected;
    if (ok) agree += 1;
    const e = (byExpected[expected] ||= { total: 0, agree: 0 });
    e.total += 1;
    if (ok) e.agree += 1;
    const lang = row.language || row.input.language || 'en';
    const l = (byLanguage[lang] ||= { total: 0, agree: 0 });
    l.total += 1;
    if (ok) l.agree += 1;
    if (!ok) {
      const key = `${row.archetype || '?'}|${lang}|${expected}->${predicted}`;
      tally[key] = (tally[key] || 0) + 1;
      if ((tallyDetail[key] || 0) < 3 && mismatches.length < 300) {
        tallyDetail[key] = (tallyDetail[key] || 0) + 1;
        mismatches.push({
          id: row.id,
          archetype: row.archetype || '?',
          language: lang,
          expected,
          predicted,
          score: a.score,
          safetyOverride: a.safetyOverride,
          safetyRules: a.safetyRules,
          incidentType: a.facts.incidentType,
          text: row.input.text,
        });
      }
    }
  }

  const pct = (n: number, d: number) => (d ? +(n / d).toFixed(4) : null);
  const perExpected = Object.fromEntries(
    Object.entries(byExpected).map(([k, v]) => [k, { total: v.total, agree: v.agree, agreement: pct(v.agree, v.total) }])
  );
  const perLanguage = Object.fromEntries(
    Object.entries(byLanguage).map(([k, v]) => [k, { total: v.total, agree: v.agree, agreement: pct(v.agree, v.total) }])
  );

  console.log(`Agreement (${split}): ${agree}/${total} = ${pct(agree, total)}`);
  for (const [k, v] of Object.entries(perExpected)) {
    console.log(`  ${k}: ${v.agree}/${v.total} = ${v.agreement}`);
  }
  console.log(`  by language: ${JSON.stringify(Object.fromEntries(Object.entries(perLanguage).map(([k, v]) => [k, v.agreement])))}`);
  const tallySorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  console.log(`  mismatch tally (${tallySorted.length} keys):`);
  for (const [k, v] of tallySorted.slice(0, 40)) console.log(`    ${v}\t${k}`);
  const show = mismatches.slice(0, 30);
  for (const m of show) {
    console.log(`  MISMATCH [${m.archetype}/${m.language}] ${m.id}: expected ${m.expected}, got ${m.predicted} (score ${m.score}${m.safetyOverride ? ', OVERRIDE' : ''}, type ${m.incidentType})`);
    console.log(`      "${m.text}"`);
  }
  if (mismatches.length > show.length) console.log(`  ... ${mismatches.length - show.length} more mismatches in report`);

  return {
    split,
    file,
    total,
    agree,
    agreement: pct(agree, total),
    perExpected,
    perLanguage,
    mismatchTally: tally,
    mismatches,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const wantUnseen = args.includes('--unseen');
  const wantAgreement = args.includes('--agreement');
  const splitIdx = args.indexOf('--split');
  const splitArg = splitIdx >= 0 ? args[splitIdx + 1] : 'train';
  const split: 'train' | 'eval' = splitArg === 'eval' ? 'eval' : 'train';

  const reg = runRegression();
  const unseen = wantUnseen ? runUnseen() : null;
  const agreement = wantAgreement ? runAgreement(split) : null;

  console.log(`Regression: ${reg.passed}/${reg.total} passed`);
  for (const f of reg.failures) {
    console.log(`  FAIL [${f.suite}] ${f.id}: expected ${f.expected}, got ${f.actual}`);
    for (const d of (f.detail.failures as string[]) || []) console.log(`        - ${d}`);
  }
  if (wantUnseen) {
    if (unseen) {
      console.log(
        `Unseen: n=${(unseen as { total: number }).total} band_accuracy=${(unseen as { accuracy: number | null }).accuracy} ` +
          `macro_f1=${(unseen as { macro_f1: number }).macro_f1} ` +
          `P1_FNR=${(unseen as { p1_false_negative_rate: number }).p1_false_negative_rate}`
      );
      console.log(`  ood:`, (unseen as { ood: unknown }).ood);
      console.log(`  narrative (historical/fiction soft ceiling):`, (unseen as { narrative: unknown }).narrative);
      console.log(`  tagSlices:`, (unseen as { tagSlices: unknown }).tagSlices);
      console.log(`  latency p50/p95/p99:`, (unseen as { latency_ms: unknown }).latency_ms);
    } else {
      console.log('Unseen: eval-unseen.jsonl not found (run the dataset generator first)');
    }
  } else {
    console.log('Unseen: skipped (pass --unseen for the held-out measurement)');
  }
  if (wantAgreement && !agreement) {
    console.log(`Agreement: dataset not found (run the generator first; expected ${split} split)`);
  }

  const report = {
    generated_at: new Date().toISOString(),
    engine: 'src/lib/priority-engine (local deterministic pipeline)',
    regression: {
      total: reg.total,
      passed: reg.passed,
      failures: reg.failures.map(f => ({ id: f.id, suite: f.suite, expected: f.expected, actual: f.actual, detail: f.detail })),
      results: reg.results,
    },
    unseen,
    agreement,
    ai_layer: {
      note: 'Gemini/OpenRouter runs in /api/priority at runtime; this offline harness measures the deterministic engine. Provider failure modes are covered by scripts/priority/provider-failure cases in the API layer tests.',
      configured_provider: process.env.AI_PRIMARY_PROVIDER || '(unset → local only)',
    },
  };
  const outFile = path.join(process.cwd(), 'data', 'priority_eval_report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Report → ${outFile}`);

  process.exit(reg.failures.length === 0 ? 0 : 1);
}

main();
