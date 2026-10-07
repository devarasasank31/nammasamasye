export * from './types';
export { extractFacts, normalizeText, detectLanguage } from './facts';
export { runSafetyEngine, SAFETY_RULE_LABELS } from './safety';
export { scoreFacts, bandForScore, SCORE_WEIGHTS, PRIORITY_BANDS } from './scoring';
export { slaClassFor, slaDaysFor, SLA_CLASS_FOR } from './sla';
export { departmentsFor } from './departments';
export { analyzePriorityLocal } from './analyze';
