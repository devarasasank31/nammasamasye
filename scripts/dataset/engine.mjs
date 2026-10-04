// Dataset generation engine: slots, transforms, lexicon, dedupe, ids.
// Deterministic (seeded) so the dataset is reproducible.
import crypto from 'node:crypto';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

export const SLOTS = {
  road: ['the main road', '100 Feet Road', 'Bannerghatta Road', 'Outer Ring Road',
    'the service road', 'Church Street', 'Bellary Road', 'Hosur Road',
    'the road near the metro pillar', 'the road opposite the bus stand'],
  area: ['our area', 'this layout', 'Koramangala', 'Indiranagar', 'JP Nagar',
    'Whitefield', 'Rajajinagar', 'BTM Layout', 'Malleshwaram', 'Yelahanka',
    'Basavanagudi', 'Hebbal'],
  spot: ['the bus stop', 'the school gate', 'the apartment entrance', 'the market',
    'the temple junction', 'the hospital gate', 'the railway crossing',
    'the park entrance', 'the flyover base'],
  when: ['since morning', 'for the past three days', 'since last night',
    'since yesterday evening', 'every night this week', 'for two weeks now',
    'since the rain started', 'since Sunday', 'for many days'],
  person: ['an old lady', 'a school kid', 'commuters', 'pedestrians',
    'two-wheeler riders', 'an auto driver', 'patients', 'office goers'],
  freq: ['every day', 'daily', 'once a week', 'almost daily', 'regularly'],
};

export function fillSlots(text, rng) {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const pool = SLOTS[key];
    if (!pool) return '';
    return pick(rng, pool);
  });
}

// ---- word maps for transliteration / native-script splicing -----------------
const HINGLISH = {
  water: 'paani', road: 'raste', gone: 'gaya', not: 'nahi', my: 'mera',
  problem: 'dikkat', when: 'kab', why: 'kyu', stopped: 'rok diya',
  garbage: 'kachra', help: 'madad', broken: 'toot gaya', blocked: 'band',
  dirty: 'ganda', 'too much': 'bahut zyada', no: 'nahi', 'not working': 'nahi chal raha',
};
const KANGLISH = {
  water: 'neeru', garbage: 'kasa', streetlight: 'deepu', problem: 'samasya',
  please: 'dayavittu', is: 'ide', not: 'illa', 'there is': 'ide',
  pothole: 'gundi', stopped: 'nididre', no: 'illa', broken: 'hagide',
  overflow: 'overflow aagide', blocked: 'block aagide', bus: 'bus',
  'not working': 'aagilla', happening: 'aagta ide',
};
const TANGLISH = {
  water: 'neellu', garbage: 'chetta', problem: 'samasya', not: 'ledu',
  is: 'undi', gone: 'poyindi', road: 'raste', no: 'ledu',
  blocked: 'block aindi', 'not working': 'run avvatledu', happening: 'avutundi',
};
const NATIVE = {
  kn: { garbage: 'ಕಸ', pothole: 'ಗುಂಡಿ', streetlight: 'ರಸ್ತೆ ದೀಪ', drain: 'ಚರಂಡಿ',
    wire: 'ತಂತಿ', bus: 'ಬಸ್', road: 'ರಸ್ತೆ', dog: 'ನಾಯಿ', noise: 'ಶಬ್ದ',
    power: 'ವಿದ್ಯುತ್', tree: 'ಮರ', metro: 'ಮೆಟ್ರೋ', water: 'ನೀರು',
    footpath: 'ಫುಟ್‌ಪಾತ್', accident: 'ಅಪಘಾತ', park: 'ಉದ್ಯಾನ' },
  hi: { garbage: 'कचरा', pothole: 'गड्ढा', streetlight: 'स्ट्रीटलाइट', drain: 'नाली',
    wire: 'तार', bus: 'बस', road: 'सड़क', dog: 'कुत्ता', noise: 'शोर',
    power: 'बिजली', tree: 'पेड़', metro: 'मेट्रो', water: 'पानी',
    footpath: 'फुटपाथ', accident: 'दुर्घटना', park: 'पार्क' },
  te: { garbage: 'చెత్త', pothole: 'గుంత', streetlight: 'స్ట్రీట్ లైట్', drain: 'డ్రైన్',
    wire: 'తీగ', bus: 'బస్సు', road: 'రోడ్', dog: 'కుక్క', noise: 'శబ్దం',
    power: 'విద్యుత్', tree: 'చెట్టు', metro: 'మెట్రో', water: 'నీరు',
    footpath: 'ఫుట్‌పాత్', accident: 'ప్రమాదం', park: 'పార్క్' },
};

