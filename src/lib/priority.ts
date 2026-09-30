// ============================================================
// PRIORITY ENGINE
//
// Grounded in real-world triage practice rather than treating every
// report as urgent:
//
//  * CPGRAMS (Government of India): "urgent/priority" grievances are
//    targeted for resolution within 3 days; ordinary grievances have
//    21 days and appeals 30 days.
//  * NYC DOB complaint priority A/B/C/D: priority A is reserved for
//    immediate life-safety conditions (open shafts, blocked egress,
//    gas leaks, structural instability) — everything else is B/C/D.
//  * BBMP "Fix My Street" / Sahaaya 2.0: routine road and civic work
//    is quoted at 2–4 weeks, so a normal pothole is NOT a P1.
//
// Result: four levels, and community pressure (repeat reports /
// citizen support) can raise a report by AT MOST one level and can
// never create a P1 out of a routine issue.
// ============================================================

import { CategoryParent, PriorityLevel } from '@/types';

export const SLA_DAYS: Record<PriorityLevel, number> = { P1: 3, P2: 7, P3: 21, P4: 30 };

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
}

const BASE_LEVEL: Record<CategoryParent, PriorityLevel> = {
  TRAFFIC: 'P3',
  CIVIC: 'P3',
  PUBLIC_SAFETY: 'P2',
  GOVERNMENT: 'P3',
  HOUSING: 'P3',
  ENVIRONMENT: 'P3',
  UTILITIES: 'P3',
  TRANSPORT: 'P3',
  DIGITAL: 'P4',
  ACCESS_INTEGRATION: 'P3',
  CORRUPTION: 'P3',
  OTHER: 'P4',
};

const BASE_SCORE: Record<PriorityLevel, number> = { P1: 90, P2: 70, P3: 45, P4: 25 };

// --- Risk language -------------------------------------------------------
// Phrases, not single words: "manhole" alone is a normal sanitation report,
// an *open* manhole is a P1 fall hazard.

const CRITICAL_PHRASES: string[] = [
  // English — life safety (NYC DOB priority A style)
  'open manhole', 'manhole cover missing', 'missing manhole', 'uncovered manhole',
  'live wire', 'exposed wire', 'open wire', 'electric shock', 'electrical shock',
  'electrocution', 'electrocuted', 'current leaking', 'leaking current',
  'wall collapse', 'wall collapsed', 'building collapse', 'collapsed', 'cave in',
  'caved in', 'road caved', 'sinking road', 'tree fell', 'tree fallen',
  'fire', 'gas leak', 'cylinder blast', 'explosion',
  'hit and run', 'run over', 'crash',
  'injured', 'injury', 'seriously injured', 'bleeding', 'fracture',
  'died', 'death', 'dead body', 'suicide',
  'trapped', 'child trapped', 'missing child', 'kidnapping', 'kidnap', 'abduction',
  'chain snatching', 'snatching', 'robbery', 'dacoity', 'murder', 'homicide',
  'assault', 'molest', 'molestation', 'threat to life', 'attack on',
  'danger to life', 'risk to life', 'immediate danger', 'about to fall',
  // Kannada
  'ವಿದ್ಯುತ್ ಆಘಾತ', 'ಶಾಕ್ ಆಗಿದೆ', 'ಕುಸಿದ', 'ಕುಸಿತ', 'ಬೆಂಕಿ ಹತ್ತಿದೆ',
  'ಅಪಘಾತ', 'ಮೃತ', 'ಸಾವು', 'ರಕ್ತ', 'ಕಿಡ್ನಾಪ್', 'ಕೊಲೆ', 'ಜೀವ ಬೆದರಿಕೆ',
  'ಮ್ಯಾನ್‌ಹೋಲ್ ತೆರೆದ', 'ಬಿದ್ದಿದೆ', 'ಬಿದ್ದಿವೆ',
  // Hindi
  'बिजली का झटका', 'करंट', 'करेंट', 'दीवार गिर', 'भवन गिर', 'धंस', 'आग लग',
  'अग्निकांड', 'एक्सीडेंट', 'दुर्घटना', 'घायल', 'मृत्यु', 'मर गया', 'मौत',
  'अपहरण', 'चेन स्नैचिंग', 'लूट', 'हत्या', 'मारपीट', 'धमकी', 'गिर गया',
  // Telugu
  'విద్యుత్ షాక్', 'కుప్పకూలింది', 'కూలిపోయింది', 'మంటలు', 'ప్రమాదం',
  'గాయపడ్డారు', 'మరణం', 'దొంగతనం', 'దాడి', 'కిడ్నాప్',
];

