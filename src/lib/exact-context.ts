import { Language } from '@/types';
import { t } from '@/lib/translations';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { normalizeSeverity, trainedSeverity } from '@/lib/trained-severity';

/**
 * Guaranteed four-line public context, built locally from the trained
 * severity + the matched scenario. Used whenever the AI call fails or times
 * out, so every feed card always has issue-specific context to show — in the
 * citizen's language, with no personal details (only scenario, qualifier,
 * severity and the public area are used).
 */

type QualifierKey =
  | 'blocking' | 'deep' | 'overflowing' | 'recurring' | 'damaged'
  | 'leaking' | 'clogged' | 'sparking' | 'stagnant' | 'loud'
  | 'scattered' | 'dangerous' | 'unfinished';

const QUALIFIER_KEYWORDS: [QualifierKey, string[]][] = [
  ['blocking', ['block', 'blocked', 'blocking', 'stops traffic', 'halted', 'roko', 'ತಡೆ', 'ఆపి', 'रोक']],
  ['deep', ['deep', 'huge', 'giant', 'big hole', 'large', 'ಆಳ', 'లోతైన', 'गहरा']],
  ['overflowing', ['overflow', 'overflowing', 'spill', 'spilling', 'overfull', 'ನಿಂತು', 'పొంగి', 'भरा']],
  ['recurring', ['recurring', 'again', 'every day', 'everyday', 'repeat', 'once more', 'ಮತ್ತೆ', 'మళ్ళీ', 'फिर से']],
  ['damaged', ['damaged', 'broken', 'crack', 'cracked', 'torn', 'collapsed', 'ಒಡೆದ', 'పగిలి', 'टूट']],
  ['leaking', ['leak', 'leaking', 'leakage', 'drip', 'dripping', 'ಸೋರು', 'చొరುతు', 'रिस']],
  ['clogged', ['clog', 'clogged', 'clogging', 'jam', 'jammed', 'choked', 'blocked drain', 'ಮುಚ್ಚಿ', 'మూసుకు', 'बंद']],
  ['sparking', ['spark', 'sparking', 'sparks', 'short circuit', 'shock', 'ಎಚ್ಚರ', 'స్పార్క్', 'झटका']],
  ['stagnant', ['stagnant', 'waterlog', 'water logged', 'waterlogged', 'standing water', 'నೀರು ನಿಂತ', 'నీరు నిలిచి', 'जलभराव']],
  ['loud', ['loud', 'noise', 'noisy', 'volume', 'blaring', 'ಶಬ್ದ', 'ధ్వని', 'शोर']],
  ['scattered', ['scattered', 'litter', 'dump', 'dumping', 'thrown', 'ಚೆಲ್ಲಾಟ', 'చెత్త', 'फैल']],
  ['dangerous', ['dangerous', 'unsafe', 'risk', 'hazard', 'peril', 'ಅಪಾಯ', 'ప్రమాద', 'खतरा']],
  ['unfinished', ['unfinished', 'incomplete', 'pending', 'half done', 'stuck', 'ಅರ್ಧ', 'అసంపూర్ణ', 'अधूरा']],
];

function categoryLabel(categoryId: string, lang: Language): string {
  const label = t(`category.${categoryId}`, lang);
  return label === `category.${categoryId}` ? categoryId.replace(/_/g, ' ') : label;
}

function pickQualifier(text: string, lang: Language): string {
  const haystack = text.toLowerCase();
  for (const [key, words] of QUALIFIER_KEYWORDS) {
    if (words.some(w => haystack.includes(w.toLowerCase()))) {
      return t(`qualifier.${key}`, lang);
    }
  }
  return '';
}

/**
 * Four lines, same shape as the AI output:
 * 1. severity + category, 2. issue (scenario + qualifier), 3. area, 4. support line.
 */
export function exactContext(input: {
  categoryId: string;
  scenarioId: string;
  text?: string;
  area?: string;
  answers?: Record<string, string>;
  lang: Language;
}): string {
  const { lang } = input;
  const scn = getScenarioById(input.scenarioId);
  const raw = `${input.text || ''} ${Object.values(input.answers || {}).join(' ')}`.trim();

  const severity = trainedSeverity({
    scenarioId: input.scenarioId,
    text: raw,
    answers: input.answers,
  });
  const qualifier = pickQualifier(raw, lang);
  const issue = scn
    ? getScenarioName(scn, lang) + (qualifier ? ` — ${qualifier}` : '')
    : input.scenarioId.replace(/_/g, ' ');

  return [
    t('context.l1', lang)
      .replace('{severity}', t(`severity.${normalizeSeverity(severity)}`, lang))
      .replace('{category}', categoryLabel(input.categoryId, lang)),
    issue,
    input.area
      ? t('context.l3', lang).replace('{area}', input.area)
      : t('context.l3_unknown', lang),
    t('context.l4', lang),
  ].join('\n');
}
