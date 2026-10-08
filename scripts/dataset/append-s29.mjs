// §29 append: adds the missing unseen-evaluation slices to the EXISTING
// data/priority-scenarios/eval-unseen.jsonl (append only — never regenerated,
// never tuned against). Labels are by construction:
//   * exact-band rows — band taken from the dataset's own conventions for
//     that content family (train.jsonl is unanimous or discriminated by the
//     documented severity rule: blocked road → P2, injury → P1, plain → P3);
//   * narrative rows (historical / movie-story) carry maxPriority:'P2' — the
//     spec only requires "NOT an active emergency" (§28 cases 4/5/22), so the
//     harness measures them as pass when the predicted band is P2–P4 or the
//     engine escalates to human review, never P1.
// Usage: node scripts/dataset/append-s29.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data', 'priority-scenarios/eval-unseen.jsonl');
const existing = fs.readFileSync(FILE, 'utf8').trim().split('\n');
const existingTexts = new Set(existing.map(l => {
  try { return (JSON.parse(l).input?.text || '').toLowerCase().replace(/\s+/g, ' ').trim(); } catch { return ''; }
}));
let nextId = existing.length + 1;

const DEPT = {
  pothole: ['TRAFFIC', 'traffic_pothole', 'BBMP Road Infrastructure', ['BBMP Road Infrastructure', 'Bengaluru Traffic Police']],
  garbage: ['CIVIC', 'civic_garbage', 'BBMP Solid Waste Management', ['BBMP Solid Waste Management']],
  streetlight: ['CIVIC', 'civic_streetlight', 'BESCOM Street Lighting', ['BESCOM Street Lighting']],
  drainage: ['CIVIC', 'civic_drainage', 'BWSSB Sewerage', ['BWSSB Sewerage']],
  water: ['CIVIC', 'civic_water_supply', 'BWSSB Water Supply', ['BWSSB Water Supply']],
  power: ['UTILITIES', 'util_power', 'BESCOM', ['BESCOM']],
  noise: ['ENVIRONMENT', 'env_noise', 'KSPCC / BBMP', ['KSPCC / BBMP']],
  stray: ['CIVIC', 'civic_stray_animals', 'BBMP Animal Control', ['BBMP Animal Control']],
  fire: ['OTHER', 'custom_issue', 'BBMP', ['BBMP Fire and Emergency Services', 'BBMP']],
  accident: ['TRAFFIC', 'traffic_accident', 'Bengaluru Traffic Police', ['Bengaluru Traffic Police', 'Emergency Medical Services']],
  safety: ['PUBLIC_SAFETY', 'safety_harassment', 'Karnataka State Police', ['Karnataka State Police']],
  other: ['OTHER', 'custom_issue', 'BBMP', ['BBMP']],
};
const SLA = { P1: 'EMERGENCY', P2: 'RAPID', P3: 'NORMAL', P4: 'ROUTINE' };
const SIG = {
  P1: [['life_safety', 'immediate_danger'], ['electrical_hazard']],
  P2: [['public_exposure', 'persistence'], ['injury', 'public_exposure']],
  P3: [['persistence']],
  P4: [],
};
const SAFETY_SIG = {
  electrical_hazard: ['electrical_hazard'],
  fire: ['fire_explosion'],
  accident: ['accident_serious_injury'],
  manhole: ['open_manhole'],
  none: [],
};

function detectLang(text) {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  return /[^\x00-\x7F]/.test(text) ? 'en' : 'en';
}

const rows = [];
function add(slice, text, family, band, opts = {}) {
  const [category, subcategory, department, departments] = DEPT[family] || DEPT.other;
  const lang = opts.language || detectLang(text);
  const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (existingTexts.has(norm)) { console.log('SKIP duplicate:', text); return; }
  existingTexts.add(norm);
  const band2 = band;
  rows.push({
    id: `pri_eval_${String(nextId++).padStart(6, '0')}`,
    input: { text, category, subcategory, language: lang },
    language: lang,
    category,
    subcategory,
    expectedPriority: band2,
    ...(opts.maxPriority ? { maxPriority: opts.maxPriority } : {}),
    sourceType: 'SYNTHETIC',
    severitySignals: opts.severitySignals ?? SIG[band2] ?? [],
    safetySignals: opts.safetySignals ?? (opts.safetySig === 'none' ? [] : opts.safetySig ? SAFETY_SIG[opts.safetySig] : []),
    expectedSafetyOverride: opts.override ?? band2 === 'P1',
    expectedSLAClass: SLA[band2],
    department,
    departments,
    explanation: opts.why || `${slice} slice — band by construction from dataset conventions (${family}).`,
    hardNegativeGroup: `s29_${slice}_${rows.length}`,
    archetype: `s29_${slice}`,
    tags: opts.tags || [slice],
    split: 'eval',
  });
}

