/**
 * Incident date/time capture (spec §12/§13).
 *
 * Every report stores WHEN it happened, separate from when it was submitted:
 *   incidentDate        YYYY-MM-DD (citizen-local calendar day)
 *   incidentTime        HH:MM      (citizen-local wall clock)
 *   incidentDateTime    ISO instant for TIMESTAMPTZ / audit
 *   incidentTimePrecision  EXACT | APPROXIMATE | UNKNOWN | ONGOING
 *
 * reportCreatedAt (incident.created_at) is set by the store at submission
 * time and is never overwritten by these fields.
 */

export type { IncidentTimePrecision } from '@/types';
import type { IncidentTimePrecision } from '@/types';

export type WhenMode = 'right_now' | 'today' | 'yesterday' | 'specific' | 'unknown';

export interface IncidentWhen {
  incident_date?: string;
  incident_time?: string;
  incident_date_time?: string;
  incident_time_precision: IncidentTimePrecision;
  /** Legacy column (TIMESTAMPTZ) kept in sync with incident_date_time. */
  date_of_incident?: string;
}

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

/**
 * Best-effort prefill from the citizen's own description so the common case
 * needs zero extra typing. Returns null when nothing was detected — the
 * citizen then picks explicitly (the step requires an answer).
 */
export function extractIncidentWhen(text: string): WhenMode | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;

  // Ongoing: "right now", "happening now", "just now" + Indic equivalents.
  if (/\bright\s*now\b|\bhappening\s+now\b|\bjust\s+now\b|\bongoing\b|ಈಗ\b|अभी|ఇప్పుడు/.test(t)) {
    return 'right_now';
  }
  if (/\byesterday\b|ನಿನ್ನೆ|నిన్న/.test(t)) return 'yesterday';
  if (/\btoday\b|\bthis\s+morning\b|\bthis\s+evening\b|ಇಂದು|आज|నేడు/.test(t)) return 'today';

  // Explicit calendar dates: 2026-10-06 / 6/10/2026 / 6th october / oct 6.
  if (
    /\b20\d{2}-\d{1,2}-\d{1,2}\b/.test(t) ||
    /\b\d{1,2}\/\d{1,2}\/(20)?\d{2}\b/.test(t) ||
    new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTHS})\\b`, 'i').test(t) ||
    new RegExp(`\\b(${MONTHS})\\s+\\d{1,2}(st|nd|rd|th)?\\b`, 'i').test(t)
  ) {
    return 'specific';
  }

  // A bare clock time still counts as a specific-time answer.
  if (/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b|\b\d{1,2}:\d{2}\s*(am|pm)?\b/.test(t)) {
    return 'specific';
  }

  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Parses YYYY-MM-DD into a local Date (no UTC shift on the day boundary). */
function parseDateOnly(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Builds the stored fields for the selected answer.
 * Precision rules:
 *   right_now            → ONGOING (active emergency, date/time = now)
 *   date + time          → EXACT
 *   date without time    → APPROXIMATE (day known, clock time not)
 *   unknown / nothing    → UNKNOWN (fields omitted — submission never blocked)
 */
export function buildIncidentWhen(
  mode: WhenMode | null,
  dateStr: string,
  timeStr: string,
  now: Date = new Date()
): IncidentWhen {
  if (mode === 'right_now') {
    const iso = now.toISOString();
    return {
      incident_date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      incident_time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      incident_date_time: iso,
      incident_time_precision: 'ONGOING',
      date_of_incident: iso,
    };
  }

  if (mode === 'unknown' || !mode) {
    return { incident_time_precision: 'UNKNOWN' };
  }

  let date = dateStr;
  if (mode === 'today' || mode === 'yesterday') {
    const d = new Date(now);
    if (mode === 'yesterday') d.setDate(d.getDate() - 1);
    date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // "Specific" chosen without a calendar day — nothing reliable to store.
    return { incident_time_precision: 'UNKNOWN' };
  }

  const time = /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '';
  const precision: IncidentTimePrecision = time ? 'EXACT' : 'APPROXIMATE';

  const local = parseDateOnly(date);
  if (!local) return { incident_time_precision: 'UNKNOWN' };
  const [hh, mm] = time ? time.split(':').map(Number) : [0, 0];
  local.setHours(hh || 0, mm || 0, 0, 0);

  return {
    incident_date: date,
    incident_time: time || undefined,
    incident_date_time: local.toISOString(),
    incident_time_precision: precision,
    date_of_incident: local.toISOString(),
  };
}

/** Human line for the review card / admin dashboard (locale-aware). */
export function formatIncidentWhen(w: {
  incident_date?: string;
  incident_time?: string;
  incident_time_precision?: IncidentTimePrecision;
} | null | undefined): string | null {
  if (!w || !w.incident_time_precision || w.incident_time_precision === 'UNKNOWN') return null;
  if (w.incident_time_precision === 'ONGOING') return 'Happening right now';
  const local = w.incident_date ? parseDateOnly(w.incident_date) : null;
  if (!local) return 'Happening right now';
  const day = local.toLocaleDateString();
  return w.incident_time ? `${day} at ${w.incident_time}` : `${day} (time not known)`;
}
