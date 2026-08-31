'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, FileText, AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, Eye, Shield, Users, LogOut } from 'lucide-react';
import { getAllIncidents } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';

interface UserSession {
  id: string;
  language: string;
  created_at: string;
  last_active: string;
  incident_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData();
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const incidents = await getAllIncidents();

    const byDay: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    const byLang: Record<string, number> = {};
    const sessionMap: Record<string, UserSession> = {};

    incidents.forEach((inc: any) => {
      const day = new Date(inc.created_at).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
      byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
      if (inc.location_area) byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
      byLang[inc.language] = (byLang[inc.language] || 0) + 1;

      // Track sessions/users
      if (!sessionMap[inc.session_id]) {
        sessionMap[inc.session_id] = {
          id: inc.session_id,
          language: inc.language,
          created_at: inc.created_at,
          last_active: inc.created_at,
          incident_count: 0,
        };
      }
      sessionMap[inc.session_id].incident_count++;
      if (new Date(inc.created_at) > new Date(sessionMap[inc.session_id].last_active)) {
        sessionMap[inc.session_id].last_active = inc.created_at;
      }
    });

    setStats({
      total: incidents.length,
      new_count: incidents.filter((i: any) => i.status === 'NEW').length,
      under_review: incidents.filter((i: any) => i.status === 'UNDER_REVIEW').length,
      missing_info: incidents.filter((i: any) => i.status === 'MISSING_INFORMATION').length,
      on_hold: incidents.filter((i: any) => i.status === 'ON_HOLD').length,
      proceeding: incidents.filter((i: any) => i.status === 'PROCEEDING').length,
      invalid: incidents.filter((i: any) => i.status === 'INVALID').length,
      closed: incidents.filter((i: any) => i.status === 'CLOSED').length,
      resolved: incidents.filter((i: any) => i.status === 'RESOLVED').length,
      reports_per_day: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
      reports_per_category: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
      reports_per_area: Object.entries(byArea).map(([area, count]) => ({ area, count })),
      byLang,
      totalUsers: Object.keys(sessionMap).length,
    });

    setUsers(Object.values(sessionMap).sort((a, b) => b.incident_count - a.incident_count));
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const kpiCards = stats ? [
    { label: 'Total Reports', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unique Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'New', value: stats.new_count, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Missing Info', value: stats.missing_info, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Proceeding', value: stats.proceeding, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Closed', value: stats.closed, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-blue-900 flex items-center justify-center font-bold text-xs">NS</div>
            <span className="font-bold">Admin Panel</span>
          </div>
          <p className="text-gray-500 text-xs mb-8">Namma Samasye</p>
          <nav className="space-y-1">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
              { icon: FileText, label: 'All Reports', href: '/admin/reports' },
              { icon: Users, label: 'Users / Sessions', href: '/admin/users' },
              { icon: Shield, label: 'Resources', href: '/admin/resources' },
              { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition text-gray-300 hover:text-white">
                <item.icon size={18} /> {item.label}
              </a>
            ))}
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition w-full">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <button onClick={handleLogout} className="lg:hidden text-gray-500 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </header>

        <main className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
          ) : stats ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={18} /> User Sessions ({users.length} unique users)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Session ID</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Language</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Reports</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">First Seen</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-xs text-gray-600">{u.id.slice(0, 12)}...</td>
                          <td className="py-2 px-3 uppercase text-gray-700">{u.language}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{u.incident_count}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{new Date(u.last_active).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
                  <div className="space-y-3">
                    {stats.reports_per_category
                      .sort((a: any, b: any) => b.count - a.count)
                      .slice(0, 8)
                      .map((cat: any) => (
                        <div key={cat.category} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 capitalize">{cat.category.replace(/_/g, ' ')}</span>
                              <span className="text-gray-500">{cat.count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-red-500 to-blue-900 rounded-full"
                                style={{ width: `${(cat.count / stats.total) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">By Area</h3>
                  <div className="space-y-3">
                    {stats.reports_per_area
                      .sort((a: any, b: any) => b.count - a.count)
                      .slice(0, 8)
                      .map((area: any) => (
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
                  {stats.reports_per_day.slice(-30).map((d: any) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-red-500 to-blue-900 rounded-t"
                        style={{ height: `${(d.count / Math.max(...stats.reports_per_day.map((x: any) => x.count), 1)) * 120}px` }} />
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
