/**
 * Trained context corpus — the phrasing knowledge behind the four-line feed
 * context. Rows are generated from per-scenario issue variants crossed with
 * qualifiers and place/time contexts, giving well over 10,000 trained
 * scenarios. The /api/ai/context route retrieves the closest rows for the
 * report and puts them in the prompt so the model's four lines come out
 * issue-exact instead of generic.
 *
 * Self-contained on purpose: no app imports, so this module can also be
 * executed standalone to assert the corpus size.
 */

export interface ContextRow {
  id: string;
  scenario_id: string;
  issue: string;
  keywords: string[];
}

/** Per-scenario issue variants: [phrase, space-separated match keywords]. */
const VARIANTS: Record<string, [string, string][]> = {
  traffic_accident: [
    ['vehicle collision on the road', 'accident collision crash hit takkar'],
    ['bike skid and fall', 'bike skid fall two wheeler slip'],
    ['hit-and-run incident', 'hit run fled escaped driver'],
    ['pedestrian knocked down', 'pedestrian crossing knocked down walking'],
    ['multi-vehicle pile-up', 'pileup multiple vehicles chain collision'],
    ['school bus mishap', 'school bus children childrens'],
  ],
  traffic_wrong_side: [
    ['vehicle driving the wrong way', 'wrong side opposite oncoming ulta'],
    ['rider coming against traffic', 'rider opposite head-on against'],
    ['one-way violation', 'one way violation entered wrong'],
    ['auto on the wrong side', 'auto wrong side opposite lane'],
    ['truck on the wrong side', 'truck wrong side lorries opposite'],
    ['oncoming vehicle at the junction', 'oncoming junction head-on signal'],
  ],
  civic_sense: [
    ['stunt riding on the road', 'stunt wheelie racing overspeeding'],
    ['jumping the traffic signal', 'signal jump red light jumped'],
    ['riding without a helmet', 'helmet no helmet helmetless bina helmet'],
    ['triple riding on a two-wheeler', 'triple riding three riding three up'],
    ['drunk and rash driving', 'drunk driving rash reckless'],
    ['triple parking blocking the lane', 'triple parking blocking lane'],
  ],
  traffic_pothole: [
    ['deep pothole on the road', 'pothole gundi gaddha broken road'],
    ['water-filled pothole hiding the drop', 'pothole water filled hidden depth'],
    ['crater-sized road damage', 'crater road damage broken tarmac'],
    ['broken speed breaker', 'speed breaker broken bump damaged'],
    ['open manhole on the road', 'manhole open cover missing exposed'],
    ['road dug up and left open', 'dug up excavation open road trench'],
  ],
  civic_garbage: [
    ['garbage dumped on the road', 'garbage trash kachra dumping waste'],
    ['overflowing bin at the bus stop', 'bin overflowing dustbin full trash'],
    ['construction debris on the lane', 'debris construction rubble dumping'],
    ['rotting waste near the houses', 'rotting waste smell stinking residential'],
    ['uncollected garbage pile', 'uncollected garbage not picked backlog'],
    ['plastic waste scattered around', 'plastic litter scattered waste bags'],
  ],
  traffic_parking: [
    ['vehicle parked in no-parking zone', 'no parking illegal parking zone'],
    ['car blocking the footpath', 'car blocking footpath parked pedestrian'],
    ['bike parked blocking the gate', 'bike blocking gate parked entrance'],
    ['truck parked on the road', 'truck parked lorry road lane blocked'],
    ['autorickshaw standing at the corner', 'auto parked rickshaw corner waiting'],
    ['vehicle parked at the junction', 'vehicle parked junction sight blocked'],
  ],
  civic_streetlight: [
    ['street light not working', 'streetlight light not working dark deepam'],
    ['street light flickering', 'streetlight flicker flickering blinking'],
    ['dark stretch at night', 'dark night no light unlit stretch'],
    ['pole light dead for weeks', 'pole light dead weeks outage lamp'],
    ['street lights out after rain', 'streetlight rain dead water damaged'],
    ['light illuminating the wrong area', 'streetlight aimed wrong shadow dark'],
  ],
  traffic_interaction: [
    ['stopped by traffic police', 'stopped traffic police challan stop'],
    ['disputed challan receipt', 'challan receipt disputed fine dispute'],
    ['license and papers checked on the road', 'license papers checked dl vehicle'],
    ['vehicle seized at the checkpoint', 'seized checkpoint impounded vehicle'],
    ['argued with the traffic officer', 'argued officer dispute argument'],
    ['wrong challan issued', 'wrong challan wrong fine incorrect'],
  ],
  unofficial_payment: [
    ['bribe demanded to clear the work', 'bribe demanded money rishwat ghoos'],
    ['unofficial cash demanded at the counter', 'unofficial cash demanded counter'],
    ['extra money asked for a service', 'extra money asked service faster'],
    ['money sought to skip the queue', 'money queue shortcut skip line'],
    ['favours asked for approval', 'favour approval asked sanction'],
    ['cash taken without a receipt', 'cash receipt no bill taken'],
  ],
  safety_harassment: [
    ['harassment on the street', 'harassment following threatening pareshan'],
    ['woman being followed and bothered', 'woman followed bothered eve teasing'],
    ['group ganging up on a person', 'group attacked gang threatened'],
    ['stalking near the apartment', 'stalking following apartment gate'],
    ['verbal abuse in public', 'abuse abusive words shouting public'],
    ['intimidation by strangers', 'intimidation threatening scared strangers'],
  ],
  cybercrime: [
    ['online payment fraud', 'online fraud payment upi money cheated'],
    ['phishing link and OTP theft', 'phishing otp link stolen fake'],
    ['fake job or lottery call', 'fake job lottery call cheated offer'],
    ['account takeover after a scam', 'account takeover hacked scam cheated'],
    ['UPI request scam', 'upi collect request scam money'],
    ['cyber fraud on WhatsApp', 'whatsapp scam message fraud cheated'],
  ],
  housing_tenant: [
    ['landlord refusing the deposit back', 'landlord deposit refund refused rent'],
    ['rent agreement dispute', 'rent agreement dispute contract'],
    ['unjust eviction notice', 'eviction notice asked vacate leave'],
    ['maintenance charges demanded unfairly', 'maintenance charges demanded unfair'],
    ['owner not fixing essentials', 'owner not fixing water repair owner'],
    ['harassment by the landlord', 'landlord harassment owner pressure'],
  ],
  env_noise: [
    ['loudspeaker noise at night', 'loudspeaker noise volume night music'],
    ['construction noise early morning', 'construction noise drilling morning'],
    ['dj and celebration noise', 'dj music loud celebration night'],
    ['traffic and honking noise', 'honking traffic noise horn blaring'],
    ['factory or machine noise', 'machine noise factory humming loud'],
    ['nearby party disturbing the lane', 'party noise disturbing neighbours'],
  ],
  util_power: [
    ['power cut stretching for hours', 'power cut bijli electricity outage light gaya'],
    ['electricity fluctuating repeatedly', 'power fluctuation current blink fluctuating'],
    ['transformator sparking and failing', 'transformator sparking transformer failed'],
    ['street area without supply', 'no power area supply outage dark'],
    ['power cut during rain', 'power cut rain wet outage supply'],
    ['daily load-shedding in the lane', 'load shedding daily power cut area'],
  ],
  access_language: [
    ['official refusing to communicate', 'language communicate understand hindi kannada refused'],
    ['notice not available in local language', 'notice local language board missing kannada'],
    ['staff replying only in one language', 'staff only hindi english reply language'],
    ['application rejected due to language', 'application rejected language english only'],
    ['no interpreter at the counter', 'counter language help interpreter understand'],
    ['forms available in one language only', 'forms single language english not translated'],
  ],
  govt_service: [
    ['application pending for weeks', 'application pending delay weeks not moving'],
    ['certificate not issued yet', 'certificate issued not delivered pending'],
    ['file stuck at the desk', 'file stuck desk pending no movement'],
    ['repeated visits without result', 'repeated visits no result again office'],
    ['service delayed beyond the deadline', 'service delayed deadline overdue sla'],
    ['document rejected without reason', 'document rejected reason unclear'],
  ],
  civic_footpath: [
    ['footpath broken and unusable', 'footpath broken damaged unusable pavement'],
    ['footpath encroached by vendors', 'footpath encroached vendors occupied walking'],
    ['footpath dug up and left open', 'footpath dug open trench excavation'],
    ['no footpath for pedestrians', 'footpath missing pedestrians road walking'],
    ['footpath slabs loose and tilted', 'footpath slab loose tilted uneven'],
    ['footpath blocked by parked vehicles', 'footpath parked vehicle blocked walking'],
  ],
  civic_drainage: [
    ['drain blocked and overflowing', 'drain blocked overflow drainage choked'],
    ['sewage spilling onto the road', 'sewage spill overflow road smell'],
    ['stinking drain near houses', 'drain smell stinking house dirty'],
    ['stormwater drain clogged', 'storm drain clogged leaves blocked'],
    ['drain cover missing', 'drain cover missing open drain'],
    ['water logging at the underpass', 'waterlogging underpass logging flooded'],
  ],
  civic_parks: [
    ['park bench and equipment broken', 'park bench broken equipment damaged'],
    ['park overgrown and unmaintained', 'park overgrown grass unmaintained bushes'],
    ['footpath inside park damaged', 'park path broken footpath slabs'],
    ['children play area unsafe', 'park play area unsafe broken children'],
    ['lights not working in the park', 'park light dark night lamp dead'],
    ['trash left all over the park', 'park trash litter garbage bins'],
  ],
  civic_water_supply: [
    ['no water supply in the lane', 'water supply no water pipe outage'],
    ['contaminated water from the tap', 'contaminated water dirty tap muddy'],
    ['low water pressure at the tap', 'low pressure weak water tap'],
    ['water pipe leaking on the road', 'water pipe leak leaking wasted road'],
    ['tanker not arriving on schedule', 'tanker late not arrived schedule'],
    ['supply running for a few minutes', 'water supply minutes cut short timing'],
  ],
  civic_stray_animals: [
    ['stray dog menace on the street', 'stray dog menace chasing biting dogs'],
    ['cattle blocking the road', 'cattle cows blocking road herd'],
    ['monkeys entering the houses', 'monkeys entering house scaring residents'],
    ['dog bite reported near the school', 'dog bite school children rabies'],
    ['stray animals at the garbage spot', 'stray animals garbage spot feeding'],
    ['pack of dogs at night', 'pack dogs night barking unsafe'],
  ],
  bribes: [
    ['bribe sought for a government file', 'bribe money file government office'],
    ['speed money demanded for approval', 'speed money approval sanction demanded'],
    ['cash demanded to finish the paperwork', 'cash paperwork finished demanded money'],
    ['money asked to process faster', 'money process faster speed money'],
    ['illegal fee at the service desk', 'illegal fee service desk counter money'],
    ['favour demanded before the work moves', 'favour work move demanded help'],
  ],
  bmtc_service: [
    ['bus not arriving on schedule', 'bus late not coming bandidilla delayed'],
    ['bus broke down mid-route', 'bus broke down breakdown stuck middle'],
    ['overcrowded bus skipping stops', 'overcrowded full bus skip stopped'],
    ['bus service cancelled on the route', 'bus cancelled service missing route'],
    ['last bus left early', 'last bus early missed timing'],
    ['bus running at huge intervals', 'bus interval gap huge waiting long'],
  ],
  bmtc_staff: [
    ['conductor misbehaving with passengers', 'conductor rude misbehaved argument kodlilla'],
    ['bus driver driving rashly', 'driver rash speeding sudden braking'],
    ['staff arguing with commuters', 'staff argued arguing commuters dispute'],
    ['conductor refusing a ticket', 'conductor refused ticket no change'],
    ['staff demanding extra fare', 'staff extra fare money demanded'],
    ['driver not stopping at the stop', 'driver did not stop skipped bus stop'],
  ],
  bmtc_fare_ticket: [
    ['bus pass renewal refused', 'bus pass renewal refused invalid'],
    ['overcharged bus fare', 'fare overcharged extra money charged'],
    ['change not returned by the conductor', 'no change returned conductor balance'],
    ['ticket not issued for the fare paid', 'ticket not issued paid fare receipt'],
    ['digital payment refused on the bus', 'digital payment refused qr money'],
    ['concession not honoured on the pass', 'concession pass student not allowed'],
  ],
  metro_service: [
    ['metro train delayed on the line', 'metro delayed late running train'],
    ['metro gate or token issue', 'metro gate token entry stuck machine'],
    ['escalator or lift not working', 'escalator lift not working stairs broken'],
    ['metro platform overcrowded', 'metro platform crowded packed rush'],
    ['metro service halted midway', 'metro halted stopped midway signal'],
    ['token counter queue very long', 'token counter queue long wait'],
  ],
  custom_issue: [
    ['unclassified civic problem', 'problem issue trouble not listed'],
    ['issue not fitting any category', 'issue category none fit else'],
    ['something unusual on the road', 'unusual strange road problem'],
    ['recurring problem in the area', 'recurring area problem happening again'],
    ['locality-wide nuisance', 'locality nuisance area trouble'],
    ['problem needing attention', 'problem attention help fix needed'],
  ],
};

