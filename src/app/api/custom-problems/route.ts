import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { Language } from '@/types';

const MIN_LEN = 4;
const MAX_LEN = 400;
const LANGS: Language[] = ['en', 'kn', 'hi', 'te'];

function cleanText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_LEN);
}

function cleanLang(raw: unknown): Language {
  return LANGS.includes(raw as Language) ? (raw as Language) : 'en';
}

// Problems citizens typed under "Something Else" are remembered here so the
// next person gets them offered as suggestions, with how many people used them.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const text = cleanText(body?.text);
    if (text.length < MIN_LEN) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    const language = cleanLang(body?.language);

    if (isDemoMode) {
      const record = demoStore.recordCustomProblem(text, language);
      return NextResponse.json({ ok: true, count: record?.count ?? 1 });
    }

    const { supabase } = await import('@/lib/supabase');
    const normalized = text.toLowerCase();
    const now = new Date().toISOString();

    const { data: existing, error: findError } = await supabase
      .from('custom_problems')
      .select('id, count')
      .eq('normalized', normalized)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (existing) {
      const { error } = await supabase
        .from('custom_problems')
        .update({ count: existing.count + 1, last_seen: now, language })
        .eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, count: existing.count + 1 });
    }

    const { data: created, error: insertError } = await supabase
      .from('custom_problems')
      .insert({ text, normalized, language, count: 1, first_seen: now, last_seen: now })
      .select('count')
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: created?.count ?? 1 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save the problem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit')) || 8));

    if (isDemoMode) {
      const suggestions = demoStore.getCustomProblems(limit).map(p => ({
        text: p.text,
        count: p.count,
        language: p.language,
      }));
      return NextResponse.json({ suggestions });
    }

    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('custom_problems')
      .select('text, language, count')
      .order('count', { ascending: false })
      .order('last_seen', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ suggestions: [], error: error.message });
    return NextResponse.json({
      suggestions: (data || []).map(p => ({
        text: p.text as string,
        count: Number(p.count) || 1,
        language: (p.language as Language) || 'en',
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load suggestions';
    return NextResponse.json({ suggestions: [], error: message }, { status: 500 });
  }
}
