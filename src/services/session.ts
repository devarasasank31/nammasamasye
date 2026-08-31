import { supabase } from '@/lib/supabase';
import { Language, Session } from '@/types';

const SESSION_KEY = 'ns_session_id';

export async function getOrCreateSession(): Promise<Session> {
  if (typeof window === 'undefined') {
    return { id: '', language: 'en', created_at: '', last_active: '' };
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ language: getStoredLanguage() })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create session:', error);
      return { id: crypto.randomUUID(), language: getStoredLanguage(), created_at: new Date().toISOString(), last_active: new Date().toISOString() };
    }

    localStorage.setItem(SESSION_KEY, data.id);
    return data;
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    localStorage.removeItem(SESSION_KEY);
    return getOrCreateSession();
  }

  await supabase
    .from('sessions')
    .update({ last_active: new Date().toISOString() })
    .eq('id', sessionId);

  return data;
}

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('ns_language') as Language) || 'en';
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ns_language', lang);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
