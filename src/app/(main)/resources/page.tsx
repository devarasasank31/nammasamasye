'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Phone, Home } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';

const officialResources = [
  { id: 'res-1', title: 'Bangalore Traffic Police', category: 'TRAFFIC', authority: 'Bangalore City Traffic Police', official_url: 'https://www.bangaloretrafficpolice.gov.in', official_phone: '080-22943400', descKey: 'resources.res1.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-2', title: 'BBMP - Bruhat Bengaluru Mahanagara Palike', category: 'CIVIC', authority: 'BBMP', official_url: 'https://bbmp.gov.in', official_phone: '1918', descKey: 'resources.res2.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-3', title: 'Bangalore Electricity Supply Company (BESCOM)', category: 'UTILITIES', authority: 'BESCOM', official_url: 'https://bescom.karnataka.gov.in', official_phone: '1912', descKey: 'resources.res3.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-4', title: 'Karnataka Police', category: 'PUBLIC_SAFETY', authority: 'Karnataka State Police', official_url: 'https://karnataka.gov.in/police', official_phone: '100', descKey: 'resources.res4.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-5', title: 'National Cyber Crime Reporting Portal', category: 'DIGITAL', authority: 'Ministry of Home Affairs', official_url: 'https://cybercrime.gov.in', official_phone: '1930', descKey: 'resources.res5.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-6', title: 'Jana Sahayavani (Citizen Helpline)', category: 'GOVERNMENT', authority: 'Government of Karnataka', official_url: 'https://karnataka.gov.in', official_phone: '1800-425-1111', descKey: 'resources.res6.desc', last_verified_at: new Date().toISOString() },
  { id: 'res-7', title: 'Karnataka Legal Services Authority', category: 'HOUSING', authority: 'High Court of Karnataka', official_url: 'https://karnatakalaw.kar.nic.in', official_phone: '', descKey: 'resources.res7.desc', last_verified_at: new Date().toISOString() },
];

export default function ResourcesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('ALL');
  const lang = useLanguage();

  const categories = ['ALL', ...new Set(officialResources.map(r => r.category))];
  const filtered = filter === 'ALL' ? officialResources : officialResources.filter(r => r.category === filter);

  const categoryLabel = (cat: string) => {
    if (cat === 'ALL') return t('resources.all', lang);
    const label = t(`category.${cat}`, lang);
    return label === `category.${cat}` ? cat.replace(/_/g, ' ') : label;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('home.resources', lang)}</h1>
          <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition">
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === cat ? 'gradient-bg text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
              }`}>
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.authority}</p>
                  <p className="text-sm text-gray-600 mt-2">{t(r.descKey, lang)}</p>
                </div>
                <a href={r.official_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition flex-shrink-0">
                  <ExternalLink size={16} />
                </a>
              </div>
              {r.official_phone && (
                <a href={`tel:${r.official_phone}`}
                  className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone size={14} /> {r.official_phone}
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