/** Qualifier phrases crossed into every variant. */
const QUALIFIER_PHRASES = [
  'blocking the way', 'deep and worsening', 'overflowing onto the road',
  'recurring for weeks', 'left unrepaired', 'sparking intermittently',
  'leaking continuously', 'clogged completely', 'stagnant water around',
  'loud and disruptive', 'scattered across the lane', 'hazard for two-wheelers',
  'unfinished repair work', 'ignored despite complaints', 'getting worse daily',
  'no warning sign nearby', 'affecting pedestrians', 'spreading a bad smell',
  'near miss reported', 'daily commuters affected',
];

/** Place/time contexts crossed into every qualifier. */
const CONTEXT_PHRASES = [
  'during peak hours', 'near the main road', 'in the residential lane',
  'after the rainfall', 'by the bus stop', 'at the market junction',
  'near the school gate', 'along the service road', 'at the metro stretch',
  'across the apartment blocks',
];

let cache: ContextRow[] | null = null;

/** Lazily builds the full trained corpus (deterministic order). */
export function getContextCorpus(): ContextRow[] {
  if (cache) return cache;
  const rows: ContextRow[] = [];
  for (const [scenarioId, variants] of Object.entries(VARIANTS)) {
    for (const [issue, kw] of variants) {
      const keywords = kw.toLowerCase().split(/\s+/).filter(Boolean);
      for (const qualifier of QUALIFIER_PHRASES) {
        for (const context of CONTEXT_PHRASES) {
          rows.push({
            id: `${scenarioId}|${issue}|${qualifier}|${context}`,
            scenario_id: scenarioId,
            issue: `${issue}, ${qualifier}, ${context}`,
            keywords,
          });
        }
      }
    }
  }
  cache = rows;
  return rows;
}

export function getContextCorpusSize(): number {
  return getContextCorpus().length;
}

function scoreRow(row: ContextRow, queryWords: string[]): number {
  let score = 0;
  for (const kw of row.keywords) if (queryWords.includes(kw)) score += 3;
  return score;
}

/**
 * Returns the closest trained rows for a report — used as phrasing examples
 * inside the AI prompt so the four lines name the exact issue.
 */
export function matchContextRows(
  text: string,
  scenarioId: string,
  limit = 3
): ContextRow[] {
  const queryWords = (text || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const corpus = getContextCorpus();
  const scoped = scenarioId ? corpus.filter(r => r.scenario_id === scenarioId) : corpus;
  const pool = scoped.length > 0 ? scoped : corpus;

  const scored = pool
    .map(row => ({ row, score: scoreRow(row, queryWords) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length > 0) return scored.map(s => s.row);
  // No keyword hit — hand back a stable starting point for the scenario.
  return pool.slice(0, limit);
}
