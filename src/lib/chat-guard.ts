// Deterministic input guard for the chatbot and the free-text report step.
// Catches insults, abuse and off-topic rants BEFORE any classifier sees them,
// so a rude message can never turn into a fake "issue" card. Detection only —
// flagged words are never echoed back to the citizen.

import { trainedScenarios, matchTrainedScenario } from './trained-scenarios';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// ---- Abuse / insult vocabulary (English, Hinglish, Hindi, Kannada, Telugu,
// Tamil — Latin transliteration and native scripts). Detection only. ----
const ABUSE_PATTERNS: RegExp[] = [
  // English (word boundaries so "sale" never matches "saale")
  /\bfuck(ing|er|ed)?\b/, /\bshit(ty|s)?\b/, /\bbullshit\b/, /\bbastard\b/,
  /\basshole\b/, /\bidiot(s)?\b/, /\bmoron(s)?\b/, /\bstupid\b/,
  /\bfool(s|ish)?\b/, /\bdumb\b/, /\buseless\b/, /\bpathetic\b/,
  /\bloser(s)?\b/, /\bsucks?\b/, /\bcrap(py)?\b/, /\bpiss(ed|ing)?\b/,
  /\bshut up\b/, /\bget lost\b/, /\bwaste of time\b/,
  /\b(trash|garbage|rubbish) (app|website|bot|service|product)\b/,
  /\bapp is (trash|garbage|garbagey|rubbish|useless)\b/,

  // Hinglish / Urdu-flavoured insults
  /\bsaal(i|ee)\b/, /\bsaale\b/, /\bkamine(y)?\b/, /\bkamini\b/, /\bgandu\b/,
  /\bchutiya(e)?\b/, /\bbhosdi(k|ke)\b/, /\bharamkhor\b/, /\brandi\b/,
  /\bbakwa?s\b/, /\bbewakoof\b/, /\bbefkoof\b/, /\bfaltu\b/, /\bhagna\b/,
  /\bkutte\b/, /\bkutta\b/, /\bkutti\b/,

  // Kannada (Latin transliteration + script)
  /\bbevarsi\b/, /\btuchi\b/, /\bgijji\b/, /\bmurkha\b/, /\bpoltu\b/,
  /ಬೇವಾರ್ಸಿ/, /ತುಚ್ಛ/, /ಮೂರ್ಖ/, /ಕಮೀನ/,

  // Telugu (Latin transliteration + script)
  /\bpanikirani\b/, /\bpich(o|u)du\b/, /\blanja\b/,
  /పనికిరాని/, /పిచ్చోడు/, /లంజ/,

  // Hindi (Devanagari)
  /कमीने/, /कमीना/, /बेवकूफ/, /मूर्ख/, /गांडू/, /रंडी/, /हरामखोर/,
  /भोसड़ी/, /साले/, /साली/, /तेरी माँ/, /पागल हो/,

  // Tamil (script + transliteration)
  /புண்டை/, /கூதி/, /மடையன்/, /\bpundai\b/, /\bkoothi\b/, /\bmadiyan\b/,
];

// ---- Framing that means the citizen is REPORTING abuse, not throwing it:
// these messages must keep flowing into the normal safety pipeline. ----
const FRAMING_PATTERNS: RegExp[] = [
  /\bsomeone\b/, /\bsomebody\b/, /\bthey\b/, /\bfew (boys|men|guys|people)\b/,
  /\bcalled me\b/, /\bsaid (to )?me\b/, /\babused me\b/, /\babuse[sd] (me|her|him)\b/,
  /\bharass/, /\bstalk/, /\bfollow/, /\bteas/, /\beve[\s-]?teas/,
  /\bthreat/, /\bchase/, /\bspat\b/, /\bgaali\b/, /\bdhamki\b/, /\bchhed\b/,
  /\btang kar/, /\bhaath pakad/, /\bkaat (liya|raha|li)\b/, /\bbit me\b/,
  /\bdog bite\b/, /\bmar diya\b/, /\bmaar diya\b/,
  /usne/, /kisi ne/, /unka/, /avanu/, /avane/, /avalu/,
  /వాడు/, /వాళ్ళు/, /ఎవరో/, /ఎవరైనా/,
];

