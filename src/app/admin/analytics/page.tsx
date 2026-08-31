'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data: incidents } = await supabase.from('incidents').select('*');
    if (incidents) {
      const byLang: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const recurring = incidents.filter(i => i.is_recurring);

      incidents.forEach(inc => {
        byLang[inc.language] = (byLang[inc.language] || 0) + 1;
        bySeverity[inc.severity || 'medium'] = (bySeverity[inc.severity || 'medium'] || 0) + 1;
      });

      setStats({
        total: incidents.length,
        byLang,
        bySeverity,
        recurringCount: recurring.length,
        withEvidence: incidents.filter(i => i.ai_confidence > 0).length,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center font-bold text-xs">NS</div>
            <span className="font-bold">Admin</span>
          </div>
          <nav className="space-y-1">
            {[
              { label: 'Dashboard', href: '/admin/dashboard' },
              { label: 'Reports', href: '/admin/reports' },
              { label: 'Resources', href: '/admin/resources' },
              { label: 'Analytics', href: '/admin/analytics' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  item.href === '/admin/analytics' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        </header>

        <main className="p-6 max-w-4xl space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading analytics...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Reports</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.recurringCount}</div>
                  <div className="text-xs text-gray-500 mt-1">Recurring Issues</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.withEvidence}</div>
                  <div className="text-xs text-gray-500 mt-1">With AI Match</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byLang).length}</div>
                  <div className="text-xs text-gray-500 mt-1">Languages Used</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">By Language</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byLang as Record<string, number>).map(([lang, count]) => (
                      <div key={lang} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 uppercase">{lang}</span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full gradient-bg rounded-full"
                              style={{ width: `${(count / stats.total) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">By Severity</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.bySeverity as Record<string, number>).map(([sev, count]) => (
                      <div key={sev} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-700 capitalize">{sev}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
