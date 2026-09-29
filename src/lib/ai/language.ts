import { Language } from '@/types';

// Citizens type in whatever comes to hand: native script, Latin transliteration
// ("kuch nahi ho raha", "gundi road", "bijli gayi"), or a mix of all three in a
// single message. Everything here exists so classification still works when the
// selected UI language and the typed language disagree.

export type Script = 'devanagari' | 'kannada' | 'telugu' | 'latin';

const SCRIPT_TESTS: Array<{ script: Script; test: RegExp }> = [
  { script: 'devanagari', test: /[\u0900-\u097F]/ },
  { script: 'kannada', test: /[\u0C80-\u0CFF]/ },
  { script: 'telugu', test: /[\u0C00-\u0C7F]/ },
  { script: 'latin', test: /[A-Za-z]/ },
];

const SCRIPT_LANGUAGE: Record<Script, Language> = {
  devanagari: 'hi',
  kannada: 'kn',
  telugu: 'te',
  latin: 'en',
};

export function detectScripts(text: string): Script[] {
  return SCRIPT_TESTS.filter(({ test }) => test.test(text)).map(({ script }) => script);
}

// Latin-script markers for non-English languages. Deliberately conservative:
// each hit must be an unambiguous word, and a language only wins on two or
// more hits so single accidental matches cannot flip the result.
const ROMANIZED_HINTS: Record<Language, string[]> = {
  en: [],
  hi: [
    'kya', 'nahi', 'nahin', 'ho raha', 'ho rahi', 'raha hai', 'rahi hai', 'kuch nahi',
    'mere', 'mera', 'meri', 'gaya', 'gayi', 'hua', 'hoga', 'chahiye', 'matlab',
    'bhai', 'bhaiya', 'theek', 'sahi', 'galat', 'batao', 'bata', 'karna', 'kare',
    'paise', 'paisa', 'riswat', 'rishwat', 'ghoos', 'bijli', 'gaddha', 'kachra',
    'kuda', 'shor', 'awaaz', 'pareshan', 'chalan', 'challan', 'madad', 'bataen',
    'haan', 'ha ji', 'bilkul', 'accha', 'acha', 'theek hai', 'kaise', 'kyun',
    'kyu', 'yahan', 'wahan', 'abhi', 'phir', 'lekin', 'aur', 'bahut', 'thoda',
    'banao', 'banwao', 'hatao', ' kar ', 'kaise hai', 'ho gaya', 'nahi hua',
  ],
  kn: [
    'anna', 'avaru', 'nodi', 'nodu', 'iro', 'hege', 'yaake', 'ellide', 'beku',
    'illa', 'aayitu', 'agide', 'madutte', 'bantu', 'matte', 'kelsa', 'samsye',
    'gundi', 'kasa', 'lancha', 'current band', 'light band', 'swatcha',
    'sari', 'sari aayitu', 'enu', 'eppudu', 'ivattu', 'navvu', 'nangu', 'namge',
    'madabeku', 'agide', 'aagta', 'illa sir', 'thale', 'beerkondidhe', 'kodti',
    'nodkoli', 'maadi', 'madi', 'sari agide',
  ],
  te: [
    'andi', 'ledu', 'undi', 'avtundi', 'cheppandi', 'bagundi',
    'tappu', 'enti', 'emi', 'kaani', 'nenu', 'meeru', 'cheppu', 'gunde',
    'chetta', 'karmika', 'pramadam', 'ela', 'enduku', 'ipudu', 'ivan', 'evaru',
    'kavali', 'ledu sir', 'cheyi', 'cheppu', 'undhi', 'ayindi', 'kastam',
  ],
};

// Words that only English uses. A Latin message with two or more of these is
// English even when the app itself is set to Kannada/Hindi/Telugu.
const ENGLISH_HINTS = [
  'the', 'what', 'is', 'my', 'i ', 'you', 'it ', 'this', 'that', 'not', 'no ',
  'yes', 'please', 'help', 'can ', 'are', 'was', 'have', 'has', 'there',
  'here', 'problem', 'issue', 'need', 'want', 'someone', 'they', 'been',
  'when', 'why', 'how', 'did', 'does', 'from', 'with', 'have a', 'there is',
  'not working', 'road', 'water', 'garbage', 'light', 'power', 'accident',
  'broken', 'today', 'yesterday', 'again', 'still', 'near', 'please help',
];

const LANG_NAMES: Record<Language, string> = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi',
  te: 'Telugu',
};

const SPEECH_LOCALES: Record<Language, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

export function languageName(lang: Language): string {
  return LANG_NAMES[lang] || LANG_NAMES.en;
}

export function speechLocale(lang: Language): string {
  return SPEECH_LOCALES[lang] || SPEECH_LOCALES.en;
}

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'kn' || value === 'hi' || value === 'te';
}

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Best guess at which language the message is actually written in.
// Native script wins outright; otherwise we score Latin-script hints.
export function guessLanguage(text: string, fallback: Language): Language {
  const scripts = detectScripts(text);
  for (const script of ['devanagari', 'kannada', 'telugu'] as const) {
    if (scripts.includes(script)) return SCRIPT_LANGUAGE[script];
  }

  const normalized = normalizeForMatch(text);
  let best: Language | null = null;
  let bestScore = 0;
  for (const lang of ['hi', 'kn', 'te'] as const) {
    const score = ROMANIZED_HINTS[lang].filter(hint => normalized.includes(hint)).length;
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }

  if (best && bestScore >= 2) return best;
  if (scripts.includes('latin')) return fallback;
  return fallback;
}

export function isLikelyRomanized(text: string, lang: Language): boolean {
  const scripts = detectScripts(text);
  if (scripts.includes('latin')) return guessLanguage(text, lang) !== lang;
  return false;
}

// Which language should the bot answer in for this particular message?
//
// This is deliberately more assertive than guessLanguage(): a citizen who asks
// a question in English while the app is set to Kannada wants an English reply,
// so a clear English signal is enough to switch. Anything ambiguous stays on
// the app language rather than flipping the conversation around.
export function detectReplyLanguage(text: string, appLang: Language): Language {
  const scripts = detectScripts(text);

  for (const script of ['devanagari', 'kannada', 'telugu'] as const) {
    if (scripts.includes(script)) return SCRIPT_LANGUAGE[script];
  }
  if (scripts.length === 0 || !scripts.includes('latin')) return appLang;

  const normalized = ` ${normalizeForMatch(text)} `;

  let best: Language | null = null;
  let bestScore = 0;
  for (const lang of ['hi', 'kn', 'te'] as const) {
    const score = ROMANIZED_HINTS[lang].filter(hint => normalized.includes(hint)).length;
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  if (best && bestScore >= 1) return best;

  const englishScore = ENGLISH_HINTS.filter(hint => normalized.includes(hint)).length;
  if (englishScore >= 2) return 'en';

  return appLang;
}

// Confidence guard used before the UI language is allowed to follow the user.
// Native script is always trusted; Latin script needs a little more evidence.
export function shouldAdoptLanguage(detected: Language, appLang: Language, text: string): boolean {
  if (detected === appLang) return false;
  const scripts = detectScripts(text);
  if (scripts.some(s => s !== 'latin')) return true;
  const normalized = ` ${normalizeForMatch(text)} `;
  if (detected === 'en') {
    return ENGLISH_HINTS.filter(hint => normalized.includes(hint)).length >= 3;
  }
  return ROMANIZED_HINTS[detected].filter(hint => normalized.includes(hint)).length >= 2;
}
