import { Language, Incident, IncidentStatus, Session, Evidence, StatusHistory, AdminNote } from '@/types';

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

function saveToStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

let sessions: Session[] = loadFromStorage<Session[]>('ns_sessions', []);
let incidents: DemoIncident[] = loadFromStorage<DemoIncident[]>('ns_incidents', []);
let idCounter = loadFromStorage<number>('ns_id_counter', 100);

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
}

// ============================================================
// SESSION
// ============================================================

export const demoStore = {
  // --- Sessions ---
  createSession(lang: Language): Session {
    const existing = sessions.find(s => s.language === lang && 
      (Date.now() - new Date(s.last_active).getTime()) < 30 * 60 * 1000);
    if (existing) {
      existing.last_active = new Date().toISOString();
      persistAll();
      return existing;
    }
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
    ai_scenario_match?: string;
    ai_confidence?: number;
    ai_reason?: string;
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
      location_area: data.location_area || '',
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      date_of_incident: data.date_of_incident,
      language: data.language,
      status: 'NEW',
      severity: 'medium',
      is_recurring: false,
      ai_scenario_match: data.ai_scenario_match || '',
      ai_confidence: data.ai_confidence || 0,
      ai_reason: data.ai_reason || '',
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

    incidents.push(incident);
    persistAll();
    return this.toPublicIncident(incident);
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

  toPublicIncident(inc: DemoIncident): Incident {
    const { answers, evidence, statusHistory, adminNotes, ...pub } = inc;
    return pub;
  },

  clearAll(): void {
    sessions = [];
    incidents = [];
    idCounter = 100;
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
