import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      session_id, category_id, subcategory, original_text,
      structured_interpretation, ai_summary, location, location_area,
      language, answers, evidence_links, ai_scenario_match,
      ai_confidence, ai_reason,
    } = body;

    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        session_id,
        category_id,
        subcategory,
        original_text,
        structured_interpretation: structured_interpretation || '',
        ai_summary: ai_summary || '',
        location: location || '',
        location_area: location_area || '',
        language: language || 'en',
        status: 'NEW',
        ai_scenario_match: ai_scenario_match || '',
        ai_confidence: ai_confidence || 0,
        ai_reason: ai_reason || '',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (answers && Object.keys(answers).length > 0) {
      await supabase.from('incident_answers').insert(
        Object.entries(answers).map(([questionId, answer]) => ({
          incident_id: incident.id,
          question_id: questionId,
          question_text: questionId,
          answer: answer as string,
        }))
      );
    }

    if (evidence_links && evidence_links.length > 0) {
      await supabase.from('evidence').insert(
        evidence_links.map((url: string) => ({
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  let query = supabase.from('incidents').select('*').order('created_at', { ascending: false });
  if (sessionId) query = query.eq('session_id', sessionId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ incidents: data });
}