// ---------------------------------------------------------------------------
// 1. typo (40) — misspellings of known content, labels from conventions
// ---------------------------------------------------------------------------
add('typo', 'live wirr sparking near the school gate, kids r passing by now', 'power', 'P1', { safetySig: 'electrical_hazard', override: true, why: 'Exposed sparking wire — P1 electrical hazard regardless of misspelling.' });
add('typo', 'open manhoel on the road near the bus stop, cover is gone', 'drainage', 'P1', { safetySig: 'manhole', why: 'Uncovered manhole = fall hazard, P1 convention (train unanimous).' });
add('typo', 'shop on fier near the market road, flames coming out', 'fire', 'P1', { safetySig: 'fire', why: 'Active structure fire — P1 (train fire rows unanimous).' });
add('typo', 'big explotion near the shop, people are running away', 'fire', 'P1', { safetySig: 'fire', why: 'Explosion = P1 fire/explosion family.' });
add('typo', 'bike acident near the junction, my leg is fractred', 'accident', 'P1', { safetySig: 'accident', why: 'Accident with fracture — P1 convention.' });
add('typo', 'deep potehole, i fell and my arm is fractred', 'pothole', 'P2', { why: 'Pothole causing fall with fracture = P2 (train discriminator: pothole + injury → P2).' });
add('typo', 'walter logging near the junction, the road is blocked 2 days', 'drainage', 'P2', { why: 'Road blocked by waterlogging ≥2 days = P2 (train convention).' });
add('typo', 'water loging, road bloced since 3 days near the market', 'drainage', 'P2', { why: 'Blocked road waterlogging = P2.' });
add('typo', 'a stray dog bit me near the juntion and bleeding is coming', 'stray', 'P2', { why: 'Dog bite with bleeding = P2 (train discriminator).' });
add('typo', 'sewrage leaking near the lane, smell is bad since 2 days', 'drainage', 'P3', { why: 'Sewage leakage with stench = P3 (train convention).' });
add('typo', 'potehole nia my gate is getting deeper every week', 'pothole', 'P3', { why: 'Routine pothole = P3.' });
add('typo', 'poteholes all over the galli near the school', 'pothole', 'P3', { why: 'Routine potholes = P3.' });
add('typo', 'garbaeg not collected 4 days, stench coming from the bin', 'garbage', 'P3', { why: 'Uncollected garbage = P3 (train unanimous).' });
add('typo', 'garbage not picked since wednesady in our block', 'garbage', 'P3', { why: 'Uncollected garbage = P3.' });
add('typo', 'strt light not wrking on the main road since 3 days', 'streetlight', 'P3', { why: 'Streetlight outage = P3 (train dominant).' });
add('typo', 'streetlite outside my house is completely dusk now', 'streetlight', 'P3', { why: 'Streetlight outage = P3.' });
add('typo', 'drinage blocked near the market, waste water overflowing', 'drainage', 'P3', { why: 'Blocked drain/overflow = P3 (no road-block wording).' });
add('typo', 'no water suppli today in our lane', 'water', 'P3', { why: 'No water supply = P3 (train unanimous).' });
add('typo', 'bijlii gone since afternoon, no power in the house', 'power', 'P3', { why: 'Power outage = P3 (train unanimous).' });
add('typo', 'the noize from construction starts at 5 am, unable to sleep', 'noise', 'P3', { why: 'Noise complaint = P3 (train unanimous).' });
add('typo', 'waterloging at the corner, ankle deep near the bus stop', 'drainage', 'P3', { why: 'Shallow waterlogging = P3 (train discriminator).' });
add('typo', 'galli me potehole ho gaya, paani bhar raha hai', 'pothole', 'P3', { language: 'hl', why: 'Hinglish routine pothole = P3.' });
add('typo', 'streetlite not wrking near the junction, darkness everywhere', 'streetlight', 'P3', { language: 'hl', why: 'Streetlight outage = P3.' });
add('typo', 'ರಸ್ತೆಯ ಗುಂಡಿ ತುಂಬಾ ಆಳವಾಗಿದೆ, ವಾಹನ ಓಡಾಡೋಕೆ ಕಷ್ಟ', 'pothole', 'P3', { why: 'Kannada routine pothole = P3.' });
add('typo', 'ಬೀದಿ ದೀಪ ಕೆಟ್ಟಿದೆ, ರಾತ್ರಿ ಕತ್ತಲಾಗಿದೆ', 'streetlight', 'P3', { why: 'Kannada streetlight outage = P3.' });
add('typo', 'गड्ढा बहुत गहरा हो गया है, गाड़ियाँ फँस रही हैं', 'pothole', 'P3', { why: 'Hindi routine pothole = P3.' });
add('typo', 'पानी की टंकी से सप्लाई नहीं आ रही है आज', 'water', 'P3', { why: 'Hindi no-water = P3.' });
add('typo', 'స్ట్రీట్ లైట్ పనిచేయడం లేదు, రాత్రి చీకటిగా ఉంది', 'streetlight', 'P3', { why: 'Telugu streetlight outage = P3.' });
add('typo', 'డ్రైనేజీ బ్లాక్ అయింది, నీరు రోడ్డుపై పోతోంది', 'drainage', 'P3', { why: 'Telugu blocked drain = P3.' });
add('typo', 'kachra bin ke paas se smell aa rahi hai, garbage rotting', 'garbage', 'P3', { language: 'hl', why: 'Garbage stench = P3.' });
add('typo', 'nali band ho gayi hai, gandi paani sadak par', 'drainage', 'P3', { language: 'hl', why: 'Hinglish blocked drain = P3.' });
add('typo', 'drinage water stagnating near the temple street for a week', 'drainage', 'P3', { why: 'Stagnant drain water = P3.' });
add('typo', 'stagnent water near the crossing, mosquito menace', 'drainage', 'P3', { why: 'Stagnant water nuisance = P3.' });
add('typo', 'the footpth is broken and slanted near the corner', 'pothole', 'P3', { why: 'Broken footpath is a routine road defect = P3 family.' });
add('typo', 'bijli fluctuting constantly, fan running slow', 'power', 'P3', { language: 'hl', why: 'Power fluctuation = P3 family.' });
add('typo', 'no water suppli in the whole lane since yesterday morning', 'water', 'P3', { why: 'No water supply = P3.' });
add('typo', 'streat light not working, dogs sleeping on the road', 'streetlight', 'P3', { why: 'Streetlight outage = P3.' });
add('typo', 'thank you for fixing the strt light near the cross', 'streetlight', 'P4', { override: false, why: 'Resolved-issue thanks = P4 (train convention).' });
add('typo', 'thanks for fixing the streetlite near the bus stop', 'streetlight', 'P4', { override: false, why: 'Resolved-issue thanks = P4.' });
add('typo', 'thank you for lifting the garbaeg on time today', 'garbage', 'P4', { override: false, why: 'Resolved-issue thanks = P4.' });

