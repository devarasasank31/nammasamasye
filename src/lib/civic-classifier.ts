// Local hybrid civic classifier: IDF-weighted retrieval over data/scenarios.jsonl
// + exact/phrase layer (legacy trained corpus) + negation/contradiction engine
// + hard-negative penalties + safety escalation + calibrated confidence +
// ambiguity detection. Deterministic, no embeddings, no API calls.
import fs from 'node:fs';
import path from 'node:path';
import { CivicScenario, CategoryCandidate, LocalClassifyResult, Severity } from './civic-types';
import { matchTrainedScenario } from './trained-scenarios';

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
let rows: CivicScenario[] | null = null;
let idf = new Map<string, number>();
let postings = new Map<string, number[]>();
let rowTokens: string[][] = [];
let rowIdfSum: number[] = [];
let rowNorm: string[] = [];
let N = 0;

function normalize(text: string): string {
  return text
    .toLowerCase()
    // \p{M} keeps combining marks (Kannada/Telugu matras, viramas) attached —
    // without it every Indic word shreds into fragments that match everywhere.
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(norm: string): string[] {
  return norm.split(' ').filter(t => t.length > 0);
}

function ensureLoaded(): boolean {
  if (rows) return rows.length > 0;
  try {
    const file = path.join(process.cwd(), 'data', 'scenarios.jsonl');
    const raw = fs.readFileSync(file, 'utf8');
    rows = raw
      .split('\n')
      .filter(l => l.trim())
      .map(l => JSON.parse(l) as CivicScenario);
  } catch {
    rows = [];
    return false;
  }

  const df = new Map<string, number>();
  rowTokens = [];
  rowNorm = [];
  rowIdfSum = [];

  for (const r of rows) {
    const n = normalize(r.text);
    const toks = Array.from(new Set(tokenize(n)));
    rowNorm.push(n);
    rowTokens.push(toks);
    rowIdfSum.push(0); // filled after idf is built (needs df pass first)
    for (const t of toks) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  N = rows.length;
  idf = new Map();
  postings = new Map();
  for (const [t, d] of df) {
    idf.set(t, Math.log(1 + N / d));
    postings.set(t, []);
  }
  rows.forEach((_, i) => {
    let sum = 0;
    for (const t of rowTokens[i]) {
      postings.get(t)!.push(i);
      sum += idf.get(t)!;
    }
    rowIdfSum[i] = sum;
  });
  return N > 0;
}

export function getCorpusSize(): number {
  return ensureLoaded() ? rows!.length : 0;
}

function idfOf(t: string): number {
  // Unknown query tokens (absent from the corpus) weigh like a df=1 token so
  // unmatched rare words drag coverage DOWN — that is what makes "capital of
  // france" score near zero instead of matching on "is/the/of".
  return idf.get(t) ?? (N > 0 ? Math.log(1 + N) : 2.2);
}

// Words that carry no category signal on their own. A row only counts as
// evidence if the query shares at least one NON-generic token with it —
// otherwise every "There is no X at all" row matches every other such row.
const GENERIC_TOKENS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'it', 'this', 'that', 'these', 'those', 'there', 'here',
  'in', 'on', 'at', 'to', 'of', 'and', 'or', 'but', 'if', 'then', 'so',
  'as', 'for', 'with', 'from', 'by', 'no', 'not', 'do', 'does', 'did',
  'have', 'has', 'had', 'can', 'could', 'will', 'would', 'am',
  'you', 'your', 'i', 'my', 'me', 'we', 'our', 'us', 'he', 'she',
  'they', 'them', 'his', 'her', 'its', 'what', 'when', 'how', 'why',
  'who', 'which', 'some', 'any', 'all', 'very', 'too', 'also', 'just',
]);

