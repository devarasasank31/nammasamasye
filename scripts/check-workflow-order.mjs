// Static guard for the citizen report flow order (spec: every report asks
// what happened -> where -> when(picker) -> details -> final check).
//  - every scenario starts with what_happened, then a location question
//  - custom_issue starts with where (what happened was typed in free text)
//  - no in-flow `when` questions — the dedicated date/time picker is the
//    single WHEN step (opens right after the location answer)
// Run: node scripts/check-workflow-order.mjs   (exit 1 on violation)
import fs from 'node:fs';

const src = fs.readFileSync('src/data/scenarios.ts', 'utf8');
const blocks = src.split(/\n  \{\n/).slice(1);
if (blocks.length !== 27) {
  console.error(`expected 27 scenarios, parsed ${blocks.length}`);
  process.exit(1);
}

let failed = 0;
for (const b of blocks) {
  const id = (b.match(/^ {4}id: '([a-z_]+)',$/m) || [])[1];
  const wf = (b.match(/workflow: \[([\s\S]*?)\n {4}\]/) || [])[1] || '';
  const qs = [...wf.matchAll(/\{ id: '([^']+)',[\s\S]*?type: '([a-z]+)'/g)].map(m => ({
    id: m[1],
    type: m[2],
  }));
  const errs = [];
  if (qs.length === 0) errs.push('empty workflow');
  if (qs.some(q => q.id === 'when')) errs.push("in-flow id 'when' must be removed");
  if (id === 'custom_issue') {
    if (qs[0] && qs[0].type !== 'location') errs.push('must start with where (location)');
  } else {
    if (qs[0] && qs[0].id !== 'what_happened') errs.push('must start with what_happened');
    if (qs[1] && qs[1].type !== 'location') errs.push('second question must be location');
    if (!qs.some(q => q.type === 'location')) errs.push('missing location question');
  }
  if (errs.length) {
    failed++;
    console.error(`FAIL ${id}: ${errs.join('; ')}`);
  }
}
if (failed) process.exit(1);
console.log(`OK — ${blocks.length} scenarios: what_happened -> where, no in-flow when`);
