import { Language, Incident, IncidentStatus, Session, Evidence, StatusHistory, AdminNote } from '@/types';

// ============================================================
// IN-MEMORY DEMO STORE — works without Supabase
// ============================================================

interface DemoIncident extends Incident {
  answers: Record<string, string>;
  evidence: Evidence[];
  statusHistory: StatusHistory[];
  adminNotes: AdminNote[];
}

let sessions: Session[] = [];
let incidents: DemoIncident[] = [];
let idCounter = 100;

function genId(): string {
  idCounter++;
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

// ============================================================
// SESSION
// ============================================================

export const demoStore = {
  // --- Sessions ---
  createSession(lang: Language): Session {
    const s: Session = {
      id: genId(),
      language: lang,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    };
    sessions.push(s);
    return s;
  },

  getSession(id: string): Session | undefined {
    return sessions.find(s => s.id === id);
  },

  updateSession(id: string): void {
    const s = sessions.find(s => s.id === id);
    if (s) s.last_active = new Date().toISOString();
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
};

// ============================================================
// SEED DEMO DATA
// ============================================================

export function seedDemoData() {
  if (incidents.length > 0) return; // already seeded

  const s1 = demoStore.createSession('en');
  const s2 = demoStore.createSession('kn');
  const s3 = demoStore.createSession('hi');

  const demoData: any[] = [
    { session_id: s1.id, category_id: 'TRAFFIC', subcategory: 'traffic_accident', original_text: 'A car hit my bike near Koramangala Signal. The driver started arguing with me.', structured_interpretation: 'Vehicle collision reported', ai_summary: 'Car hit bike at Koramangala Signal', location: 'Koramangala Signal, Bengaluru', location_area: 'Koramangala', language: 'en' as Language, ai_confidence: 96, ai_scenario_match: 'Road accident', ai_reason: 'Description mentions vehicle collision', answers: { what_happened: 'Car hit my bike', when: 'Yesterday at 6pm', where: 'Koramangala Signal', injured: 'No', witnesses: 'Yes' }, evidence_links: ['https://drive.google.com/example1'] },
    { session_id: s1.id, category_id: 'CIVIC', subcategory: 'civic_pothole', original_text: 'Huge pothole on 80 Feet Road near Indiranagar. Very dangerous for two-wheelers.', structured_interpretation: 'Pothole on major road', ai_summary: 'Dangerous pothole on 80 Feet Road Indiranagar', location: '80 Feet Road, Indiranagar', location_area: 'Indiranagar', language: 'en' as Language, ai_confidence: 92, ai_scenario_match: 'Pothole', ai_reason: 'Mentions road damage and pothole', answers: { where: '80 Feet Road', severity: 'large', recurring: 'Yes' }, evidence_links: [] },
    { session_id: s2.id, category_id: 'CIVIC', subcategory: 'civic_garbage', original_text: 'Garbage dumping near BTM Layout 2nd Stage. Been there for a week.', structured_interpretation: 'Garbage dumping', ai_summary: 'Garbage near BTM Layout', location: 'BTM Layout 2nd Stage', location_area: 'BTM Layout', language: 'kn' as Language, ai_confidence: 88, ai_scenario_match: 'Garbage dumping', ai_reason: 'Mentions garbage and dumping', answers: { where: 'BTM Layout 2nd Stage', recurring: 'Yes', frequency: 'daily' }, evidence_links: [] },
    { session_id: s3.id, category_id: 'GOVERNMENT', subcategory: 'unofficial_payment', original_text: 'Traffic police asked me for 250 instead of giving me the challan near MG Road.', structured_interpretation: 'Alleged unofficial payment request', ai_summary: 'Police asked for money instead of challan', location: 'MG Road, Bengaluru', location_area: 'MG Road', language: 'hi' as Language, ai_confidence: 94, ai_scenario_match: 'Alleged unofficial payment request', ai_reason: 'Mentions payment request instead of official challan', answers: { what_happened: 'Police asked for money', where: 'MG Road', when: 'Today at 3pm', amount: '250', challan: 'No' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'TRAFFIC', subcategory: 'traffic_parking', original_text: 'Car parked on footpath near HSR Layout. Pedestrians cannot walk.', structured_interpretation: 'Illegal parking on footpath', ai_summary: 'Car blocking footpath at HSR Layout', location: 'HSR Layout', location_area: 'HSR Layout', language: 'en' as Language, ai_confidence: 85, ai_scenario_match: 'Illegal parking', ai_reason: 'Mentions parking on footpath', answers: { where: 'HSR Layout', blocking: 'Yes' }, evidence_links: [] },
    { session_id: s2.id, category_id: 'CIVIC', subcategory: 'civic_streetlight', original_text: 'Streetlight not working near Whitefield Main Road for 2 weeks.', structured_interpretation: 'Streetlight failure', ai_summary: 'Broken streetlight at Whitefield', location: 'Whitefield Main Road', location_area: 'Whitefield', language: 'kn' as Language, ai_confidence: 90, ai_scenario_match: 'Streetlight failure', ai_reason: 'Mentions broken streetlight', answers: { where: 'Whitefield Main Road', how_long: '2 weeks' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'PUBLIC_SAFETY', subcategory: 'safety_harassment', original_text: 'Someone following me near JP Nagar. Feeling unsafe.', structured_interpretation: 'Safety concern reported', ai_summary: 'Person being followed at JP Nagar', location: 'JP Nagar', location_area: 'JP Nagar', language: 'en' as Language, ai_confidence: 78, ai_scenario_match: 'Safety concern', ai_reason: 'Mentions being followed and feeling unsafe', answers: { what_happened: 'Being followed', where: 'JP Nagar', when: 'Just now', immediate_danger: 'No' }, evidence_links: [] },
    { session_id: s3.id, category_id: 'DIGITAL', subcategory: 'cybercrime', original_text: 'Received phishing link claiming to be from bank. Almost entered my details.', structured_interpretation: 'Phishing attempt', ai_summary: 'Phishing link received via email', location: 'Online', location_area: '', language: 'hi' as Language, ai_confidence: 82, ai_scenario_match: 'Cybercrime - phishing', ai_reason: 'Mentions phishing link', answers: { what_happened: 'Phishing attempt', platform: 'Email', suspicious_links: 'Yes' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'HOUSING', subcategory: 'housing_tenant', original_text: 'Landlord not returning deposit even after 2 months of vacating.', structured_interpretation: 'Deposit dispute', ai_summary: 'Landlord not returning deposit', location: 'Electronic City', location_area: 'Electronic City', language: 'en' as Language, ai_confidence: 87, ai_scenario_match: 'Tenant-landlord dispute', ai_reason: 'Mentions deposit dispute with landlord', answers: { what_happened: 'Deposit not returned', agreement: 'Yes' }, evidence_links: [] },
    { session_id: s2.id, category_id: 'ENVIRONMENT', subcategory: 'env_noise', original_text: 'Construction noise after 10 PM in residential area near Sarjapur Road.', structured_interpretation: 'Noise pollution', ai_summary: 'Late night construction noise at Sarjapur', location: 'Sarjapur Road', location_area: 'Sarjapur', language: 'kn' as Language, ai_confidence: 91, ai_scenario_match: 'Noise pollution', ai_reason: 'Mentions construction noise at night', answers: { where: 'Sarjapur Road', what_source: 'Construction', when: 'After 10 PM' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'CIVIC', subcategory: 'civic_pothole', original_text: 'Multiple potholes on Outer Ring Road near Marathahalli bridge.', structured_interpretation: 'Road damage', ai_summary: 'Multiple potholes at Marathahalli', location: 'Outer Ring Road, Marathahalli', location_area: 'Marathahalli', language: 'en' as Language, ai_confidence: 93, ai_scenario_match: 'Road damage', ai_reason: 'Mentions multiple potholes', answers: { where: 'Marathahalli bridge', severity: 'large' }, evidence_links: [] },
    { session_id: s3.id, category_id: 'TRAFFIC', subcategory: 'traffic_interaction', original_text: 'Traffic police stopped me without any reason and asked for documents repeatedly.', structured_interpretation: 'Traffic stop concern', ai_summary: 'Traffic stop without stated reason', location: 'Silk Board', location_area: 'Silk Board', language: 'hi' as Language, ai_confidence: 76, ai_scenario_match: 'Traffic stop concern', ai_reason: 'Mentions traffic stop', answers: { what_happened: 'Stopped without reason', where: 'Silk Board', when: 'Today', reason: 'None stated' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'UTILITIES', subcategory: 'util_power', original_text: 'Power outage in entire layout since morning. No notice from BESCOM.', structured_interpretation: 'Power outage', ai_summary: 'Area-wide power outage', location: 'Kadugodi', location_area: 'Kadugodi', language: 'en' as Language, ai_confidence: 95, ai_scenario_match: 'Power outage', ai_reason: 'Mentions power outage', answers: { where: 'Kadugodi', when: 'Since morning', area_wide: 'Yes' }, evidence_links: [] },
    { session_id: s2.id, category_id: 'CIVIC', subcategory: 'civic_drainage', original_text: 'Drainage blocked near Banashankari causing water logging.', structured_interpretation: 'Drainage blockage', ai_summary: 'Blocked drainage at Banashankari', location: 'Banashankari', location_area: 'Banashankari', language: 'kn' as Language, ai_confidence: 89, ai_scenario_match: 'Drainage blockage', ai_reason: 'Mentions blocked drainage', answers: { where: 'Banashankari', recurring: 'Yes' }, evidence_links: [] },
    { session_id: s1.id, category_id: 'CIVIC', subcategory: 'civic_footpath', original_text: 'Footpath encroached by shops near Jayanagar 4th Block.', structured_interpretation: 'Footpath obstruction', ai_summary: 'Shops encroaching footpath at Jayanagar', location: 'Jayanagar 4th Block', location_area: 'Jayanagar', language: 'en' as Language, ai_confidence: 86, ai_scenario_match: 'Footpath obstruction', ai_reason: 'Mentions footpath encroachment', answers: { where: 'Jayanagar 4th Block', what_happened: 'Shops on footpath' }, evidence_links: [] },
    { session_id: s3.id, category_id: 'CIVIC', subcategory: 'civic_garbage', original_text: 'Garbage pile up near Koramangala water tank. Stray dogs everywhere.', structured_interpretation: 'Garbage dumping', ai_summary: 'Garbage pile at Koramangala', location: 'Koramangala Water Tank', location_area: 'Koramangala', language: 'hi' as Language, ai_confidence: 90, ai_scenario_match: 'Garbage dumping', ai_reason: 'Mentions garbage pile', answers: { where: 'Koramangala Water Tank', recurring: 'Yes', frequency: 'weekly' }, evidence_links: [] },
  ];

  demoData.forEach(d => {
    demoStore.createIncident(d);
  });

  // Set some statuses to make dashboard interesting
  const allInc = incidents;
  if (allInc[0]) demoStore.updateIncidentStatus(allInc[0].id, 'UNDER_REVIEW', 'admin', 'Reviewing evidence');
  if (allInc[1]) demoStore.updateIncidentStatus(allInc[1].id, 'PROCEEDING', 'admin', 'Forwarded to BBMP');
  if (allInc[3]) demoStore.updateIncidentStatus(allInc[3].id, 'UNDER_REVIEW', 'admin', 'Checking with traffic dept');
  if (allInc[4]) demoStore.updateIncidentStatus(allInc[4].id, 'CLOSED', 'admin', 'Issue resolved by local authority');
  if (allInc[5]) demoStore.updateIncidentStatus(allInc[5].id, 'PROCEEDING', 'admin', 'BBMP notified');
  if (allInc[6]) demoStore.updateIncidentStatus(allInc[6].id, 'MISSING_INFORMATION', 'admin', 'Please provide more details');
  if (allInc[11]) demoStore.updateIncidentStatus(allInc[11].id, 'PROCEEDING', 'admin', 'BESCOM contacted');

  console.log(`[Demo] Seeded ${incidents.length} incidents, ${sessions.length} sessions`);
}