// ---- First-person harm: an angry message that is still a real complaint. ----
const FIRST_PERSON_PATTERNS: RegExp[] = [
  /\bmy (bike|scooter|car|leg|hand|arm|head|house|home|road|street|area|gate|child|kid|son|daughter|mother|mom|father|dad|wallet|phone|bag|shoe|vehicle)\b/,
  /\bi (fell|was|got|live|have|am)\b/,
  /\bnear me\b/, /\bon me\b/, /\bto me\b/,
  /mera /, /mere /, /meri /, /ನನ್ನ /, /ನಾ /,
];

// ---- Civic vocabulary: at least two distinct hits (or one long trained
// phrase) means the message carries a real complaint even if it is rude. ----
const CIVIC_TERMS = [
  'road', 'pothole', 'gundha', 'gaddha', 'khadda', 'gundi', 'garbage',
  'kachra', 'kachre', 'kuda', 'chettha', 'waste', 'trash', 'litter',
  'drain', 'drainage', 'sewage', 'nali', 'naali', 'nala', 'water',
  'paani', 'neeru', 'flood', 'waterlog', 'bijli', 'power', 'electric',
  'light', 'streetlight', 'street light', 'bus', 'metro', 'accident',
  'crash', 'parking', 'footpath', 'pavement', 'signal', 'helmet',
  'manhole', 'wire', 'pole', 'fire', 'noise', 'bribe', 'rishwat',
  'scam', 'fraud', 'otp', 'landlord', 'rent', 'tenant', 'dog', 'cat',
  'animal', 'stray', 'toilet', 'tree', 'construction', 'encroach',
  'vendor', 'hawker', 'speeding', 'rash', 'drunk', 'wrong side',
  'theft', 'snatch', 'cyber', 'smell', 'stink', 'tank', 'tap',
  'pipeline', 'pipe', 'sewer', 'bench', 'park', 'gate', 'wall',
  'galli', 'street', 'junction', 'kutte', 'kutta', 'naayi', 'bhonk',
  'barking', 'bite', 'biting', 'dogs',
  'ರಸ್ತೆ', 'ಗುಂಡಿ',
  'ಕಸ', 'ನೀರು', 'ವಿದ್ಯುತ್', 'ದೀಪ', 'బస్సు', 'రోడు', 'చెత్త',
  'నీరు', 'కరెంటు', 'गड्ढा', 'कूड़ा', 'पानी', 'बिजली', 'रोड',
];

// ASCII terms need word boundaries ("trash" must not count as "rash");
// native-script terms are distinct enough for a plain substring check.
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CIVIC_MATCHERS: { re: RegExp | null; sub: string }[] = CIVIC_TERMS.map(t =>
  /^[\x20-\x7E]+$/.test(t) ? { re: new RegExp(`\\b${escapeRegex(t)}\\b`), sub: t } : { re: null, sub: t }
);

export function containsAbuse(text: string): boolean {
  const s = norm(text);
  if (!s) return false;
  return ABUSE_PATTERNS.some(p => p.test(s));
}

function hasFraming(text: string): boolean {
  return FRAMING_PATTERNS.some(p => p.test(text));
}

function hasFirstPersonHarm(text: string): boolean {
  return FIRST_PERSON_PATTERNS.some(p => p.test(text));
}

