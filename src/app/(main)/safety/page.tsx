'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Home } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';

const emergencyResources = [
  { number: '112', nameKey: 'safety.r1.name', descKey: 'safety.r1.desc' },
  { number: '181', nameKey: 'safety.r2.name', descKey: 'safety.r2.desc' },
  { number: '1930', nameKey: 'safety.r3.name', descKey: 'safety.r3.desc' },
  { number: '080-22943400', nameKey: 'safety.r4.name', descKey: 'safety.r4.desc' },
  { number: '100', nameKey: 'safety.r5.name', descKey: 'safety.r5.desc' },
  { number: '1090', nameKey: 'safety.r6.name', descKey: 'safety.r6.desc' },
];

export default function SafetyPage() {
  const router = useRouter();
  const lang = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('safety.title', lang)}</h1>
          <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition">
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Emergency Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🚨</div>
          <h2 className="font-bold text-red-800 text-lg mb-2">{t('safety.danger_title', lang)}</h2>
          <p className="text-sm text-red-700 mb-4">{t('safety.danger_desc', lang)}</p>
          <a href="tel:112" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition">
            <Phone size={20} /> {t('safety.call_112', lang)}
          </a>
        </div>

        {/* Emergency Resources */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">{t('safety.resources_title', lang)}</h2>
          <div className="space-y-3">
            {emergencyResources.map(r => (
              <a key={r.number} href={`tel:${r.number}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary hover:shadow-md transition">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{t(r.nameKey, lang)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t(r.descKey, lang)}</div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">{r.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">{t('safety.notice_title', lang)}</h2>
          <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
            <p>
              <strong>{t('safety.notice_strong', lang)}</strong>{' '}
              {t('safety.notice_rest', lang)}
            </p>
            <p>
              {t('safety.notice_call_a', lang)} <strong>112</strong> {t('safety.notice_call_b', lang)}
            </p>
            <p>
              {t('safety.notice_3', lang)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