function applyWordMap(text, map) {
  let out = text;
  let hits = 0;
  for (const [en, target] of Object.entries(map)) {
    const re = new RegExp(`\\b${en}\\b`, 'i');
    if (re.test(out)) {
      out = out.replace(re, target);
      hits++;
    }
  }
  return { text: out, hits };
}

// ---- transforms -------------------------------------------------------------
const FILLERS = /^(there is |there are |we have |it is |i am facing |i want to report |hello, |hi, |kindly |please )/i;

export const TRANSFORMS = {
  identity: (t) => t,
  typo: (t, rng) => {
    const words = t.split(' ').filter(w => w.length >= 5 && /[a-z]/i.test(w));
    if (!words.length) return t;
    const w = pick(rng, words);
    const i = Math.floor(rng() * (w.length - 1));
    const mode = rng() < 0.5 ? 0 : 1;
    const mutated = mode === 0
      ? w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2)
      : w.slice(0, i) + w.slice(i + 1);
    return t.replace(w, mutated);
  },
  informal: (t, rng) => {
    const pre = ['pls fix this', 'kindly do the needful', 'urgent issue,', 'respected sir,', 'hi,'];
    const post = ['pls fix', 'kindly attend to this', 'urgent', 'sir', 'thanks'];
    return rng() < 0.5 ? `${pick(rng, pre)} ${t}` : `${t} ${pick(rng, post)}`;
  },
  hinglish: (t) => applyWordMap(t, HINGLISH),
  kanglish: (t) => applyWordMap(t, KANGLISH),
  tanglish: (t) => applyWordMap(t, TANGLISH),
  native: (t, rng, ctx) => {
    const script = ctx?.script || pick(rng, ['kn', 'hi', 'te']);
    const map = NATIVE[script];
    const words = t.split(' ');
    let replaced = 0;
    const out = words.map(w => {
      const key = w.toLowerCase().replace(/[^a-z]/g, '');
      if (map[key] && replaced < 2 && rng() < 0.7) { replaced++; return map[key]; }
      return w;
    });
    return { text: out.join(' '), hits: replaced };
  },
  urgency: (t, rng) => (rng() < 0.5
    ? `URGENT: ${t}`
    : `${t} please take action immediately`),
  punct: (t, rng) => {
    const mode = Math.floor(rng() * 3);
    if (mode === 0) return t.replace(/\.$/, '');
    if (mode === 1) return `${t.replace(/\.$/, '')}!!`;
    const words = t.split(' ');
    const i = Math.floor(rng() * words.length);
    words[i] = words[i].toUpperCase();
    return words.join(' ');
  },
  shorten: (t) => t.replace(FILLERS, ''),
  location: (t, rng) => {
    const suffix = ` near ${pick(rng, SLOTS.spot)}, ${pick(rng, SLOTS.area)}`;
    return t.replace(/\s*\.$/, '') + suffix + '.';
  },
};

