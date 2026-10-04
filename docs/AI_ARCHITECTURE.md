# Namma Samasye AI — Architecture

Status: implemented alongside this document. Scope: the bot (chat + complaint
classification) only. Other app surfaces (feed, admin, track) are untouched.

## 1. Goals

- Classify any natural-language civic complaint for the 27 categories the app
  already ships (see `src/data/scenarios.ts`) — and nothing outside that scope.
- Understand meaning, not keywords: negations, contradictions, multi-issue
  sentences, cause vs. symptom, informal/misspelled/Indian/Indian-English
  phrasing, transliteration, mixed scripts.
- Safety-critical situations always outrank mundane categories.
- Calibrated confidence; ask ONE clarifying question when genuinely ambiguous.
- External AI is a fallback with validation — never a trusted oracle.
- The assistant is also an all-in-one conversational bot: it answers general
  questions freely; it classifies only when the message is a civic complaint.
- Never hallucinate facts, never invent evidence, never treat allegations as
  verified fact.

## 2. Current architecture (as found)

| Layer | Implementation |
|---|---|
| Framework | Next.js 16.3.3 (Turbopack), TypeScript, API routes in `src/app/api/*` (Node runtime) |
| Categories | 27 scenario ids in `src/data/scenarios.ts` (11 parent domains: TRAFFIC, CIVIC, UTILITIES, TRANSPORT, …), each with a 4-language workflow |
| Bot | `src/app/api/chatbot/route.ts` — intent rules → abuse guard → `matchTrainedScenario` (19,982 mechanical phrase variants in `src/lib/trained-scenarios.ts`) → Groq (`openai/gpt-oss-120b`) fallback → backstops |
| Report flow | `classifyIncident` in `src/ai/classify.ts` (keyword map) + client-side `matchTrainedScenario` |
| Severity | `src/lib/trained-severity.ts` (5 levels), priority engine `src/lib/priority.ts` |
| Guard | `src/lib/chat-guard.ts` — multilingual abuse detection, never classifies abuse |
| Language | Reply language = explicit app selection only (`replyLang = appLang`) |
| Storage | Supabase with browser demo-mode fallback; no server DB required for the bot |
| Vector store / embeddings | none (none configured) |
| Existing dataset | No scenario dataset. The 19,982 rows are generated phrase variants (“X problem”, “X issue”), not authored scenarios — no hard negatives, no negations, no reasons |

## 3. Proposed architecture (implemented)

```
                       ┌────────────────────────────────────────────┐
 user message ────────►│ /api/chatbot                                │
                       │  1. deterministic intents (greeting/thanks)│
                       │  2. abuse guard (chat-guard)               │
                       │  3. LOCAL CLASSIFIER  ◄── data/scenarios   │
                       │     (civic-classifier.ts)                  │
                       │       ├ Layer A: exact/phrase match        │
                       │       │   (existing trained matcher)       │
                       │       ├ Layer B: IDF-weighted retrieval    │
                       │       │   over 5,000+ authored scenarios   │
                       │       ├ negation/contradiction engine      │
                       │       ├ hard-negative veto                 │
                       │       ├ safety escalation                  │
                       │       ├ margin → calibrated confidence     │
                       │       └ ambiguity → clarification          │
                       │  4. if local confidence < threshold OR     │
                       │     top-2 margin close → EXTERNAL AI       │
                       │     (candidate-scoped prompt, Groq)        │
                       │  5. validate AI output against taxonomy +  │
                       │     local evidence → reject if invalid     │
                       │  6. response cache (LRU) + structured logs │
                       └────────────────────────────────────────────┘
```

### 3.1 Local classifier (`src/lib/civic-classifier.ts`)

No embeddings, no model training. Hybrid lexical retrieval, deterministic and
free to run per message:

1. **Normalize**: lowercase, strip punctuation, collapse spaces, keep native
   scripts intact; transliteration-tolerant tokenization.
2. **Layer A — exact/phrase**: the existing trained phrase matcher (keeps
   proven behavior for the phrasings users already hit).
3. **Layer B — retrieval**: inverted index over `data/scenarios.jsonl`.
   Per-candidate score = IDF-weighted query coverage (70%) + specificity
   (30%), grouped by category; rare-token hits boost; categories aggregate
   their best candidate.
