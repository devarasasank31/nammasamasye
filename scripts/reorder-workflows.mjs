// One-off, idempotent reorder of the 27 app workflows in src/data/scenarios.ts:
//   every scenario: what_happened -> where (location) -> remaining detail questions
//   custom_issue:   where first (what was already collected in the free-text step)
//   in-flow `when` questions are REMOVED — the dedicated date/time picker step
//   is the single WHEN step (it opens right after the location answer).
// UTF-8 safe: reads/writes with fs (never PowerShell Add-Content).
import fs from 'node:fs';
const FILE = 'src/data/scenarios.ts';

const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

const whatTemplate = lines.find(
  (l) => l.includes("{ id: 'what_happened'") && l.includes("en: 'What happened?'")
);
const whereTemplate = lines.find(
  (l) =>
    l.includes("{ id: 'where'") &&
    l.includes("en: 'Where did this happen?'") &&
    l.includes("type: 'location'")
);
if (!whatTemplate || !whereTemplate) throw new Error('templates not found');

const depthOf = (s) => (s.match(/[{[]/g) || []).length - (s.match(/[}\]]/g) || []).length;
const entryId = (e) => (e[0].match(/^\s*\{ id: '([^']+)'/) || [])[1];
const isLocation = (e) => e.some((l) => l.includes("type: 'location'"));

const out = [];
let scenarioId = null;
let changed = 0;

const transform = (entries, id) => {
  const kept = entries.filter((e) => entryId(e) !== 'when');
  if (id === 'custom_issue') return kept; // where is already first once `when` is gone
  const what = kept.find((e) => entryId(e) === 'what_happened');
  const loc = kept.find(isLocation);
  const rest = kept.filter((e) => e !== what && e !== loc);
  const next = [what || [whatTemplate], loc || [whereTemplate], ...rest];
  if (
    next.length !== kept.length ||
    next.some((e, i) => e !== kept[i])
  )
    changed++;
  return next;
};

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const idm = line.match(/^    id: '([a-z_]+)',$/);
  if (idm) scenarioId = idm[1];

  if (line === '    workflow: [') {
    out.push(line);
    i++;
    const entries = [];
    while (i < lines.length && !/^ {4}\]/.test(lines[i])) {
      if (/^ {6}\{ id: /.test(lines[i])) {
        const entry = [lines[i]];
        let depth = depthOf(lines[i]);
        while (depth > 0) {
          i++;
          entry.push(lines[i]);
          depth += depthOf(lines[i]);
        }
        entries.push(entry);
      } else {
        throw new Error(`unexpected workflow line ${i + 1}: ${lines[i]}`);
      }
      i++;
    }
    transform(entries, scenarioId).forEach((e) => out.push(...e));
    out.push(lines[i]); // "    ],"
    i++;
    continue;
  }
  out.push(line);
  i++;
}

fs.writeFileSync(FILE, out.join('\n'), 'utf8');
console.log(`done — ${changed} workflows reordered`);
