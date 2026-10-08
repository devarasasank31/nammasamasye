import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { Language, PriorityAnalysisEnvelope, IncidentTimePrecision } from '@/types';
import { runPriorityPipeline } from '@/lib/priority-engine/pipeline';
import { rateLimit, clientIp, dailyAllow, isExemptIp, LIMITS } from '@/lib/security';

interface IncidentBody {
  session_id?: string;
  category_id?: string;
  subcategory?: string;
  original_text?: string;
  structured_interpretation?: string;
  ai_summary?: string;
  location?: string;
  location_area?: string;
  location_lat?: number;
  location_lng?: number;
  /** When it happened (spec §12) — kept separate from submission time. */
  incident_date?: string;
  incident_time?: string;
  incident_date_time?: string;
  incident_time_precision?: IncidentTimePrecision;
  date_of_incident?: string;
  language?: Language;
  answers?: Record<string, string>;
  evidence_links?: string[];
  attachments?: { id: string; name: string; kind: 'image' | 'video'; mime: string; size: number; added_at: string }[];
  ai_scenario_match?: string;
  ai_confidence?: number;
  ai_reason?: string;
  ai_context?: string;
}

export async function POST(req: NextRequest) {
  // Spam guard: a citizen files a handful of real reports a day, not hundreds.
  const ip = clientIp(req.headers);
  if (!isExemptIp(ip) &&
      (!rateLimit(`inc:${ip}`, LIMITS.incidentPerHour, 60 * 60 * 1000) ||
       !dailyAllow(`inc_day:${ip}`, LIMITS.incidentPerDay))) {
    return NextResponse.json({ error: 'Too many reports from this device today. Please try again later.' }, { status: 429 });
  }

  try {
    const body: IncidentBody = await req.json();

    if (!body.category_id || !body.subcategory) {
      return NextResponse.json({ error: 'category_id and subcategory are required' }, { status: 400 });
    }
    if (!body.session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    if (isDemoMode) {
      // Same ONE priority result as /api/priority (local → retrieval → AI).
      // Degraded to local-only if the pipeline cannot run.
      let priority_analysis: PriorityAnalysisEnvelope | undefined;
      const reportText = body.original_text || '';
      if (reportText.trim().length >= 4) {
        try {
          const p = await runPriorityPipeline({
            text: reportText,
            category: body.category_id || 'OTHER',
            subcategory: body.subcategory || 'other',
            answers: body.answers,
            language: body.language,
          });
          priority_analysis = { analysis: p.analysis, source: p.source, created_at: new Date().toISOString() };
        } catch (err) {
          console.warn('[incidents] priority pipeline unavailable:', err);
        }
      }
      const incident = demoStore.createIncident({
        session_id: body.session_id,
        category_id: body.category_id,
        subcategory: body.subcategory,
        original_text: body.original_text || '',
        structured_interpretation: body.structured_interpretation || '',
        ai_summary: body.ai_summary || '',
        location: body.location || '',
        location_area: body.location_area || '',
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        incident_date: body.incident_date,
        incident_time: body.incident_time,
        incident_date_time: body.incident_date_time,
        incident_time_precision: body.incident_time_precision,
        date_of_incident: body.date_of_incident,
        language: body.language || 'en',
        answers: body.answers || {},
        evidence_links: body.evidence_links || [],
        attachments: body.attachments || [],
        ai_scenario_match: body.ai_scenario_match,
        ai_confidence: body.ai_confidence,
        ai_reason: body.ai_reason,
        ai_context: body.ai_context,
        priority_analysis,
      });
      return NextResponse.json({ incident });
    }

    const { supabase } = await import('@/lib/supabase');

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        session_id: body.session_id,
        category_id: body.category_id,
        subcategory: body.subcategory,
        original_text: body.original_text || '',
        structured_interpretation: body.structured_interpretation || '',
        ai_summary: body.ai_summary || '',
        location: body.location || '',
        location_area: body.location_area || '',
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        incident_date: body.incident_date || null,
        incident_time: body.incident_time || null,
        incident_date_time: body.incident_date_time || null,
        incident_time_precision: body.incident_time_precision || 'UNKNOWN',
        date_of_incident: body.date_of_incident || null,
        language: body.language || 'en',
        status: 'NEW',
        attachments: body.attachments || [],
        ai_scenario_match: body.ai_scenario_match || '',
        ai_confidence: body.ai_confidence || 0,
        ai_reason: body.ai_reason || '',
        ai_context: body.ai_context || '',
      })
      .select()
      .single();

    if (error || !incident) {
      return NextResponse.json({ error: error?.message || 'Failed to create incident' }, { status: 500 });
    }

    const answers = body.answers || {};
    if (Object.keys(answers).length > 0) {
      await supabase.from('incident_answers').insert(
        Object.entries(answers).map(([questionId, answer]) => ({
          incident_id: incident.id,
          question_id: questionId,
          question_text: questionId,
          answer,
        }))
      );
    }

    if (body.evidence_links && body.evidence_links.length > 0) {
      await supabase.from('evidence').insert(
        body.evidence_links.map(url => ({
          incident_id: incident.id,
          type: 'link',
          url,
          description: '',
          status: 'pending',
        }))
      );
    }

    await supabase.from('status_history').insert({
      incident_id: incident.id,
      previous_status: null,
      new_status: 'NEW',
      admin_id: 'system',
      admin_note: 'Incident created',
    });

    return NextResponse.json({ incident });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create incident';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (isDemoMode) {
      // Public list (no session filter) is the sanitised feed shape — the
      // same redaction the UI gets through getPublicFeed(). A session-scoped
      // list is the citizen's OWN reports and keeps full text.
      if (!sessionId) {
        return NextResponse.json({ incidents: demoStore.getPublicFeed() });
      }
      return NextResponse.json({ incidents: demoStore.getIncidentsBySession(sessionId) });
    }

    const { supabase } = await import('@/lib/supabase');

    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (sessionId) query = query.eq('session_id', sessionId);

    const { data, error } = await query.limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ incidents: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load incidents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