// ---- lexicon (category signal terms, incl. transliterations) ----------------
export const LEXICON = {
  traffic_accident: ['accident', 'collision', 'crashed', 'crash', 'takkar', 'hit and run',
    'ಅಪಘಾತ', 'దుర్ఘటన', 'दुर्घटना', 'two wheeler hit', 'collided'],
  traffic_wrong_side: ['wrong side', 'opposite direction', 'oncoming', 'ulta chal',
    'ತಪ್ಪು ಬದಿ', 'తప్పు వైపు', 'गलत दिशा', 'coming in wrong', 'driving wrong'],
  civic_sense: ['stunt', 'wheelie', 'racing', 'overspeeding', 'signal', 'helmet',
    'drunk driving', 'reckless', 'triple riding', 'ಸ್ಟಂಟ್', 'స్టంట్', 'स्टंट', 'jumped'],
  traffic_pothole: ['pothole', 'potholes', 'gundi', 'gadda', 'road damage', 'road broken',
    'crater', 'caved in', 'ಗುಂಡಿ', 'గుంత', 'गड्ढा', 'broken road'],
  civic_garbage: ['garbage', 'trash', 'waste', 'kachra', 'kasa', 'dumping', 'stink',
    'ಇಲ್ಲಿ ಕಸ', 'చెత్త', 'कचरा', 'bins overflowing', 'waste pile'],
  traffic_parking: ['parking', 'parked', 'blocking the', 'ಪಾರ್ಕಿಂಗ್', 'పార్కింగ్', 'पार्किंग',
    'vehicle is parked', 'cars parked'],
  civic_streetlight: ['streetlight', 'street light', 'lamp post', 'no light', 'light not working',
    'deepu', 'ದೀಪ', 'దీపం', 'स्ट्रीटलाइट', 'dark stretch', 'light is not'],
  traffic_interaction: ['challan', 'chalan', 'receipt', 'traffic police stopped', 'stopped me',
    'fine receipt', 'ಚಲಾನ್', 'चालान', 'cop stopped', 'halted by police'],
  unofficial_payment: ['unofficial payment', 'extra money', 'without receipt', 'extra charge',
    'asked for more', 'receipt illa', 'ಅನಧಿಕೃತ', 'अनौपचारिक', 'no receipt', 'money without bill'],
  safety_harassment: ['harassment', 'harassing', 'following me', 'stalking', 'threatening',
    'picha kar', 'ಕಿರುಕುಳ', 'వేధింపు', 'उत्पीड़न', 'eve teasing', 'molested', 'unsafe'],
  cybercrime: ['cyber', 'otp', 'phishing', 'fraud', 'scam', 'fake link', 'upi fraud',
    'ಸೈಬರ್', 'సైబర్', 'साइबर', 'hacked', 'blocked amount', 'otp nange bantu'],
  housing_tenant: ['tenant', 'landlord', 'land lord', 'deposit', 'rent agreement',
    'evict', 'ಕಿರಾಯಿ', 'కిరాయి', 'किरायेदार', 'owner is', 'deposit nange'],
  env_noise: ['noise', 'loud music', 'loud speaker', 'shor', 'sharaba', 'dj till',
    'ಶಬ್ದ', 'ధ్వని', 'शोर', 'horn honking', 'construction noise', 'dj night'],
  util_power: ['power cut', 'no power', 'electricity', 'bijli', 'current gaya', 'voltage',
    'ವಿದ್ಯುತ್', 'విద్యుత్', 'बिजली', 'transformer', 'no current', 'power is gone', 'load shedding'],
  access_language: ['language', 'communicate', 'understand hindi', 'cannot explain',
    'ಭಾಷೆ', 'భాష', 'भाषा', 'not understanding english', 'only kannada', 'only telugu'],
  govt_service: ['government office', 'application', 'certificate', 'delayed approval',
    'sarkari', 'ಸರ್ಕಾರಿ', 'ప్రభుత్వ', 'सरकारी', 'file is pending', 'no response from office', 'rti'],
  civic_footpath: ['footpath', 'sidewalk', 'pavement', 'walkway', 'ಫುಟ್‌ಪಾತ್', 'ఫుట్‌పాత్',
    'फुटपाथ', 'foot path', 'no walking space', 'encroached path'],
  civic_drainage: ['drain', 'drainage', 'clogged drain', 'sewage', 'manhole', 'nala',
    'ಚರಂಡಿ', 'డ్రైన్', 'नाली', 'sewer', 'storm water', 'overflowing drain'],
  civic_parks: ['park', 'garden', 'playground', 'ಉದ್ಯಾನ', 'పార్క్', 'पार्क',
    'gym in park', 'bench', 'garden area', 'children play'],
  civic_water_supply: ['water supply', 'no water', 'water leakage', 'pipe leak', 'low pressure',
    'contaminated water', 'ನೀರು', 'నీరు', 'पानी', 'tap water', 'bwssb', 'water is not', 'paani'],
  civic_stray_animals: ['stray dog', 'stray dogs', 'dogs chasing', 'cattle on road', 'monkeys',
    'ಆವಾರ ನಾಯಿ', 'stray animal', 'dog bite', 'rabid', 'cow on road', 'street dogs'],
  bribes: ['bribe', 'rishwat', 'ghoos', 'lancha', 'money to get work done', 'cut money',
    'ಲಂಚ', 'లంచం', 'रिश्वत', 'asked money to approve', 'to clear the file'],
  bmtc_service: ['bus did not come', 'bus not coming', 'bus late', 'bus breakdown',
    'bus skipped', 'bus did not stop', 'ಬಸ್', 'బస్సు', 'बस', 'bmrtc', 'crowded bus', 'no bus',
    'bus', 'overfill', 'overcrowd', 'school bus', 'hanging from doors'],
  bmtc_staff: ['conductor', 'bus driver', 'driver misbehaved', 'staff rude',
    'ಕಂಡಕ್ಟರ್', 'కండక్టర్', 'कंडक्टर', 'driver shouted', 'ticket kodlilla', 'abused passengers'],
  bmtc_fare_ticket: ['bus pass', 'buspass', 'ticket not given', 'overcharged', 'no change',
    'fare', 'ಟಿಕೆಟ್', 'టికెట్', 'टिकट', 'extra money for ticket', 'pass renewal'],
  metro_service: ['metro', 'bmrcl', 'namma metro', 'ಮೆಟ್ರೋ', 'మెట్రో', 'मेट्रो',
    'metro gate', 'metro train', 'metro token', 'escalator', 'metro platform'],
  custom_issue: [],
};

