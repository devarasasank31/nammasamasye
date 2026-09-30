import {
  Language, Incident, IncidentStatus, Session, Evidence, StatusHistory, AdminNote,
  AttachmentMeta, CategoryParent, PublicIncident,
} from '@/types';
import { computePriority, severityFor } from '@/lib/priority';
import { buildClusters } from '@/lib/clusters';
import { assessRisk, RiskLevel } from '@/lib/spam';
import {
  buildDailySeries as buildSeries,
  getCivicPulse as getTodaysPulse,
  findSimilarIssues as findSimilar,
  CivicPulse, DayPoint, SimilarMatch, ExportInput,
} from '@/lib/analytics';

// ============================================================
// PERSISTENT DEMO STORE — uses localStorage to survive restarts
// ============================================================

interface DemoIncident extends Incident {
  answers: Record<string, string>;
  evidence: Evidence[];
  statusHistory: StatusHistory[];
  adminNotes: AdminNote[];
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

let sessions: Session[] = loadFromStorage<Session[]>('ns_sessions', []);
let incidents: DemoIncident[] = loadFromStorage<DemoIncident[]>('ns_incidents', []);
let idCounter = loadFromStorage<number>('ns_id_counter', 100);

// Problems people typed under "Something Else" — kept with a usage count so
// the next citizen gets them offered as suggestions instead of retyping.
export interface CustomProblem {
  text: string;
  normalized: string;
  count: number;
  language: Language;
  first_seen: string;
  last_seen: string;
}

let customProblems: CustomProblem[] = loadFromStorage<CustomProblem[]>('ns_custom_problems', []);

// One vote / one flag per browser — the feed is anonymous, so the local
// device is the identity.
const supported: string[] = loadFromStorage<string[]>('ns_supported', []);
const flagged: string[] = loadFromStorage<string[]>('ns_flagged', []);

/**
 * Re-derives everything that depends on the whole collection: cluster
 * membership (N citizens, same ward, same issue) and the priority level,
 * which can rise by one when enough citizens report or support the same
 * problem.
 */
function recomputeDerived(): void {
  const { citizenCountByIncident, clusterKeyByIncident } = buildClusters(incidents);
  for (const inc of incidents) {
    const cluster = citizenCountByIncident.get(inc.incident_id) || 1;
    const support = inc.support_count || 0;
    const res = computePriority({
      category: (inc.category_id as CategoryParent) || 'OTHER',
      subcategory: inc.subcategory,
      text: `${inc.original_text} ${inc.ai_summary} ${Object.values(inc.answers || {}).join(' ')}`,
      answers: inc.answers,
      supportCount: support,
      clusterSize: cluster,
    });
    inc.priority = res.level;
    inc.priority_base = res.baseLevel;
    inc.priority_score = res.score;
    inc.priority_reason = res.reason;
    inc.sla_days = res.slaDays;
    inc.severity = severityFor(res.level);
    inc.cluster_citizens = cluster;
    inc.cluster_key = clusterKeyByIncident.get(inc.incident_id);
  }
  persistAll();
}

function genId(): string {
  idCounter++;
  saveToStorage('ns_id_counter', idCounter);
  return `ns-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function genIncidentId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = 'NS-';
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function persistAll(): void {
  saveToStorage('ns_sessions', sessions);
  saveToStorage('ns_incidents', incidents);
  saveToStorage('ns_custom_problems', customProblems);
}

// ============================================================
// SESSION
// ============================================================

export const demoStore = {
  // --- Sessions ---
  // Mirrors Supabase mode: a caller only reaches here when this browser has no
  // stored session id, so mint a brand-new session instead of reusing a recent
  // one. Distinct citizens must stay distinct or "N citizens reported this"
  // clusters would collapse to a single person.
  createSession(lang: Language): Session {
    const s: Session = {
      id: genId(),
      language: lang,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    };
    sessions.push(s);
    persistAll();
    return s;
  },

  getSession(id: string): Session | undefined {
    return sessions.find(s => s.id === id);
  },

  updateSession(id: string): void {
    const s = sessions.find(s => s.id === id);
    if (s) {
      s.last_active = new Date().toISOString();
      persistAll();
    }
  },

  // --- Incidents ---
  createIncident(data: {
    session_id: string;
    category_id: string;
    subcategory: string;
    original_text: string;
    structured_interpretation: string;
    ai_summary: string;
    location: string;
    location_area?: string;
    location_lat?: number;
    location_lng?: number;
    date_of_incident?: string;
    language: Language;
    answers: Record<string, string>;
    evidence_links: string[];
    attachments?: AttachmentMeta[];
    ai_scenario_match?: string;
    ai_confidence?: number;
    ai_reason?: string;
    ward?: string;
    ward_number?: number;
    zone?: string;
    police_station?: string;
    ward_distance_km?: number;
  }): Incident {
    const now = new Date().toISOString();
    const incId = genIncidentId();
    const id = genId();

    const incident: DemoIncident = {
      id,
      incident_id: incId,
      session_id: data.session_id,
      category_id: data.category_id,
      subcategory: data.subcategory,
      original_text: data.original_text,
      structured_interpretation: data.structured_interpretation || '',
      ai_summary: data.ai_summary || '',
      location: data.location || '',
      location_area: data.location_area || data.ward || '',
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      date_of_incident: data.date_of_incident,
      language: data.language,
      status: 'NEW',
      severity: 'medium',
      is_recurring: false,
      attachments: data.attachments || [],
      ai_scenario_match: data.ai_scenario_match || '',
      ai_confidence: data.ai_confidence || 0,
      ai_reason: data.ai_reason || '',
      ward: data.ward,
      ward_number: data.ward_number,
      zone: data.zone,
      police_station: data.police_station,
      ward_distance_km: data.ward_distance_km,
      support_count: 0,
      flag_count: 0,
      created_at: now,
      updated_at: now,
      answers: data.answers || {},
      evidence: (data.evidence_links || []).map(url => ({
        id: genId(),
        incident_id: id,
        type: 'link' as const,
        description: '',
        url,
        status: 'pending' as const,
        date_added: now,
      })),
      statusHistory: [{
        id: genId(),
        incident_id: id,
        previous_status: null,
        new_status: 'NEW',
        admin_id: 'system',
        admin_note: 'Incident created',
        timestamp: now,
      }],
      adminNotes: [],
    };

    // Moderation score at creation time. Volume alone never trips it: only
    // identical resubmissions, impossible coordinates, abuse or junk media do.
    const normalizedReport = (s: string) =>
      (s || '').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
    const risk = assessRisk({
      text: `${data.original_text} ${Object.values(data.answers || {}).join(' ')}`,
      lat: data.location_lat,
      lng: data.location_lng,
      evidenceLinks: data.evidence_links,
      attachments: data.attachments,
      recentBySession: incidents
        .filter(r => r.session_id === data.session_id)
        .map(r => ({ created_at: r.created_at, normalized: normalizedReport(r.original_text) })),
    });
    incident.risk_score = risk.score;
    incident.risk_level = risk.level as RiskLevel;
    incident.risk_flags = risk.flags.map(f => `${f.code}: ${f.detail}`);

    incidents.push(incident);
    // Clusters first (they can raise priority), then the derived fields.
    recomputeDerived();
    const created = incidents.find(i => i.id === id);
    return created ? this.toPublicIncident(created) : this.toPublicIncident(incident);
  },

  getIncidentsBySession(sessionId: string): Incident[] {
    return incidents
      .filter(i => i.session_id === sessionId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(i => this.toPublicIncident(i));
  },

  getIncidentByPublicId(incidentId: string): Incident | undefined {
    const inc = incidents.find(i => i.incident_id === incidentId);
    return inc ? this.toPublicIncident(inc) : undefined;
  },

  getIncidentById(id: string): DemoIncident | undefined {
    return incidents.find(i => i.id === id);
  },

  getAllIncidents(): Incident[] {
    return incidents
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(i => this.toPublicIncident(i));
  },

  getIncidentAnswers(incidentId: string): { question_id: string; answer: string }[] {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return [];
    return Object.entries(inc.answers).map(([question_id, answer]) => ({ question_id, answer }));
  },

  getIncidentEvidence(incidentId: string): Evidence[] {
    const inc = incidents.find(i => i.id === incidentId);
    return inc?.evidence || [];
  },

  getStatusHistory(incidentId: string): StatusHistory[] {
    const inc = incidents.find(i => i.id === incidentId);
    return inc?.statusHistory || [];
  },

  getAdminNotes(incidentId: string): AdminNote[] {
    const inc = incidents.find(i => i.id === incidentId);
    return inc?.adminNotes || [];
  },

  updateIncidentStatus(incidentId: string, newStatus: IncidentStatus, adminId: string, note?: string): boolean {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return false;

    const prev = inc.status;
    inc.status = newStatus;
    inc.updated_at = new Date().toISOString();
    if (newStatus === 'RESOLVED' && !inc.resolved_at) {
      inc.resolved_at = new Date().toISOString();
    }
    if (newStatus !== 'RESOLVED' && newStatus !== 'CLOSED') {
      inc.resolved_at = undefined;
    }
    inc.statusHistory.push({
      id: genId(),
      incident_id: incidentId,
      previous_status: prev,
      new_status: newStatus,
      admin_id: adminId,
      admin_note: note || '',
      timestamp: new Date().toISOString(),
    });
    persistAll();
    return true;
  },

  addAdminNote(incidentId: string, adminId: string, content: string): void {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return;
    inc.adminNotes.push({
      id: genId(),
      incident_id: incidentId,
      admin_id: adminId,
      content,
      is_private: true,
      created_at: new Date().toISOString(),
    });
    persistAll();
  },

  addAdminNotePublic(incidentId: string, adminId: string, content: string, isPrivate: boolean): void {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return;
    inc.adminNotes.push({
      id: genId(),
      incident_id: incidentId,
      admin_id: adminId,
      content,
      is_private: isPrivate,
      created_at: new Date().toISOString(),
    });
    persistAll();
  },

  getPublicNotes(incidentId: string): AdminNote[] {
    const inc = incidents.find(i => i.id === incidentId);
    return (inc?.adminNotes || []).filter(n => !n.is_private);
  },

  getStats() {
    const total = incidents.length;
    const byCategory: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    const byLang: Record<string, number> = {};

    incidents.forEach(inc => {
      byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
      if (inc.location_area) byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
      byLang[inc.language] = (byLang[inc.language] || 0) + 1;
    });

    return { total, byCategory, byArea, byLang };
  },

  // --- Public issue feed (sanitised) ---
  toPublicFeedItem(i: Incident): PublicIncident {
    return {
      incident_id: i.incident_id,
      category_id: i.category_id,
      subcategory: i.subcategory,
      ward: i.ward,
      ward_number: i.ward_number,
      zone: i.zone,
      police_station: i.police_station,
      area: i.ward || i.location_area || '',
      priority: i.priority || 'P3',
      severity: i.severity || 'medium',
      status: i.status,
      support_count: i.support_count || 0,
      flag_count: i.flag_count || 0,
      cluster_citizens: i.cluster_citizens || 1,
      sla_days: i.sla_days,
      created_at: i.created_at,
      resolved_at: i.resolved_at,
      supported: supported.includes(i.incident_id),
      flagged: flagged.includes(i.incident_id),
    };
  },

  getPublicFeed(): PublicIncident[] {
    const rank: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return incidents
      .map(i => this.toPublicFeedItem(this.toPublicIncident(i)))
      .filter(i => i.status !== 'INVALID')
      .sort(
        (a, b) =>
          rank[a.priority] - rank[b.priority] ||
          b.support_count - a.support_count ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  /**
   * Toggle citizen support — the same button withdraws it. One vote per
   * browser; returns the fresh count plus whether this browser now supports it.
   */
  supportIncident(incidentId: string): { count: number; supported: boolean } | null {
    const inc = incidents.find(i => i.incident_id === incidentId);
    if (!inc) return null;
    const at = supported.indexOf(incidentId);
    if (at >= 0) {
      supported.splice(at, 1);
      inc.support_count = Math.max(0, (inc.support_count || 0) - 1);
    } else {
      supported.push(incidentId);
      inc.support_count = (inc.support_count || 0) + 1;
    }
    saveToStorage('ns_supported', supported);
    recomputeDerived();
    const after = incidents.find(i => i.incident_id === incidentId);
    return { count: after?.support_count ?? 0, supported: supported.includes(incidentId) };
  },

  /** Report a poor/inaccurate description so an admin can improve it. */
  flagIncident(incidentId: string): number | null {
    const inc = incidents.find(i => i.incident_id === incidentId);
    if (!inc) return null;
    if (flagged.includes(incidentId)) return inc.flag_count || 0;
    flagged.push(incidentId);
    inc.flag_count = (inc.flag_count || 0) + 1;
    saveToStorage('ns_flagged', flagged);
    persistAll();
    return inc.flag_count;
  },

  hasSupported(incidentId: string): boolean {
    return supported.includes(incidentId);
  },

  hasFlagged(incidentId: string): boolean {
    return flagged.includes(incidentId);
  },

  /** All clusters with 2+ independent citizens — admin "same issue" view. */
  getClusters() {
    return buildClusters(incidents).clusters;
  },

  /**
   * Reports this submission would duplicate, best match first — used to show
   * "Similar issue nearby … Reported by N citizens" instead of a new ticket.
   */
  findSimilarIssues(input: { lat?: number; lng?: number; wardNumber?: number; subcategory: string; text: string }): SimilarMatch[] {
    return findSimilar(incidents, input);
  },

  /** Registered vs resolved for each of the last N days. */
  getDailySeries(days = 14): DayPoint[] {
    return buildSeries(incidents, days);
  },

  /** Bengaluru Civic Pulse — today's real numbers. */
  getCivicPulse(): CivicPulse {
    return getTodaysPulse(incidents);
  },

  /** Everything an admin export needs, including answers, links and history. */
  getExportData(): ExportInput[] {
    return incidents.map(inc => ({
      incident: this.toPublicIncident(inc),
      answers: inc.answers,
      evidenceUrls: (inc.evidence || []).map(e => e.url),
      attachmentNames: (inc.attachments || []).map(a => a.name),
      statusHistory: (inc.statusHistory || []).map(s => ({
        new_status: s.new_status,
        timestamp: s.timestamp,
        admin_note: s.admin_note,
      })),
      adminNotes: (inc.adminNotes || []).map(n => ({ content: n.content, created_at: n.created_at })),
    }));
  },

  toPublicIncident(inc: DemoIncident): Incident {
    const { answers, evidence, statusHistory, adminNotes, ...pub } = inc;
    return pub;
  },

  // --- "Something else" custom problems ---
  recordCustomProblem(text: string, language: Language): CustomProblem | null {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (trimmed.length < 4) return null;
    const normalized = trimmed.toLowerCase();
    const now = new Date().toISOString();
    const existing = customProblems.find(p => p.normalized === normalized);
    if (existing) {
      existing.count += 1;
      existing.last_seen = now;
      if (language) existing.language = language;
      persistAll();
      return existing;
    }
    const record: CustomProblem = {
      text: trimmed,
      normalized,
      count: 1,
      language,
      first_seen: now,
      last_seen: now,
    };
    customProblems.unshift(record);
    if (customProblems.length > 300) customProblems.length = 300;
    persistAll();
    return record;
  },

  getCustomProblems(limit = 8): CustomProblem[] {
    return [...customProblems]
      .sort((a, b) => b.count - a.count || (a.last_seen < b.last_seen ? 1 : -1))
      .slice(0, Math.max(1, limit));
  },

  clearAll(): void {
    sessions = [];
    incidents = [];
    idCounter = 100;
    customProblems = [];
    supported.length = 0;
    flagged.length = 0;
    saveToStorage('ns_supported', []);
    saveToStorage('ns_flagged', []);
    persistAll();
  },
};

// ============================================================
// SEED DEMO DATA — REMOVED
// Only real user-submitted incidents are shown
// ============================================================

export function seedDemoData() {
  // No fake data — only real submissions from users
}

// Back-fill wards/priorities for reports saved by an earlier build.
if (typeof window !== 'undefined' && incidents.length > 0) {
  try {
    recomputeDerived();
  } catch {
    // Never block the app on a bad legacy record.
  }
}
