'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { Language, Incident } from '@/types';
import { getAllIncidents } from '@/services/incident';
import { ArrowLeft, MessageSquare, Search, Home, CheckCircle, FileText, Clock } from 'lucide-react';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { getStatusBadgeClass } from '@/lib/status-colors';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { buildDailySeries, getCivicPulse } from '@/lib/analytics';

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

  const loadIncidents = async () => {
    setLoading(true);
    const allInc = await getAllIncidents();
    setIncidents(allInc);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadIncidents();
    };
    void init();
  }, []);

  const handleSearch = () => {
    if (!searchId.trim()) return;
    router.push(`/track/${searchId.trim().toUpperCase()}`);
  };

  const daily = buildDailySeries(incidents);
  const pulse = getCivicPulse(incidents);
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const openCount = incidents.length - resolvedCount;

  const summary = [
    { label: t('track.reported', lang), value: incidents.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('track.resolved', lang), value: resolvedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: t('track.open', lang), value: openCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
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

        {/* Bengaluru Civic Pulse — today's real numbers */}
        {!loading && (
          <div className="bg-gradient-to-r from-slate-900 to-gray-800 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-sm">{t('track.pulse_title', lang)}</h2>
              <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded-full">
                {t('track.pulse_today', lang)} · {pulse.today}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white/10 rounded-xl px-3 py-2.5">
                <div className="text-2xl font-bold">{pulse.reportsToday}</div>
                <div className="text-[11px] text-gray-300">{t('track.day_reports', lang)}</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5">
                <div className="text-2xl font-bold text-green-400">{pulse.resolvedToday}</div>
                <div className="text-[11px] text-gray-300">{t('track.resolved', lang)}</div>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5">
                <div className="text-2xl font-bold text-amber-400">{pulse.open}</div>
                <div className="text-[11px] text-gray-300">{t('track.open', lang)}</div>
              </div>
            </div>
          </div>
        )}

        {/* My dashboard: totals + day-by-day reports vs resolved */}
        {!loading && incidents.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {summary.map(s => (
                <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-4`}>
                  <s.icon size={18} className={s.color} />
                  <div className="text-2xl font-bold text-gray-900 mt-2">{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-3">{t('track.by_day', lang)}</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => String(v).slice(5)} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip labelFormatter={v => String(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="reports" name={t('track.day_reports', lang)} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line dataKey="resolved" name={t('track.day_resolved', lang)} stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <h2 className="font-bold text-gray-900 text-sm mt-4 mb-2">{t('track.day_header', lang)}</h2>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">{t('track.day_date', lang)}</th>
                      <th className="text-right font-medium px-3 py-2">{t('track.day_registered', lang)}</th>
                      <th className="text-right font-medium px-3 py-2">{t('track.day_resolved', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...daily].reverse().map(d => (
                      <tr key={d.date} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 font-mono text-gray-600">{d.date.slice(5)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{d.reports}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-green-600">{d.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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
