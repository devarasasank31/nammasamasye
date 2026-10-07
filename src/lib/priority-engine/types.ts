// ============================================================
// PRIORITY INTELLIGENCE ENGINE — shared types
//
// A report's final priority is ONE result produced by a fixed pipeline:
//
//   normalize → language detect → fact extraction → safety engine
//   → deterministic score → priority band → SLA class → departments
//
// The AI layer (Gemini primary, OpenRouter secondary) may VALIDATE the
// local result when configured, but can never override the deterministic
// safety engine: a confirmed life-safety condition stays P1.
// ============================================================

import { PriorityLevel } from '../../types';

/** SLA class assigned AFTER the priority band. Configurable in sla.ts. */
export type SlaClass = 'EMERGENCY' | 'RAPID' | 'NORMAL' | 'ROUTINE';

/** Incident families the fact extractor recognises. */
export type IncidentType =
  | 'vehicle_collision'
  | 'electrical_hazard'
  | 'fire_explosion'
  | 'structural_collapse'
  | 'trapped_rescue'
  | 'drowning'
  | 'physical_violence'
  | 'animal_attack'
  | 'sewage_contamination'
  | 'gas_chemical_hazard'
  | 'waterlogging'
  | 'road_hazard'
  | 'streetlight_outage'
  | 'garbage_dumping'
  | 'water_supply'
  | 'power_outage'
  | 'noise'
  | 'corruption'
  | 'cybercrime'
  | 'harassment_stalking'
  | 'housing'
  | 'govt_service'
  | 'transport_service'
  | 'other_civic'
  | 'unknown';

/**
 * Injuries extracted from the citizen's own words. Free-text injuries are
 * ALWAYS `suspected` — an unverified account is never presented as a
 * verified medical fact (allegations rule). Uncertainty never downgrades
 * safety handling: a suspected fracture still triggers the override.
 */
export interface InjuryFact {
  kind: 'fracture' | 'bleeding' | 'unconscious' | 'head_injury' | 'burn' | 'crush' | 'general';
  basis: 'suspected';
}

export interface IncidentFacts {
  /** Lower-cased, punctuation-collapsed text the extractor worked on. */
  normalized: string;
  language: 'en' | 'kn' | 'hi' | 'te' | 'mixed' | 'und';
  incidentType: IncidentType;
  /** All recognised incident families (multi-incident reports carry >1). */
  incidentTypes: IncidentType[];
  multiIncident: boolean;
  /** When one incident causes another, the cause family (drives routing). */
  causeType: IncidentType | null;
  injuries: InjuryFact[];
  /** A vehicle was involved (hit/crash/collision), not a solo fall. */
  accidentInvolved: boolean;
  /** Open / missing manhole cover specifically (fall hazard). */
  openManhole: boolean;
  /** Live/down/sparked wire or actual shock — life-threatening electrical. */
  wireDown: boolean;
  /** True when a safety condition is explicitly denied ("there is no live wire"). */
  safetyDenied: boolean;
  /** True when the report says the situation is already over / nobody hurt. */
  resolvedNow: boolean;
  /** Unverified third-party allegations, e.g. suspected intoxication. */
  allegations: { kind: 'intoxication' | 'other'; verified: boolean }[];
  peopleAffected: number | null;
  immediateDanger: boolean;
  imminentDanger: boolean;
  emergencyAccessBlocked: boolean;
  vulnerableInvolved: boolean;
  infraCritical: boolean;
  publicExposure: boolean;
  persistenceDays: number | null;
  recurring: boolean;
  /** Nothing recognisable — the report is out of distribution for the engine. */
  outOfDistribution: boolean;
}

export type SafetyRuleName =
  | 'accident_serious_injury'
  | 'electrical_hazard'
  | 'fire_explosion'
  | 'person_trapped'
  | 'unconscious'
  | 'severe_bleeding'
  | 'multi_person_danger'
  | 'structural_collapse'
  | 'open_manhole'
  | 'drowning'
  | 'gas_chemical_hazard'
  | 'active_violence';

export interface SafetyResult {
  /** Deterministic, non-LLM: when true the final priority is P1, always. */
  override: boolean;
  rules: SafetyRuleName[];
}

/** The eight configurable scoring dimensions (weights sum to 100). */
export interface ScoreWeights {
  lifeSafety: number;
  injury: number;
  immediateDanger: number;
  publicExposure: number;
  population: number;
  emergencyAccess: number;
  infraCriticality: number;
  persistence: number;
}

export interface ScoreBreakdown {
  lifeSafety: number;
  injury: number;
  immediateDanger: number;
  publicExposure: number;
  population: number;
  emergencyAccess: number;
  infraCriticality: number;
  persistence: number;
  total: number;
  weights: ScoreWeights;
}

/** Separate confidences — never one blended number. */
export interface PriorityConfidences {
  /** Category/scenario classification confidence handed in by the caller. */
  classification: number;
  severity: number;
  priority: number;
  retrieval: number;
  /** null when the AI layer did not run (no key / disabled). */
  ai: number | null;
}

export interface RetrievalMatch {
  id: string;
  expectedPriority: PriorityLevel;
  score: number;
  category: string;
  explanation?: string;
}

export interface RetrievalInfo {
  matched: boolean;
  id: string | null;
  priority: PriorityLevel | null;
  score: number;
  /** Share of top matches agreeing on one band (0–1). */
  agreement: number;
  top: RetrievalMatch[];
}

export type PriorityProvider = 'local' | 'gemini' | 'openrouter';

export interface AiInfo {
  provider: PriorityProvider;
  model: string;
  priority: PriorityLevel | null;
  agreed: boolean;
}

export interface PriorityAnalysis {
  priority: PriorityLevel;
  /** Band before the community bump (safety override already applied). */
  basePriority: PriorityLevel;
  score: number;
  safetyOverride: boolean;
  safetyRules: SafetyRuleName[];
  slaClass: SlaClass;
  slaDays: number;
  departments: string[];
  reasons: string[];
  requiresHumanReview: boolean;
  needsClarification: boolean;
  outOfDistribution: boolean;
  facts: IncidentFacts;
  breakdown: ScoreBreakdown;
  confidences: PriorityConfidences;
  /** Enrichment attached by the API layer when available. */
  retrieval?: RetrievalInfo | null;
  ai?: AiInfo | null;
  provider: PriorityProvider;
  model?: string;
  latencyMs?: number;
}

export interface PriorityInput {
  text: string;
  /** Category parent (TRAFFIC/CIVIC/…) or a raw scenario/category id. */
  category: string;
  subcategory: string;
  answers?: Record<string, string>;
  language?: string;
  /** 0–100 classification confidence when known. */
  classificationConfidence?: number;
}
