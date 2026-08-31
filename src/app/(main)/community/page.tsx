'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Language } from '@/types';
import { getStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { ArrowLeft, TrendingUp, BarChart3, MapPin } from 'lucide-react';

interface CommunityStats {
  total: number;
  byCategory: Record<string, number>;
  byArea: Record<string, number>;
  recentTrend: { date: string; count: number }[];
}

export default function CommunityPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLang(getStoredLanguage());
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data: incidents } = await supabase
      .from('incidents')
      .select('category_id, location_area, created_at, status');

    if (incidents) {
      const byCategory: Record<string, number> = {};
      const byArea: Record<string, number> = {};

      incidents.forEach(inc => {
        byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
        if (inc.location_area) {
          byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
        }
      });

      setStats({
        total: incidents.length,
        byCategory,
        byArea,
        recentTrend: [],
      });
    }
    setLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    TRAFFIC: 'Traffic',
    CIVIC: 'Civic',
    PUBLIC_SAFETY: 'Public Safety',
    GOVERNMENT: 'Government',
    HOUSING: 'Housing',
    ENVIRONMENT: 'Environment',
    UTILITIES: 'Utilities',
    DIGITAL: 'Digital',
    ACCESS_INTEGRATION: 'Access',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('community.pulse', lang)}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading community data...</div>
        ) : stats ? (
          <>
            {/* Total Reports */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-gray-500 mt-1">Total Community Reports</div>
            </div>

            {/* By Category */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} /> Reports by Category
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{categoryLabels[cat] || cat}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-bg rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* By Area */}
            {Object.keys(stats.byArea).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} /> Reports by Area
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.byArea)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 12)
                    .map(([area, count]) => (
                      <div key={area} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500">{area}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800">
                {t('community.disclaimer', lang)}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">No data available yet.</div>
        )}
      </main>
    </div>
  );
}