// ---------------------------------------------------------------------------
// Negation / contradiction engine (phase 13): key = "category:subcategory"
// ---------------------------------------------------------------------------
const NEGATION_PATTERNS: Record<string, RegExp[]> = {
  'util_power:power_outage': [
    /no power (cut|outage|problem)/,
    /there is no (power|electricity|current)/,
    /electricity is (working|fine|normal|ok|there)/,
    /power is (normal|back|on|fine|working)/,
    /we have (power|electricity|current)/,
    /(power|electricity|bijli|current) (nahi|to) (gaya|nhi gaya|nahi gaya)/,
    /current (chal raha|aa raha|ide|undi)/,
    /no (power|electricity) cut/,
    /without (a )?(power|electricity) (cut|outage)/,
    /(ವಿದ್ಯುತ್|ಕರೆಂಟ್|current|bijli)[^.]{0,30}(ಸಮಸ್ಯೆ )?ಇಲ್ಲ/,
    /(ಕರೆಂಟ್|ವಿದ್ಯುತ್) (ಇದೆ|ಚಾಲ್ತಿ ಇದೆ)/,
    /no (issue|problem) with (the )?(power|electricity|supply)/,
  ],
  'civic_water_supply:no_supply': [
    /water is (available|coming|normal|fine)/,
    /we have (tap )?water/,
    /supply is normal/,
    /paani (aa raha|chal raha|hai|ide)/,
    /neeru (ide|bartha)/,
    /no (water )?(problem|issue)/,
    /taps? (are )?(working|having water)/,
  ],
  'civic_streetlight:light_not_working': [
    /street ?lights? (are )?(all )?(working|fine|on|functioning|ok)/,
    /light (works|is on|is fine)/,
    /deepu (ide|bartha)/,
  ],
  'civic_drainage:drain_blockage': [
    /drain is (clean|clear|not blocked)/,
    /no (drain|drainage) (block|problem|issue)/,
    /drainage is (fine|working|clear)/,
  ],
  'civic_garbage:uncollected_waste': [
    /garbage is (collected|picked up|fine)/,
    /(waste|kachra|kasa) (was )?(collected|picked)/,
    /bins? (are )?(empty|clean)/,
  ],
  'traffic_pothole:pothole': [
    /no pothole/,
    /road is (fine|smooth|good|ok)/,
    /raste (theek|saaf|fine)/,
    /ರಸ್ತೆ (ಚೆನ್ನಾಗಿದೆ|ಸರಿ ಇದೆ)/,
  ],
  'civic_footpath:missing_footpath': [
    /footpath is (fine|good|there|ok)/,
    /sidewalk is (fine|good|ok)/,
  ],
  'env_noise:loudspeaker_dj': [
    /noise is (gone|stopped|fine|over)/,
    /no (loud )?(music|noise) (now|anymore)/,
  ],
  'bmtc_service:bus_not_coming': [
    /bus (came|is coming|arrived)/,
    /bus bandidide|bus aa gayi/,
  ],
};

// ---------------------------------------------------------------------------
// Safety / hazard escalation (phase 6): pattern -> target + severity
// ---------------------------------------------------------------------------
interface HazardRule {
  name: string;
  pattern: RegExp;
  unless?: RegExp; // explicit surface/context that overrides the hazard
  category: string;
  subcategory: string;
  severity: Severity;
  boost: number;
}
const HAZARD_RULES: HazardRule[] = [
  { name: 'live_wire', pattern: /\b(live|exposed|open|snapped|broken|low|hanging|dangling) (electric(al)? )?(wire|cable)\b|\b(wire|cable)[^.!?]{0,40}\b(fallen|fell|is fallen|has fallen|down|lying|broke|broken|dropped|hang|hangs|hangs low)\b|\b(fallen|fallen-down|lying|hang(ing)?) (live )?(wire|cable)\b|\bwires? (hang|hangs) (low|down)\b|\b(taar|तार|तीग|ತಂತಿ|தார்|తీಗ)[^.!?]{0,25}\b(came|come|is|has|gira)\b|\btaar (gira|bidd|sadak)/i, unless: /\b(not|ledu|ledu|illa|illaa|ill|no) an? (electric(al)? |live )?(wire|cable)\b|\b(no|not) (live |electric(al)? )?(wire|cable) (down|lying|fallen)\b/i, category: 'util_power', subcategory: 'fallen_wire', severity: 'critical', boost: 0.25 },
  { name: 'electric_shock', pattern: /\b(electric( )?shock|getting shocks|shocked people|shock lag|electrocut)/i, category: 'util_power', subcategory: 'fallen_wire', severity: 'critical', boost: 0.3 },
  { name: 'sparking', pattern: /\bspark(ing|s)?\b|\bwire.*(sparking|sparks)\b/i, category: 'util_power', subcategory: 'sparking_wire', severity: 'critical', boost: 0.25 },
  // A manhole ON the footpath is reported as a footpath problem (the authored
  // confusion rows say so, including their Hindi/Telugu/Kannada translits of
  // "footpath"); only road/open-context manholes escalate.
  { name: 'open_manhole', pattern: /\bopen manhole\b|\bmanhole (cover )?(missing|open|gone)\b|\bmissing (manhole|cover)\b/i, unless: /(footpath|sidewalk|pavement|फुटपाथ|फ़ुटपाथ|फुटपाथ|ಫುಟ್‌ಪಾತ್|ఫుట్‌పాత్|फुटपात)/i, category: 'civic_drainage', subcategory: 'missing_manhole', severity: 'critical', boost: 0.25 },
  { name: 'sewage_spill', pattern: /\bsewage (is )?(overflow|spill|leak|flowing|on the road)\b|\bsewer (pipe )?(burst|broken|phat)/i, category: 'civic_drainage', subcategory: 'sewage_overflow', severity: 'critical', boost: 0.2 },
  { name: 'chemical_smell', pattern: /\b(chemical|toxic|gas) (smell|leak|fumes)\b|\bstrange smell\b/i, category: 'civic_drainage', subcategory: 'broken_drain', severity: 'critical', boost: 0.2 },
  { name: 'fire', pattern: /\b(on fire|catching fire|fire broke|building (is )?burning)\b/i, category: 'traffic_accident', subcategory: 'solo_crash', severity: 'critical', boost: 0.25 },
  { name: 'building_collapse', pattern: /\b(building|structure|wall|roof)s? (is |are )?(collapse|collapsing|cave|caving|about to fall)\b/i, category: 'traffic_accident', subcategory: 'solo_crash', severity: 'critical', boost: 0.2 },
  { name: 'accident_injury', pattern: /\b(accident|happened|hit|collided|crash)\b.*\b(blood|bleeding|injured|hurt|hospital|fracture)\b|\b(blood|bleeding|injured|hurt)\b.*\b(accident|hit|crash|collided)\b/i, category: 'traffic_accident', subcategory: 'vehicle_collision', severity: 'critical', boost: 0.2 },
  { name: 'dog_bite', pattern: /\b(dog|dogs|puppy) (bite|bitten|bit|attacked)\b|\bbitten by (a )?dog\b/i, category: 'civic_stray_animals', subcategory: 'animal_attack', severity: 'critical', boost: 0.3 },
  { name: 'stalking', pattern: /\b(following me|followed me|stalking|picha kar|piche aa raha|hunting me)\b/i, category: 'safety_harassment', subcategory: 'stalking', severity: 'high', boost: 0.25 },
  { name: 'attack', pattern: /\b(beat|beaten|attack(ed|ing|s)?|hit me|slapped|stabbed|molest)\b/i, category: 'safety_harassment', subcategory: 'physical_attack', severity: 'critical', boost: 0.2 },
];