4. **Negation / contradiction engine**: category-specific denial patterns
   (“there is no power outage”, “electricity is working normally”, “we have
   water”) strongly penalize or veto the denied category. “NOT X BUT Y”
   resolves to Y.
5. **Hard-negative veto**: scenarios labelled `hard_negative_for: [cat]`
   that match strongly pull `cat` down — keyword presence alone never wins.
6. **Safety escalation**: live/exposed wire, shock, fire, collapse, open
   manhole, chemical smell, serious injury → correct safety-capable category
   with elevated confidence; a dangerous condition is never downgraded.
7. **Primary/secondary**: multi-issue input → higher-scoring specific
   category is primary; the other is reported as secondary in `reason`.
   First keyword encountered is never the deciding factor.
8. **Confidence**: mapped from score + margin between top-1 and top-2 +
   rule adjustments (negation, safety, hard-negative), banded 0–100 with
   the calibration described in the spec (90+ extreme, 75–89 strong,
   55–74 moderate, <55 ambiguous). Not manufactured.
9. **Ambiguity**: top-2 margin < threshold or no category ≥ 55 →
   `needs_clarification` with ONE concise question (localized ×4),
   unless the input is already decisive.

### 3.2 External AI fallback (Groq, `openai/gpt-oss-120b`)

Called only when: local confidence < 75, top-2 close, no similar scenario,
or novel/unusual combination. The prompt receives the user text, top-K
retrieved scenarios, candidate categories + descriptions, detected negations
and hazards — and must return strict JSON
(`category, subcategory, confidence, severity, reason, needs_clarification,
clarification_question, primary_issue, secondary_issue`).

**Validation (never blind trust)**: category must exist in the taxonomy;
scenario_id must be valid; the text must not contradict the chosen category
(local negation check); `hasAnyCivicSignal` backstop still applies; confidence
is clamped; if the local candidate is stronger, local wins. Invalid →
rejection → local classification or clarification.

### 3.3 All-in-one assistant behavior

The system prompt gives the model two jobs:

- **JOB 1 — conversation**: answer ANY question the citizen asks (general
  knowledge, how-to, app questions, small talk) conversationally in the
  selected language, with no fabricated facts, live data, phone numbers or
  official claims. Abuse still gets the polite deterministic guard reply.
- **JOB 2 — classification**: only when the message describes a civic
  problem from the app’s 27 categories, return structured JSON.

### 3.4 Output contract (backward compatible)

```json
{
  "type": "classify",
  "scenario_id": "util_power",
  "confidence": 95,
  "reason": "…in the selected language…",
  "category": "util_power",
  "subcategory": "fallen_wire",
  "severity": "critical",
  "primary_issue": "fallen_live_wire",
  "secondary_issue": "power_outage",
  "needs_clarification": false,
  "clarification_question": null,
  "source": "local_scenario | hybrid | external_ai",
  "replyLang": "kn"
}
```

`{type:"chat"}` responses keep `reply`; clarification questions arrive as a
chat `reply`. `source` replaces the old `trained/ai/guard/rules` labels with
the spec’s vocabulary (`rules`/`guard` kept for the deterministic paths the
frontend already distinguishes).

### 3.5 Report flow

`POST /api/classify` runs the same local classifier server-side and returns
top-3 candidates; the report page falls back to the existing client keyword
map if the call fails. One classifier, one truth, small client bundle.

### 3.6 Cost control & observability

- Local-first: a response cache (LRU, keyed by normalized text + language,
  TTL) prevents repeat AI calls entirely.
- Structured log line per classification: truncated query, local score,
  local category, whether the API was called, source, latency. Never the API
  key; never to the frontend.

## 4. What is deliberately NOT done

- No fine-tuned model (retrieval + rules + small LLM fallback is the right
  cost/quality tradeoff at this scale).
- No embedding/vector service: adds a per-message API call, latency and cost
  for marginal gain over IDF retrieval at 5k–20k documents; the interface
  (`civic-classifier.ts`) isolates scoring so embeddings can be added later.
- No scraping of private databases or PII — sources are public taxonomies
  and openly licensed datasets (see `data/sources.json`).
- No out-of-scope categories: only Namma Samasye’s own domains.
