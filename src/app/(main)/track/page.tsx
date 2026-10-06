'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { Language, Incident } from '@/types';
import { getIncidentsBySession } from '@/services/incident';
import { getOrCreateSession } from '@/services/session';
import { ArrowLeft, MessageSquare, Search, Home, FileText, Clock } from 'lucide-react';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { getStatusBadgeClass } from '@/lib/status-colors';

function subcategoryLabel(id: string, lang: Language): string {
  const scn = getScenarioById(id);
  if (scn) return getScenarioName(scn, lang);
  return id.replace(/_/g, ' ');
}

export default function TrackPage() {
  const router = useRouter();
  const lang = useLanguage();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);

  // Only this browser's own reports — the dashboard belongs to the citizen
  // who filed them, so filed/resolved/open numbers never show anyone else's.
  const loadIncidents = async () => {
    const session = await getOrCreateSession();
    const mine = await getIncidentsBySession(session.id);
    setIncidents(mine);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadIncidents();
    };
    void init();

    // Numbers stay live: quiet refresh every 10 seconds, on tab focus, and
    // when this browser files a report from another tab.
    const refresh = () => void loadIncidents();
    const timer = window.setInterval(refresh, 10000);
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ns_incidents') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleSearch = () => {
    if (!searchId.trim()) return;
    router.push(`/track/${searchId.trim().toUpperCase()}`);
  };

  const openCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  const summary = [
    { id: 'filed', label: t('track.reported', lang), value: incidents.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'open', label: t('track.open', lang), value: openCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('track.title', lang)}</h1>

          <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition">
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
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

        {/* My dashboard: quick totals */}
        {!loading && incidents.length > 0 && (
          <div className="grid grid-cols-2 gap-3" data-testid="track-dashboard">
            {summary.map(s => (
              <div key={s.label} data-testid={`track-kpi-${s.id}`} className={`${s.bg} border border-gray-100 rounded-2xl p-4`}>
                <s.icon size={18} className={s.color} />
                <div className="text-2xl font-bold text-gray-900 mt-2">{s.value}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Incidents List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('general.loading', lang)}</div>
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
          <div className="text-xs text-gray-500 mt-0.5 capitalize">{subcategoryLabel(inc.subcategory, lang)}</div>
          {inc.ward && <div className="text-[11px] text-gray-400 mt-0.5">{inc.ward}</div>}
        </div>
        <div className="flex flex-col items-end gap-1">
          {inc.priority && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              inc.priority === 'P1' ? 'bg-red-100 text-red-700 border-red-300'
              : inc.priority === 'P2' ? 'bg-orange-100 text-orange-700 border-orange-300'
              : inc.priority === 'P3' ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}>{inc.priority}</span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inc.status)}`}>
            {t(`status.${inc.status}`, lang)}
          </span>
        </div>
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
