export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface CivicScenario {
  id: string;
  text: string;
  category: string;
  subcategory: string;
  severity: Severity;
  intent: string;
  hard_negative_for: string[];
  confusable_categories: string[];
  reason: string;
}

export interface CategoryCandidate {
  category: string;
  subcategory: string;
  score: number; // 0..1 aggregated evidence
  scenario_id: string; // app scenario id (= category)
  reason: string;
  severity: Severity;
}

export interface LocalClassifyResult {
  category: string | null;
  subcategory: string | null;
  scenario_id: string | null;
  confidence: number; // calibrated 0..99
  severity: Severity;
  reason: string;
  secondary_issue: string | null;
  needs_clarification: boolean;
  clarification_family: string | null;
  top: CategoryCandidate[];
  margin: number;
  negations_applied: string[];
  hazards: string[];
  latency_ms: number;
}
