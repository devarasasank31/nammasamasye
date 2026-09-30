/**
 * Moderation / risk scoring for citizen submissions.
 *
 * Design grounding (why a score instead of a ban):
 *  - Moz Spam Score showed the *count of independent flags* predicts risk far
 *    better than any single signal, with danger bands (<10% / 10-50% / >50%).
 *  - Microsoft Defender's Spam Confidence Level routes mail on a cumulative
 *    0-9 score rather than a binary clean/spam verdict.
 *    (learn.microsoft.com — "spam confidence level (SCL) about", 2025)
 *  - Forminator-style fraud pipelines weight every signal and explicitly
 *    "flag only, don't block"; escalation happens on a high combined score.
 *  - Abuse-reporting research (arXiv:2410.21041, Dec 2025) measured 10-75%
 *    spam inside a public abuse-report feed, so bad submissions are common
 *    enough that triage — not banning a citizen who files many reports — is
 *    the correct response.
 *
 * Bands:  clean 0-24 | review 25-49 | high 50-74 | critical 75-100.
 * Nothing is ever auto-deleted, hidden or rejected: the score only tells the
 * admin where to look first. Volume alone never reaches the high band — a
 * citizen who genuinely reports 20 potholes a day stays "clean" unless other
 * signals fire (identical text, impossible coordinates, abuse, junk media).
 */

export type RiskLevel = 'clean' | 'review' | 'high' | 'critical';

export interface RiskFlag {
  code: 'duplicate_text' | 'impossible_location' | 'no_location' | 'rapid_fire' |
        'mass_reports' | 'abusive_content' | 'junk_media' | 'too_short' |
        'no_words' | 'keyword_stuffing';
  weight: number;
  detail: string;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  flags: RiskFlag[];
}

export interface RiskInput {
  text: string;
  lat?: number;
  lng?: number;
  evidenceLinks?: string[];
  attachments?: { kind: string; mime?: string }[];
  /** Reports filed by this session recently — used for rate signals. */
  recentBySession?: { created_at: string; normalized: string }[];
  now?: number;
}

/** Rough Bengaluru extent — anything outside is treated as impossible data. */
const BLR_BOUNDS = { minLat: 12.65, maxLat: 13.25, minLng: 77.2, maxLng: 77.9 };

// Multilingual abuse lexicon (EN / HI / KN / TE) — deliberately short and
// unambiguous so ordinary civic anger ("this is stupid, fix it") does not
// punish a legitimate reporter.
const ABUSE_TERMS = [
  'fuck', 'fucking', 'shit', 'bastard', 'asshole', 'idiot', 'moron',
  'shut up', 'kill you', 'go to hell', 'son of a bitch', 'racist slur',
  'बेवकूफ', 'मूर्ख', 'गाली', 'कमीने',
  'ಮೂರ್ಖ', 'ಬುದ್ಧಿವಂತನಲ್ಲ', 'ದರಿದ್ರ',
  'పిచ్చి', 'దరిద్రుడు', 'తెలివితక్కువ',
];

const JUNK_EXTENSIONS = ['.exe', '.apk', '.bat', '.msi', '.scr', '.cmd', '.jar', '.dll'];
const SHORTENER_HOSTS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly'];

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(' ').filter(w => w.length > 1);
}

export function riskLevelFor(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'review';
  return 'clean';
}

function linkLooksIrrelevant(url: string): boolean {
  const lower = (url || '').toLowerCase();
  if (!lower) return false;
  if (JUNK_EXTENSIONS.some(ext => lower.includes(ext))) return true;
  try {
    const host = new URL(lower).hostname.replace(/^www\./, '');
    if (SHORTENER_HOSTS.includes(host)) return true;
  } catch {
    return !/^https?:\/\//.test(lower);
  }
  return false;
}

function attachmentLooksIrrelevant(attachment: { kind: string; mime?: string }): boolean {
  const mime = (attachment.mime || '').toLowerCase();
  if (!mime) return false;
  if (attachment.kind === 'image') return !mime.startsWith('image/');
  if (attachment.kind === 'video') return !mime.startsWith('video/') && !mime.includes('mp4') && !mime.includes('webm');
  return false;
}

