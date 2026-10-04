// Evaluation harness: runs data/eval_tests.jsonl through the local hybrid
// classifier, simulates the /api/chatbot acceptance gates, and reports
// honest metrics (accuracy, macro-F1, confusions, fallback rate, latency).
//
// Build & run:
//   npx tsc -p scripts/tsconfig.eval.json
//   node .eval-build/scripts/evaluate.js
import * as fs from 'fs';
import * as path from 'path';
import { civicClassify } from '../src/lib/civic-classifier';

interface Test {
  id: string;
  pool: string;
  lang: string;
  script: string;
  text: string;
  expected_category?: string | null;
  subcategory?: string | null;
  denied_category?: string | null;
  min_conf?: number | null;
  kind: string;
}

const ROOT = path.join(__dirname, '..', '..');
const tests: Test[] = fs.readFileSync(path.join(ROOT, 'data', 'eval_tests.jsonl'), 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l) as Test);

// Route gate simulation (must mirror src/app/api/chatbot/route.ts):
const LOCAL_TRUST = 75;
const LOCAL_ACCEPT = 55;
const MARGIN_TRUST = 0.1;

interface PoolStat {
  n: number;
  localPass: number;
  e2ePass: number;
}

const failures: Array<{
  pool: string; id: string; text: string; expected: string | null;
  denied: string | null; got: string | null; conf: number; margin: number;
  clar: boolean; neg: string[]; hz: string[]; localPass: boolean; e2ePass: boolean;
}> = [];

const pools: Record<string, PoolStat> = {};
const classifyExpect: Array<{ expected: string; got: string | null; conf: number; accepted: boolean; correct: boolean; safetyOk: boolean }> = [];
const latencies: number[] = [];
let fallbackCount = 0;
let acceptedCount = 0;
let clarifyCount = 0;
let warm = false;

for (const t of tests) {
  if (!warm) { civicClassify('warmup'); warm = true; }
  const r = civicClassify(t.text);
  latencies.push(r.latency_ms);

  const negatedNoHazard = r.negations_applied.length > 0 && r.hazards.length === 0;
  const trustGate = negatedNoHazard ? 85 : LOCAL_TRUST;
  const acceptGate = negatedNoHazard ? 70 : LOCAL_ACCEPT;
  const wouldCallAI = !r.category || r.confidence < trustGate || r.margin < MARGIN_TRUST;
  const accepted = Boolean(r.category) && r.confidence >= acceptGate && !r.needs_clarification;
  if (wouldCallAI) fallbackCount++;
  if (accepted) acceptedCount++;
  if (r.needs_clarification) clarifyCount++;

  let localPass = false;
  let e2ePass = false;

  if (t.expected_category) {
    const correct = r.category === t.expected_category;
    const minConf = t.min_conf || 0;
    const safetyOk = t.pool !== 'safety' || (correct && r.confidence >= minConf);
    localPass = correct && r.confidence >= minConf;
    e2ePass = accepted && correct && safetyOk;
    classifyExpect.push({
      expected: t.expected_category,
      got: r.category,
      conf: r.confidence,
      accepted,
      correct,
      safetyOk,
    });
  } else if (t.denied_category) {
    const wrong = r.category === t.denied_category && r.confidence >= 55;
    localPass = !wrong;
    e2ePass = !(accepted && r.category === t.denied_category);
  } else if (t.pool === 'ambiguous') {
    localPass = r.needs_clarification;
    e2ePass = !accepted; // an accepted classify on an ambiguous text is a failure
  } else {
    // ood / adversarial: never confidently classify
    const wrong = Boolean(r.category) && r.confidence >= 55;
    localPass = !wrong;
    e2ePass = !accepted;
  }

  const p = pools[t.pool] || (pools[t.pool] = { n: 0, localPass: 0, e2ePass: 0 });
  p.n++;
  if (localPass) p.localPass++;
  if (e2ePass) p.e2ePass++;
  if (!localPass && failures.length < 600) {
    failures.push({
      pool: t.pool, id: t.id, text: t.text.slice(0, 140),
      expected: t.expected_category || null, denied: t.denied_category || null,
      got: r.category, conf: r.confidence, margin: Number(r.margin.toFixed(3)),
      clar: r.needs_clarification, neg: r.negations_applied, hz: r.hazards,
      localPass, e2ePass,
    });
  }
}

// ---- aggregate metrics ------------------------------------------------------
const classifyN = classifyExpect.length;
const localTop1 = classifyExpect.filter(c => c.correct).length;
const e2eCorrect = classifyExpect.filter(c => c.accepted && c.correct).length;
const abstained = classifyExpect.filter(c => !c.accepted).length;

// Macro-F1 over categories with support
const cats = [...new Set(classifyExpect.map(c => c.expected))].sort();
const perCat: Array<{ cat: string; support: number; tp: number; fp: number; fn: number; p: number; r: number; f1: number }> = [];
for (const cat of cats) {
  const tp = classifyExpect.filter(c => c.expected === cat && c.got === cat).length;
  const fp = classifyExpect.filter(c => c.expected !== cat && c.got === cat).length;
  const fn = classifyExpect.filter(c => c.expected === cat && c.got !== cat).length;
  const p = tp + fp ? tp / (tp + fp) : 0;
  const r = tp + fn ? tp / (tp + fn) : 0;
  const f1 = p + r ? (2 * p * r) / (p + r) : 0;
  perCat.push({ cat, support: tp + fn, tp, fp, fn, p, r, f1 });
}
const macroF1 = perCat.length ? perCat.reduce((s, c) => s + c.f1, 0) / perCat.length : 0;

