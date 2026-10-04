import { SeverityLevel, SEVERITY_RANK } from '@/types';

/**
 * Trained severity — a 5-level scale that is decided from the scenario the
 * citizen reported plus what they actually wrote:
 *
 *   life_threatening → urgent → serious → moderate → minor
 *
 * The base level comes from the scenario; wording like "blood", "unconscious",
 * "gas leak" (in any language) escalates it, the citizen's own "How severe is
 * it?" answer nudges it one step, and "recurring" bumps it one step up.
 * This is separate from the P1–P4 priority engine used for admin review.
 */

const BASE_SEVERITY: Record<string, SeverityLevel> = {
  traffic_accident: 'life_threatening',
  safety_harassment: 'urgent',
  cybercrime: 'urgent',
  civic_stray_animals: 'urgent',
  traffic_wrong_side: 'urgent',
  civic_sense: 'urgent',
  bmtc_staff: 'urgent',
  bribes: 'serious',
  unofficial_payment: 'serious',
  civic_water_supply: 'serious',
  civic_drainage: 'serious',
  traffic_pothole: 'serious',
  util_power: 'moderate',
  civic_streetlight: 'moderate',
  civic_footpath: 'moderate',
  traffic_parking: 'moderate',
  traffic_interaction: 'moderate',
  env_noise: 'moderate',
  housing_tenant: 'moderate',
  govt_service: 'moderate',
  bmtc_service: 'moderate',
  metro_service: 'moderate',
  custom_issue: 'moderate',
  access_language: 'minor',
  civic_garbage: 'minor',
  civic_parks: 'minor',
  bmtc_fare_ticket: 'minor',
};

// Words that make an incident life-threatening, in every supported language.
const LIFE_WORDS = [
  // English
  'unconscious', 'not breathing', 'blood', 'bleeding', 'injured', 'injury',
  'fracture', 'hospital', 'dying', 'died', 'death', 'dead', 'fire', 'burning',
  'gas leak', 'electrocut', 'shock', 'drowning', 'drowned', 'trapped',
  'explosion', 'major accident', 'serious accident', 'severe', 'trauma',
  'snake bite', 'attacking me', 'killing', 'weapon', 'knife', 'gun',
  'live wire', 'fell from', 'critical condition', 'road rage', 'no pulse',
  // Hindi
  'बेहोश', 'खून', 'लहू', 'घायल', 'अस्पताल', 'मृत्यु', 'मर गया', 'मरा हुआ',
  'आग लग', 'गैस रिसाव', 'बिजली का झटका', 'डूब', 'विस्फोट', 'हत्या',
  'चाकू', 'पिस्टल', 'जान से मार', 'घातक', 'गंभीर चोट',
  // Kannada
  'ಬೇಹೋಶ', 'ರಕ್ತ', 'ಗಾಯ', 'ಆಸ್ಪತ್ರೆ', 'ಸಾವು', 'ಮೃತ', 'ಬೆಂಕಿ',
  'ಎಲೆಕ್ಟ್ರಿಕ್ ಶಾಕ್', 'ಮುಳುಗ', 'ಸ್ಫೋಟ', 'ಕೊಲೆ', 'ಚಾಕು', 'ಪ್ರಾಣಾಂತಕ',
  // Telugu
  'అపస్మారక', 'రక్తం', 'గాయం', 'ఆసుపత్రి', 'మరణం', 'చనిపో', 'అగ్ని',
  'పేలుడు', 'హత్య', 'కత్తి', 'ప్రాణాంతక',
];

// Words that make an incident urgent (same-day attention).
const URGENT_WORDS = [
  // English
  'school zone', 'near school', 'children', 'kids', 'elderly', 'disabled',
  'pregnant', 'spark', 'smoke', 'collapse', 'caving', 'leaning', 'crack',
  'fully blocked', 'blocked completely', 'sewage', 'overflow', 'overflowing',
  'snatch', 'snatching', 'stalking', 'following me', 'unsafe', 'scared',
  'dangerous', 'blind turn', 'blind curve', 'dog bite', 'near miss',
  'spilling', 'acid', 'shattered glass', 'helmetless', 'triple riding',
  // Hindi
  'बच्चे', 'स्कूल', 'बुजुर्ग', 'दिव्यांग', 'स्पार्क', 'धुआं', 'गिरने', 'डामर',
  'गंदगी', 'बदबू', 'चेन स्नैचिंग', 'डर', 'असुरक्षित', 'कुत्ते ने काटा',
  // Kannada
  'ಮಕ್ಕಳ', 'ಶಾಲೆ', 'ಹಿರಿಯರು', 'ಹೊಗೆ', 'ಬೀಳು', 'ಸೋರು', 'ಕೀಳು',
  'ಭಯ', 'ಅಸುರಕ್ಷಿತ', 'ನಾಯಿ ಕಡಿತ',
  // Telugu
  'పిల్లలు', 'పాఠశాల', 'పెద్దలు', 'పొగ', 'జారిపడే', 'స్నాచింగ్',
  'భయం', 'అసురక్షితం', 'కుక్క కాటు',
];

