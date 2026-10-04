'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Flag, Users } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { PublicIncident } from '@/types';
import { getPublicFeed, supportIncident, flagIncident, getDashboardStats } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { buildFallbackContext } from '@/lib/ai-context';
import { getAllCategories } from '@/data/scenarios';
import { getStatusBadgeClass } from '@/lib/status-colors';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-gray-100 text-gray-600 border-gray-300',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
};

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function severityKey(severity: string): string {
  return SEVERITY_RANK[severity] !== undefined ? severity : 'medium';
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeedPage() {
  const router = useRouter();
  const lang = useLanguage();
  const [items, setItems] = useState<PublicIncident[]>([]);
  const [registered, setRegistered] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'severity' | 'support'>('severity');
  const [category, setCategory] = useState('all');
  const [showFlagNote, setShowFlagNote] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      seedDemoData();
    }
    const [feed, stats] = await Promise.all([getPublicFeed(), getDashboardStats()]);
    setItems(feed);
    setRegistered(stats.total);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await load();
    };
    void init();

    // The corner counter stays live: quiet refresh every minute, plus on tab
    // focus and when another tab files a report.
    const refresh = () => void load(true);
    const timer = window.setInterval(refresh, 60000);
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

  const categories: string[] = [...getAllCategories()];

  const visible = items
    .filter(i => category === 'all' || i.category_id === category)
    .sort((a, b) => {
      if (sort === 'support') return b.support_count - a.support_count;
      return (
        (SEVERITY_RANK[severityKey(a.severity)] ?? 2) - (SEVERITY_RANK[severityKey(b.severity)] ?? 2) ||
        b.support_count - a.support_count
      );
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

          {/* One small corner counter — total registered, refreshes each minute */}
          <span
            data-testid="feed-registered-total"
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-1 ml-1"
            title={t('feed.registered_title', lang)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <b className="text-gray-900 tabular-nums">{registered !== null ? registered : '–'}</b>
            <span className="hidden sm:inline">{t('track.day_registered', lang)}</span>
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
            {(['severity', 'support'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2 font-medium transition ${sort === s ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {s === 'severity' ? t('feed.sort_priority', lang) : t('feed.sort_support', lang)}
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
            {visible.map(item => {
              const sev = severityKey(item.severity);
              const context = item.ai_context?.trim() || buildFallbackContext(item, lang);
              return (
                <article key={item.incident_id} data-testid="feed-card" className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        data-testid="feed-severity"
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[sev] || SEVERITY_STYLE.medium}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[sev] || SEVERITY_DOT.medium}`} />
                        {t(`severity.${sev}`, lang)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadgeClass(item.status)}`}>
                        {t(`status.${item.status}`, lang)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0" data-testid="feed-when">
                      {formatWhen(item.created_at)}
                    </span>
                  </div>

                  {/* Four-line analysed context instead of the raw complaint */}
                  <p className="mt-2.5 text-sm text-gray-700 leading-relaxed whitespace-pre-line" data-testid="feed-context">
                    {context}
                  </p>

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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
