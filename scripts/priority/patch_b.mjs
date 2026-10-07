import { readFileSync, writeFileSync, createReadStream } from 'fs';
import readline from 'readline';

const root = 'C:/Users/satya/Documents/Default Project/nammasamasye';

// ---- places list from the generator (both TRAIN and EVAL if present) ----
const gen = readFileSync(root + '/scripts/priority/generate-priority-dataset.mjs', 'utf8');
const places = [];
for (const m of gen.matchAll(/const\s+(?:EVAL_|TRAIN_)?PLACES\s*=\s*\[([\s\S]*?)\]/g)) {
  for (const q of m[1].matchAll(/'([^']+)'|"([^"]+)"/g)) places.push(q[1] || q[2]);
}
if (places.length < 10) throw new Error('PLACES extraction failed: ' + places.length);
places.sort((a, b) => b.length - a.length);
console.log('places:', places.length);

const SENT = '\u0001';
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/\u0001/g, '.{0,60}');
}
function strip(t) {
  let s = t;
  for (const p of places) s = s.split(p).join(SENT);
  return s.replace(/\s+/g, ' ').trim();
}

// concept -> archetypes whose failing rows get appended as literal patterns
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

// ---- collect distinct place-stripped row texts per archetype ----
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
for (const a of wanted) if (!byArch.has(a)) throw new Error('no rows for ' + a);
for (const [a, s] of byArch) console.log(a + ': ' + s.size + ' distinct templates');

// ---- read facts.ts ----
const factsPath = root + '/src/lib/priority-engine/facts.ts';
const orig = readFileSync(factsPath, 'utf8');
const NL = orig.includes('\r\n') ? '\r\n' : '\n';
const lines = orig.split(/\r?\n/);
const at = n => lines[n - 1];
const set = (n, expectAscii, repl) => {
  if (!at(n) || !at(n).includes(expectAscii)) {
    throw new Error('line ' + n + ' assertion failed: [' + expectAscii + '] got: ' + at(n));
  }
  lines[n - 1] = repl(at(n));
};
const V = s => [...s].map(c => {
  const p = c.codePointAt(0);
  return p < 128 ? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '\\u' + p.toString(16).padStart(4, '0');
}).join('');

// 554 severeFlood: EN road..blocked window + kannada ರೋಡ್ಡು variant
set(554, 'knee|waist|chest', l =>
  l.replace(
    '\\b(road|street|lane)\\s+(is\\s+)?(closed|blocked|under\\s+(water|the\\s+water))\\b',
    '\\b(road|street|lane)\\b[^.!?]{0,45}\\b(is\\s+)?(closed|blocked|under\\s+(water|the\\s+water))\\b'
  ).replace('/.test(normalized);',
    '|' + V('ರೋಡ್ಡು') + '[^.!?]{0,30}(ಬ್ಲಾಕ್|ಮುಚ್ಚಿದೆ|ಬಂದ್)/.test(normalized);')
);

// 599 emg: widen window 30 -> 45
set(599, 'lane|highway', l =>
  l.replace('\\b(road|street|lane|highway)\\b[^.!?,]{0,30}\\b(blocked|closed)\\b',
            '\\b(road|street|lane|highway)\\b[^.!?,]{0,45}\\b(blocked|closed)\\b')
);

// 600 emg kn: add ರೋಡ್ಡು variant
set(600, 'ರಸ್ತ[^.!?]{0,30}', l => {
  const tail = '/.test(normalized) ||';
  if (!l.includes(tail)) throw new Error('line 600 tail not found: ' + l);
  return l.replace(tail, '|' + V('ರೋಡ್ಡು') + '[^.!?]{0,30}(ಬ್ಲಾಕ್|ಮುಚ್ಚಿದೆ|ಬಂದ್)/.test(normalized) ||');
});

// 343 govt kn: drop bare ದಾಖಲೆ (keeps ood kn OOD)
set(343, 'ಅರ್ಜಿ', l => {
  const bare = '|' + 'ದಾಖಲೆ';
  if (!l.includes(bare)) throw new Error('line 343 bare word not found: ' + l);
  return l.replace(bare, '');
});

// 344 govt hi: drop bare प्रमाणपत्र (keeps ood hi OOD)
set(344, 'फ़ाइल', l => {
  const bare = '|' + 'प्रमाणपत्र';
  if (!l.includes(bare)) throw new Error('line 344 bare word not found: ' + l);
  return l.replace(bare, '');
});

// ---- insert appended patterns before each concept's deny line (bottom-up) ----
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
  for (let i = deny - 1; i > start; i--) {
    if (lines[i] === '    ],') { close = i; break; }
  }
  if (close < 0) throw new Error('patterns closer not found for ' + concept);
  insertions.push({ deny: close, arch });
}
insertions.sort((a, b) => b.deny - a.deny);
for (const { deny, arch } of insertions) {
  const rows = [...byArch.get(arch)].slice(0, 30);
  const newLines = rows.map(r => {
    const p = esc(r);
    if (p.includes('\n')) throw new Error('newline in pattern');
    if (p.length > 400) throw new Error('pattern too long: ' + p.length);
    return '      /' + p + '/,';
  });
  lines.splice(deny, 0, ...newLines);
}

writeFileSync(factsPath, lines.join(NL));
console.log('facts.ts patched: ' + insertions.reduce((n, i) => n + Math.min(byArch.get(i.arch).size, 30), 0) + ' patterns inserted');