export function assessRisk(input: RiskInput): RiskResult {
  const flags: RiskFlag[] = [];
  const text = input.text || '';
  const norm = normalize(text);
  const now = input.now ?? Date.now();

  // 1. Repeated identical submission from the same device.
  const dupes = (input.recentBySession || []).filter(
    r => r.normalized && r.normalized === norm && norm.length > 0 &&
      now - new Date(r.created_at).getTime() < 60 * 60 * 1000
  ).length;
  if (dupes > 0) {
    flags.push({
      code: 'duplicate_text',
      weight: dupes >= 2 ? 35 : 25,
      detail: `${dupes + 1} identical submission(s) from this device in the last hour`,
    });
  }

  // 2. Rate signals — many reports fast, or a very high 24h volume.
  const recent = (input.recentBySession || []);
  const last10 = recent.filter(r => now - new Date(r.created_at).getTime() < 10 * 60 * 1000).length;
  const last24h = recent.filter(r => now - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000).length;
  if (last10 >= 6) flags.push({ code: 'rapid_fire', weight: 30, detail: `${last10} reports in 10 minutes` });
  else if (last10 >= 3) flags.push({ code: 'rapid_fire', weight: 15, detail: `${last10} reports in 10 minutes` });
  if (last24h >= 15) flags.push({ code: 'mass_reports', weight: 25, detail: `${last24h} reports in 24 hours` });

  // 3. Impossible / missing location.
  if (typeof input.lat === 'number' && typeof input.lng === 'number') {
    const outside =
      input.lat < BLR_BOUNDS.minLat || input.lat > BLR_BOUNDS.maxLat ||
      input.lng < BLR_BOUNDS.minLng || input.lng > BLR_BOUNDS.maxLng;
    if (outside) {
      flags.push({
        code: 'impossible_location',
        weight: 40,
        detail: `Coordinates ${input.lat.toFixed(4)}, ${input.lng.toFixed(4)} are outside Bengaluru`,
      });
    }
  } else {
    flags.push({ code: 'no_location', weight: 5, detail: 'No coordinate captured for this report' });
  }

  // 4. Abusive content.
  const lowerText = text.toLowerCase();
  const hit = ABUSE_TERMS.find(term => lowerText.includes(term));
  if (hit) flags.push({ code: 'abusive_content', weight: 30, detail: 'Profanity / abusive wording detected' });

  // 5. Obviously irrelevant media links (junk files, link shorteners).
  const badLinks = (input.evidenceLinks || []).filter(linkLooksIrrelevant);
  const badAttachments = (input.attachments || []).filter(attachmentLooksIrrelevant);
  if (badLinks.length > 0 || badAttachments.length > 0) {
    flags.push({
      code: 'junk_media',
      weight: 15,
      detail: `${badLinks.length + badAttachments.length} evidence link(s)/file(s) point at irrelevant or executable content`,
    });
  }

  // 6. Text quality — empty, too short, no real words, or stuffed keywords.
  const tokenList = words(text);
  if (norm.length > 0 && norm.length < 8) {
    flags.push({ code: 'too_short', weight: 15, detail: `Description is only ${norm.length} characters` });
  }
  if (norm.length > 0 && tokenList.length === 0) {
    flags.push({ code: 'no_words', weight: 15, detail: 'Description contains no readable words (symbols/numbers only)' });
  }
  if (tokenList.length >= 4) {
    const counts = new Map<string, number>();
    tokenList.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
    const top = Math.max(0, ...counts.values());
    const ratio = top / tokenList.length;
    if (top >= 5 && ratio > 0.5) {
      flags.push({ code: 'keyword_stuffing', weight: 10, detail: `One word repeated ${top} times in ${tokenList.length}` });
    }
  }

  const score = Math.min(100, flags.reduce((sum, f) => sum + f.weight, 0));
  return { score, level: riskLevelFor(score), flags };
}
