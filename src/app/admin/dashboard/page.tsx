'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/types';
import { BarChart3, FileText, AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, Eye, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data: incidents } = await supabase.from('incidents').select('*');

    if (incidents) {
      const byDay: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      const byArea: Record<string, number> = {};

      incidents.forEach(inc => {
        const day = new Date(inc.created_at).toISOString().split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
        byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
        if (inc.location_area) byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
      });

      setStats({
        total: incidents.length,
        new_count: incidents.filter(i => i.status === 'NEW').length,
        under_review: incidents.filter(i => i.status === 'UNDER_REVIEW').length,
        missing_info: incidents.filter(i => i.status === 'MISSING_INFORMATION').length,
        on_hold: incidents.filter(i => i.status === 'ON_HOLD').length,
        proceeding: incidents.filter(i => i.status === 'PROCEEDING').length,
        invalid: incidents.filter(i => i.status === 'INVALID').length,
        closed: incidents.filter(i => i.status === 'CLOSED').length,
        resolved: incidents.filter(i => i.status === 'RESOLVED').length,
        reports_per_day: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
        reports_per_category: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
        reports_per_area: Object.entries(byArea).map(([area, count]) => ({ area, count })),
      });
    }
    setLoading(false);
  };

  const kpiCards = stats ? [
    { label: 'Total Reports', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'New', value: stats.new_count, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Missing Info', value: stats.missing_info, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Proceeding', value: stats.proceeding, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Closed', value: stats.closed, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Invalid', value: stats.invalid, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center font-bold text-xs">NS</div>
            <span className="font-bold">Namma Samasye</span>
          </div>
          <nav className="space-y-1">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
              { icon: FileText, label: 'Reports', href: '/admin/reports' },
              { icon: Shield, label: 'Resources', href: '/admin/resources' },
              { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition text-gray-300 hover:text-white">
                <item.icon size={18} /> {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </header>

        <main className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
          ) : stats ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {kpiCards.map(kpi => (
                  <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-5 border border-gray-100`}>
                    <div className="flex items-center justify-between mb-3">
                      <kpi.icon size={20} className={kpi.color} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Reports by Category</h3>
                  <div className="space-y-3">
                    {stats.reports_per_category
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 8)
                      .map(cat => (
                        <div key={cat.category} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 capitalize">{cat.category.replace(/_/g, ' ')}</span>
                              <span className="text-gray-500">{cat.count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full gradient-bg rounded-full"
                                style={{ width: `${(cat.count / stats.total) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Area Distribution */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Reports by Area</h3>
                  <div className="space-y-3">
                    {stats.reports_per_area
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 8)
                      .map(area => (
                        <div key={area.area} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-700">{area.area || 'Unknown'}</span>
                          <span className="font-bold text-gray-900 text-sm">{area.count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Daily Trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Reports per Day</h3>
                <div className="flex items-end gap-1 h-40">
                  {stats.reports_per_day.slice(-30).map(d => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full gradient-bg rounded-t"
                        style={{ height: `${(d.count / Math.max(...stats.reports_per_day.map(x => x.count), 1)) * 120}px` }} />
                      <span className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No data available.</div>
          )}
        </main>
      </div>
    </div>
  );
}