// ---------------------------------------------------------------------------
// 2. stt (20) — speech-to-text style errors (homophones, fillers, dropped words)
// ---------------------------------------------------------------------------
add('stt', 'walter logging on eighty feet road, cars r stuck', 'drainage', 'P2', { tags: ['stt', 'typo'], why: 'STT homophone walter→water; blocked road = P2.' });
add('stt', 'water pooling on the main road, vehicle stuck since two days', 'drainage', 'P2', { why: 'Blocked road waterlogging = P2.' });
add('stt', 'sparking from the whire near the school one', 'power', 'P1', { safetySig: 'electrical_hazard', tags: ['stt', 'typo'], why: 'Sparking wire = P1 regardless of STT noise.' });
add('stt', 'there is a live wire down near the junction i think', 'power', 'P1', { safetySig: 'electrical_hazard', why: 'Live wire = P1.' });
add('stt', 'uh there is a big pothole near my gate uh', 'pothole', 'P3', { why: 'Filler words; routine pothole = P3.' });
add('stt', 'umm the street light near my house is not working since two days', 'streetlight', 'P3', { why: 'Filler words; streetlight outage = P3.' });
add('stt', 'no light on the stret since two days i guess', 'streetlight', 'P3', { tags: ['stt', 'typo'], why: 'STT homophone stret→street; outage = P3.' });
add('stt', 'i think the drainage line is blocked near our gate', 'drainage', 'P3', { why: 'Blocked drain = P3.' });
add('stt', 'sounds like the singal is not changing for hours now', 'other', 'P3', { tags: ['stt', 'typo'], why: 'Signal malfunction = routine transport issue, P3 family.' });
add('stt', 'the garbage van has not come this week i guess', 'garbage', 'P3', { why: 'Missed garbage collection = P3.' });
add('stt', 'water is not coming in the tap since morning sir', 'water', 'P3', { why: 'No water = P3.' });
add('stt', 'uh the drain near the market is overflowing again i think', 'drainage', 'P3', { why: 'Drain overflow = P3.' });
add('stt', 'i guess someone hit my parked bike and ran away', 'accident', 'P2', { why: 'Hit-and-run on parked vehicle without reported injury = P2 family (accident non-injury).' });
add('stt', 'there was a small fire in the kitchen but its out now', 'fire', 'P3', { override: false, safetySig: 'none', tags: ['stt'], why: 'Explicitly extinguished kitchen fire — resolved, not active (deny rule); residual complaint = P3 family.' });
add('stt', 'paani supply is zero since morning full problem', 'water', 'P3', { language: 'hl', why: 'No water supply = P3.' });
add('stt', 'ಹೋಸ್ ಪೈಪ್ ಒಡೆದು ನೀರು ರಸ್ತೆಗೆ ಬರ್ತಿದೆ', 'water', 'P2', { why: 'Kannada burst supply pipe flooding = P2 family (supply failure, road affected).' });
add('stt', 'बिजली का तार नीचे गिरा है, खतरा है', 'power', 'P1', { safetySig: 'electrical_hazard', why: 'Hindi fallen live wire = P1.' });
add('stt', 'కరెంటు తీగ రోడ్డు మీద పడింది, ప్రమాదం', 'power', 'P1', { safetySig: 'electrical_hazard', why: 'Telugu fallen live wire = P1.' });
add('stt', 'i think there is an accident near the flyover people shouting', 'accident', 'P1', { safetySig: 'accident', why: 'Accident report = P1 family.' });
add('stt', 'the buss stand board is broken no one is fixing it', 'other', 'P3', { tags: ['stt', 'typo'], why: 'Damaged bus-stop signage = routine transport defect P3 family.' });

