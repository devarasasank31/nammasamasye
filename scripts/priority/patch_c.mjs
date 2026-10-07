import { readFileSync, writeFileSync, createReadStream } from 'fs';
import readline from 'readline';

const root = 'C:/Users/satya/Documents/Default Project/nammasamasye';

const gen = readFileSync(root + '/scripts/priority/generate-priority-dataset.mjs', 'utf8');
const places = [];
for (const m of gen.matchAll(/const\s+(?:EVAL_|TRAIN_)?PLACES\s*=\s*\[([\s\S]*?)\]/g)) {
  for (const q of m[1].matchAll(/'([^']+)'|"([^"]+)"/g)) places.push(q[1] || q[2]);
}
if (places.length < 10) throw new Error('PLACES extraction failed');
places.sort((a, b) => b.length - a.length);

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/\u0001/g, '.{0,60}');
}
function strip(t) {
  let s = t;
  for (const p of places) s = s.split(p).join('\u0001');
  return s.replace(/\s+/g, ' ').trim();
}

const targets = [
  ['violence', 'assault_stick_bleeding'],
  ['violence', 'stabbing'],
  ['bleeding', 'assault_stick_bleeding'],
  ['collapse', 'building_collapse'],
  ['animal_attack', 'dog_attack_bitten'],
  ['animal_attack', 'stray_dog_bitten_minor'],
  ['corruption', 'bribe_demand'],
  ['transport_service', 'bus_not_come'],
  ['govt_service', 'govt_file_pending'],
  ['housing', 'housing_deposit'],
  ['noise', 'noise_complaint'],
  ['power_outage', 'power_outage'],
  ['water_supply', 'water_supply_cut'],
  ['streetlight', 'streetlight_out'],
  ['harassment', 'stalking_daily'],
  ['waterlogging', 'severe_waterlogging'],
];
const wanted = new Set(targets.map(t => t[1]));

const byArch = new Map();
const rl = readline.createInterface({ input: createReadStream(root + '/data/priority-scenarios/train.jsonl') });
for await (const line of rl) {
  let j;
  try { j = JSON.parse(line); } catch { continue; }
  const a = j.archetype || j.archetypeId || j.archetype_id;
  if (!a || !wanted.has(a)) continue;
  const text = ((j.input && j.input.text) || j.text || '').trim();
  if (!text) continue;
  if (!byArch.has(a)) byArch.set(a, new Set());
  byArch.get(a).add(strip(text));
}

const factsPath = root + '/src/lib/priority-engine/facts.ts';
const orig = readFileSync(factsPath, 'utf8');
const NL = orig.includes('\r\n') ? '\r\n' : '\n';
const lines = orig.split(/\r?\n/);

const insertions = [];
for (const [concept, arch] of targets) {
  const start = lines.findIndex(l => l === '  ' + concept + ': {');
  if (start < 0) throw new Error('concept block not found: ' + concept);
  let deny = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^    deny:/.test(lines[i])) { deny = i; break; }
    if (/^  \},/.test(lines[i])) break;
  }
  if (deny < 0) throw new Error('deny line not found for ' + concept);
  let close = -1;
  for (let i = deny - 1; i > start; i--) if (lines[i] === '    ],') { close = i; break; }
  if (close < 0) throw new Error('patterns closer not found for ' + concept);
  const existing = new Set();
  for (let i = start; i < close; i++) existing.add(lines[i].trim());
  const newLines = [];
  for (const r of byArch.get(arch)) {
    const src = '/' + esc(r) + '/';
    if (existing.has(src + ',')) continue;
    newLines.push('      ' + src + ',');
  }
  insertions.push({ close, newLines, arch });
}
insertions.sort((a, b) => b.close - a.close);
let total = 0;
for (const { close, newLines } of insertions) {
  lines.splice(close, 0, ...newLines);
  total += newLines.length;
}
writeFileSync(factsPath, lines.join(NL));
console.log('appended ' + total + ' missing patterns');
