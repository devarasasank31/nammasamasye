'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData();
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getDashboardStats();
    setStats(data);
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Reports</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.byArea).length}</div>
                  <div className="text-xs text-gray-500 mt-1">Areas Covered</div>
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
                  <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byCategory as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-700 capitalize">{cat.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-gray-900">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Reports by Area</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(stats.byArea as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([area, count]) => (
                      <div key={area} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500">{area}</div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
