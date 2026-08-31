'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { Language, Incident, AdminNote } from '@/types';
import { getAllIncidents } from '@/services/incident';
import { ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/status-colors';

export default function TrackPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLang(getStoredLanguage());
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    const allInc = await getAllIncidents();
    setIncidents(allInc);
    setLoading(false);
  };

  const handleSearch = () => {
    if (!searchId.trim()) return;
    router.push(`/track/${searchId.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('track.title', lang)}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('track.search_placeholder', lang)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
          <button onClick={handleSearch} className="px-6 py-3 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition">
            {t('track.search', lang)}
          </button>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 text-sm">{t('track.no_incidents', lang)}</p>
              <button onClick={() => router.push('/report')} className="mt-4 px-6 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
                {t('track.report_something', lang)}
              </button>
            </div>
          ) : (
            incidents.map(inc => (
              <IncidentCard key={inc.id} inc={inc} lang={lang} onClick={() => router.push(`/track/${inc.incident_id}`)} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function IncidentCard({ inc, lang, onClick }: { inc: Incident; lang: Language; onClick: () => void }) {
  const [hasNotes, setHasNotes] = useState(false);

  useEffect(() => {
    const checkNotes = async () => {
      const { isDemoMode } = await import('@/lib/supabase');
      if (isDemoMode) {
        const { demoStore } = await import('@/lib/demo-store');
        const notes = demoStore.getPublicNotes(inc.id);
        if (notes.length > 0) setHasNotes(true);
      }
    };
    checkNotes();
  }, [inc.id]);

  return (
    <div onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono font-bold text-primary text-sm flex items-center gap-2">
            {inc.incident_id}
            {hasNotes && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 capitalize">{inc.subcategory.replace(/_/g, ' ')}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inc.status)}`}>
          {t(`status.${inc.status}`, lang)}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-2">{new Date(inc.created_at).toLocaleString()}</div>
      {hasNotes && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
          <MessageSquare size={12} /> {t('track.admin_left_note', lang)}
        </div>
      )}
    </div>
  );
}