// ---- confusion pairs (phase 5) ----------------------------------------------
export const CONFUSION_PAIRS = [
  ['util_power', 'civic_streetlight', 'Power outage vs streetlight failure (power on, light off)'],
  ['util_power', 'traffic_pothole', 'Fallen wire lies on a damaged road'],
  ['civic_drainage', 'civic_water_supply', 'Drainage blockage vs water pipe burst'],
  ['civic_drainage', 'traffic_pothole', 'Road flooding vs drain overflow'],
  ['civic_water_supply', 'civic_drainage', 'Water leakage vs supply disruption'],
  ['civic_garbage', 'civic_parks', 'Garbage collection vs illegal dumping in park'],
  ['traffic_pothole', 'civic_footpath', 'Road damage vs broken footpath'],
  ['civic_parks', 'civic_garbage', 'Tree trimming vs fallen tree/debris'],
  ['env_noise', 'civic_sense', 'Construction noise vs traffic violation noise'],
  ['civic_footpath', 'civic_sense', 'Illegal construction vs footpath encroachment'],
  ['bribes', 'unofficial_payment', 'Bribe demand vs extra charge without receipt'],
  ['bmtc_service', 'bmtc_staff', 'Bus service vs conductor behaviour'],
  ['bmtc_service', 'bmtc_fare_ticket', 'Bus not coming vs fare/ticket issue'],
  ['metro_service', 'bmtc_service', 'Metro service vs BMTC bus service'],
  ['traffic_accident', 'civic_sense', 'Accident (happened) vs reckless driving (observed)'],
  ['safety_harassment', 'traffic_interaction', 'Being followed vs being stopped by police'],
];

