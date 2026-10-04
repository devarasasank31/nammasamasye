# Namma Samasye AI — Dataset Plan

How the 5,000+ scenario knowledge base is sourced, generated, validated and
evaluated. Canonical artifacts live in `data/` and are produced by the
pipeline in `scripts/`.

## 1. Scope (explicit constraint)

Only scenarios for Namma Samasye’s own complaint domains — the 27 scenario
ids in `src/data/scenarios.ts` (roads/potholes, footpaths, drainage,
streetlights, water supply, garbage, parks, stray animals, noise, power,
traffic behaviour, accidents, parking, BMTC/metro, harassment, bribery,
unofficial payments, cybercrime, tenancy, government services, language
barriers). No generic municipal taxonomy beyond these. The assistant may
*converse* about anything, but the classifier only ever labels in-scope
categories or asks for clarification.

## 2. Phase 1 — Research (public sources)

Verified sources (fetch/search) are recorded in `data/sources.json` with
url, license, content and usage. Highlights:

| Source | What we take | License |
|---|---|---|
| BBMP Sahaaya 2.0 (sahaaya2.bbmp.gov.in) | Bengaluru complaint category/subcategory taxonomy (34 depts) | Government portal — taxonomy reference only |
| CPGRAMS (pgportal.gov.in) + DARPG CPGRAMS 7.0 doc | Central grievance category structure (1,239 major / 18,762 sub) for normalization | GoI — taxonomy reference |
| data.gov.in | Open Government Data (GODL-India); CPGRAMS statistics | GODL-India |
| Janaagraha iCMyC (OpenCity) | Bengaluru complaint text + category patterns | CC BY-SA 2.0 — attribution kept |
| BBMP grievances (OpenCity) | Ward-level complaint structure | Public Domain (stated) |
| Seva Sindhu | Karnataka service/complaint catalog | GoK — taxonomy reference |
| SF 311 / NYC 311 / Chicago 311 | Cross-jurisdiction request-type hierarchies so the taxonomy is not overfitted to one city | Open data terms — reference only |

Rules honoured: no private databases, no PII (names/phones/emails/addresses),
no login walls, no CAPTCHA bypass. Where a portal is login/GIS-gated its
*category labels* are used as reference only, never its records.

## 3. Phase 2 — Canonical taxonomy

`data/categories.json` — one entry per app category:

```json
{
  "category_id": "util_power",
  "parent_category": "UTILITIES",
  "category_name": "Power Outage",
  "description": "…",
  "subcategories": ["power_outage","voltage_fluctuation","fallen_wire","…"],
  "synonyms": ["bijli gayi", "current cut", "power cut", "…"],
  "positive_examples": ["…"], "negative_examples": ["…"],
  "confusing_categories": ["civic_streetlight","traffic_pothole"],
  "severity_guidance": "fallen live wire → critical; area outage → medium",
  "department": "BESCOM"
}
```

Subcategories are the granularity at which the classifier distinguishes
(e.g. `fallen_wire` vs `power_outage`); parent domains group for reporting.
Kept small enough to be reliably separable from text alone.

## 4. Phase 3–6 — Scenario generation (`scripts/build-dataset.mjs`)

Authored template banks per domain (`scripts/dataset/banks/*.mjs`):

- `positives` — hand-written complaint texts per subcategory across registers:
  formal English, simple English, Indian English, conversational, short,
  long, cause/effect, symptom, temporal, emergency, uncertain, multi-sentence.
- `hard_negatives` — texts containing misleading keywords of ANOTHER
  category (e.g. “There is no power outage, but a fallen wire is sparking”)
  labelled with the TRUE category and `hard_negative_for: ["util_power"]`.
- `confusion_tests` — pairs where one small detail flips the answer
  (power outage vs electrical hazard, drainage blockage vs sewage burst,
  water leakage vs supply disruption, road flooding vs drain overflow,
  streetlight vs power outage, garbage collection vs illegal dumping,
  road damage vs excavation, fallen tree vs trimming, construction noise
  vs noise pollution, illegal construction vs encroachment).

The engine then applies controlled variation per authored base — slot fills
(roads/areas/landmarks/times), spelling mistakes, informal shorthand,
urgency framing, punctuation noise, Hinglish/Kanglish/Tanglish
transliteration, native-script word splicing (Kannada/Hindi/Telugu) —
deterministically (seeded RNG), then de-duplicates.

