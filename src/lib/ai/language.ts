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
  ],
  kn: [
    'anna', 'avaru', 'nodi', 'nodu', 'iro', 'hege', 'yaake', 'ellide', 'beku',
    'illa', 'aayitu', 'agide', 'madutte', 'bantu', 'matte', 'kelsa', 'samsye',
    'gundi', 'kasa', 'lancha', 'current band', 'light band', 'swatcha',
  ],
  te: [
    'andi', 'ledu', 'undi', 'avtundi', 'cheppandi', 'cheyandi', 'bagundi',
    'tappu', 'enti', 'emi', 'kaani', 'nenu', 'meeru', 'cheppu', 'gunde',
    'chetta', 'karmika', 'pramadam',
  ],
};

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
