import { Incident, IncidentStatus, Evidence, StatusHistory, Language, AttachmentMeta, IncidentStats, PublicIncident } from '@/types';
import { isDemoMode } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { buildExportRows, CivicPulse, DayPoint, ExportRow, SimilarMatch } from '@/lib/analytics';

export async function createIncident(data: {
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
  ai_context?: string;
  ward?: string;
  ward_number?: number;
  zone?: string;
  police_station?: string;
  ward_distance_km?: number;
}): Promise<Incident | null> {
  if (isDemoMode) {
    return demoStore.createIncident(data);
  }

  const { supabase } = await import('@/lib/supabase');

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
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
      date_of_incident: data.date_of_incident || null,
      language: data.language,
      status: 'NEW',
      attachments: data.attachments || [],
      ai_scenario_match: data.ai_scenario_match || '',
      ai_confidence: data.ai_confidence || 0,
      ai_reason: data.ai_reason || '',
      ai_context: data.ai_context || '',
      ward: data.ward || null,
      ward_number: data.ward_number ?? null,
      zone: data.zone || null,
      police_station: data.police_station || null,
      ward_distance_km: data.ward_distance_km ?? null,
    })
    .select()
    .single();

  if (error || !incident) {
    console.error('Failed to create incident:', error);
    return null;
  }

  // Save answers
  const answerEntries = Object.entries(data.answers);
  if (answerEntries.length > 0) {
    await supabase.from('incident_answers').insert(
      answerEntries.map(([questionId, answer]) => ({
        incident_id: incident.id,
        question_id: questionId,
        question_text: questionId,
        answer,
      }))
    );
  }

  // Save evidence
  if (data.evidence_links.length > 0) {
    await supabase.from('evidence').insert(
      data.evidence_links.map(url => ({
        incident_id: incident.id,
        type: 'link' as const,
        url,
        description: '',
        status: 'pending',
      }))
    );
  }

  // Create initial status history
  await supabase.from('status_history').insert({
    incident_id: incident.id,
    previous_status: null,
    new_status: 'NEW',
    admin_id: 'system',
    admin_note: 'Incident created',
  });

  return incident;
}

export async function getIncidentsBySession(sessionId: string): Promise<Incident[]> {
  if (isDemoMode) {
    return demoStore.getIncidentsBySession(sessionId);
  }

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch incidents:', error);
    return [];
  }

  return data || [];
}

export async function getIncidentById(incidentId: string): Promise<Incident | null> {
  if (isDemoMode) {
    return demoStore.getIncidentByPublicId(incidentId) || null;
  }

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('incident_id', incidentId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getIncidentAnswers(incidentId: string) {
  if (isDemoMode) {
    return demoStore.getIncidentAnswers(incidentId);
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase
    .from('incident_answers')
    .select('*')
    .eq('incident_id', incidentId);

  return data || [];
}

export async function getIncidentEvidence(incidentId: string): Promise<Evidence[]> {
  if (isDemoMode) {
    return demoStore.getIncidentEvidence(incidentId);
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase
    .from('evidence')
    .select('*')
    .eq('incident_id', incidentId)
    .order('date_added', { ascending: false });

  return data || [];
}

export async function getStatusHistory(incidentId: string): Promise<StatusHistory[]> {
  if (isDemoMode) {
    return demoStore.getStatusHistory(incidentId);
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase
    .from('status_history')
    .select('*')
    .eq('incident_id', incidentId)
    .order('timestamp', { ascending: true });

  return data || [];
}

export async function updateIncidentStatus(
  incidentId: string,
  newStatus: IncidentStatus,
  adminId: string,
  note?: string
): Promise<boolean> {
  if (isDemoMode) {
    return demoStore.updateIncidentStatus(incidentId, newStatus, adminId, note);
  }

  const { supabase } = await import('@/lib/supabase');

  const { data: current } = await supabase
    .from('incidents')
    .select('status')
    .eq('id', incidentId)
    .single();

  const { error } = await supabase
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', incidentId);

  if (error) return false;

  await supabase.from('status_history').insert({
    incident_id: incidentId,
    previous_status: current?.status || null,
    new_status: newStatus,
    admin_id: adminId,
    admin_note: note || '',
  });

  return true;
}

// Direct DB access helpers for admin pages
export async function getAllIncidents(): Promise<Incident[]> {
  if (isDemoMode) {
    return demoStore.getAllIncidents();
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getIncidentInternal(id: string) {
  if (isDemoMode) {
    return demoStore.getIncidentById(id) || null;
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase.from('incidents').select('*').eq('id', id).single();
  return data;
}

export async function getAdminNotes(incidentId: string) {
  if (isDemoMode) {
    return demoStore.getAdminNotes(incidentId);
  }

  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase.from('admin_notes').select('*').eq('incident_id', incidentId).order('created_at', { ascending: false });
  return data || [];
}

export async function addAdminNote(incidentId: string, adminId: string, content: string) {
  if (isDemoMode) {
    demoStore.addAdminNote(incidentId, adminId, content);
    return;
  }

  const { supabase } = await import('@/lib/supabase');
  await supabase.from('admin_notes').insert({ incident_id: incidentId, admin_id: adminId, content, is_private: true });
}

export async function getDashboardStats(): Promise<IncidentStats> {
  if (isDemoMode) {
    return demoStore.getStats();
  }

  const { supabase } = await import('@/lib/supabase');
  const { data: incidents } = await supabase.from('incidents').select('category_id, location_area, language, status');
  if (!incidents) return { total: 0, byCategory: {}, byArea: {}, byLang: {} };

  const byCategory: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  const byLang: Record<string, number> = {};

  incidents.forEach((inc) => {
    byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
    if (inc.location_area) byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
    byLang[inc.language] = (byLang[inc.language] || 0) + 1;
  });

  return { total: incidents.length, byCategory, byArea, byLang };
}

// ============================================================
// PUBLIC ISSUE FEED — sanitised, no personal or sensitive fields
// ============================================================

export async function getPublicFeed(): Promise<PublicIncident[]> {
  if (isDemoMode) return demoStore.getPublicFeed();
  return [];
}

/** Toggle citizen support — the same control withdraws it. */
export async function supportIncident(incidentId: string): Promise<{ count: number; supported: boolean } | null> {
  if (isDemoMode) return demoStore.supportIncident(incidentId);
  return null;
}

export async function flagIncident(incidentId: string): Promise<number | null> {
  if (isDemoMode) return demoStore.flagIncident(incidentId);
  return null;
}

/** Would this submission duplicate an existing report? ("similar issue") */
export async function findSimilarIssues(input: {
  lat?: number; lng?: number; wardNumber?: number; subcategory: string; text: string;
}): Promise<SimilarMatch[]> {
  if (isDemoMode) return demoStore.findSimilarIssues(input);
  return [];
}

/** Registered vs resolved, per day, for the citizen and admin dashboards. */
export async function getDailySeries(days = 14): Promise<DayPoint[]> {
  if (isDemoMode) return demoStore.getDailySeries(days);
  return [];
}

/** Bengaluru Civic Pulse — today's reports, resolutions and open cases. */
export async function getCivicPulse(): Promise<CivicPulse> {
  if (isDemoMode) return demoStore.getCivicPulse();
  return { today: new Date().toISOString().split('T')[0], reportsToday: 0, resolvedToday: 0, open: 0, resolved: 0, total: 0 };
}

/** Full admin export: every field, answers, evidence links and history. */
export async function exportAllData(): Promise<ExportRow[]> {
  if (isDemoMode) return buildExportRows(demoStore.getExportData());
  return [];
}