// ---- dedupe -----------------------------------------------------------------
export function normalizeKey(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensOf(text) {
  return normalizeKey(text).split(' ').filter(Boolean);
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function simhash64(text) {
  const toks = tokensOf(text);
  const v = new Array(64).fill(0);
  for (const t of toks) {
    const h = fnv1a(t);
    for (let i = 0; i < 64; i++) {
      v[i] += (h >> i) & 1 ? 1 : -1;
    }
  }
  let out = 0n;
  for (let i = 0; i < 64; i++) if (v[i] > 0) out |= 1n << BigInt(i);
  return out;
}

export function hamming64(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x) { count += Number(x & 1n); x >>= 1n; }
  return count;
}

// ---- generation --------------------------------------------------------------
export function generateRows(bankDef, categoryId, rng, opts = {}) {
  const rows = [];
  const confusable = opts.confusable || [];
  const baseId = opts.baseIndex || 1;

  const push = (sub, sev, text, hardFor = [], kind = 'positive') => {
    const subLabel = bankDef.subcats?.[sub]?.[0] || sub;
    const subReason = bankDef.subcats?.[sub]?.[1] || `Describes ${subLabel}.`;
    let reason = subReason;
    if (kind === 'hard_negative') {
      reason = `Mentions ${hardFor.join('/')} but the real problem is ${subLabel}.`;
    } else if (kind === 'confusion') {
      reason = `One detail decides it: this is ${subLabel}, not ${hardFor.join('/')}.`;
    }
    rows.push({
      category: categoryId,
      subcategory: sub,
      severity: sev,
      intent: sev === 'critical' || sev === 'high' ? 'report_hazard' : 'report_issue',
      hard_negative_for: kind === 'hard_negative' ? hardFor : [],
      confusable_categories: confusable,
      text,
      reason,
      kind,
    });
  };

  const expand = (sub, sev, text, hardFor, kind) => {
    if (!text) return;
    const variants = [];
    const withSlots = fillSlots(text, rng);
    variants.push(['identity', withSlots]);
    if (/\{\w+\}/.test(text)) {
      variants.push(['slot', fillSlots(text, rng)]);
      variants.push(['slot', fillSlots(text, rng)]);
      variants.push(['slot', fillSlots(text, rng)]);
      const locMarkers = (withSlots.match(/\b(near|in|at|on)\b/g) || []).length;
      if (locMarkers <= 1) {
        variants.push(['slot2', TRANSFORMS.location(withSlots, rng)]);
        variants.push(['slot3', TRANSFORMS.location(withSlots, rng)]);
      }
    }
    variants.push(['typo', TRANSFORMS.typo(withSlots, rng)]);
    variants.push(['typo', TRANSFORMS.typo(withSlots, rng)]);
    variants.push(['informal', TRANSFORMS.informal(withSlots, rng)]);
    variants.push(['informal', TRANSFORMS.informal(withSlots, rng)]);
    variants.push(['shorten', TRANSFORMS.shorten(withSlots)]);
    variants.push(['punct', TRANSFORMS.punct(withSlots, rng)]);
    variants.push(['punct', TRANSFORMS.punct(withSlots, rng)]);
    variants.push(['urgency', TRANSFORMS.urgency(withSlots, rng)]);
    variants.push(['urgency', TRANSFORMS.urgency(withSlots, rng)]);
    const hl = applyWordMap(withSlots, HINGLISH);
    if (hl.hits > 0) variants.push(['hinglish', hl.text]);
    const kl = applyWordMap(withSlots, KANGLISH);
    if (kl.hits > 0) variants.push(['kanglish', kl.text]);
    const tl = applyWordMap(withSlots, TANGLISH);
    if (tl.hits > 0) variants.push(['tanglish', tl.text]);
    for (const script of ['kn', 'hi', 'te']) {
      const n = TRANSFORMS.native(withSlots, rng, { script });
      if (n.hits > 0) variants.push([`native-${script}`, n.text]);
    }

    const lex = LEXICON[categoryId] || [];
    const seen = new Set();
    for (const [, v] of variants) {
      if (typeof v !== 'string') continue;
      const cleaned = v.replace(/\s+/g, ' ').trim();
      if (cleaned.split(' ').length < 3) continue;
      const key = normalizeKey(cleaned);
      if (!key || seen.has(key)) continue;
      // nonsense guard: output must still signal its own category
      if (lex.length && !lex.some(term => key.includes(normalizeKey(term)))) continue;
      seen.add(key);
      push(sub, sev, cleaned, hardFor, kind);
    }
  };

  for (const [sub, sev, text] of bankDef.positives || []) expand(sub, sev, text, [], 'positive');
  for (const [sub, sev, text, misleading] of bankDef.negatives || []) {
    expand(sub, sev, text, [misleading], 'hard_negative');
  }
  for (const [sub, sev, text, other] of bankDef.confusions || []) {
    expand(sub, sev, text, [other], 'confusion');
  }
  void baseId;
  return rows;
}

export function dedupe(rows) {
  const exact = new Set();
  const out = [];
  const byCatHash = new Map();
  let rejectedExact = 0;
  let rejectedNear = 0;

  for (const r of rows) {
    const key = normalizeKey(r.text);
    if (exact.has(key)) { rejectedExact++; continue; }
    const h = simhash64(r.text);
    const bucket = byCatHash.get(r.category) || [];
    let near = false;
    for (const prev of bucket) {
      if (hamming64(prev.h, h) <= 3) { near = true; break; }
    }
    if (near) { rejectedNear++; continue; }
    exact.add(key);
    bucket.push({ h });
    byCatHash.set(r.category, bucket);
    out.push(r);
  }
  return { rows: out, rejectedExact, rejectedNear };
}