// Confusion pairs
const confPairs = new Map<string, number>();
for (const c of classifyExpect) {
  if (c.got !== c.expected) {
    const k = `${c.expected} -> ${c.got || 'none'}`;
    confPairs.set(k, (confPairs.get(k) || 0) + 1);
  }
}
const topConfusions = [...confPairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  .map(([pair, count]) => ({ pair, count }));

// Confidence separation
const correctConfs = classifyExpect.filter(c => c.correct).map(c => c.conf);
const wrongConfs = classifyExpect.filter(c => !c.correct).map(c => c.conf);
const mean = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;

// Latency percentiles
const sortedLat = [...latencies].sort((a, b) => a - b);
const pct = (p: number) => sortedLat.length ? sortedLat[Math.min(sortedLat.length - 1, Math.floor(p * sortedLat.length))] : 0;

const report = {
  tests_total: tests.length,
  classify_tests: classifyN,
  local_top1_accuracy: Number((localTop1 / Math.max(1, classifyN)).toFixed(4)),
  e2e_simulated_accuracy: Number((e2eCorrect / Math.max(1, classifyN)).toFixed(4)),
  abstained_after_gates: abstained,
  macro_f1: Number(macroF1.toFixed(4)),
  pools: Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, {
    n: v.n,
    local: `${v.localPass}/${v.n}`,
    e2e: `${v.e2ePass}/${v.n}`,
    local_rate: Number((v.localPass / Math.max(1, v.n)).toFixed(4)),
    e2e_rate: Number((v.e2ePass / Math.max(1, v.n)).toFixed(4)),
  }])),
  api_fallback_rate: Number((fallbackCount / Math.max(1, tests.length)).toFixed(4)),
  local_accepted_rate: Number((acceptedCount / Math.max(1, tests.length)).toFixed(4)),
  clarification_rate: Number((clarifyCount / Math.max(1, tests.length)).toFixed(4)),
  latency_ms: { p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), max: sortedLat[sortedLat.length - 1] || 0 },
  confidence: {
    correct_mean: Number(mean(correctConfs).toFixed(1)),
    wrong_mean: Number(mean(wrongConfs).toFixed(1)),
  },
  top_confusions: topConfusions,
  per_category: perCat,
  failures,
};

fs.writeFileSync(path.join(ROOT, 'data', 'eval_report.json'), JSON.stringify(report, null, 2) + '\n');

// ---- print ------------------------------------------------------------------
console.log('=== LOCAL CLASSIFIER EVAL ===');
console.log(`tests: ${tests.length} (classify-expect ${classifyN})`);
console.log(`local top-1 accuracy : ${(report.local_top1_accuracy * 100).toFixed(2)}%`);
console.log(`e2e simulated acc    : ${(report.e2e_simulated_accuracy * 100).toFixed(2)}%  (abstained: ${abstained})`);
console.log(`macro-F1             : ${(macroF1 * 100).toFixed(2)}%`);
console.log(`api fallback rate    : ${(report.api_fallback_rate * 100).toFixed(2)}%  (would call AI)`);
console.log(`local accepted rate  : ${(report.local_accepted_rate * 100).toFixed(2)}%`);
console.log(`clarification rate   : ${(report.clarification_rate * 100).toFixed(2)}%`);
console.log(`latency ms p50/p95/p99/max: ${report.latency_ms.p50}/${report.latency_ms.p95}/${report.latency_ms.p99}/${report.latency_ms.max}`);
console.log(`conf correct/wrong mean: ${report.confidence.correct_mean} / ${report.confidence.wrong_mean}`);
console.log('pools:');
for (const [name, p] of Object.entries(report.pools)) {
  console.log(`  ${name.padEnd(14)} n=${String(p.n).padStart(5)}  local ${p.local}  e2e ${p.e2e}`);
}
console.log('worst categories (F1):');
[...perCat].sort((a, b) => a.f1 - b.f1).slice(0, 10).forEach(c => {
  console.log(`  ${c.cat.padEnd(22)} sup=${String(c.support).padStart(4)} P=${c.p.toFixed(2)} R=${c.r.toFixed(2)} F1=${c.f1.toFixed(2)}`);
});
console.log('top confusion pairs:');
topConfusions.slice(0, 8).forEach(c => console.log(`  ${String(c.count).padStart(4)}  ${c.pair}`));

if (process.argv.includes('--failures')) {
  console.log('\n=== FAILURES (sample per weak pool) ===');
  for (const pool of ['hard_negative', 'positive', 'confusion', 'ambiguous', 'ood', 'adversarial', 'safety', 'multi_issue', 'negation']) {
    const f = failures.filter(x => x.pool === pool);
    if (!f.length) continue;
    console.log(`\n-- ${pool} (${f.length} shown up to) --`);
    f.slice(0, 8).forEach(x => {
      console.log(`  [${x.id}] exp=${x.expected || x.denied || (x.pool === 'ambiguous' ? 'clarify' : 'chat')} got=${x.got || 'none'} conf=${x.conf} margin=${x.margin} clar=${x.clar}`);
      console.log(`    "${x.text}"`);
    });
  }
}
