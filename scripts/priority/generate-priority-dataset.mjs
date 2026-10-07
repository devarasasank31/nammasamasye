// ============================================================
// PRIORITY DATASET GENERATOR
//
// Builds data/priority-scenarios/{train.jsonl,eval-unseen.jsonl,report.json}
// from the archetype modules in scripts/priority/archetypes/.
//
// Labels are BY CONSTRUCTION (archetype.expected) — never derived from
// the engine, which would be circular. The agreement mode in
// evaluate-priority.ts measures engine vs these labels afterwards.
//
// Determinism: seeded mulberry32 (seed 20261006) → same bytes every run.
// Disjointness: train uses TRAIN_PLACES, eval uses EVAL_PLACES (no
// overlap, no concept-triggering words). De-duplication is global on
// normalized text.
//
// Run (from repo root):
//   npx tsc -p scripts/priority/tsconfig.eval.json
//   node scripts/priority/generate-priority-dataset.mjs
// ============================================================

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { AP1A } from './archetypes/ap1a.mjs';
import { AP1B } from './archetypes/ap1b.mjs';
import { AP1C } from './archetypes/ap1c.mjs';
import { AP2A } from './archetypes/ap2a.mjs';
import { AP2B } from './archetypes/ap2b.mjs';
import { AP3A } from './archetypes/ap3a.mjs';
import { AP3B } from './archetypes/ap3b.mjs';
import { AP3C } from './archetypes/ap3c.mjs';
import { AP3D } from './archetypes/ap3d.mjs';
import { AP4OOD } from './archetypes/ap4ood.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// Department routing comes from the compiled engine so the dataset can
// never drift from src/lib/priority-engine/departments.ts.
const departmentsModulePath = path.join(ROOT, '.eval-build', 'src', 'lib', 'priority-engine', 'departments.js');
if (!fs.existsSync(departmentsModulePath)) {
  console.error(`Missing ${departmentsModulePath}\nRun first: npx tsc -p scripts/priority/tsconfig.eval.json`);
  process.exit(1);
}
const { departmentsFor } = require(departmentsModulePath);

const SEED = 20261006;
const LANGS = ['en', 'kn', 'hi', 'te', 'hl'];

// Capacity math (per archetype):
//   train rows available = Σ_lang train_surfaces × 36 places × 5 filler slots
//   eval  rows available = Σ_lang eval_surfaces  × 18 places × 5 filler slots
const TRAIN_PLACES = [
  'Indiranagar 100ft Lane', 'Koramangala 5th Block', 'HSR Layout Sector 2', 'Whitefield ITPL Main',
  'Jayanagar 4th Block', 'Malleshwaram 8th Cross', 'Banashankari 3rd Stage', 'Rajajinagar 2nd Block',
  'Basavanagudi Bull Temple', 'Adugodi Metro Area', 'Domlur Flyover Stretch', 'Old Airport Road',
  'Sarjapur Outer Ring', 'Bellandur Lake View', 'Marathahalli Bridge Area', 'CV Raman Nagar',
  'Frazer Town Road', 'Shivajinagar Back Lane', 'Cunningham Road', 'Palace Guttahalli',
  'Vijayanagar 100ft', 'Nagarbhavi Circle', 'Kengeri Satellite Town', 'Jalahalli Cross',
  'Yeshwanthpur Industrial', 'Tumkur Road Stretch', 'Peenya 2nd Stage', 'Challaghatta Layout',
  'Bommanahalli Main', 'Garvebhavipalya', 'Hoskote Town Center', 'Anekal Road Bend',
  'Devanahalli Village', 'Yelahanka New Town', 'Nandini Layout', 'Sunkadakatte Junction',
];
const EVAL_PLACES = [
  'Avalahalli Cross', 'Begur Koppa Road', 'Chikkabanavara', 'Doddanekundi Phase 1',
  'Ejipura Main Lane', 'Guddadanahalli', 'Hanumanthanagar', 'Iblur Gate Stretch',
  'Jakkur Plotta', 'Kalyan Nagar Back Side', 'Lingarajpuram 1st Cross', 'Muneswaranaguthi',
  'Nagavara Palya', 'Odipur Layout', 'Panthers Road Bend', 'Quiens Road Corner',
  'Rajarajeshwari Nagar', 'Someshwarpura',
];
const FILLERS = [
  '',
  'please take action on this',
  'kindly look into this',
  'need this resolved soon',
  'kindly attend to this',
];