// ---------------------------------------------------------------------------
// 3. slang (25) — colloquial phrasing, labels from content conventions
// ---------------------------------------------------------------------------
add('slang', 'this pothole is a total nightmare yaar, cars keep scraping bottom', 'pothole', 'P3', { why: 'Routine pothole = P3; slang wrapper.' });
add('slang', 'the garbage situation here is disgusting dude, full stink everywhere', 'garbage', 'P3', { why: 'Garbage complaint = P3; slang wrapper.' });
add('slang', 'bloody streetlight outside my gate has been dead for a week now', 'streetlight', 'P3', { why: 'Streetlight outage = P3; slang wrapper.' });
add('slang', 'the DJ last night was brutal yaar, could not sleep at all', 'noise', 'P3', { why: 'Noise complaint = P3; slang wrapper.' });
add('slang', 'paani supply is so useless dude, zero pressure since morning', 'water', 'P3', { language: 'hl', why: 'Low/no water pressure = P3; slang wrapper.' });
add('slang', 'bijli bill is fine but power is gone again lol what is this', 'power', 'P3', { language: 'hl', why: 'Power outage = P3; slang wrapper.' });
add('slang', 'some goons are beating a guy near the bus stop right now, mad scary', 'safety', 'P1', { safetySig: 'none', why: 'Active beating = serious violence, P1 safety family.' });
add('slang', 'a dude on a bike snatched my chain near the signal, what a mess', 'safety', 'P1', { safetySig: 'none', why: 'Chain snatching = violent crime, P1 safety family.' });
add('slang', 'these stray dogs are so aggressive yaar, chasing everyone here', 'stray', 'P3', { why: 'Aggressive strays without bite = P3 family (no-bleeding discriminator).' });
add('slang', 'water logging is ankle deep only thoda sa but annoying as hell', 'drainage', 'P3', { language: 'hl', why: 'Shallow waterlogging = P3.' });
add('slang', 'the drain is totally jammed yaar, dirty water spilling onto the road', 'drainage', 'P3', { why: 'Blocked drain spilling = P3 (no sustained road-block wording).' });
add('slang', 'auto anna blocked the footpath again full arrogant parking', 'other', 'P3', { language: 'hl', why: 'Footpath obstruction = routine civic nuisance, P3 family.' });
add('slang', 'this construction noise starts at bloody 5 am every single day', 'noise', 'P3', { why: 'Morning construction noise = P3.' });
add('slang', 'kachra has not been lifted for days yaar and the smell is killer', 'garbage', 'P3', { language: 'hl', why: 'Uncollected garbage = P3.' });
add('slang', 'the road in front is legit destroyed lol full craters everywhere', 'pothole', 'P3', { why: 'Road craters/potholes = P3; slang wrapper.' });
add('slang', 'scooter slipped on the oily patch near the junction i fell down bad', 'accident', 'P2', { why: 'Fall on road surface with reported impact = non-vehicle-collision accident, P2 family.' });
add('slang', 'somebody chucked a full bag of trash on the corner again morons', 'garbage', 'P3', { why: 'Dumping complaint = P3.' });
add('slang', 'my landlord is being a total jerk about the deposit yaar any help', 'other', 'P3', { why: 'Tenancy dispute = routine housing issue, P3 family.' });
add('slang', 'the transformer near our lane keeps sparking like crazy scary stuff', 'power', 'P1', { safetySig: 'electrical_hazard', why: 'Sparking transformer = electrical hazard, P1.' });
add('slang', 'smoke is coming from the old building wall something is burning i think', 'fire', 'P1', { safetySig: 'fire', why: 'Smoke/fire迹象 = active fire hazard, P1.' });
add('slang', 'honestly this stinky drain water is disgusting af near the school', 'drainage', 'P3', { why: 'Drain stench = P3; slang wrapper.' });
add('slang', 'the bus conductors are being rude again and full drama at the stop', 'other', 'P3', { why: 'Service-staff conduct complaint = routine transport issue P3 family.' });
add('slang', 'footpath is a joke yaar broken slabs everywhere people walking on road', 'pothole', 'P3', { why: 'Broken footpath = P3 family.' });
add('slang', 'water supply today is pathetic dude literally dripping only', 'water', 'P3', { why: 'Trickling supply = P3 family.' });
add('slang', 'some idiots are burning trash near the playground again thick smoke', 'fire', 'P2', { override: false, safetySig: 'none', why: 'Open trash burning with smoke = hazardous nuisance, P2 family (not structure fire).' });

// ---------------------------------------------------------------------------
// 4. very_short (25) — <= 3 words, conservative labels (spec §8)
// ---------------------------------------------------------------------------
add('very_short', 'open manhole', 'drainage', 'P1', { safetySig: 'manhole', why: 'Short safety-critical input stays conservative = P1 (spec §8/§28).' });
add('very_short', 'live wire sparking', 'power', 'P1', { safetySig: 'electrical_hazard', why: 'Short electrical hazard = P1.' });
add('very_short', 'accident now', 'accident', 'P1', { safetySig: 'accident', why: 'Short accident + now = P1.' });
add('very_short', 'fire', 'fire', 'P1', { safetySig: 'fire', why: 'Bare safety term must not collapse to P4 (spec §28 case 21).' });
add('very_short', 'building collapsing', 'fire', 'P1', { safetySig: 'none', why: 'Short structural collapse = P1 safety family.' });
add('very_short', 'someone kidnapped', 'safety', 'P1', { safetySig: 'none', why: 'Short kidnapping = P1 serious crime with review (spec §8).' });
add('very_short', 'manhole open', 'drainage', 'P1', { safetySig: 'manhole', why: 'Open manhole = P1.' });
add('very_short', 'big pothole', 'pothole', 'P3', { why: 'Recognised but routine = P3, not auto-P4 (spec §8).' });
add('very_short', 'garbage stink', 'garbage', 'P3', { why: 'Garbage nuisance = P3.' });
add('very_short', 'streetlight broken', 'streetlight', 'P3', { why: 'Streetlight outage = P3.' });
add('very_short', 'no water', 'water', 'P3', { why: 'No-water complaint = P3 (not a denial of a report).' });
add('very_short', 'no power today', 'power', 'P3', { why: 'Power outage = P3.' });
add('very_short', 'water logging', 'drainage', 'P3', { why: 'Bare waterlogging without blockage = P3.' });
add('very_short', 'drain blocked', 'drainage', 'P3', { why: 'Blocked drain = P3.' });
add('very_short', 'sewage smell', 'drainage', 'P3', { why: 'Sewage stench = P3.' });
add('very_short', 'loud noise', 'noise', 'P3', { why: 'Noise complaint = P3.' });
add('very_short', 'dogs barking', 'stray', 'P3', { why: 'Barking nuisance = P3 family.' });
add('very_short', 'guinea road damaged', 'pothole', 'P3', { tags: ['very_short', 'typo'], why: 'Road damage = P3; typo+short combined slice.' });
add('very_short', 'ಗುಂಡಿ', 'pothole', 'P3', { why: 'Kannada single-word pothole = P3.' });
add('very_short', 'गड्ढा', 'pothole', 'P3', { why: 'Hindi single-word pothole = P3.' });
add('very_short', 'గుంత', 'pothole', 'P3', { why: 'Telugu single-word pothole = P3.' });
add('very_short', 'ಕಸ ಸಂಗ್ರಹಣೆ ಆಗಿಲ್ಲ', 'garbage', 'P3', { why: 'Kannada uncollected garbage = P3.' });
add('very_short', 'पानी नहीं आ रहा', 'water', 'P3', { why: 'Hindi no water = P3.' });
add('very_short', 'thanks for fixing', 'streetlight', 'P4', { override: false, why: 'Resolved thanks = P4 family.' });
add('very_short', 'issue resolved thanks', 'other', 'P4', { override: false, why: 'Resolved thanks = P4.' });

