// Debug harness: prints per-layer evidence of civicClassify for given inputs.
// Usage: npx tsc -p scripts/tsconfig.eval.json && node .eval-build/scripts/debug-classify.js [--rows] "query1" "query2"
import { civicClassify, __debugRows } from '../src/lib/civic-classifier';
import { matchTrainedScenario } from '../src/lib/trained-scenarios';

const argv = process.argv.slice(2);
const showRows = argv.includes('--rows');
const queries = argv.filter(a => a !== '--rows');
if (!queries.length) {
  console.log('no queries given');
  process.exit(1);
}

for (const q of queries) {
  const trained = matchTrainedScenario(q);
  const r = civicClassify(q);
  console.log('==== Q:', q);
  console.log('  trained:', trained
    ? `${trained.scenario_id}@${trained.confidence} :: ${(trained.reason || '').slice(0, 80)}`
    : 'none');
  console.log('  conf:', r.confidence, '| cat:', r.category, '| sub:', r.subcategory,
    '| clar:', r.needs_clarification, '| margin:', r.margin.toFixed(3),
    '| neg:', r.negations_applied.join(',') || '-', '| hz:', r.hazards.join(',') || '-');
  for (const c of r.top) {
    const raw = Math.round(100 * (0.4 + 0.65 * c.score));
    console.log(`   - ${c.category}/${c.subcategory} score=${c.score.toFixed(3)} raw=${raw} sev=${c.severity} reason=${(c.reason || '').slice(0, 70)}`);
  }
  if (showRows) {
    for (const d of __debugRows(q)) {
      console.log(`     row ${d.score.toFixed(3)} ${d.cat}/${d.sub} :: ${d.row}`);
    }
  }
}