// Words that at least make an incident serious.
const SERIOUS_WORDS = [
  // English
  'recurring', 'every day', 'everyday', 'weeks', 'months', 'not fixed',
  'no one came', 'ignored', 'filed before', 'damaged', 'big hole', 'deep',
  'huge', 'waterlogged', 'water logged', 'flooded', 'stagnant', 'dengue',
  'malaria', 'cholera', 'contaminated', 'dirty water', 'no water',
  'power cut since', 'still no', 'not repaired', 'for weeks', 'for months',
  'spoil', 'spoiled', 'rotting', 'stinking',
  // Hindi
  'बार-बार', 'रोज़', 'रोज', 'हफ्तों', 'महीनों', 'गहरा', 'जलभराव', 'डेंगू',
  'दूषित पानी', 'गंदा पानी', 'सड़', 'बदबू', 'नहीं ठीक', 'नहीं हुआ',
  // Kannada
  'ಪುನರಾವರ್ತಿತ', 'ಪ್ರತಿದಿನ', 'ವಾರಗಳಿಂದ', 'ತಿಂಗಳಿಂದ', 'ಆಳವಾದ',
  'ನೀರು ನಿಂತ', 'ಡೆಂಗ್ಯೂ', 'ಕಲುಷಿತ ನೀರು', 'ಕೊಳೆ', 'ವಾಸನೆ', 'ಸರಿಪಡಿಸಿಲ್ಲ',
  // Telugu
  'పునరావృతం', 'ప్రతిరోజూ', 'నెలలుగా', 'లోతైన', 'నీరు నిలిచి',
  'డెంగ్యూ', 'కలుషిత నీరు', 'చెడిపోయి', 'దుర్వాసన', 'బాగుపడలేదు',
];

function includesAny(haystack: string, words: string[]): boolean {
  return words.some(w => haystack.includes(w.toLowerCase()));
}

function stepToward(level: SeverityLevel, direction: 1 | -1): SeverityLevel {
  const rank = Math.min(4, Math.max(0, SEVERITY_RANK[level] + direction));
  return (Object.keys(SEVERITY_RANK) as SeverityLevel[]).find(k => SEVERITY_RANK[k] === rank) || level;
}

/**
 * Maps stored severity values (current 5-level, legacy 4-level, or anything
 * unknown) onto the trained 5-level scale so the feed can always label and
 * sort correctly.
 */
export function normalizeSeverity(value?: string | null): SeverityLevel {
  const v = (value || '').toLowerCase().trim();
  if (v === 'life_threatening' || v === 'urgent' || v === 'serious' || v === 'moderate' || v === 'minor') return v;
  if (v === 'critical') return 'life_threatening';
  if (v === 'high') return 'urgent';
  if (v === 'medium') return 'moderate';
  if (v === 'low') return 'minor';
  return 'moderate';
}

/**
 * Decides the trained severity for a report. Pure function of the scenario id,
 * the citizen's words, and their workflow answers.
 */
export function trainedSeverity(input: {
  scenarioId?: string;
  text?: string;
  answers?: Record<string, string>;
}): SeverityLevel {
  const scenario = (input.scenarioId || '').toLowerCase().trim();
  let level: SeverityLevel = BASE_SEVERITY[scenario] || 'moderate';

  const haystack = `${input.text || ''} ${Object.values(input.answers || {}).join(' ')}`
    .toLowerCase()
    .replace(/\s+/g, ' ');

  // The citizen's own "How severe is it?" answer nudges the trained base by
  // one step — "large" one step more severe (never past urgent by itself),
  // "small" one step less severe. Hard escalations below still win.
  const own = ((input.answers || {}).severity || '').toLowerCase().trim();
  if (own === 'large' && SEVERITY_RANK[level] > SEVERITY_RANK.urgent) level = stepToward(level, -1);
  else if (own === 'small' && SEVERITY_RANK[level] < SEVERITY_RANK.minor) level = stepToward(level, 1);

  // Hard escalations from what was written — these always win.
  if (includesAny(haystack, LIFE_WORDS)) return 'life_threatening';
  if (includesAny(haystack, URGENT_WORDS) && SEVERITY_RANK[level] > SEVERITY_RANK.urgent) level = 'urgent';
  if (includesAny(haystack, SERIOUS_WORDS) && SEVERITY_RANK[level] > SEVERITY_RANK.serious) level = 'serious';

  // A recurring issue gets one extra step of attention (capped at urgent).
  const recurring = (input.answers || {}).recurring || '';
  if (/^(true|yes|y|ಹೌದು|हाँ|हो|అవును)$/i.test(recurring.trim()) && SEVERITY_RANK[level] > SEVERITY_RANK.urgent) {
    level = stepToward(level, -1);
  }

  return level;
}