// ---------------------------------------------------------------------------
// 5. ambiguous (10) — recognisable but underspecified → default non-emergency
// ---------------------------------------------------------------------------
add('ambiguous', 'water on the road', 'drainage', 'P3', { tags: ['ambiguous'], why: 'Ambiguous cause, no severity signal → conservative P3 with clarification.' });
add('ambiguous', 'there is a problem near the bus stop', 'other', 'P3', { tags: ['ambiguous'], why: 'Underspecified civic problem → P3 default.' });
add('ambiguous', 'something is blocking the way', 'pothole', 'P3', { tags: ['ambiguous'], why: 'Underspecified obstruction → P3 default.' });
add('ambiguous', 'the light near my house is not proper', 'streetlight', 'P3', { tags: ['ambiguous'], why: 'Ambiguous lighting issue → P3 default.' });
add('ambiguous', 'sound issue at night', 'noise', 'P3', { tags: ['ambiguous'], why: 'Ambiguous noise issue → P3 default.' });
add('ambiguous', 'transport problem today', 'other', 'P3', { tags: ['ambiguous'], why: 'Ambiguous transport issue → P3 default.' });
add('ambiguous', 'road looks bad near the junction', 'pothole', 'P3', { tags: ['ambiguous'], why: 'Ambiguous road condition → P3 default.' });
add('ambiguous', 'service is not working properly', 'other', 'P3', { tags: ['ambiguous'], why: 'Ambiguous service issue → P3 default.' });
add('ambiguous', 'there is a bad smell somewhere here', 'drainage', 'P3', { tags: ['ambiguous'], why: 'Ambiguous smell source → P3 default.' });
add('ambiguous', 'the junction looks unsafe somehow', 'other', 'P3', { tags: ['ambiguous'], why: 'Vague safety concern without hazard detail → P3 with review.' });

// ---------------------------------------------------------------------------
// 6. multi_issue (10) — several problems in one report (spec §11)
// ---------------------------------------------------------------------------
add('multi_issue', 'the drain is blocked and water is logging, also the streetlight nearby stopped working', 'drainage', 'P3', { tags: ['multi_issue'], why: 'Dominant specific issue (drain) sets the band, secondary in text (spec §11).' });
add('multi_issue', 'pothole outside my gate plus the garbage bin smells terrible', 'pothole', 'P3', { tags: ['multi_issue'], why: 'Both routine civic → P3 by dominant content.' });
add('multi_issue', 'water logging on the main road and two potholes are submerged deep', 'drainage', 'P2', { tags: ['multi_issue'], why: 'Blocked/serious waterlogging dominates → P2.' });
add('multi_issue', 'streetlight is dead and someone smashed the bus stop glass', 'other', 'P3', { tags: ['multi_issue'], why: 'Most urgent specific item (vandalised shelter) sets P3-family band.' });
add('multi_issue', 'a bike accident near the junction and the signal is also not working', 'accident', 'P1', { safetySig: 'accident', tags: ['multi_issue'], why: 'Safety issue dominates (spec §11): accident with potential injury → P1.' });
add('multi_issue', 'garbage not collected and stray dogs are roaming over it', 'garbage', 'P3', { tags: ['multi_issue'], why: 'Garbage dominates, dogs secondary → P3.' });
add('multi_issue', 'the drain overflow plus foul smell near the school gate', 'drainage', 'P3', { tags: ['multi_issue'], why: 'Drain overflow + smell = P3 family.' });
add('multi_issue', 'no water supply since morning and the tap outside is leaking all day', 'water', 'P3', { tags: ['multi_issue'], why: 'Supply failure dominates → P3.' });
add('multi_issue', 'sewage overflow blocking the footpath and people walking on road', 'drainage', 'P2', { tags: ['multi_issue'], why: 'Footpath blockage forcing pedestrians = exposure → P2 family.' });
add('multi_issue', 'noise from the club and parking chaos outside the gate', 'noise', 'P3', { tags: ['multi_issue'], why: 'Both routine → P3 by dominant content.' });

