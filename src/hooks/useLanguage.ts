'use client';

import { useEffect, useState } from 'react';
import { getStoredLanguage, LANGUAGE_EVENT } from '@/services/session';
import { Language } from '@/types';

// The stored language, kept live for as long as the component is mounted.
// Re-renders immediately when the language changes anywhere else — the landing
// modal, the report switcher, the AI bot adopting the citizen's language, or
// another browser tab — so no refresh is ever needed.
export function useLanguage(): Language {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) setLang(getStoredLanguage());
    };
    const init = async () => {
      await Promise.resolve();
      sync();
    };
    void init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ns_language') sync();
    };
    window.addEventListener(LANGUAGE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener(LANGUAGE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return lang;
}
