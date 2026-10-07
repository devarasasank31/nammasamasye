import { readFileSync, writeFileSync } from 'fs';

const root = 'C:/Users/satya/Documents/Default Project/nammasamasye';

// ---- 1. facts.ts: electrical deny gets "तार नहीं" (built from codepoints) ----
const factsPath = root + '/src/lib/priority-engine/facts.ts';
let facts = readFileSync(factsPath, 'utf8');
let flines = facts.split(/\r?\n/);
const denyIdx = flines.findIndex(l => l.includes('तार') && l.includes('ಇಲ್ಲ'));
if (denyIdx < 0) throw new Error('electrical deny line not found');
if (flines[denyIdx].includes('TAR_NAHI_MARK')) throw new Error('already patched');
// \bतार\s+नहींं?\b  →  \bतार\s+नहींं?\b
const tarNahi = '/\\b\u0924\u093e\u0930\\s+\u0928\u0939\u0940\u0902\u0902?\\b/';
flines[denyIdx] = flines[denyIdx].replace(/,\s*$/, ', ' + tarNahi + ',');
facts = flines.join('\n');
writeFileSync(factsPath, facts);
console.log('facts deny line ' + (denyIdx + 1) + ' -> ' + flines[denyIdx]);

// ---- 2. safety.ts: खुन(0941) -> खून(0942) in severe_bleeding rule ----
const safetyPath = root + '/src/lib/priority-engine/safety.ts';
let safety = readFileSync(safetyPath, 'utf8');
const wrong = '\u0916\u0941\u0928'; // खुन
const right = '\u0916\u0942\u0928'; // खून
const count = safety.split(wrong).length - 1;
if (count !== 2) throw new Error('expected 2 khun occurrences, got ' + count);
safety = safety.split(wrong).join(right);
writeFileSync(safetyPath, safety);
console.log('safety.ts: replaced ' + count + ' खुन -> खून');

// ---- 3. scoring.ts: hoist waterlogging/sewage immediateDanger to 0.35x ----
const scoringPath = root + '/src/lib/priority-engine/scoring.ts';
let scoring = readFileSync(scoringPath, 'utf8');
const anchor = '  if (f.immediateDanger) return clamp(Math.round(w * 0.75), w);';
if (scoring.split(anchor).length !== 2) throw new Error('scoring anchor not unique');
const hoist =
  '  if (\n' +
  '    f.immediateDanger &&\n' +
  '    !f.accidentInvolved &&\n' +
  '    f.injuries.length === 0 &&\n' +
  '    !f.openManhole &&\n' +
  "    !f.incidentTypes.includes('gas_chemical_hazard') &&\n" +
  "    (f.incidentTypes.includes('waterlogging') || f.incidentTypes.includes('sewage_contamination'))\n" +
  '  ) {\n' +
  '    return clamp(Math.round(w * 0.35), w);\n' +
  '  }\n';
scoring = scoring.replace(anchor, hoist + anchor);
writeFileSync(scoringPath, scoring);
console.log('scoring.ts: hoist inserted');
