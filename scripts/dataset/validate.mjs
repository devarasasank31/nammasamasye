// §31 dataset validation report — audits the four existing datasets without
// modifying them: total / valid / invalid / duplicates / contradictory rows,
// priority-band counts, safety coverage, multilingual and hard-negative
// coverage. Writes data/dataset_validation_report.json.
//
// Usage: node scripts/dataset/validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
const BANDS = ['P1', 'P2', 'P3', 'P4'];

function langOf(t) {
  if (/[\u0C80-\u0CFF]/.test(t)) return 'kn';
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  if (/[\u0C00-\u0C7F]/.test(t)) return 'te';
  return 'en/latin';
}

function auditPriorityDataset(name, rows) {
  const invalid = [];
  const byId = new Map();
  const byText = new Map();
  const bands = Object.fromEntries([...BANDS, 'OOD'].map(b => [b, 0]));
  const languages = {};
  const safetySignals = {};
  let overrides = 0;
  let hardNeg = 0;
  let tags = {};

  for (const [i, r] of rows.entries()) {
    const id = r.id ?? `#${i}`;
    const text = r.input?.text;
    const reasons = [];
    if (!text || !String(text).trim()) reasons.push('empty text');
    if (!BANDS.includes(r.expectedPriority) && r.expectedPriority !== 'OOD') reasons.push(`bad band: ${r.expectedPriority}`);
    if (!r.input?.category) reasons.push('missing category');
    if (reasons.length) invalid.push({ id, reasons });

    if (byId.has(r.id)) invalid.push({ id, reasons: ['duplicate id'] });
    byId.set(r.id, true);

    const key = crypto.createHash('md5').update(String(text || '').toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
    if (byText.has(key)) byText.get(key).push(id);
    else byText.set(key, [id]);

    bands[r.expectedPriority] = (bands[r.expectedPriority] || 0) + 1;
    const lang = r.language || langOf(text || '');
    languages[lang] = (languages[lang] || 0) + 1;
    if (r.expectedSafetyOverride) overrides += 1;
    for (const s of r.safetySignals || []) safetySignals[s] = (safetySignals[s] || 0) + 1;
    if (r.hardNegativeGroup) hardNeg += 1;
    for (const t of r.tags || []) tags[t] = (tags[t] || 0) + 1;
  }

  const duplicateGroups = [...byText.values()].filter(g => g.length > 1);

  // Contradictory: identical text carrying two different expected bands.
  const contradictory = [];
  for (const ids of byText.values()) {
    if (ids.length < 2) continue;
    const set = new Set(rows.filter(r => ids.includes(r.id)).map(r => r.expectedPriority));
    if (set.size > 1) contradictory.push({ ids, bands: [...set] });
  }

  const sortedTags = Object.fromEntries(Object.entries(tags).sort((a, b) => b[1] - a[1]));
  return {
    dataset: name,
    total: rows.length,
    valid: rows.length - invalid.length,
    invalid,
    duplicateTextGroups: duplicateGroups.length,
    duplicateTextRows: duplicateGroups.reduce((n, g) => n + g.length, 0),
    contradictory,
    bands,
    languages,
    safety: { overrides, safetySignals: Object.fromEntries(Object.entries(safetySignals).sort((a, b) => b[1] - a[1])) },
    hardNegatives: hardNeg,
    tags: sortedTags,
  };
}

function auditScenarios(name, rows) {
  const invalid = [];
  const byId = new Map();
  const byText = new Map();
  const severity = {};
  const languages = {};
  let hardNegCoverage = 0;
  let confusable = 0;

  for (const [i, r] of rows.entries()) {
    const id = r.id ?? `#${i}`;
    const reasons = [];
    if (!r.text || !String(r.text).trim()) reasons.push('empty text');
    if (!r.category) reasons.push('missing category');
    if (!['low', 'medium', 'high', 'critical'].includes(r.severity)) reasons.push(`bad severity: ${r.severity}`);
    if (!r.reason) reasons.push('missing reason');
    if (reasons.length) invalid.push({ id, reasons });

    if (byId.has(r.id)) invalid.push({ id, reasons: ['duplicate id'] });
    byId.set(r.id, true);
    const key = crypto.createHash('md5').update(String(r.text || '').toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
    if (byText.has(key)) byText.get(key).push(id);
    else byText.set(key, [id]);

    severity[r.severity] = (severity[r.severity] || 0) + 1;
    languages[langOf(r.text || '')] = (languages[langOf(r.text || '')] || 0) + 1;
    if ((r.hard_negative_for || []).length) hardNegCoverage += 1;
    if ((r.confusable_categories || []).length) confusable += 1;
  }

  const duplicateGroups = [...byText.values()].filter(g => g.length > 1);
  return {
    dataset: name,
    total: rows.length,
    valid: rows.length - invalid.length,
    invalid,
    duplicateTextGroups: duplicateGroups.length,
    duplicateTextRows: duplicateGroups.reduce((n, g) => n + g.length, 0),
    severity,
    languages,
    hardNegativeAnnotated: hardNegCoverage,
    confusableAnnotated: confusable,
  };
}

function auditEvalTests(name, rows) {
  const invalid = [];
  const pools = {};
  const scripts = {};
  const byText = new Map();
  for (const [i, r] of rows.entries()) {
    const id = r.id ?? `#${i}`;
    const reasons = [];
    if (!r.text || !String(r.text).trim()) reasons.push('empty text');
    if (!r.pool) reasons.push('missing pool');
    // Contract per scripts/dataset/tests.mjs: category pools need
    // expected_category; negation needs denied_category; ambiguous/ood/
    // adversarial are behaviour pools (text only).
    const CATEGORY_POOLS = ['positive', 'hard_negative', 'confusion', 'multi_issue', 'safety'];
    if (CATEGORY_POOLS.includes(r.pool) && !r.expected_category) reasons.push('missing expected_category');
    if (r.pool === 'negation' && !r.denied_category) reasons.push('missing denied_category');
    if (reasons.length) invalid.push({ id, reasons });
    pools[r.pool] = (pools[r.pool] || 0) + 1;
    scripts[r.script || 'unknown'] = (scripts[r.script || 'unknown'] || 0) + 1;
    const key = crypto.createHash('md5').update(String(r.text || '').toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
    if (byText.has(key)) byText.get(key).push(id);
    else byText.set(key, [id]);
  }
  const duplicateGroups = [...byText.values()].filter(g => g.length > 1);
  return {
    dataset: name,
    total: rows.length,
    valid: rows.length - invalid.length,
    invalid,
    duplicateTextGroups: duplicateGroups.length,
    pools,
    scripts,
  };
}

// §29 coverage checklist over the unseen set (measured, not assumed).
function coverage29(unseen) {
  const has = { typo: 0, stt: 0, slang: 0, movie: 0, short: 0, negation: 0, historical: 0, active: 0, multi_issue: 0, cause_vs_consequence: 0, ambiguous: 0, ood: 0 };
  for (const r of unseen) {
    const t = r.input?.text || '';
    const tl = t.toLowerCase();
    const tags = r.tags || [];
    if (tags.includes('typo') || tags.includes('misspelling') || /\b(knda|potehole|garbaeg|strtlight|watter|gundha|drinage|pothol|waterlogg)\b/.test(tl)) has.typo += 1;
    if (tags.includes('stt')) has.stt += 1;
    if (tags.includes('slang') || /\b(bkl|bc|full traffic|bloody|bloody hell|yaar|annoying as hell|chaaos|lit|savage)\b/.test(tl)) has.slang += 1;
    if (tags.includes('movie_story') || tags.includes('fiction') || /\b(movie|film|scene|script|novel|actor|hero|villain|dialogue|story book|fiction)\b/.test(tl)) has.movie += 1;
    if (t.trim().split(/\s+/).length <= 3) has.short += 1;
    if (tags.includes('negation') || /\b(no|not|isn't|isnt|never|without|stopped complaining)\b/.test(tl)) has.negation += 1;
    if (tags.includes('historical') || /\b(was|were|last year|in 19|in 20[0-2]\d|former|late mr|back in)\b/.test(tl)) has.historical += 1;
    if (tags.includes('active') || (r.maxPriority === undefined && /\b(right now|just now|currently|still)\b/.test(tl))) has.active += 1;
    if (tags.includes('multi_issue')) has.multi_issue += 1;
    if (tags.includes('cause_vs_consequence')) has.cause_vs_consequence += 1;
    if (tags.includes('ambiguous')) has.ambiguous += 1;
    if (r.expectedPriority === 'OOD') has.ood += 1;
  }
  return has;
}

const report = { generatedAt: new Date().toISOString(), datasets: {}, coverage29: null };

const scenarios = read('data/scenarios.jsonl');
report.datasets.scenarios = auditScenarios('data/scenarios.jsonl', scenarios);

const train = read('data/priority-scenarios/train.jsonl');
report.datasets.train = auditPriorityDataset('data/priority-scenarios/train.jsonl', train);

const unseen = read('data/priority-scenarios/eval-unseen.jsonl');
report.datasets.evalUnseen = auditPriorityDataset('data/priority-scenarios/eval-unseen.jsonl', unseen);
report.coverage29 = coverage29(unseen);

const evalTests = read('data/eval_tests.jsonl');
report.datasets.evalTests = auditEvalTests('data/eval_tests.jsonl', evalTests);

// ---- Safety coverage (§31): scenario KB must carry emergency categories ----
const SAFETY_CATEGORIES = ['traffic_accident', 'util_power', 'civic_drainage', 'safety_harassment', 'civic_stray_animals'];
const catCount = {};
for (const s of scenarios) catCount[s.category] = (catCount[s.category] || 0) + 1;
report.safetyCoverage = Object.fromEntries(SAFETY_CATEGORIES.map(c => [c, catCount[c] || 0]));
report.missingSafetyCoverage = SAFETY_CATEGORIES.filter(c => !catCount[c]);

const outPath = path.join(ROOT, 'data', 'dataset_validation_report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

const d = report.datasets;
console.log('=== §31 dataset validation report ===');
for (const [k, v] of Object.entries(d)) {
  console.log(`${k}: total=${v.total} valid=${v.valid} invalid=${v.invalid.length} dupGroups=${v.duplicateTextGroups}${'contradictory' in v ? ` contradictory=${v.contradictory.length}` : ''}`);
}
console.log('train bands:', JSON.stringify(d.train.bands));
console.log('unseen bands:', JSON.stringify(d.evalUnseen.bands));
console.log('unseen languages:', JSON.stringify(d.evalUnseen.languages));
console.log('unseen coverage29:', JSON.stringify(report.coverage29));
console.log('safety coverage:', JSON.stringify(report.safetyCoverage), 'missing:', JSON.stringify(report.missingSafetyCoverage));
if (d.train.invalid.length) console.log('train invalid sample:', JSON.stringify(d.train.invalid.slice(0, 5)));
if (d.scenarios.invalid.length) console.log('scenarios invalid sample:', JSON.stringify(d.scenarios.invalid.slice(0, 5)));
if (d.train.contradictory.length) console.log('train contradictory sample:', JSON.stringify(d.train.contradictory.slice(0, 3)));
console.log('written:', outPath);