// ---------------------------------------------------------------------------
// 7. cause_vs_consequence (10) — classify the cause (spec §10)
// ---------------------------------------------------------------------------
add('cause_vs_consequence', 'a burst water pipe near the junction is causing flooding on the road', 'water', 'P2', { tags: ['cause_vs_consequence'], why: 'Cause = burst pipe (supply), consequence = flooding; road affected → P2 family.' });
add('cause_vs_consequence', 'the transformer sparked and that is why the whole street has no power now', 'power', 'P1', { safetySig: 'electrical_hazard', tags: ['cause_vs_consequence'], why: 'Cause = sparking transformer (hazard) dominates over the outage consequence → P1.' });
add('cause_vs_consequence', 'sewer line burst under the road causing dirty water everywhere', 'drainage', 'P2', { tags: ['cause_vs_consequence'], why: 'Cause = burst sewer with spread → P2 family.' });
add('cause_vs_consequence', 'tree fell on the wire because of last night storm, wire down now', 'power', 'P1', { safetySig: 'electrical_hazard', tags: ['cause_vs_consequence'], why: 'Cause chain ends in downed wire → electrical hazard P1.' });
add('cause_vs_consequence', 'construction digging made the road sink, now bikes are falling', 'pothole', 'P2', { tags: ['cause_vs_consequence'], why: 'Cause = sunken road from digging, falling risk → P2 family.' });
add('cause_vs_consequence', 'the drain clogging is why the water entered my house today', 'drainage', 'P2', { tags: ['cause_vs_consequence'], why: 'Cause = clogged drain, consequence = indoor flooding → P2 family.' });
add('cause_vs_consequence', 'broken sewage pipe is the reason for the stench in the whole lane', 'drainage', 'P3', { tags: ['cause_vs_consequence'], why: 'Cause = broken pipe, stench consequence → P3 family.' });
add('cause_vs_consequence', 'faulty streetlight wiring is sparking and the light flickers all night', 'streetlight', 'P1', { safetySig: 'electrical_hazard', tags: ['cause_vs_consequence'], why: 'Sparking wiring dominates over flicker complaint → P1.' });
add('cause_vs_consequence', 'the auto stand encroachment is blocking the footpath near the market', 'other', 'P3', { tags: ['cause_vs_consequence'], why: 'Cause = encroachment, consequence = blocked footpath → P3 family.' });
add('cause_vs_consequence', 'because the valve was left open the lane is flooded since morning', 'water', 'P2', { tags: ['cause_vs_consequence'], why: 'Cause = open valve, consequence = lane flooding → P2 family.' });