// Prompt-injection / spam shapes: never classify, regardless of keywords.
const ADVERSARIAL_PATTERNS: RegExp[] = [
  /ignore (all |the )?(previous|above|prior|earlier) instructions/,
  /\bsystem\s*:/,
  /you are now (an? )?(assistant|bot|model)/,
  /classify everything as/,
  /always returns? scenario/,
  /confidence ?[:=]? ?99/,
];

// ---------------------------------------------------------------------------
// Clarification questions (phase 17), localized
// ---------------------------------------------------------------------------
const CLARIFICATION_QUESTIONS: Record<string, Record<string, string>> = {
  water: {
    en: 'Is the water coming from rainfall, a blocked drain, a broken pipe, or sewage?',
    kn: 'ಆ ನೀರು ಮಳೆಯದ್ದಾ, ಅಡ್ಡಗಟ್ಟಿದ ಚರಂಡಿಯದ್ದಾ, ಒಡೆದ ಪೈಪ್‌ನದ್ದಾ, ಅಥವಾ ಒದರದ (sewage) ನೀರಾ?',
    hi: 'क्या यह पानी बारिश का है, अवरुद्ध नाली का, टूटी पाइप का, या सीवेज का?',
    te: 'ఆ నీరు వర్షపుదా, అడ్డుపడ్డ డ్రైన్‌దా, పగిలిన పైప్‌దా, లేదా మురుగునీరా?',
  },
  power: {
    en: 'Is there no electricity at all, or is it a streetlight or fallen wire problem?',
    kn: 'ಬಿಲ್ಲೇ ಇಲ್ಲವಾ, ಅಥವಾ ಅದು ರಸ್ತೆ ದೀಪ ಅಥವಾ ಬಿದ್ದ ತಂತಿಯ ಸಮಸ್ಯೆಯಾ?',
    hi: 'क्या बिल्कुल बिजली नहीं है, या यह स्ट्रीटलाइट या गिरे तार की समस्या है?',
    te: 'పవర్ అసలు లేదా, లేక అది స్ట్రీట్ లైట్ లేదా పడిన తీగ సమస్యా?',
  },
  road: {
    en: 'Is this a pothole, flooding, or a drain problem?',
    kn: 'ಇದು ಗುಂಡಿಯಾ, ನೀರು ನಿಲ್ಲುವಿಕೆಯಾ, ಅಥವಾ ಚರಂಡಿ ಸಮಸ್ಯೆಯಾ?',
    hi: 'क्या यह गड्ढा है, जलभराव है, या नाली की समस्या है?',
    te: 'ఇది గుంతా, నీటి నిల్వా, లేదా డ్రైన్ సమస్యా?',
  },
  transport: {
    en: 'Is this about the bus or the metro, and is it the vehicle, the staff, or the fare?',
    kn: 'ಇದು ಬಸ್‌ನದ್ದಾ ಮೆಟ್ರೋದ್ದಾ, ಮತ್ತು ಅದು ವಾಹನ, ಸಿಬ್ಬಂದಿ, ಅಥವಾ ದರದ ಸಮಸ್ಯೆಯಾ?',
    hi: 'क्या यह बस की है या मेट्रो की, और यह वाहन, कर्मचारी, या किराये की समस्या है?',
    te: 'ఇది బస్సుదా లేదా మెట్రోదా, మరియు అది వాహనం, సిబ్బంది, లేదా ఛార్జీ సమస్యా?',
  },
  safety: {
    en: 'Can you say a little more — are you in danger right now, or reporting something that happened?',
    kn: 'ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಹೇಳಬಹುದಾ — ಈಗ ಅಪಾಯದಲ್ಲಿದ್ದೀರಾ, ಅಥವಾ ನಡೆದ ಘಟನೆ ವರದಿ ಮಾಡ್ತಿದ್ದೀರಾ?',
    hi: 'थोड़ा और बताएँ — क्या आप अभी खतरे में हैं, या कोई घटना बता रहे हैं?',
    te: 'కొంచెం చెప్పగలరా — మీరు ఇప్పుడు ప్రమాదంలో ఉన్నారా, లేదా జరిగిన సంఘటన చెబుతున్నారా?',
  },
  generic: {
    en: 'Can you tell me a little more about what exactly is happening?',
    kn: 'ಸ್ವಲ್ಪ ಹೆಚ್ಚು ವಿವರ ಹೇಳಬಹುದಾ — ನಿಖರವಾಗಿ ಏನಾಗ್ತಿದೆ?',
    hi: 'थोड़ा और बता सकते हैं — ठीक से क्या हो रहा है?',
    te: 'కొంచెం వివరంగా చెప్పగలరా — ఖచ్చితంగా ఏమవుతోంది?',
  },
};