Safety-critical scenarios are explicitly materialized (live wires, shock,
fire, collapse, open manhole, chemical smell, injuries) with
`severity ∈ {low, medium, high, critical}`; severity is inferred from text
signals only — no invented danger, no medical diagnoses.

Allegations are labelled as claims, never facts (“the mayor is stealing
money, so the road is broken” → `road_damage`, reason notes unverified claim).

## 5. Phase 7 — Quality gates (in the pipeline)

1. Exact de-duplication on normalized text.
2. Near-duplicate removal (SimHash, hamming ≤ 3, same category).
3. Contradictory-label detection (same normalized text, different category →
   pipeline error).
4. Nonsense filter (min token count, must contain at least one lexicon term
   of its own category — authored text is trusted, transforms re-checked).
5. Category balance report; per-category minimum enforced.
6. Counts are asserted, not claimed: the pipeline fails loudly if the valid
   unique total is below 5,000.

`data/dataset_report.json` records: total scenarios, unique, categories,
per-category counts, hard negatives, confusion pairs, safety scenarios,
ambiguous scenarios, rejected/near-dup counts.

## 6. Phase 8 — Data format

`data/scenarios.jsonl` (one JSON object per line):

```json
{"id":"scenario_000421","text":"A live wire is sparking near the school gate",
 "category":"util_power","subcategory":"fallen_wire","severity":"critical",
 "intent":"report_hazard","hard_negative_for":[],
 "confusable_categories":["civic_streetlight"],
 "reason":"Fallen sparking wire is an electrical hazard, not a power outage."}
```

Plus `data/categories.json`, `data/confusion_matrix.json`,
`data/dataset_report.json`, `data/sources.json`.

## 7. Phase 9–10 — Retrieval, not training

The dataset is a **retrieval knowledge base** for the hybrid classifier in
`src/lib/civic-classifier.ts` (see `docs/AI_ARCHITECTURE.md` §3.1): exact
match layer + IDF-weighted retrieval + negation/contradiction + hard-negative
veto + safety escalation + calibrated confidence. No fine-tuning.

## 8. Phase 11–12 — External AI fallback

Only on low local confidence / close top-2 / novel input; candidate-scoped
prompt; strict JSON; validated against the taxonomy and local evidence
before use (reject → local or clarification).

## 9. Phase 13–17 — Reasoning engines

Negation/contradiction, primary/secondary issue, allegations-as-claims,
calibrated confidence bands, single-question clarification — implemented in
the classifier and covered by dedicated eval pools (below).

## 10. Phase 19 — Evaluation (`scripts/evaluate.ts`)

Holdout discipline: test texts come from a **disjoint test-template pool**
(never used for retrieval), plus programmatic transformations with different
seeds. Pools:

- basic (per category), paraphrase, hard-negative, contradiction,
  multi-issue, ambiguous (expect `needs_clarification`), safety,
  spelling/informal, novel/OOD, adversarial.

Metrics computed: accuracy (top-1), top-3, macro precision/recall/F1,
confusion matrix (top pairs), average confidence, false high-confidence
rate (conf ≥ 85 and wrong), safety-critical recall, ambiguity-detection
accuracy, average latency. Results written into `data/dataset_report.json`.

## 11. Phase 20 — Failure analysis loop

The harness prints worst categories, most common confusion pairs and
high-confidence wrong predictions. Targeted hard negatives are authored for
those failures and the suite is re-run until gains flatten. The iteration
record lives in the dataset report.

## 12. Phase 21–22 — Cost, logging, sources

LRU response cache, local-first ordering, structured per-request logs
(query, local candidates, local confidence, API-called flag, result,
latency; never keys). `data/sources.json` records every source with license
and retrieval method.

## 13. Phase 23 — Localization

Scenarios exist in English, Indian English, transliterations
(Hinglish/Kanglish/Tanglish) and native scripts. The original complaint text
is preserved; normalization is semantic (tokens), not blind translation.
Reply language stays governed by the explicit app language selector.

## 14. Success criteria

Reported numbers (not claims): scenarios generated, categories, hard
negatives, confusion pairs, test cases, accuracy, F1, top confusion pairs,
API fallback rate, average latency, files created/modified, remaining
weaknesses.
