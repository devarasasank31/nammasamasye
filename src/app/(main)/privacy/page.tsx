'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';

export default function PrivacyPage() {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('privacy.title', lang)}</h1>
          <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition">
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.anonymous', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.anonymous', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.collect', lang)}</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>{t('privacy.l.collect1', lang)}</li>
              <li>{t('privacy.l.collect2', lang)}</li>
              <li>{t('privacy.l.collect3', lang)}</li>
              <li>{t('privacy.l.collect4', lang)}</li>
              <li>{t('privacy.l.collect5', lang)}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.not_collect', lang)}</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>{t('privacy.l.not1', lang)}</li>
              <li>{t('privacy.l.not2', lang)}</li>
              <li>{t('privacy.l.not3', lang)}</li>
              <li>{t('privacy.l.not4', lang)}</li>
              <li>{t('privacy.l.not5', lang)}</li>
              <li>{t('privacy.l.not6', lang)}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.evidence', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.evidence', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.admin', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.admin', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.ai', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.ai', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.agg', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.agg', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.retention', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.retention', lang)}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-lg mb-3">{t('privacy.h.limitations', lang)}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('privacy.p.limitations', lang)}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