export function clarificationQuestion(family: string, lang: string): string {
  const q = CLARIFICATION_QUESTIONS[family] || CLARIFICATION_QUESTIONS.generic;
  return q[lang] || q.en;
}

function familyFor(topA: string | null, topB: string | null): string {
  const set = new Set([topA, topB].filter(Boolean) as string[]);
  const has = (...ids: string[]) => ids.some(id => set.has(id));
  if (has('civic_water_supply', 'civic_drainage')) return 'water';
  if (has('util_power', 'civic_streetlight')) return 'power';
  if (has('traffic_pothole', 'civic_footpath', 'traffic_accident')) return 'road';
  if (has('bmtc_service', 'bmtc_staff', 'bmtc_fare_ticket', 'metro_service')) return 'transport';
  if (has('safety_harassment', 'civic_stray_animals')) return 'safety';
  return 'generic';
}

// ---------------------------------------------------------------------------
// Polarity check for adjacent windows: does this token sit next to a
// negator? ("is NOT collected", "NOT working", "ಇಲ್ಲ", "nahi", "n't")
const NEG_WINDOW = /(?:^|\s)(no|not|never|without|illa|ledu|nahi|nahin|nhi|ಇಲ್ಲ)(?:\s|$)|n['’]t(?:\s|$)/i;
function windowNeg(tokens: string[], idx: number): boolean {
  if (idx < 0) return false;
  for (let j = Math.max(0, idx - 1); j <= Math.min(tokens.length - 1, idx + 1); j++) {
    if (NEG_WINDOW.test(' ' + tokens[j] + ' ')) return true;
  }
  return false;
}
// The row's window must show an explicit positive assertion for the
// contradiction to mean anything — "garbage IS collected" contradicts
// "garbage is NOT collected", but "the light is dark" does not contradict
// "no light" just because the word "not" is missing.
const ROW_POS = /(?:^|\s)(is|are|was|were|has|have|gets)(?:\s|$)/i;
function windowPos(tokens: string[], idx: number): boolean {
  if (idx < 0) return false;
  for (let j = Math.max(0, idx - 1); j <= Math.min(tokens.length - 1, idx + 1); j++) {
    if (ROW_POS.test(' ' + tokens[j] + ' ')) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function civicClassify(text: string): LocalClassifyResult {
  const t0 = Date.now();
  const empty: LocalClassifyResult = {
    category: null, subcategory: null, scenario_id: null, confidence: 0,
    severity: 'low', reason: '', secondary_issue: null,
    needs_clarification: true, clarification_family: 'generic', top: [],
    margin: 0, negations_applied: [], hazards: [], latency_ms: 0,
  };

  const norm = normalize(text);
  if (!norm) { empty.latency_ms = Date.now() - t0; return empty; }

  // Prompt-injection / spam shapes never classify (case 1 of the adversarial
  // pool): fall straight through to an unclassified result.
  if (ADVERSARIAL_PATTERNS.some(p => p.test(norm))) {
    empty.latency_ms = Date.now() - t0;
    empty.needs_clarification = false;
    return empty;
  }

  // ---- Layer A: legacy exact/phrase matcher -------------------------------
  const trained = matchTrainedScenario(text);

  if (!ensureLoaded()) {
    if (trained) {
      return {
        ...empty,
        category: trained.scenario_id,
        subcategory: null,
        scenario_id: trained.scenario_id,
        confidence: trained.confidence,
        reason: trained.reason,
        needs_clarification: trained.confidence < 55,
        clarification_family: null,
        top: [{ category: trained.scenario_id, subcategory: '', score: trained.confidence / 100, scenario_id: trained.scenario_id, reason: trained.reason, severity: 'medium' }],
        latency_ms: Date.now() - t0,
      };
    }
    empty.latency_ms = Date.now() - t0;
    return empty;
  }

  const qTokens = tokenize(norm);
  const qUnique = [...new Set(qTokens)];

  // ---- Layer B: IDF-weighted retrieval ------------------------------------
  const cand = new Set<number>();
  const sortedTokens = [...qUnique].sort((a, b) => idfOf(b) - idfOf(a));
  for (const t of sortedTokens.slice(0, 48)) {
    const list = postings.get(t);
    if (!list) continue;
    if (list.length > 1500) continue; // near-stopword: no candidate value
    for (const i of list) cand.add(i);
  }

  const qIdfTotal = qUnique.reduce((s, t) => s + idfOf(t), 0) || 1;
  const rowScores = new Map<number, number>();

  for (const i of cand) {
    const rTokens = rowTokens[i];
    const rSet = new Set(rTokens);
    let matchedIdf = 0;
    let matchedCount = 0;
    let rarest = 0;
    for (const t of qUnique) {
      if (rSet.has(t)) {
        const w = idfOf(t);
        matchedIdf += w;
        matchedCount++;
        if (w > rarest) rarest = w;
      }
    }
    if (matchedCount === 0) continue;
    // Decisive: at least one shared, non-generic token with real idf — rare
    // enough that it can't be borrowed from an unrelated category's rows.
    let decisive = false;
    for (const t of qUnique) {
      if (rSet.has(t) && !GENERIC_TOKENS.has(t) && idfOf(t) >= 2.4) { decisive = true; break; }
    }
    if (!decisive) continue;
    const rowIdfTotal = rowIdfSum[i] || 1;
    const cov = matchedIdf / qIdfTotal;
    const spec = Math.min(1, matchedIdf / rowIdfTotal);
    const rn = rowNorm[i];
    const rowWords = rn.split(' ').length;
    let phrase = 0;
    if (rn === norm || rn.includes(norm)) phrase = 0.35;
    // Query contains the row only counts for a decent-length row — a 2-word
    // row like "metro station" sitting inside any travel query is freebies.
    else if (rowWords >= 4 && norm.includes(rn)) phrase = 0.35;
    else if (norm.length > 40 && rn.length > 20 && rn.split(' ').filter(w => w && norm.includes(w)).length >= 4) phrase = 0.1;
    let score = Math.min(1, 0.6 * cov + 0.27 * spec + phrase + 0.08 * Math.min(1, rarest / 5));
    // Query/row polarity contradiction on a shared content word: the query
    // says "garbage is NOT collected" but the row asserts "garbage IS
    // collected daily …" — that row is borrowing our words for a different
    // problem, so its evidence is mostly noise.
    let contradictions = 0;
    for (const t of qUnique) {
      if (!rSet.has(t) || GENERIC_TOKENS.has(t)) continue;
      const qi = qTokens.indexOf(t);
      const ri = rTokens.indexOf(t);
      if (windowNeg(qTokens, qi) && !windowNeg(rTokens, ri) && windowPos(rTokens, ri)) contradictions++;
    }
    if (contradictions) score = Math.max(0.04, score * 0.45);
    if (score > 0.05) rowScores.set(i, score);
  }

  // Aggregate: category:subcategory -> evidence (best + 0.3*second)
  interface Agg { best: number; second: number; bestRow: number; }
  const subAgg = new Map<string, Agg>();
  for (const [i, s] of rowScores) {
    const r = rows![i];
    const key = `${r.category}:${r.subcategory}`;
    const cur = subAgg.get(key) || { best: 0, second: 0, bestRow: -1 };
    if (s > cur.best) { cur.second = cur.best; cur.best = s; cur.bestRow = i; }
    else if (s > cur.second) { cur.second = s; }
    subAgg.set(key, cur);
  }

  // Legacy trained match folded in as evidence for its category
  if (trained && trained.confidence >= 55) {
    const key = `${trained.scenario_id}:__trained`;
    const s = Math.min(0.97, (trained.confidence / 100) * 0.92);
    const cur = subAgg.get(key) || { best: 0, second: 0, bestRow: -1 };
    if (s > cur.best) { cur.best = s; cur.bestRow = -2; }
    subAgg.set(key, cur);
  }

  // Category aggregation: best subcat + small credit for a second subcat
  const catAgg = new Map<string, { score: number; sub: string; second: number }>();
  for (const [key, agg] of subAgg) {
    const [cat, sub] = key.split(':');
    const s = Math.min(1, agg.best + 0.3 * agg.second);
    const cur = catAgg.get(cat);
    if (!cur || s > cur.score) catAgg.set(cat, { score: s, sub, second: 0 });
    else if (s > cur.second) cur.second = s;
  }

  // ---- Hard-negative penalties (phase 4) ----------------------------------
  // Bounded: only the single strongest triggering row penalizes/inflates.
  // Summing across rows let a family of weakly-matching negatives drain the
  // correct category to zero while their own category ratcheted up to ~1.0.
  const negDrop = new Map<string, number>();
  const catBonus = new Map<string, number>();
  const negationsApplied: string[] = [];
  for (const [i, s] of rowScores) {
    if (s < 0.45) continue;
    const r = rows![i];
    for (const negId of r.hard_negative_for) {
      if (negId === r.category) continue; // intra-category subcat guard
      const drop = 0.18 * Math.min(1, s / 0.7);
      if (drop > (negDrop.get(negId) || 0)) negDrop.set(negId, drop);
      const bonus = 0.06 * s;
      if (bonus > (catBonus.get(r.category) || 0)) catBonus.set(r.category, bonus);
    }
  }
  for (const [negId, drop] of negDrop) {
    const cur = catAgg.get(negId);
    if (cur) cur.score = Math.max(0, cur.score - drop);
  }
  for (const [cat, b] of catBonus) {
    const cur = catAgg.get(cat);
    if (cur) cur.score = Math.min(1, cur.score + b);
  }

  // Precompute hazard hits once (used by negation logic + escalation).
  const hazardHits = HAZARD_RULES.filter(r => r.pattern.test(norm) && !(r.unless && r.unless.test(norm)));

  // ---- Negation / contradiction (phase 13): subcat-scoped -----------------
  for (const [key, patterns] of Object.entries(NEGATION_PATTERNS)) {
    const hit = patterns.some(p => p.test(norm));
    if (!hit) continue;
    negationsApplied.push(key);
    const [cat, sub] = key.split(':');
    const cur = catAgg.get(cat);
    if (!cur) continue;
    const catHazard = hazardHits.some(h => h.category === cat);
    if (!catHazard) {
      // The query denies this category and has no positive hazard signal for
      // it — any winner riding the shared denial lead-in ("no X … but Y" rows)
      // is evidence of the denial, not of a problem. Sink the whole category.
      cur.score = Math.min(cur.score, 0.15);
      cur.second = 0;
    } else if (cur.sub === sub || sub === '__trained') {
      // Hazard present: only the denied subcat story may fall back to a
      // genuinely different subcat of the same category.
      const others = [...subAgg.entries()]
        .filter(([k]) => k.startsWith(cat + ':') && !k.endsWith(sub))
        .map(([, a]) => Math.min(1, a.best + 0.3 * a.second));
      const fallback = others.length ? Math.max(...others) : 0;
      cur.score = Math.min(cur.score, Math.max(fallback, cur.score - 0.55));
    } else {
      // A losing subcat denied — shrink its contribution if it was second.
      if (cur.second) cur.second *= 0.3;
    }
  }

  // ---- Safety escalation (phase 6): hazard outranks the current leader -----
  const hazards: string[] = [];
  const hazardCats = new Set<string>();
  for (const rule of hazardHits) {
    hazards.push(rule.name);
    hazardCats.add(rule.category);
    const cur = catAgg.get(rule.category);
    const subEvidence = subAgg.get(`${rule.category}:${rule.subcategory}`);
    const lead = catAgg.size ? Math.max(...[...catAgg.values()].map(v => v.score)) : 0;
    const base = Math.max(
      subEvidence ? subEvidence.best + 0.3 * subEvidence.second : 0,
      cur?.score || 0
    );
    const targetScore = Math.min(1, Math.max(base + rule.boost, 0.55, lead + 0.05));
    const wasLeader = Boolean(cur && cur.sub === rule.subcategory && cur.score >= lead);
    catAgg.set(rule.category, { score: targetScore, sub: rule.subcategory, second: 0 });
    if (!wasLeader) hazards[hazards.length - 1] = rule.name + '!';
  }

  // ---- Build ranked candidates -------------------------------------------
  const ranked: CategoryCandidate[] = [...catAgg.entries()]
    .filter(([, v]) => v.score > 0.08)
    .map(([cat, v]) => {
      const bestRow = subAgg.get(`${cat}:${v.sub}`);
      const row = bestRow && bestRow.bestRow >= 0 ? rows![bestRow.bestRow] : null;
      return {
        category: cat,
        subcategory: v.sub === '__trained' ? '' : v.sub,
        score: v.score,
        scenario_id: cat,
        reason: row ? row.reason : (trained && trained.scenario_id === cat ? trained.reason : ''),
        severity: (row?.severity || severityForHazard(hazards, cat) || 'medium') as Severity,
      };
    })
    .sort((a, b) => (b.score - a.score) ||
      ((hazardCats.has(b.category) ? 1 : 0) - (hazardCats.has(a.category) ? 1 : 0)))
    .slice(0, 3);

  // Enforce trained reason if trained produced the top category and no row reason
  if (trained && ranked[0]?.category === trained.scenario_id && !ranked[0].reason) {
    ranked[0].reason = trained.reason;
  }

  if (!ranked.length) {
    empty.latency_ms = Date.now() - t0;
    empty.negations_applied = negationsApplied;
    empty.hazards = hazards;
    return empty;
  }

  // ---- Confidence calibration (phase 16) ----------------------------------
  const top = ranked[0];
  const second = ranked[1];
  const margin = second ? top.score - second.score : top.score;
  let confidence = Math.round(100 * (0.4 + 0.65 * top.score));
  if (margin > 0.25) confidence += 3;

  // Exact/phrase-level top evidence — the winning row literally contains the
  // whole query (or the trained matcher nailed it). Short generic queries can
  // saturate coverage for several categories at once; those stay subject to
  // the tie-break penalty below.
  const topAgg = subAgg.get(`${top.category}:${top.subcategory || '__trained'}`);
  const topRowIdx = topAgg ? topAgg.bestRow : -1;
  const exactish =
    (topRowIdx >= 0 && (rowNorm[topRowIdx] === norm || rowNorm[topRowIdx].includes(norm))) ||
    (topRowIdx === -2 && !!trained && trained.scenario_id === top.category && trained.confidence >= 75);

  // Near-tie penalty — never applied when a safety hazard is in play (a
  // confirmed hazard must not be punished for another row tagging along).
  if (second && margin < 0.06 && second.score > 0.45 &&
      (top.score < 0.97 || !exactish) && !hazards.length) confidence -= 10;
  if (negationsApplied.length && !hazards.length) confidence -= 4;

  // Two or more meaningful words absent from the corpus: the tokens that would
  // decide the class are foreign — off-domain text riding incidental overlaps.
  // Cap low so the route abstains / hands off to the AI fallback. Never
  // applied when a safety hazard fired — exotic vocabulary must not stop a
  // confirmed live wire / dog bite / collapse from reaching the hotline path.
  const unknownMeaningful = qUnique.filter(t => !idf.has(t) && !GENERIC_TOKENS.has(t)).length;
  if (unknownMeaningful >= 2 && !hazards.length) confidence = Math.min(confidence, 50);
  // Thin top evidence (<0.55): report the doubt in the number too, not just
  // the clarification flag, so no consumer sees "73% sure" on a coin flip.
  if (top.score < 0.55) confidence = Math.min(confidence, 50);

  confidence = clamp(confidence, 1, 99);

  // Clarify when: overall confidence is low, the best row evidence itself is
  // thin (off-domain queries landing on incidental overlaps score <0.55),
  // or two categories are statistically tied without exact phrase backing.
  const ambiguous = confidence < 55 ||
    top.score < 0.55 ||
    (!!second && !hazards.length && margin < 0.05 && second.score > 0.35 &&
      (top.score < 0.75 || !exactish));
  const secondary = second && second.score >= 0.55 * top.score ? second.subcategory || second.category : null;
  const family = ambiguous ? familyFor(top.category, second?.category || null) : null;

  return {
    category: top.category,
    subcategory: top.subcategory || null,
    scenario_id: top.scenario_id,
    confidence,
    severity: top.severity,
    reason: top.reason,
    secondary_issue: secondary,
    needs_clarification: ambiguous,
    clarification_family: family,
    top: ranked,
    margin,
    negations_applied: negationsApplied,
    hazards,
    latency_ms: Date.now() - t0,
  };
}

function severityForHazard(hazards: string[], cat: string): Severity | null {
  for (const h of hazards) {
    const rule = HAZARD_RULES.find(r => h.startsWith(r.name));
    if (rule && rule.category === cat) return rule.severity;
  }
  return null;
}

// TEMP DEBUG: row-level scoring trace (remove after calibration).
export function __debugRows(text: string, k = 8): Array<{ score: number; cat: string; sub: string; row: string }> {
  if (!ensureLoaded()) return [];
  const norm = normalize(text);
  const qTokens = tokenize(norm);
  const qUnique = [...new Set(qTokens)];
  const cand = new Set<number>();
  const sortedTokens = [...qUnique].sort((a, b) => idfOf(b) - idfOf(a));
  for (const t of sortedTokens.slice(0, 48)) {
    const list = postings.get(t);
    if (!list) continue;
    if (list.length > 1500) continue;
    for (const i of list) cand.add(i);
  }
  const qIdfTotal = qUnique.reduce((s, t) => s + idfOf(t), 0) || 1;
  const out: Array<{ score: number; cat: string; sub: string; row: string }> = [];
  for (const i of cand) {
    const rTokens = rowTokens[i];
    const rSet = new Set(rTokens);
    let matchedIdf = 0;
    let matchedCount = 0;
    let rarest = 0;
    for (const t of qUnique) {
      if (rSet.has(t)) {
        const w = idfOf(t);
        matchedIdf += w;
        matchedCount++;
        if (w > rarest) rarest = w;
      }
    }
    if (matchedCount === 0) continue;
    // Decisive: at least one shared, non-generic token with real idf — rare
    // enough that it can't be borrowed from an unrelated category's rows.
    let decisive = false;
    for (const t of qUnique) {
      if (rSet.has(t) && !GENERIC_TOKENS.has(t) && idfOf(t) >= 2.4) { decisive = true; break; }
    }
    if (!decisive) continue;
    const rowIdfTotal = rowIdfSum[i] || 1;
    const cov = matchedIdf / qIdfTotal;
    const spec = Math.min(1, matchedIdf / rowIdfTotal);
    const rn = rowNorm[i];
    const rowWords = rn.split(' ').length;
    let phrase = 0;
    if (rn === norm || rn.includes(norm)) phrase = 0.35;
    else if (rowWords >= 4 && norm.includes(rn)) phrase = 0.35;
    else if (norm.length > 40 && rn.length > 20 && rn.split(' ').filter(w => w && norm.includes(w)).length >= 4) phrase = 0.1;
    let score = Math.min(1, 0.6 * cov + 0.27 * spec + phrase + 0.08 * Math.min(1, rarest / 5));
    let contradictions = 0;
    for (const t of qUnique) {
      if (!rSet.has(t) || GENERIC_TOKENS.has(t)) continue;
      const qi = qTokens.indexOf(t);
      const ri = rTokens.indexOf(t);
      if (windowNeg(qTokens, qi) && !windowNeg(rTokens, ri) && windowPos(rTokens, ri)) contradictions++;
    }
    if (contradictions) score = Math.max(0.04, score * 0.45);
    if (score > 0.05) {
      const r = rows![i];
      out.push({
        score,
        cat: r.category,
        sub: r.subcategory,
        row: `${r.text} | matched=${matchedCount} cov=${cov.toFixed(2)} spec=${spec.toFixed(2)} phrase=${phrase}${contradictions ? ` CONTRA=${contradictions}` : ''}`,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k);
}
