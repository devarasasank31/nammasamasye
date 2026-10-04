// Builds data/scenarios.jsonl + categories.json + confusion_matrix.json +
// dataset_report.json from the authored banks. Deterministic: fixed seed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mulberry32, generateRows, dedupe, normalizeKey,
  LEXICON, CONFUSION_PAIRS,
} from './dataset/engine.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const BANKS_DIR = path.join(__dirname, 'dataset', 'banks');

const SEED = 20261005;
const MIN_TOTAL = 5000;
const MIN_PER_CATEGORY = 100;

// Canonical app category ids (must match src/data/scenarios.ts)
const ALL_CATEGORIES = new Set([
  'traffic_accident', 'traffic_wrong_side', 'civic_sense', 'traffic_pothole',
  'civic_garbage', 'traffic_parking', 'civic_streetlight', 'traffic_interaction',
  'unofficial_payment', 'safety_harassment', 'cybercrime', 'housing_tenant',
  'env_noise', 'util_power', 'access_language', 'govt_service', 'civic_footpath',
  'civic_drainage', 'civic_parks', 'civic_water_supply', 'civic_stray_animals',
  'bribes', 'bmtc_service', 'bmtc_staff', 'bmtc_fare_ticket', 'metro_service',
  'custom_issue',
]);

async function loadBanks() {
  const files = fs.readdirSync(BANKS_DIR).filter(f => f.endsWith('.mjs')).sort();
  const merged = {};
  for (const f of files) {
    const url = new URL('./dataset/banks/' + f, import.meta.url).href;
    const mod = await import(url);
    Object.assign(merged, mod.default);
  }
  return { merged, files };
}

const { merged: BANKS, files } = await loadBanks();

const confusableFor = (id) => [...new Set(CONFUSION_PAIRS
  .filter(([a, b]) => a === id || b === id)
  .map(([a, b]) => (a === id ? b : a)))];

const rng = mulberry32(SEED);
let allRows = [];
let authored = { positives: 0, negatives: 0, confusions: 0 };
let bankErrors = [];

for (const [categoryId, def] of Object.entries(BANKS)) {
  if (!def.subcats || !def.positives) {
    bankErrors.push(`${categoryId}: missing subcats/positives`);
    continue;
  }
  for (const [sub, , , ] of def.positives || []) {
    if (!def.subcats[sub]) bankErrors.push(`${categoryId}: positive uses unknown subcat "${sub}"`);
  }
  for (const [sub, , , misleading] of def.negatives || []) {
    if (!def.subcats[sub]) bankErrors.push(`${categoryId}: negative uses unknown subcat "${sub}"`);
    if (!ALL_CATEGORIES.has(misleading) && !def.subcats[misleading]) {
      bankErrors.push(`${categoryId}: negative misleading "${misleading}" is not a category or subcategory`);
    }
  }
  for (const [sub, , , other] of def.confusions || []) {
    if (!def.subcats[sub]) bankErrors.push(`${categoryId}: confusion uses unknown subcat "${sub}"`);
    if (!ALL_CATEGORIES.has(other) && !def.subcats[other]) {
      bankErrors.push(`${categoryId}: confusion other "${other}" is not a category or subcategory`);
    }
  }
  authored.positives += def.positives.length;
  authored.negatives += (def.negatives || []).length;
  authored.confusions += (def.confusions || []).length;

  const rows = generateRows(def, categoryId, rng, { confusable: confusableFor(categoryId) });
  allRows.push(...rows);
}

if (bankErrors.length) {
  console.error('BANK SCHEMA ERRORS:');
  for (const e of bankErrors) console.error('  - ' + e);
  process.exit(1);
}

const { rows: uniqueRows, rejectedExact, rejectedNear } = dedupe(allRows);

// contradictory-label check: same normalized text with different categories
const labelMap = new Map();
let contradictory = 0;
for (const r of uniqueRows) {
  const k = normalizeKey(r.text);
  const prev = labelMap.get(k);
  if (prev && prev.category !== r.category) {
    contradictory++;
    console.warn(`  CONTRADICTORY: "${r.text}" -> ${prev.category} vs ${r.category}`);
  } else if (!prev) labelMap.set(k, r);
}

// ids
const finalRows = uniqueRows.map((r, i) => ({
  id: `scenario_${String(i + 1).padStart(6, '0')}`,
  text: r.text,
  category: r.category,
  subcategory: r.subcategory,
  severity: r.severity,
  intent: r.intent,
  hard_negative_for: r.hard_negative_for,
  confusable_categories: r.confusable_categories,
  reason: r.reason,
}));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(
  path.join(DATA_DIR, 'scenarios.jsonl'),
  finalRows.map(r => JSON.stringify(r)).join('\n') + '\n',
  'utf8'
);

