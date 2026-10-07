// ============================================================
// SCORING — eight configurable dimensions, weights sum to 100.
//
//   life safety 0-30 · injury 0-25 · immediate danger 0-20 ·
//   public exposure 0-10 · population 0-10 · emergency access 0-10 ·
//   infra criticality 0-10 · persistence 0-5
//
// The score decides the band ONLY when the safety engine does not
// override: P1 >= 80, P2 >= 60, P3 >= 35, else P4. Weights are
// constants here so the eval harness can tune them by measurement —
// nothing in the pipeline hard-codes a category→priority mapping.
// ============================================================

import { PriorityLevel } from '../../types';
import { IncidentFacts, ScoreBreakdown, ScoreWeights } from './types';

export const SCORE_WEIGHTS: ScoreWeights = {
  lifeSafety: 30,
  injury: 25,
  immediateDanger: 20,
  publicExposure: 10,
  population: 10,
  emergencyAccess: 10,
  infraCriticality: 10,
  persistence: 5,
};

export const PRIORITY_BANDS: { min: number; level: PriorityLevel }[] = [
  { min: 80, level: 'P1' },
  { min: 60, level: 'P2' },
  { min: 35, level: 'P3' },
  { min: 0, level: 'P4' },
];

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, n));
}

// Families whose problems sit on public infrastructure/right-of-way: they
// always carry public exposure even when the citizen never says "road".
const CIVIC_PUBLIC_FAMILIES = [
  'streetlight_outage', 'road_hazard', 'waterlogging', 'sewage_contamination',
  'garbage_dumping', 'power_outage', 'water_supply', 'noise', 'vehicle_collision',
  'animal_attack',
];

function lifeSafetyScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.lifeSafety;
  if (f.resolvedNow) return clamp(Math.round(w * 0.1), w);
  if (f.incidentTypes.some(t => ['fire_explosion', 'structural_collapse', 'trapped_rescue', 'drowning'].includes(t))) {
    return w;
  }
  if (f.incidentTypes.includes('electrical_hazard')) return clamp(Math.round(w * 0.8), w);
  if (
    f.immediateDanger &&
    !f.accidentInvolved &&
    f.injuries.length === 0 &&
    !f.openManhole &&
    !f.incidentTypes.includes('gas_chemical_hazard') &&
    (f.incidentTypes.includes('waterlogging') || f.incidentTypes.includes('sewage_contamination'))
  ) {
    return clamp(Math.round(w * 0.35), w);
  }
  if (f.immediateDanger) return clamp(Math.round(w * 0.75), w);
  if (f.accidentInvolved && f.injuries.length > 0) return clamp(Math.round(w * 0.75), w);
  if (f.incidentTypes.includes('physical_violence')) return clamp(Math.round(w * 0.7), w);
  if (f.incidentTypes.includes('harassment_stalking')) return clamp(Math.round(w * 0.5), w);
  if (f.incidentTypes.includes('animal_attack') || f.incidentTypes.includes('trapped_rescue')) {
    return clamp(Math.round(w * 0.6), w);
  }
  if (f.accidentInvolved) return clamp(Math.round(w * 0.45), w);
  if (f.incidentTypes.includes('waterlogging') || f.incidentTypes.includes('road_hazard') || f.incidentTypes.includes('sewage_contamination')) {
    return clamp(Math.round(w * 0.35), w);
  }
  if (f.incidentType !== 'unknown' && f.incidentType !== 'other_civic' &&
      f.incidentTypes.some(t => CIVIC_PUBLIC_FAMILIES.includes(t))) {
    return clamp(Math.round(w * 0.33), w);
  }
  if (f.incidentType !== 'unknown' && f.incidentType !== 'other_civic') {
    return clamp(Math.round(w * 0.2), w);
  }
  return clamp(Math.round(w * 0.13), w);
}

function injuryScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.injury;
  if (f.resolvedNow || f.injuries.length === 0) return 0;
  const rank: Record<string, number> = {
    unconscious: 1,
    bleeding: 0.9,
    fracture: 0.85,
    head_injury: 0.9,
    crush: 0.95,
    burn: 0.7,
    general: 0.5,
  };
  const top = f.injuries.reduce((m, i) => Math.max(m, rank[i.kind] ?? 0.5), 0);
  return clamp(Math.round(w * top), w);
}

function immediateDangerScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.immediateDanger;
  if (f.resolvedNow) return 0;
  if (f.immediateDanger) return w;
  if (f.imminentDanger) return clamp(Math.round(w * 0.7), w);
  if (f.incidentTypes.includes('physical_violence') || f.incidentTypes.includes('harassment_stalking')) {
    return clamp(Math.round(w * 0.5), w);
  }
  if (
    f.incidentTypes.includes('waterlogging') ||
    f.incidentTypes.includes('road_hazard') ||
    f.incidentTypes.includes('streetlight_outage') ||
    f.incidentTypes.includes('sewage_contamination') ||
    f.incidentTypes.includes('garbage_dumping')
  ) {
    return clamp(Math.round(w * 0.35), w);
  }
  if (f.injuries.length > 0) return clamp(Math.round(w * 0.4), w);
  return clamp(Math.round(w * 0.1), w);
}

function publicExposureScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.publicExposure;
  if (f.publicExposure) return w;
  if (f.incidentTypes.some(t => CIVIC_PUBLIC_FAMILIES.includes(t))) return w;
  return Math.round(w * 0.5);
}

function populationScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.population;
  if (f.peopleAffected !== null && f.peopleAffected >= 20) return w;
  if (f.peopleAffected !== null && f.peopleAffected >= 5) return clamp(Math.round(w * 0.7), w);
  if (f.peopleAffected !== null) return clamp(Math.round(w * 0.5), w);
  if (/\b(everyone|many\s+people|crowd|hundreds|thousands|whole\s+street|entire|all\s+(of\s+)?us|numerous|neighborhood|neighbourhood|colony|entire\s+(road|street|area|village))\b/.test(f.normalized)) {
    return w;
  }
  if (/\b(families|several|many|multiple\s+houses|nearby|houses|shops|vehicles)\b/.test(f.normalized)) {
    return clamp(Math.round(w * 0.6), w);
  }
  return clamp(Math.round(w * 0.4), w);
}

function emergencyAccessScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.emergencyAccess;
  return f.emergencyAccessBlocked ? w : 0;
}

function infraCriticalityScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.infraCriticality;
  if (f.infraCritical) return w;
  if (f.incidentTypes.includes('road_hazard') || f.incidentTypes.includes('waterlogging') || f.incidentTypes.includes('power_outage')) {
    return clamp(Math.round(w * 0.6), w);
  }
  if (f.incidentTypes.includes('streetlight_outage') || f.incidentTypes.includes('garbage_dumping') || f.incidentTypes.includes('water_supply')) {
    return clamp(Math.round(w * 0.4), w);
  }
  return clamp(Math.round(w * 0.2), w);
}

function persistenceScore(f: IncidentFacts): number {
  const w = SCORE_WEIGHTS.persistence;
  if (f.persistenceDays !== null && f.persistenceDays >= 14) return w;
  if (f.persistenceDays !== null && f.persistenceDays >= 7) return clamp(Math.round(w * 0.8), w);
  if (f.persistenceDays !== null && f.persistenceDays >= 3) return clamp(Math.round(w * 0.6), w);
  if (f.recurring) return clamp(Math.round(w * 0.7), w);
  return 0;
}

/** Runs all eight dimensions and returns the raw total (0–100). */
export function scoreFacts(f: IncidentFacts): ScoreBreakdown {
  const lifeSafety = lifeSafetyScore(f);
  const injury = injuryScore(f);
  const immediateDanger = immediateDangerScore(f);
  const publicExposure = publicExposureScore(f);
  const population = populationScore(f);
  const emergencyAccess = emergencyAccessScore(f);
  const infraCriticality = infraCriticalityScore(f);
  const persistence = persistenceScore(f);
  const total = clamp(
    lifeSafety + injury + immediateDanger + publicExposure + population + emergencyAccess + infraCriticality + persistence,
    100
  );
  return {
    lifeSafety,
    injury,
    immediateDanger,
    publicExposure,
    population,
    emergencyAccess,
    infraCriticality,
    persistence,
    total,
    weights: SCORE_WEIGHTS,
  };
}

/** Score → band. The safety override (applied later) can still force P1. */
export function bandForScore(score: number): PriorityLevel {
  for (const band of PRIORITY_BANDS) {
    if (score >= band.min) return band.level;
  }
  return 'P4';
}