const EXPECTED_SLA = { P1: 'EMERGENCY', P2: 'RAPID', P3: 'NORMAL', P4: 'ROUTINE', OOD: 'ROUTINE' };
const TARGETS = {
  train: { P1: 2000, P2: 2500, P3: 3500, P4: 1500, OOD: 500 },
  eval: { P1: 200, P2: 250, P3: 350, P4: 150, OOD: 50 },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const ALL_ARCHETYPES = [...AP1A, ...AP1B, ...AP1C, ...AP2A, ...AP2B, ...AP3A, ...AP3B, ...AP3C, ...AP3D, ...AP4OOD];

function buildItems(a, split) {
  const places = split === 'train' ? TRAIN_PLACES : EVAL_PLACES;
  const items = [];
  for (const lang of LANGS) {
    const surfaces = a.langs[lang]?.[split] || [];
    for (const surface of surfaces) {
      for (const place of places) {
        for (const filler of FILLERS) {
          items.push({ lang, surface, place, filler });
        }
      }
    }
  }
  return items;
}

function renderText(item) {
  let text = item.surface.replaceAll('{place}', item.place);
  if (item.filler) text = `${text}, ${item.filler}`;
  return text;
}

function dedupeKey(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function main() {
  const seen = new Set();
  let duplicates = 0;
  const rows = { train: [], eval: [] };
  const stats = { train: {}, eval: {} };
  const seq = { train: 0, eval: 0 };

  for (const a of ALL_ARCHETYPES) {
    if (!LANGS.every(l => a.langs[l])) {
      console.error(`Archetype ${a.key} missing language block (has: ${Object.keys(a.langs).join(',')})`);
      process.exit(1);
    }
    for (const split of ['train', 'eval']) {
      const want = TARGETS[split][a.expected];
      const bucketKey = `${a.expected}::${a.key}`;
      const already = (stats[split][bucketKey] ||= { archetype: a.key, expected: a.expected, rows: 0, target: want, short: false });
      const picked = shuffle(buildItems(a, split));
      for (const item of picked) {
        if (already.rows >= want) break;
        const text = renderText(item);
        const key = dedupeKey(text);
        if (seen.has(key)) { duplicates += 1; continue; }
        seen.add(key);
        seq[split] += 1;
        const departments = departmentsFor({ subcategory: a.subcategory, category: a.category }, a.facts.incidentType);
        const row = {
          id: `pri_${split === 'train' ? 'train' : 'eval'}_${String(seq[split]).padStart(6, '0')}`,
          input: { text, category: a.category, subcategory: a.subcategory, language: item.lang },
          language: item.lang,
          category: a.category,
          subcategory: a.subcategory,
          expectedPriority: a.expected,
          sourceType: item.filler ? 'AUGMENTED' : 'SYNTHETIC',
          severitySignals: a.signals,
          safetySignals: a.safety,
          expectedSafetyOverride: a.expected === 'P1',
          expectedSLAClass: EXPECTED_SLA[a.expected],
          department: departments[0] || 'BBMP',
          departments,
          explanation: a.explanation,
          hardNegativeGroup: a.group,
          archetype: a.key,
          tags: a.tags || [],
          split,
        };
        rows[split].push(row);
        already.rows += 1;
      }
      if (already.rows < want) already.short = true;
    }
  }

  const outDir = path.join(ROOT, 'data', 'priority-scenarios');
  fs.mkdirSync(outDir, { recursive: true });
  for (const split of ['train', 'eval']) {
    const file = path.join(outDir, split === 'train' ? 'train.jsonl' : 'eval-unseen.jsonl');
    fs.writeFileSync(file, rows[split].map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  }

  const summarize = split => {
    const byPriority = {};
    const byLanguage = {};
    const byArchetype = {};
    for (const r of rows[split]) {
      byPriority[r.expectedPriority] = (byPriority[r.expectedPriority] || 0) + 1;
      byLanguage[r.language] = (byLanguage[r.language] || 0) + 1;
      byArchetype[r.archetype] = (byArchetype[r.archetype] || 0) + 1;
    }
    return { total: rows[split].length, byPriority, byLanguage, byArchetype };
  };

  const report = {
    generated_at: new Date().toISOString(),
    generator: 'scripts/priority/generate-priority-dataset.mjs',
    seed: SEED,
    archetypes: ALL_ARCHETYPES.length,
    places: { train: TRAIN_PLACES.length, eval: EVAL_PLACES.length, overlap: TRAIN_PLACES.filter(p => EVAL_PLACES.includes(p)) },
    fillers: FILLERS.length,
    duplicates_skipped: duplicates,
    targets: TARGETS,
    capacity: { train: stats.train, eval: stats.eval },
    splits: { train: summarize('train'), eval: summarize('eval') },
    label_policy: 'labels by construction from archetype.expected; never engine-derived (agreement is measured, not baked in)',
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  const shorts = [...Object.values(stats.train), ...Object.values(stats.eval)].filter(s => s.short);
  console.log(`train: ${report.splits.train.total} rows ${JSON.stringify(report.splits.train.byPriority)}`);
  console.log(`eval:  ${report.splits.eval.total} rows ${JSON.stringify(report.splits.eval.byPriority)}`);
  console.log(`languages (train): ${JSON.stringify(report.splits.train.byLanguage)}`);
  console.log(`duplicates skipped: ${duplicates}`);
  if (shorts.length > 0) {
    console.log(`SHORT on capacity for ${shorts.length} archetype/split targets:`);
    for (const s of shorts) console.log(`  - ${s.archetype} (${s.expected}) ${s.rows}/${s.target}`);
  }
  console.log(`Files → ${outDir}`);
}

main();
