// ============================================================
// DETERMINISTIC SAFETY ENGINE
//
// Runs BEFORE and AFTER any AI step and is the only part of the
// pipeline allowed to force P1. It never depends on an LLM: if the AI
// layer is down, misconfigured or disagrees, these rules still hold.
//
// P1 triggers (spec):
//   serious injury + accident · life-threatening electrical hazard ·
//   active fire/explosion · person trapped · unconscious ·
//   severe bleeding · immediate danger to multiple people
// plus the standing civic equivalents: structural collapse, open
// manhole, drowning, gas/chemical hazard.
//
// Negation and resolved-state come from the fact extractor: a report
// that denies the hazard or says everyone is fine cannot fire a rule.
// ============================================================

import { IncidentFacts, SafetyResult, SafetyRuleName } from './types';

interface Rule {
  name: SafetyRuleName;
  test: (f: IncidentFacts) => boolean;
}

const hasInjury = (f: IncidentFacts, ...kinds: IncidentFacts['injuries'][number]['kind'][]) =>
  f.injuries.some(i => kinds.includes(i.kind));

const rules: Rule[] = [
  // 1. Serious injury in a traffic accident — suspected injuries still
  //    count (uncertainty never downgrades safety). Requires a vehicle:
  //    a solo fall is scored, not overridden.
  {
    name: 'accident_serious_injury',
    test: f =>
      !f.resolvedNow &&
      f.accidentInvolved &&
      hasInjury(f, 'fracture', 'unconscious', 'bleeding', 'head_injury', 'crush'),
  },
  // 2. Life-threatening electrical hazard — a wire that is down/live/
  //    exposed/sparking or an actual shock (facts.wireDown, multilingual).
  //    A merely "hanging" wire scores high but does not become a P1.
  {
    name: 'electrical_hazard',
    test: f =>
      !f.resolvedNow &&
      !f.safetyDenied &&
      f.incidentTypes.includes('electrical_hazard') &&
      f.wireDown,
  },
  // 3. Active fire or explosion.
  {
    name: 'fire_explosion',
    test: f => !f.resolvedNow && !f.safetyDenied && f.incidentTypes.includes('fire_explosion'),
  },
  // 4. Person trapped (incl. "may be trapped" — uncertainty escalates).
  {
    name: 'person_trapped',
    test: f => !f.resolvedNow && !f.safetyDenied && f.incidentTypes.includes('trapped_rescue'),
  },
  // 5. Unconscious person.
  {
    name: 'unconscious',
    test: f => !f.resolvedNow && hasInjury(f, 'unconscious'),
  },
  // 6. Severe bleeding — plain bleeding alone does not make a civic
  //    report a P1; severe/uncontrolled bleeding, bleeding at an
  //    accident scene, or blood on the road does.
  {
    name: 'severe_bleeding',
    test: f =>
      !f.resolvedNow &&
      hasInjury(f, 'bleeding') &&
      (f.accidentInvolved ||
        /\b(severe|heavy|excess|profuse|uncontrolled|too\s+much|a\s+lot\s+of)\s+(blood|bleeding)\b/.test(f.normalized) ||
        /\bbleeding\b[^.!?]{0,25}\b(badly|heavily|lot|much)\b/.test(f.normalized) ||
        /\bblood\s+(is\s+)?(on\s+the\s+(road|ground|floor)|everywhere|pool)\b/.test(f.normalized) ||
        /(?:ರಕ್ತ\s+(?:ಭಾರಿ|ತೀವ್ರ)|(?:ಭಾರಿ|ತೀವ್ರ)\s+ರಕ್ತ)|(?:खून\s+(?:बह|काफी|बहुत)|(?:काफी|बहुत|तीव्र)\s+खून)|(?:రక్తం\s+(?:భారి|ತೀವ್ರ|తీవ్ర)|(?:భారి|ತೀವ್ರ|తీవ్ర)\s+రక్తం)/.test(f.normalized)),
  },
  // 7. Immediate danger to multiple people — an active/imminent hazard
  //    plus a crowd-scale exposure.
  {
    name: 'multi_person_danger',
    test: f =>
      !f.resolvedNow &&
      (f.immediateDanger || f.imminentDanger) &&
      (f.peopleAffected !== null
        ? f.peopleAffected >= 5
        : /\b(everyone|everyone\s+here|many\s+people|crowd|hundreds|whole\s+street|entire\s+(road|street|area)|all\s+(of\s+)?us|thousands)\b/.test(
            f.normalized
          )),
  },
  // 8. Structural collapse (current, not historic).
  {
    name: 'structural_collapse',
    test: f => !f.resolvedNow && !f.safetyDenied && f.incidentTypes.includes('structural_collapse'),
  },
  // 9. Open / uncovered manhole — fall hazard (sewage overflow alone is
  //    scored, not overridden).
  {
    name: 'open_manhole',
    test: f => !f.resolvedNow && !f.safetyDenied && f.openManhole,
  },
  // 10. Drowning risk.
  {
    name: 'drowning',
    test: f => !f.resolvedNow && !f.safetyDenied && f.incidentTypes.includes('drowning'),
  },
  // 11. Gas leak / chemical exposure.
  {
    name: 'gas_chemical_hazard',
    test: f => !f.resolvedNow && !f.safetyDenied && f.incidentTypes.includes('gas_chemical_hazard'),
  },
  // 12. Weapon / life-threatening violence in progress — the standing
  //     civic equivalent of the old "assault / threat to life" P1 list.
  {
    name: 'active_violence',
    test: f =>
      !f.resolvedNow &&
      !f.safetyDenied &&
      f.incidentTypes.includes('physical_violence') &&
      (/\b(stabb?ed|stabbing|knife|machete|gun|pistol|acid\s+(attack|throw|on)|threat\s+to\s+life|trying\s+to\s+kill|kill\s+me|set\s+(me|him|her|them)\s+on\s+fire|mob\s+(beating|attack|lynching)|beaten\s+badly|chased\s+me\s+with|murder|homicide|molest\w*|rape)\b/.test(
        f.normalized
      ) ||
        /ಹತ್ಯೆ|ಕತ್ತಿ|ಜೀವ\s+ಬೆದರಿಕೆ/.test(f.normalized) ||
        /चाकू|जान\s+से\s+मार|हत्या|धमकी\s+जान/.test(f.normalized) ||
        /హత్య|కత్తి|ప్రాణాలకు\s+ముప్పు/.test(f.normalized)),
  },
];

/**
 * Runs every rule. Deterministic, same input → same output, no I/O.
 * Returns which rules fired; `override` forces the final priority to P1.
 */
export function runSafetyEngine(facts: IncidentFacts): SafetyResult {
  const fired = rules.filter(r => r.test(facts)).map(r => r.name);
  return { override: fired.length > 0, rules: fired };
}

/** Human-readable explanation of each fired rule (admin-facing). */
export const SAFETY_RULE_LABELS: Record<SafetyRuleName, string> = {
  accident_serious_injury: 'Serious injury reported in a traffic accident',
  electrical_hazard: 'Life-threatening electrical hazard (live/exposed/fallen wire or shock)',
  fire_explosion: 'Active fire or explosion',
  person_trapped: 'Person trapped / rescue needed',
  unconscious: 'Unconscious person reported',
  severe_bleeding: 'Severe bleeding reported',
  multi_person_danger: 'Immediate danger to multiple people',
  structural_collapse: 'Structural collapse',
  open_manhole: 'Open/uncovered manhole (fall hazard)',
  drowning: 'Drowning risk',
  gas_chemical_hazard: 'Gas leak or chemical exposure',
  active_violence: 'Weapon / life-threatening violence in progress',
};