// categories.json
const categories = Object.entries(BANKS).map(([id, def]) => {
  const catRows = finalRows.filter(r => r.category === id);
  const subcats = Object.entries(def.subcats).map(([sid, [label, reason]]) => ({
    subcategory_id: sid,
    name: label,
    description: reason,
    count: catRows.filter(r => r.subcategory === sid).length,
  }));
  return {
    category_id: id,
    parent_category: catRows[0]?.category_parent || parentOf(id),
    category_name: nameOf(id),
    description: def.subcats[Object.keys(def.subcats)[0]][1],
    department: def.department || '',
    severity_guidance: def.severityGuidance || '',
    subcategories: subcats,
    synonyms: (LEXICON[id] || []).slice(0, 12),
    positive_examples: (def.positives || []).slice(0, 3).map(p => p[2]),
    negative_examples: (def.negatives || []).slice(0, 3).map(n => n[2]),
    confusing_categories: confusableFor(id),
    scenario_count: catRows.length,
  };
});

function parentOf(id) {
  const P = {
    traffic_accident: 'TRAFFIC', traffic_wrong_side: 'TRAFFIC', civic_sense: 'TRAFFIC',
    traffic_pothole: 'CIVIC', civic_garbage: 'CIVIC', traffic_parking: 'TRAFFIC',
    civic_streetlight: 'CIVIC', traffic_interaction: 'TRAFFIC',
    unofficial_payment: 'GOVERNMENT', safety_harassment: 'PUBLIC_SAFETY',
    cybercrime: 'DIGITAL', housing_tenant: 'HOUSING', env_noise: 'ENVIRONMENT',
    util_power: 'UTILITIES', access_language: 'ACCESS_INTEGRITY', govt_service: 'GOVERNMENT',
    civic_footpath: 'CIVIC', civic_drainage: 'CIVIC', civic_parks: 'CIVIC',
    civic_water_supply: 'CIVIC', civic_stray_animals: 'CIVIC', bribes: 'CORRUPTION',
    bmtc_service: 'TRANSPORT', bmtc_staff: 'TRANSPORT', bmtc_fare_ticket: 'TRANSPORT',
    metro_service: 'TRANSPORT', custom_issue: 'OTHER',
  };
  return P[id] || 'OTHER';
}
function nameOf(id) {
  const s = id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return s
    .replace('Bmtc', 'BMTC').replace('Civic', '').replace('Util Power', 'Power Outage')
    .replace('Traffic', '').trim();
}

fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2), 'utf8');

// confusion_matrix.json (designed confusion pairs + realized counts)
const confusionMatrix = {
  pairs: CONFUSION_PAIRS.map(([a, b, note]) => ({ a, b, note })),
  hard_negative_count: finalRows.filter(r => r.hard_negative_for.length > 0).length,
  confusion_example_count: finalRows.filter(r => r.confusable_categories.length > 0 && r.hard_negative_for.length === 0).length,
};
fs.writeFileSync(path.join(DATA_DIR, 'confusion_matrix.json'), JSON.stringify(confusionMatrix, null, 2), 'utf8');

// dataset_report.json
const byCategory = {};
for (const r of finalRows) byCategory[r.category] = (byCategory[r.category] || 0) + 1;
const bySeverity = {};
for (const r of finalRows) bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;

const thin = Object.entries(byCategory).filter(([, n]) => n < MIN_PER_CATEGORY);
const report = {
  generated_at: new Date().toISOString(),
  seed: SEED,
  bank_files: files,
  total_scenarios: finalRows.length,
  unique_scenarios: finalRows.length,
  categories: Object.keys(byCategory).length,
  authored_bases: authored,
  rejected_exact_duplicates: rejectedExact,
  rejected_near_duplicates: rejectedNear,
  contradictory_labels: contradictory,
  scenarios_per_category: byCategory,
  scenarios_per_severity: bySeverity,
  hard_negatives: confusionMatrix.hard_negative_count,
  confusion_pairs: CONFUSION_PAIRS.length,
  safety_scenarios: finalRows.filter(r => r.severity === 'critical' || r.severity === 'high').length,
  thin_categories: Object.fromEntries(thin),
  below_minimum_total: finalRows.length < MIN_TOTAL,
};
fs.writeFileSync(path.join(DATA_DIR, 'dataset_report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify({
  bank_files: files,
  categories: Object.keys(BANKS).length,
  authored,
  generated: allRows.length,
  unique: finalRows.length,
  rejected_exact: rejectedExact,
  rejected_near: rejectedNear,
  contradictory,
  per_category: byCategory,
  below_5000: finalRows.length < MIN_TOTAL,
  thin: Object.fromEntries(thin),
}, null, 2));

if (finalRows.length < MIN_TOTAL) {
  console.error(`FAIL: only ${finalRows.length} unique scenarios (< ${MIN_TOTAL})`);
  process.exit(1);
}
console.log('DATASET_OK');
