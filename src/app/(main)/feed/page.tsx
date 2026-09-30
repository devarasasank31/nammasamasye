'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Flag, MapPin, Users, ShieldAlert } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { Language, PublicIncident, Incident } from '@/types';
import { getPublicFeed, supportIncident, flagIncident, getAllIncidents } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { buildDailySeries, getCivicPulse } from '@/lib/analytics';
import { getScenarioById, getScenarioName, getAllCategories } from '@/data/scenarios';
import { getStatusBadgeClass } from '@/lib/status-colors';

function subcategoryLabel(id: string, lang: Language): string {
  const scn = getScenarioById(id);
  if (scn) return getScenarioName(scn, lang);
  return id.replace(/_/g, ' ');
}

const PRIORITY_STYLE: Record<string, string> = {
  P1: 'bg-red-100 text-red-700 border-red-300',
  P2: 'bg-orange-100 text-orange-700 border-orange-300',
  P3: 'bg-amber-100 text-amber-800 border-amber-300',
  P4: 'bg-gray-100 text-gray-600 border-gray-300',
};

export default function FeedPage() {
  const router = useRouter();
  const lang = useLanguage();
  const [items, setItems] = useState<PublicIncident[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sort, setSort] = useState<'priority' | 'support'>('priority');
  const [category, setCategory] = useState('all');
  const [showFlagNote, setShowFlagNote] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      seedDemoData();
    }
    const [feed, all] = await Promise.all([getPublicFeed(), getAllIncidents()]);
    setItems(feed);
    setIncidents(all);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await load();
    };
    void init();

    // Numbers on this page stay live: quiet refresh every 10 seconds, on tab
    // focus, and when another tab files a report.
    const refresh = () => void load(true);
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

  const daily = buildDailySeries(incidents);
  const pulse = getCivicPulse(incidents);

  const categories: string[] = [...getAllCategories()];

  const visible = items
    .filter(i => category === 'all' || i.category_id === category)
    .sort((a, b) => {
      if (sort === 'support') return b.support_count - a.support_count;
      const rank = { P1: 0, P2: 1, P3: 2, P4: 3 } as Record<string, number>;
      return rank[a.priority] - rank[b.priority] || b.support_count - a.support_count;
    });

  const categoryLabel = (cat: string) => {
    const label = t(`category.${cat}`, lang);
    return label === `category.${cat}` ? cat.replace(/_/g, ' ') : label;
  };

  const handleSupport = async (incidentId: string) => {
    // Same button toggles — support it, then click again to withdraw.
    await supportIncident(incidentId);
    setItems(await getPublicFeed());
  };

  const handleFlag = async (incidentId: string) => {
    await flagIncident(incidentId);
    setItems(await getPublicFeed());
    setShowFlagNote(incidentId);
    setTimeout(() => setShowFlagNote(null), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('feed.title', lang)}</h1>

          {/* Always-visible live counter, even while scrolling the feed */}
          <span
            data-testid="feed-header-registered-today"
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-1 ml-1"
            title={t('track.registered_today', lang)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <b className="text-gray-900 tabular-nums">{!loading ? pulse.reportsToday : '–'}</b>
            <span className="hidden sm:inline">{t('track.registered_today', lang)}</span>
          </span>

          <button
            onClick={() => router.push('/')}
            title="Go to homepage"
            aria-label="Go to homepage"
            className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition"
          >
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">{t('feed.subtitle', lang)}</p>

        {/* Live counter: how many reports were registered today */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm" data-testid="feed-registered-today">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {t('track.registered_today', lang)}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('track.live', lang)}
                {lastUpdated && (
                  <span>· {t('track.updated_at', lang).replace('{time}', lastUpdated)}</span>
                )}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-1">
              <div>
                <div
                  key={pulse.reportsToday}
                  className="text-5xl font-black text-blue-600 leading-none tabular-nums"
                  data-testid="feed-registered-today-count"
                >
                  {pulse.reportsToday}
                </div>
                <div className="text-[11px] text-gray-500 mt-1.5">
                  {t('track.day_reports', lang)} · {pulse.today}
                </div>
              </div>
              <span className="text-lg" role="img" aria-label="registered today">📝</span>
            </div>
          </div>
        )}

        {/* Registered each day — just the numbers, rolls forward on its own */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 text-sm mb-3">{t('track.registered_by_day', lang)}</h2>
            <div className="flex gap-2 overflow-x-auto pb-1" data-testid="feed-registered-by-day">
              {daily.map(d => {
                const isToday = d.date === pulse.today;
                return (
                  <div
                    key={d.date}
                    className={`shrink-0 min-w-[56px] rounded-xl border px-2 py-2 text-center ${
                      isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className={`text-xl font-bold tabular-nums ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                      {d.reports}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 mt-0.5">{d.date.slice(5)}</div>
                    {isToday && (
                      <div className="text-[9px] font-semibold text-blue-500 uppercase mt-0.5">
                        {t('track.pulse_today', lang)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-primary"
          >
            <option value="all">{t('feed.all', lang)}</option>
            {categories.map(c => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden bg-white text-xs">
            {(['priority', 'support'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 font-medium transition ${sort === s ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {s === 'priority' ? t('feed.sort_priority', lang) : t('feed.sort_support', lang)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">{t('feed.loading', lang)}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">🏙️</div>
            <p className="text-gray-500 text-sm">{t('feed.empty', lang)}</p>
            <button
              onClick={() => router.push('/report')}
              className="mt-4 px-6 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition"
            >
              {t('home.report_now', lang)}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">{visible.length} {t('feed.issues', lang)}</div>
            {visible.map(item => (
              <article key={item.incident_id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{item.incident_id}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.P3}`}>
                        {item.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(item.status)}`}>
                        {t(`status.${item.status}`, lang)}
                      </span>
                    </div>
                    <div className="mt-1.5 font-medium text-gray-900 text-sm">
                      {categoryLabel(item.category_id)} — {subcategoryLabel(item.subcategory, lang)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {item.area || t('report.unknown_area', lang)}
                      </span>
                      {item.sla_days ? (
                        <span className="inline-flex items-center gap-1">
                          <ShieldAlert size={12} /> {t('report.sla', lang)}: {item.sla_days} {t('report.days', lang)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {item.cluster_citizens > 1 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1.5">
                    <Users size={12} />
                    {t('feed.citizens', lang).replace('{count}', String(item.cluster_citizens))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => void handleSupport(item.incident_id)}
                    aria-pressed={item.supported}
                    title={t('feed.support_hint', lang)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${
                      item.supported
                        ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/15'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Users size={14} />
                    {item.supported ? t('feed.supported', lang) : t('feed.support', lang)}
                    <span className="font-bold">{item.support_count}</span>
                  </button>
                  <button
                    onClick={() => void handleFlag(item.incident_id)}
                    disabled={item.flagged}
                    title={t('feed.flag', lang)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition ${
                      item.flagged
                        ? 'bg-amber-50 border-amber-300 text-amber-700 cursor-default'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700'
                    }`}
                  >
                    <Flag size={13} />
                    {item.flagged ? t('feed.flagged', lang) : t('feed.flag', lang)}
                    {item.flag_count > 0 && <span className="font-bold">{item.flag_count}</span>}
                  </button>
                </div>

                {showFlagNote === item.incident_id && (
                  <p className="mt-2 text-[11px] text-amber-700">{t('feed.flagged', lang)}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
