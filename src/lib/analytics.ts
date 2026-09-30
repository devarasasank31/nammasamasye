import { Incident } from '@/types';
import { haversineKm } from '@/data/wards';

// ============================================================
// DAY-BY-DAY + TODAY (shared by the citizen dashboard and admin)
// ============================================================

export interface DayPoint {
  date: string;
  reports: number;
  resolved: number;
}

export function lastNDates(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

/** Every day in the window with its registered and resolved counts. */
export function buildDailySeries(incidents: Incident[], days = 14): DayPoint[] {
  const series = lastNDates(days).map(date => ({ date, reports: 0, resolved: 0 }));
  const index = new Map(series.map((d, i) => [d.date, i]));
  for (const inc of incidents) {
    const created = new Date(inc.created_at).toISOString().split('T')[0];
    const at = index.get(created);
    if (at !== undefined) series[at].reports += 1;
    if (inc.resolved_at) {
      const r = index.get(new Date(inc.resolved_at).toISOString().split('T')[0]);
      if (r !== undefined) series[r].resolved += 1;
    }
  }
  return series;
}

export interface CivicPulse {
  today: string;
  reportsToday: number;
  resolvedToday: number;
  open: number;
  resolved: number;
  total: number;
}

/** "Bengaluru Civic Pulse" — today's real numbers plus lifetime totals. */
export function getCivicPulse(incidents: Incident[]): CivicPulse {
  const today = new Date().toISOString().split('T')[0];
  const isOpen = (i: Incident) => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.status !== 'INVALID';
  const resolved = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  return {
    today,
    reportsToday: incidents.filter(i => new Date(i.created_at).toISOString().split('T')[0] === today).length,
    resolvedToday: incidents.filter(i => i.resolved_at && new Date(i.resolved_at).toISOString().split('T')[0] === today).length,
    open: incidents.filter(isOpen).length,
    resolved,
    total: incidents.length,
  };
}

// ============================================================
// SIMILAR-ISSUE DETECTION — "one problem, many citizens"
// ============================================================

export const SIMILAR_RADIUS_KM = 1.2;
const SIMILAR_WIDE_RADIUS_KM = 3;
const SIMILAR_WINDOW_DAYS = 90;

export interface SimilarMatch {
  incident: Incident;
  distanceKm: number | null;
  score: number;
  reason: 'nearby' | 'same_ward';
}

function tokenSet(text: string): Set<string> {
  return new Set(
    (text || '').toLowerCase().replace(/[^a-z0-9\u0C80-\u0CFF\u0900-\u097F\u0C00-\u0C7F ]/g, ' ')
      .split(/\s+/).filter(w => w.length > 2)
  );
}

/** Jaccard overlap — 1 = identical wording, 0 = nothing shared. */
export function textSimilarity(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  A.forEach(w => { if (B.has(w)) shared += 1; });
  return shared / (A.size + B.size - shared);
}

/**
 * Would this submission duplicate an existing report?
 * Same subcategory, within ~1.2 km (or the same ward), raised in the last
 * 90 days. Text similarity and citizen counts decide the ordering so the
 * card shows the issue most people already back.
 */
export function findSimilarIssues(
  incidents: Incident[],
  input: { lat?: number; lng?: number; wardNumber?: number; subcategory: string; text: string }
): SimilarMatch[] {
  if (!input.subcategory) return [];
  const cutoff = Date.now() - SIMILAR_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const matches: SimilarMatch[] = [];
  for (const inc of incidents) {
    if (inc.subcategory !== input.subcategory) continue;
    if (inc.status === 'INVALID') continue;
    if (new Date(inc.created_at).getTime() < cutoff) continue;

    let distanceKm: number | null = null;
    if (
      typeof input.lat === 'number' && typeof input.lng === 'number' &&
      typeof inc.location_lat === 'number' && typeof inc.location_lng === 'number'
    ) {
      distanceKm = Math.round(haversineKm(input.lat, input.lng, inc.location_lat, inc.location_lng) * 100) / 100;
    }

    const sameWard = typeof input.wardNumber === 'number' && inc.ward_number === input.wardNumber;
    const nearby = distanceKm !== null && distanceKm <= SIMILAR_RADIUS_KM;
    const wideNearby = distanceKm !== null && distanceKm <= SIMILAR_WIDE_RADIUS_KM;
    if (!nearby && !sameWard && !wideNearby) continue;
    if (distanceKm !== null && distanceKm > SIMILAR_WIDE_RADIUS_KM) continue;

    const words = textSimilarity(input.text, `${inc.original_text} ${inc.ai_summary}`);
    const citizens = inc.cluster_citizens || 1;
    const score =
      (nearby ? 40 : wideNearby ? 25 : 15) +
      (sameWard ? 20 : 0) +
      Math.round(words * 25) +
      Math.min(15, citizens * 3) +
      Math.round(Math.min(10, (inc.support_count || 0) * 2));

    matches.push({
      incident: inc,
      distanceKm,
      score,
      reason: sameWard ? 'same_ward' : 'nearby',
    });
    void now;
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ============================================================
// FULL EXPORT (CSV / JSON) — admin takes the data with them
// ============================================================

export interface ExportInput {
  incident: Incident;
  answers?: Record<string, string>;
  evidenceUrls?: string[];
  attachmentNames?: string[];
  statusHistory?: { new_status: string; timestamp: string; admin_note?: string }[];
  adminNotes?: { content: string; created_at: string }[];
}

export interface ExportRow {
  incident_id: string;
  created_at: string;
  updated_at: string;
  resolved_at: string;
  status: string;
  priority: string;
  priority_base: string;
  priority_score: number | '';
  priority_reason: string;
  sla_days: number | '';
  category: string;
  subcategory: string;
  language: string;
  ward: string;
  ward_number: number | '';
  zone: string;
  police_station: string;
  area: string;
  latitude: number | '';
  longitude: number | '';
  support_count: number;
  flag_count: number;
  citizens_reporting: number;
  risk_score: number | '';
  risk_level: string;
  risk_flags: string;
  severity: string;
  recurring: string;
  evidence_links: string;
  attachments: string;
  answers_json: string;
  description: string;
  ai_summary: string;
  latest_admin_note: string;
  status_history: string;
  public_url: string;
  admin_url: string;
}

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

export function buildExportRows(items: ExportInput[]): ExportRow[] {
  const base = origin();
  return items.map(({ incident: i, answers, evidenceUrls, attachmentNames, statusHistory, adminNotes }) => ({
    incident_id: i.incident_id,
    created_at: i.created_at,
    updated_at: i.updated_at,
    resolved_at: i.resolved_at || '',
    status: i.status,
    priority: i.priority || '',
    priority_base: i.priority_base || '',
    priority_score: i.priority_score ?? '',
    priority_reason: i.priority_reason || '',
    sla_days: i.sla_days ?? '',
    category: i.category_id,
    subcategory: i.subcategory,
    language: i.language,
    ward: i.ward || '',
    ward_number: typeof i.ward_number === 'number' ? i.ward_number : '',
    zone: i.zone || '',
    police_station: i.police_station || '',
    area: i.location_area || '',
    latitude: typeof i.location_lat === 'number' ? i.location_lat : '',
    longitude: typeof i.location_lng === 'number' ? i.location_lng : '',
    support_count: i.support_count || 0,
    flag_count: i.flag_count || 0,
    citizens_reporting: i.cluster_citizens || 1,
    risk_score: i.risk_score ?? '',
    risk_level: i.risk_level || 'clean',
    risk_flags: (i.risk_flags || []).join('; '),
    severity: i.severity || '',
    recurring: i.is_recurring ? 'yes' : 'no',
    evidence_links: (evidenceUrls || []).join(' | '),
    attachments: (attachmentNames || []).join(' | '),
    answers_json: JSON.stringify(answers || {}),
    description: i.original_text || '',
    ai_summary: i.ai_summary || '',
    latest_admin_note: (adminNotes || [])[adminNotes?.length ? adminNotes.length - 1 : 0]?.content || '',
    status_history: (statusHistory || [])
      .map(s => `${s.timestamp} ${s.new_status}${s.admin_note ? ` (${s.admin_note})` : ''}`)
      .join(' > '),
    public_url: `${base}/track/${i.incident_id}`,
    admin_url: `${base}/admin/reports/${i.id}`,
  }));
}

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportRowsToCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map(r => headers.map(h => csvCell((r as unknown as Record<string, unknown>)[h])).join(','))].join('\r\n');
}

export function exportRowsToJson(rows: ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