// ---------------------------------------------------------------------------
// 8. historical (30, maxPriority P2) — past events are never active (§34.8)
// ---------------------------------------------------------------------------
add('historical', 'a murder happened last year near the market, the case is closed now', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical serious crime — not an active emergency (spec §28 case 4).' });
add('historical', 'in 2021 a transformer exploded here, back then the street was dark for days', 'power', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Past explosion, no current hazard claim → never P1.' });
add('historical', 'the flood in 2019 washed away this road, it was never repaired then', 'drainage', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical flood narrative → never active P1.' });
add('historical', 'an accident near the junction last year took a life, case long closed', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical fatal accident, closed → never P1.' });
add('historical', 'a kidnapping case from 2015 was solved long back in the city', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical kidnapping, resolved → never P1.' });
add('historical', 'the shop fire in 2019 destroyed two shops here, matter is closed', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical fire, closed → never P1.' });
add('historical', 'there was a stabbing outside the bar in 2018, the case is closed', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical violent crime, closed → never P1.' });
add('historical', 'this building wall collapsed five years ago and was rebuilt then', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Past collapse, repaired → never P1.' });
add('historical', 'a gas cylinder exploded here months ago, everything is normal now', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Past explosion with explicit normal-now → never P1.' });
add('historical', 'last year someone was attacked near the bus stop, case transferred already', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical attack, case moved on → never P1.' });
add('historical', 'the old case about the stolen bike from 2019 is still pending they say', 'other', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Old unresolved case is administrative, not an active emergency.' });
add('historical', 'in 2020 the lake overflowed and flooded the colony, that problem ended after that week', 'drainage', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical flooding with explicit end → never P1.' });
add('historical', 'a murder was reported here last year, police closed the case finally', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical murder, closed → never P1.' });
add('historical', 'the accident on this curve in 2017 was very famous, road was fixed after', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical accident, road fixed → never P1.' });
add('historical', 'an explosion in the factory happened two years ago, plant shut since', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical explosion, plant closed → never P1.' });
add('historical', 'kidnapping of that child happened in 2016, they caught the person long back', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical kidnapping, resolved → never P1.' });
add('historical', 'burning of the car here was in 2019, matter closed by police', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical vehicle fire, closed → never P1.' });
add('historical', 'the live wire accident happened last year during the rains, case closed', 'power', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical electrical accident, closed → never P1.' });
add('historical', 'ಕಳೆದ ವರ್ಷ ಇಲ್ಲಿ ಅಪಘಾತ ಆಗಿತ್ತು, ಪ್ರಕರಣ ಮುಗಿದಿದೆ', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Kannada historical accident, closed → never P1.' });
add('historical', '2018ರಲ್ಲಿ ಇಲ್ಲಿ ಬೆಂಕಿ ಅನಾಹುತ ಆಗಿತ್ತು, ಆಮೇಲೆ ಸರಿ ಮಾಡಿದರು', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Kannada historical fire, repaired → never P1.' });
add('historical', 'पिछले साल यहाँ आग लगी थी, मामला बंद हो गया', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Hindi historical fire, closed → never P1.' });
add('historical', '2019 में यहाँ एक्सीडेंट हुआ था, केस ख़त्म हो चुका है', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Hindi historical accident, closed → never P1.' });
add('historical', 'గత సంవత్సరం ఇక్కడ ప్రమాదం జరిగింది, కేసు ముగిసింది', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Telugu historical accident, closed → never P1.' });
add('historical', '2020లో ఇక్కడ అగ్నిప్రమాదం జరిగింది, అప్పట్లోనే అన్నీ సరిచేశారు', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Telugu historical fire, repaired → never P1.' });
add('historical', 'that theft incident from two years ago was never solved i guess', 'other', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Old theft narrative, not active → never P1.' });
add('historical', 'the manhole accident here happened long back, cover was fixed then', 'drainage', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical manhole accident, fixed → never P1.' });
add('historical', 'noise complaint against that club was from 2019 they moved away later', 'noise', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical noise case, resolved → never P1.' });
add('historical', 'a dog bite case happened here months ago, treatment completed then', 'stray', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical bite, treated → never P1.' });
add('historical', 'the harassment complaint near that office was from last year, resolved by now', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical harassment, resolved → never P1.' });
add('historical', 'the flooding of this underpass happened only in the 2022 rains, cleared after', 'drainage', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Historical underpass flooding, cleared → never P1.' });

// ---------------------------------------------------------------------------
// 9. active (30) — present-tense events; exact bands (twin of historical)
// ---------------------------------------------------------------------------
add('active', 'a murder happened near the market just now, police are here', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Present serious crime → active handling (historical twin).' });
add('active', 'a transformer exploded here just now, sparks are flying still', 'power', 'P1', { safetySig: 'electrical_hazard', tags: ['active'], why: 'Active explosion + sparks = P1 (historical twin).' });
add('active', 'the flood water has washed away the road today, traffic stuck completely', 'drainage', 'P2', { tags: ['active'], why: 'Active flooding with road impact = P2 (historical twin).' });
add('active', 'an accident at the junction right now, an injured person is on the road', 'accident', 'P1', { safetySig: 'accident', tags: ['active'], why: 'Active accident with injury = P1.' });
add('active', 'a kidnapping is being reported from this area right now, kids missing', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active kidnapping report = P1 with review.' });
add('active', 'the shop is on fire right now near the market, flames are visible', 'fire', 'P1', { safetySig: 'fire', tags: ['active'], why: 'Active structure fire = P1.' });
add('active', 'someone is being attacked near the bus stop right now, please hurry', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Attack in progress = P1 (spec §28 case 3).' });
add('active', 'the wall of the building is collapsing right now, people are running', 'fire', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active structural collapse = P1.' });
add('active', 'a stabbing happened outside the bar just now, blood on the road', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active violent crime = P1 with review.' });
add('active', 'the gas cylinder exploded in the kitchen just now, everyone is out now', 'fire', 'P1', { safetySig: 'fire', tags: ['active'], why: 'Active explosion = P1.' });
add('active', 'the wall collapsed on the footpath today morning, debris everywhere', 'fire', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active collapse = P1.' });
add('active', 'live wire fell on the road just now and is sparking still', 'power', 'P1', { safetySig: 'electrical_hazard', tags: ['active'], why: 'Active sparking wire = P1.' });
add('active', 'the accident on this curve just now injured two people seriously', 'accident', 'P1', { safetySig: 'accident', tags: ['active'], why: 'Active serious accident = P1.' });
add('active', 'an explosion in the factory happened just now, smoke is rising', 'fire', 'P1', { safetySig: 'fire', tags: ['active'], why: 'Active explosion = P1.' });
add('active', 'the manhole cover is missing right now, people are walking past it', 'drainage', 'P1', { safetySig: 'manhole', tags: ['active'], why: 'Active open manhole = P1.' });
add('active', 'a theft is happening at the shop right now, they are shouting', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Crime in progress = P1 with review.' });
add('active', 'the child was kidnapped from this street today, search is on', 'safety', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active kidnapping = P1 with review.' });
add('active', 'this building wall collapsed only today, repair team has not come', 'fire', 'P1', { safetySig: 'none', tags: ['active'], why: 'Active collapse = P1.' });
add('active', 'the car fire near the lake is still burning now, flames high', 'fire', 'P1', { safetySig: 'fire', tags: ['active'], why: 'Active vehicle fire = P1.' });
add('active', 'waterlogging on the main road right now, road blocked since 2 days', 'drainage', 'P2', { tags: ['active'], why: 'Active blocked-road waterlogging = P2 (historical twin).' });
add('active', 'the old case about the stolen bike is reopened today, they found clues', 'other', 'P2', { tags: ['active'], why: 'Reopened active case = P2 family, not historical.' });
add('active', 'a dog bite just happened here, bleeding needs attention now', 'stray', 'P2', { tags: ['active'], why: 'Fresh bite with bleeding = P2.' });
add('active', 'the lake overflowed into the colony today, water entering houses now', 'drainage', 'P2', { tags: ['active'], why: 'Active flooding entering homes = P2.' });
add('active', 'the streetlight near my gate is still not working today, third day', 'streetlight', 'P3', { tags: ['active'], why: 'Ongoing outage = P3.' });
add('active', 'the club noise is happening tonight again, same loud music now', 'noise', 'P3', { tags: ['active'], why: 'Ongoing noise = P3.' });
add('active', 'garbage has not been lifted today also, bin is overflowing now', 'garbage', 'P3', { tags: ['active'], why: 'Ongoing garbage = P3.' });
add('active', 'no water supply today morning in our lane, tanker not sent', 'water', 'P3', { tags: ['active'], why: 'Ongoing no-water = P3.' });
add('active', 'power has been gone since afternoon today, no notice from BESCOM', 'power', 'P3', { tags: ['active'], why: 'Ongoing outage = P3.' });
add('active', 'the drain outside is clogged again today, dirty water on the path', 'drainage', 'P3', { tags: ['active'], why: 'Ongoing drain blockage = P3.' });
add('active', 'the harassment near that office is happening again today, same man', 'safety', 'P2', { tags: ['active'], why: 'Ongoing harassment report = active P2 family with review.' });

// ---------------------------------------------------------------------------
// 10. movie_story (30, maxPriority P2) — fiction never active (§34.9)
// ---------------------------------------------------------------------------
add('movie_story', 'there is a murder in the movie I am watching', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction murder — must never be P1 (spec §28 case 5).' });
add('movie_story', 'the novel describes an explosion at the factory', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction explosion — narrative, never active P1.' });
add('movie_story', 'in this movie the villain blows up a building in the climax', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction explosion — never active P1.' });
add('movie_story', 'a scene from the film shows a kidnapping on a busy street', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction kidnapping — never active P1.' });
add('movie_story', 'the actor dies in the film climax after the fight scene', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction death — never active P1.' });
add('movie_story', 'the story in the book ends with a murder at the junction', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction murder — never active P1.' });
add('movie_story', 'a movie about a kidnapping in the city is trending online', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction kidnapping — never active P1.' });
add('movie_story', 'the web series shows a stabbing inside the old market area', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction stabbing — never active P1.' });
add('movie_story', 'in the series episode the hero gets shot near the lake', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction shooting — never active P1.' });
add('movie_story', 'the cartoon shows the villain setting fire to the school', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Cartoon fiction fire — never active P1.' });
add('movie_story', 'a scene from the movie shows the wall collapsing on the street', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction collapse — never active P1.' });
add('movie_story', 'the novel i am reading describes a gas leak in the colony', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction gas leak — never active P1.' });
add('movie_story', 'the film shows a live wire falling on a crowd during the storm', 'power', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction electrical accident — never active P1.' });
add('movie_story', 'the episode ends with the building exploding over the hero', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction explosion — never active P1.' });
add('movie_story', 'in the movie the kidnapper demands ransom in the second half', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction kidnapping — never active P1.' });
add('movie_story', 'the screenplay i am writing has an accident scene on the flyover', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Scripted fiction accident — never active P1.' });
add('movie_story', 'the story describes a bomb blast at the bus stand in chapter four', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction blast — never active P1.' });
add('movie_story', 'the drama on stage shows a murder during the festival scene', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Staged fiction murder — never active P1.' });
add('movie_story', 'comic book shows the hero fighting goons near the market road', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Comic fiction violence — never active P1.' });
add('movie_story', 'the anime episode shows the villain dropping a car from the bridge', 'accident', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Animation fiction incident — never active P1.' });
add('movie_story', 'the fiction book i bought describes a flood drowning the town', 'drainage', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction flooding — never active P1.' });
add('movie_story', 'the play at the auditorium ends with the actor being stabbed', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Staged fiction stabbing — never active P1.' });
add('movie_story', 'ಈ ಸಿನಿಮಾದಲ್ಲಿ ಕೊಲೆ ನಡೆಯುತ್ತದೆ ಕ್ಲೈಮಾಕ್ಸ್‌ನಲ್ಲಿ', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Kannada fiction murder — never active P1.' });
add('movie_story', 'ಆ ಕಥೆಯಲ್ಲಿ ಅನಾಹುತ ನಡೆಯುತ್ತದೆ ಕಾರ್ಖಾನೆಯಲ್ಲಿ', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Kannada fiction accident — never active P1.' });
add('movie_story', 'इस फ़िल्म में अपहरण की कहानी है दूसरे हिस्से में', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Hindi fiction kidnapping — never active P1.' });
add('movie_story', 'उस उपन्यास में फैक्टरी में विस्फोट का दृश्य है', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Hindi fiction explosion — never active P1.' });
add('movie_story', 'ఈ సినిమాలో హత్య సన్నివేశం ఉంది క్లైమాక్స్‌లో', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Telugu fiction murder — never active P1.' });
add('movie_story', 'ఆ కథలో పేలుడు సంఘటన ఉంది కర్మాగారంలో', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Telugu fiction explosion — never active P1.' });
add('movie_story', 'the ghost story ends with the old building catching fire at midnight', 'fire', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Fiction fire — never active P1.' });
add('movie_story', 'based on a true story movie shows a kidnapping near the school gate', 'safety', 'P2', { maxPriority: 'P2', override: false, safetySig: 'none', why: 'Film narrative kidnapping — never active P1.' });

// ---------------------------------------------------------------------------
// append
// ---------------------------------------------------------------------------
for (const r of rows) existing.push(JSON.stringify(r));
fs.writeFileSync(FILE, existing.join('\n') + '\n');

const bySlice = {};
const byBand = {};
for (const r of rows) {
  const slice = r.archetype.replace('s29_', '');
  bySlice[slice] = (bySlice[slice] || 0) + 1;
  const b = r.maxPriority ? `${r.expectedPriority}(soft)` : r.expectedPriority;
  byBand[b] = (byBand[b] || 0) + 1;
}
console.log(`appended ${rows.length} rows -> eval-unseen.jsonl now ${existing.length}`);
console.log('by slice:', JSON.stringify(bySlice));
console.log('by band:', JSON.stringify(byBand));
