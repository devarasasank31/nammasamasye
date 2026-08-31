import { supabase } from '@/lib/supabase';
import { Incident, IncidentStatus, Evidence, StatusHistory, Language } from '@/types';

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
  ai_scenario_match?: string;
  ai_confidence?: number;
  ai_reason?: string;
}): Promise<Incident | null> {
  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
      session_id: data.session_id,
      category_id: data.category_id,
      subcategory: data.subcategory,
      original_text: data.original_text,
      structured_interpretation: data.structured_interpretation,
      ai_summary: data.ai_summary,
      location: data.location,
      location_area: data.location_area || '',
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      date_of_incident: data.date_of_incident || null,
      language: data.language,
      status: 'NEW',
      ai_scenario_match: data.ai_scenario_match || '',
      ai_confidence: data.ai_confidence || 0,
      ai_reason: data.ai_reason || '',
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
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('incident_id', incidentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getIncidentAnswers(incidentId: string) {
  const { data } = await supabase
    .from('incident_answers')
    .select('*')
    .eq('incident_id', incidentId);

  return data || [];
}

export async function getIncidentEvidence(incidentId: string): Promise<Evidence[]> {
  const { data } = await supabase
    .from('evidence')
    .select('*')
    .eq('incident_id', incidentId)
    .order('date_added', { ascending: false });

  return data || [];
}

export async function getStatusHistory(incidentId: string): Promise<StatusHistory[]> {
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
