import { Language, PublicIncident } from '@/types';
import { t } from '@/lib/translations';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { normalizeSeverity } from '@/lib/trained-severity';

/**
 * Everything on the public feed must be shareable with strangers. These
 * helpers strip anything that could identify a person before text reaches
 * the AI, and reject any AI answer that still contains something personal.
 */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
// Indian vehicle numbers: KA-01-AB-1234, MH12AB1234, KA 52 MC 1234
const PLATE = /\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{0,3}[\s-]?\d{3,4}\b/;
// Indian mobiles: +91 98765 43210, 9876543210, 080-45678900
const PHONE = /(?:\+?91[\s-]?)?(?:0[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/;
// OTPs, account numbers, any long digit run
const LONG_DIGITS = /\b\d{6,}\b/;

/** Redact personal identifiers from the text we send to the AI. */
export function redactPII(text: string): string {
  return text
    .replace(EMAIL, '[redacted]')
    .replace(PLATE, '[redacted]')
    .replace(PHONE, '[redacted]')
    .replace(LONG_DIGITS, '[redacted]');
}

/** True if an AI answer still carries something personal — never publish it. */
export function containsPII(text: string): boolean {
  return EMAIL.test(text) || PLATE.test(text) || PHONE.test(text) || LONG_DIGITS.test(text);
}

function severityLabel(severity: string, lang: Language): string {
  // Trained 5-level label; legacy values are mapped onto the same scale.
  return t(`severity.${normalizeSeverity(severity)}`, lang);
}

function categoryLabel(categoryId: string, lang: Language): string {
  const label = t(`category.${categoryId}`, lang);
  return label === `category.${categoryId}` ? categoryId.replace(/_/g, ' ') : label;
}

/**
 * Fallback four-line context for reports filed before AI summaries existed
 * (or when the AI call failed) — same shape as the AI output, built only
 * from fields that are already public.
 */
export function buildFallbackContext(item: PublicIncident, lang: Language): string {
  const scn = getScenarioById(item.subcategory);
  const sub = scn ? getScenarioName(scn, lang) : item.subcategory.replace(/_/g, ' ');
  return [
    t('context.l1', lang)
      .replace('{severity}', severityLabel(item.severity, lang))
      .replace('{category}', categoryLabel(item.category_id, lang)),
    sub,
    item.area
      ? t('context.l3', lang).replace('{area}', item.area)
      : t('context.l3_unknown', lang),
    t('context.l4', lang),
  ].join('\n');
}