function hasStrongCivic(text: string): boolean {
  // One long (≥10 char) trained phrase is strong evidence on its own.
  for (const scenario of trainedScenarios) {
    for (const kw of scenario.keywords) {
      if (kw.length >= 10 && text.includes(kw.toLowerCase())) return true;
    }
  }
  // Otherwise require at least two distinct civic terms.
  let hits = 0;
  for (const m of CIVIC_MATCHERS) {
    if (m.re ? m.re.test(text) : text.includes(m.sub)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  return false;
}

/** True when the message is abuse/off-topic with no real civic complaint. */
export function shouldGuard(text: string): boolean {
  const s = norm(text);
  if (!s || !containsAbuse(s)) return false;
  if (hasFraming(s)) return false;
  if (hasFirstPersonHarm(s)) return false;
  if (hasStrongCivic(s)) return false;
  return true;
}

// Safety vocabulary that also counts as real content even when no civic
// noun is present (harassment and danger reports must never be blocked).
const SAFETY_TERMS = [
  'following', 'stalk', 'harass', 'threat', 'attack', 'chase', 'spat',
  'molest', 'snatch', 'steal', 'stolen', 'fight', 'beating', 'abused',
  'teas', 'eve', 'goon', 'gang', 'scared', 'afraid', 'danger', 'unsafe',
  'help me', 'kidnap', 'abduct', 'grope', 'abuse',
  'ಕಿರುಕುಳ', 'ಭಯ', 'किरूकुळ', 'खतरा', 'హింస', 'భయం',
];

const SAFETY_MATCHERS: { re: RegExp | null; sub: string }[] = SAFETY_TERMS.map(t =>
  /^[\x20-\x7E]+$/.test(t) ? { re: new RegExp(`\\b${escapeRegex(t)}\\b`), sub: t } : { re: null, sub: t }
);

/**
 * Lenient content check used before accepting an AI classification: true when
 * the text touches ANY civic or safety topic (or matches the trained corpus).
 * Off-topic chatter ("capital of France") and gibberish return false.
 */
export function hasAnyCivicSignal(text: string): boolean {
  const s = norm(text);
  if (!s) return false;
  if (matchTrainedScenario(s)) return true;
  for (const m of [...CIVIC_MATCHERS, ...SAFETY_MATCHERS]) {
    if (m.re ? m.re.test(s) : s.includes(m.sub)) return true;
  }
  return false;
}
const REPLIES: Record<string, string> = {
  en: "Let's keep this polite 🙂 I only help with real civic problems — potholes, garbage, water, power, buses, safety. Tell me what's actually happening in your area and I'll help you file a proper report.",
  kn: 'ದಯವಿಟ್ಟು ಸಭ್ಯವಾಗಿ ಮಾತನಾಡೋಣ 🙂 ನಾನು ನಿಜವಾದ ನಗರ ಸಮಸ್ಯೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ — ಗುಂಡಿ, ಕಸ, ನೀರು, ವಿದ್ಯುತ್, ಬಸ್, ಸುರಕ್ಷತೆ. ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ನಿಜವಾಗಿ ಏನಾಗಿದೆ ಎಂದು ಹೇಳಿ, ಸರಿಯಾದ ವರದಿ ಮಾಡಲು ನೆರವು ನೀಡುತ್ತೇನೆ.',
  hi: 'चलिए शालीनता से बात करते हैं 🙂 मैं असली नागरिक समस्याओं में ही मदद करता हूँ — गड्ढा, कूड़ा, पानी, बिजली, बस, सुरक्षा। बताएँ आपके इलाके में असल में क्या हो रहा है, मैं सही रिपोर्ट दर्ज करने में मदद करूँगा।',
  te: 'దయచేసి సభ్యంగా మాట్లాడదాము 🙂 నేను నిజమైన పౌర సమస్యలకే సహాయం చేస్తాను — గుంత, చెత్త, నీరు, కరెంటు, బస్సు, భద్రత. మీ ప్రాంతంలో నిజంగా ఏమి జరుగుతోందో చెప్పండి, సరైన నివేదిక నమోదుకు సహాయపడతాను.',
};

/** Polite redirect in the citizen's chosen language. Never echoes input. */
export function guardReply(lang: string): string {
  return REPLIES[lang] || REPLIES.en;
}
