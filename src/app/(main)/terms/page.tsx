'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { getStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { Language } from '@/types';

export default function TermsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      setLang(getStoredLanguage());
    };
    void init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('terms.title', lang)}</h1>
          <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition">
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.title', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.tou', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.emergency', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.emergency', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.legal', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.legal', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.guilt', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.guilt', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.responsibilities', lang)}</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>{t('terms.l.res1', lang)}</li>
              <li>{t('terms.l.res2', lang)}</li>
              <li>{t('terms.l.res3', lang)}</li>
              <li>{t('terms.l.res4', lang)}</li>
              <li>{t('terms.l.res5', lang)}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.community', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.community', lang)}
            </p>
          </section>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.guidelines', lang)}</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>{t('terms.l.g1', lang)}</li>
              <li>{t('terms.l.g2', lang)}</li>
              <li>{t('terms.l.g3', lang)}</li>
              <li>{t('terms.l.g4', lang)}</li>
              <li>{t('terms.l.g5', lang)}</li>
              <li>{t('terms.l.g6', lang)}</li>
            </ul>
          </section>
        </div>

        {/* Safety Disclaimer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('terms.h.safety', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('terms.p.safety', lang)}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