const ELEVATED_PHRASES: string[] = [
  // English — public risk, not yet life-critical
  'waterlogging', 'water logged', 'flooding', 'flood', 'drain overflow',
  'sewage overflow', 'overflowing drain', 'stagnant water', 'open drain',
  'streetlight not working', 'no street light', 'street light not working',
  'lights not working', 'dark stretch', 'unlit road', 'poorly lit',
  'dangerous', 'unsafe', 'hazard', 'leaning wall', 'hanging wire',
  'blind curve', 'school zone', 'near school', 'hospital road',
  'elderly', 'wheelchair', 'patients', 'contaminated water', 'drinking water',
  'disease', 'dengue', 'dead animal', 'dog bite', 'stray dog attack',
  'garbage burning', 'smoke', 'no ramp', 'blocked footpath', 'encroachment on footpath',
  'deep pothole', 'accident spot', 'sinkhole',
  // Kannada
  'ನೀರು ನಿಂತಿದೆ', 'ನೀರು ಸೋರುತ್ತಿದೆ', 'ಚರಂಡಿ ತುಂಬಿ', 'ಬೀದಿ ದೀಪ ಇಲ್ಲ',
  'ದೀಪ ಉರಿಯುತ್ತಿಲ್ಲ', 'ಭಯಾನಕ', 'ಅಪಾಯ', 'ಶಾಲೆ', 'ಆಸ್ಪತ್ರೆ', 'ನಾಯಿ ಕಡಿತ',
  // Hindi
  'जलभराव', 'पानी भरा', 'गंदा पानी', 'नाली', 'स्ट्रीट लाइट नहीं', 'अंधेरा',
  'खतरनाक', 'स्कूल', 'अस्पताल', 'कुत्ते ने काटा', 'गड्ढा',
  // Telugu
  'నీరు నిలిచింది', 'మురుగు', 'స్ట్రీట్ లైట్', 'పాఠశాల', 'ఆసుపత్రి',
  'ప్రమాదకరం', 'చేప కుట్టినట్టు',
];

const LOW_PHRASES: string[] = [
  'suggestion', 'request for information', 'thank you', 'appreciation',
  'cosmetic', 'painting', 'naming', 'renaming', 'language setting',
  'ಭಾಷಾ', 'सुझाव', 'जानकारी चाहिए', 'సూచన', 'సమాచారం',
];

function findPhrases(haystack: string, phrases: string[]): string[] {
  const hits: string[] = [];
  for (const p of phrases) {
    if (haystack.includes(p)) {
      hits.push(p);
      if (hits.length >= 6) break;
    }
  }
  return hits;
}

export function computePriority(input: {
  category: CategoryParent;
  subcategory: string;
  text: string;
  answers?: Record<string, string>;
  supportCount?: number;
  clusterSize?: number;
}): PriorityResult {
  const answers = input.answers || {};
  const haystack = [input.text, input.subcategory, ...Object.values(answers)]
    .join(' . ')
    .toLowerCase();

  const factors: PriorityFactor[] = [];
  let level: PriorityLevel = BASE_LEVEL[input.category] || 'P3';
  let score = BASE_SCORE[level];

  factors.push({ label: `Category baseline (${input.category})`, delta: 0 });

  const critical = findPhrases(haystack, CRITICAL_PHRASES);
  if (critical.length > 0) {
    level = 'P1';
    score = Math.max(score, 90);
    factors.push({ label: `Life-safety indicators: ${critical.slice(0, 3).join(', ')}`, delta: 45 });
  } else {
    const elevated = findPhrases(haystack, ELEVATED_PHRASES);
    if (elevated.length > 0 && level !== 'P2') {
      level = 'P2';
      factors.push({ label: `Public-risk indicators: ${elevated.slice(0, 3).join(', ')}`, delta: 25 });
    } else if (elevated.length > 0) {
      factors.push({ label: `Public-risk indicators: ${elevated.slice(0, 3).join(', ')}`, delta: 5 });
    }
    const low = findPhrases(haystack, LOW_PHRASES);
    if (low.length > 0 && level === 'P3') {
      level = 'P4';
      factors.push({ label: `Informational / non-urgent wording`, delta: -15 });
    }
  }

  const baseLevel = level;
  const baseScore = BASE_SCORE[baseLevel];

  // --- Community pressure: at most ONE level, never manufacturing a P1 ---
  const support = input.supportCount || 0;
  const cluster = input.clusterSize || 0;
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

  score = Math.max(0, Math.min(100, baseScore + (bumped ? 8 : cluster >= 3 || support >= 1 ? 3 : 0)));

  return {
    level,
    baseLevel,
    score,
    slaDays: SLA_DAYS[level],
    reason: reasonFor(level, critical, baseLevel, bumped),
    factors,
    bumped,
  };
}

function nextLevel(l: PriorityLevel): PriorityLevel {
  return l === 'P4' ? 'P3' : l === 'P3' ? 'P2' : 'P2';
}

function reasonFor(level: PriorityLevel, critical: string[], base: PriorityLevel, bumped: boolean): string {
  if (critical.length > 0) {
    return `Life-safety condition ("${critical[0]}") — same class as an immediate-danger civic complaint; target ${SLA_DAYS.P1} days.`;
  }
  if (level === 'P2') {
    return bumped
      ? `Elevated by repeated community reports — resolve within ${SLA_DAYS.P2} days.`
      : `Affects public safety or vulnerable users; target ${SLA_DAYS.P2} days.`;
  }
  if (level === 'P3') {
    return `Routine civic issue — comparable to BBMP road/garbage work quoted at 2-4 weeks; target ${SLA_DAYS.P3} days.`;
  }
  return `Informational or low-impact report; target ${SLA_DAYS.P4} days (base ${base}).`;
}

export function severityFor(level: PriorityLevel): 'critical' | 'high' | 'medium' | 'low' {
  return level === 'P1' ? 'critical' : level === 'P2' ? 'high' : level === 'P3' ? 'medium' : 'low';
}

export function isOverdue(priority: PriorityLevel, createdAt: string, resolvedAt?: string): boolean {
  const start = new Date(createdAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  return end - start > SLA_DAYS[priority] * 24 * 60 * 60 * 1000;
}
