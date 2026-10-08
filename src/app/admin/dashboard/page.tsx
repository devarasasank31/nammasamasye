'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, FileText, AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, Eye,
  Shield, Users, LogOut, Flag, UsersRound, MapPinned, Layers,
  ShieldAlert, FileJson, FileSpreadsheet, AlertTriangle, MessageSquare } from 'lucide-react';
import { getAllIncidents, exportAllData } from '@/services/incident';
import { exportRowsToCsv, exportRowsToJson, downloadTextFile, getCivicPulse } from '@/lib/analytics';
import { seedDemoData } from '@/lib/demo-store';
import { DashboardStats, Incident, PriorityLevel } from '@/types';
import { buildClusters, IssueCluster } from '@/lib/clusters';
import { WARDS, haversineKm } from '@/data/wards';
import { getAllCategories } from '@/data/scenarios';
import { isOverdue, PRIORITY_ORDER, SLA_DAYS } from '@/lib/priority';
import dynamic from 'next/dynamic';
import type { MapPoint, MapHotspot } from '@/components/AdminIssueMap';

const AdminIssueMap = dynamic(() => import('@/components/AdminIssueMap'), {
  ssr: false,
  loading: () => <div className="w-full rounded-xl bg-gray-100 animate-pulse" style={{ height: 440 }} />,
});

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, PieChart, Pie, Cell, BarChart as RBarChart,
} from 'recharts';

interface UserSession {
  id: string;
  language: string;
  created_at: string;
  last_active: string;
  incident_count: number;
}

interface AdminStats extends DashboardStats {
  byLang: Record<string, number>;
  totalUsers: number;
}

const PRIORITY_COLOR: Record<PriorityLevel, string> = {
  P1: '#dc2626',
  P2: '#ea580c',
  P3: '#d97706',
  P4: '#6b7280',
};

const PIE_COLORS = ['#dc2626', '#ea580c', '#d97706', '#9ca3af'];

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function wardTitle(inc: Incident): string {
  return inc.ward || inc.location_area || 'Unassigned';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [users, setUsers] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  // Empty = show every category on the map.
  const [mapCats, setMapCats] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    const all = await getAllIncidents();
    setIncidents(all);
    setClusters(buildClusters(all).clusters);

    const byDay: Record<string, number> = {};
    const byResolvedDay: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    const byLang: Record<string, number> = {};
    const sessionMap: Record<string, UserSession> = {};

    all.forEach((inc) => {
      const day = new Date(inc.created_at).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
      if (inc.resolved_at) {
        const rd = new Date(inc.resolved_at).toISOString().split('T')[0];
        byResolvedDay[rd] = (byResolvedDay[rd] || 0) + 1;
      }
      byCategory[inc.category_id] = (byCategory[inc.category_id] || 0) + 1;
      if (inc.location_area) byArea[inc.location_area] = (byArea[inc.location_area] || 0) + 1;
      byLang[inc.language] = (byLang[inc.language] || 0) + 1;

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
      total: all.length,
      new_count: all.filter((i) => i.status === 'NEW').length,
      under_review: all.filter((i) => i.status === 'UNDER_REVIEW').length,
      missing_info: all.filter((i) => i.status === 'MISSING_INFORMATION').length,
      on_hold: all.filter((i) => i.status === 'ON_HOLD').length,
      proceeding: all.filter((i) => i.status === 'PROCEEDING').length,
      invalid: all.filter((i) => i.status === 'INVALID').length,
      closed: all.filter((i) => i.status === 'CLOSED').length,
      resolved: all.filter((i) => i.status === 'RESOLVED').length,
      reports_per_day: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
      reports_per_category: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
      reports_per_area: Object.entries(byArea).map(([area, count]) => ({ area, count })),
      byLang,
      totalUsers: Object.keys(sessionMap).length,
    });

    setUsers(Object.values(sessionMap).sort((a, b) => b.incident_count - a.incident_count));
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      seedDemoData();
      await loadStats();
    };
    void init();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // --- Derived series -----------------------------------------------------
  const dailySeries = useMemo(() => {
    return lastNDays(14).map(date => {
      const created = incidents.filter(i => new Date(i.created_at).toISOString().split('T')[0] === date).length;
      const resolved = incidents.filter(
        i => i.resolved_at && new Date(i.resolved_at).toISOString().split('T')[0] === date
      ).length;
      return { date: date.slice(5), reports: created, resolved };
    });
  }, [incidents]);

  const prioritySeries = useMemo(() => {
    const counts: Record<PriorityLevel, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    incidents.forEach(i => {
      const p = (i.priority || 'P3') as PriorityLevel;
      counts[p] = (counts[p] || 0) + 1;
    });
    return PRIORITY_ORDER.map(p => ({ name: p, value: counts[p], sla: SLA_DAYS[p] }));
  }, [incidents]);

  const categorySeries = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach(i => { map[i.category_id] = (map[i.category_id] || 0) + 1; });
    return Object.entries(map)
      .map(([category, count]) => ({ category: category.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [incidents]);

  const issueSeries = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach(i => { map[i.subcategory] = (map[i.subcategory] || 0) + 1; });
    return Object.entries(map)
      .map(([issue, count]) => ({ issue: issue.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [incidents]);

  const wardSeries = useMemo(() => {
    const map: Record<string, number> = {};
    incidents.forEach(i => { const w = wardTitle(i); map[w] = (map[w] || 0) + 1; });
    return Object.entries(map)
      .map(([ward, count]) => ({ ward, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [incidents]);

  const priorityQueue = useMemo(() => {
    const rank: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return incidents
      .filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.status !== 'INVALID')
      .sort((a, b) => rank[a.priority || 'P3'] - rank[b.priority || 'P3'] || (b.support_count || 0) - (a.support_count || 0))
      .slice(0, 12);
  }, [incidents]);

  const topSupported = useMemo(
    () => [...incidents].sort((a, b) => (b.support_count || 0) - (a.support_count || 0)).slice(0, 6),
    [incidents]
  );

  const flaggedItems = useMemo(() => incidents.filter(i => (i.flag_count || 0) > 0), [incidents]);

  // --- Zoomable map: every report + recurring hotspots --------------------
  const humanize = (id: string) =>
    id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const mapPoints = useMemo<MapPoint[]>(() => {
    return incidents
      .filter(i => typeof i.location_lat === 'number' && typeof i.location_lng === 'number')
      .filter(i => mapCats.length === 0 || mapCats.includes(i.category_id))
      .map(i => ({
        id: i.incident_id,
        lat: i.location_lat as number,
        lng: i.location_lng as number,
        title: i.subcategory || i.category_id,
        category: humanize(i.category_id),
        priority: i.priority || 'P3',
        citizens: Math.max(1, i.cluster_citizens || 1),
        createdAt: i.created_at,
      }));
  }, [incidents, mapCats]);

  const mapHotspots = useMemo<MapHotspot[]>(() => {
    const out: MapHotspot[] = [];
    clusters.forEach(c => {
      if (mapCats.length > 0 && !mapCats.includes(c.category)) return;
      const members = incidents.filter(
        i => c.incidentIds.includes(i.incident_id) && typeof i.location_lat === 'number'
      );
      const wardRec = c.wardNumber != null ? WARDS.find(w => w.ward === c.wardNumber) : undefined;
      const lat = members.length
        ? members.reduce((s, i) => s + (i.location_lat as number), 0) / members.length
        : wardRec?.lat;
      const lng = members.length
        ? members.reduce((s, i) => s + (i.location_lng as number), 0) / members.length
        : wardRec?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      out.push({
        id: c.key,
        lat,
        lng,
        label: `${humanize(c.subcategory)} — ${c.ward || c.area || 'Bengaluru'}`,
        count: c.reportCount,
        p1: members.filter(i => i.priority === 'P1').length,
      });
    });
    return out;
  }, [clusters, incidents, mapCats]);

  // --- Officer action center ---------------------------------------------
  const actionCenter = useMemo(() => {
    const isOpen = (i: Incident) => !['RESOLVED', 'CLOSED', 'INVALID'].includes(i.status);
    const open = incidents.filter(isOpen);
    const critical = open.filter(i => i.priority === 'P1').length;
    const high = open.filter(i => i.priority === 'P2').length;
    const normal = open.filter(i => !i.priority || i.priority === 'P3' || i.priority === 'P4').length;
    const breach = incidents.filter(i =>
      isOverdue((i.priority || 'P3') as PriorityLevel, i.created_at, i.resolved_at)
    ).length;
    const duplicates = clusters.reduce((s, c) => s + Math.max(0, c.reportCount - 1), 0);

    // "Nearby" = open reports around the busiest live hotspot (5 km radius).
    const located = open.filter(
      i => typeof i.location_lat === 'number' && typeof i.location_lng === 'number'
    );
    let nearby = 0;
    if (located.length > 0) {
      let best = 1;
      for (const seed of located.slice(0, 50)) {
        const count = located.filter(
          o =>
            haversineKm(
              seed.location_lat as number, seed.location_lng as number,
              o.location_lat as number, o.location_lng as number
            ) <= 5
        ).length;
        if (count > best) best = count;
      }
      nearby = best;
    }

    return { critical, high, normal, breach, duplicates, nearby };
  }, [incidents, clusters]);

  const riskyCount = useMemo(
    () => incidents.filter(i => i.risk_level === 'high' || i.risk_level === 'critical').length,
    [incidents]
  );

  const pulse = getCivicPulse(incidents);

  const handleExport = async (fmt: 'csv' | 'json') => {
    setExporting(true);
    try {
      const rows = await exportAllData();
      const stamp = new Date().toISOString().slice(0, 10);
      if (fmt === 'csv') {
        downloadTextFile(`namma-samasye-export-${stamp}.csv`, exportRowsToCsv(rows), 'text/csv;charset=utf-8');
      } else {
        downloadTextFile(`namma-samasye-export-${stamp}.json`, exportRowsToJson(rows), 'application/json');
      }
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = stats ? [
    { label: 'Total Reports', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unique Citizens', value: stats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'P1 Open', value: incidents.filter(i => i.priority === 'P1' && !['RESOLVED', 'CLOSED'].includes(i.status)).length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'P2 Open', value: incidents.filter(i => i.priority === 'P2' && !['RESOLVED', 'CLOSED'].includes(i.status)).length, icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Citizen Supports', value: incidents.reduce((s, i) => s + (i.support_count || 0), 0), icon: UsersRound, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Duplicate Clusters', value: clusters.length, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Needs Better Description', value: flaggedItems.length, icon: Flag, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Spam / Risk Watch', value: riskyCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ] : [];

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FileText, label: 'All Reports', href: '/admin/reports' },
    { icon: MessageSquare, label: 'App Reviews', href: '/admin/feedback' },
    { icon: Users, label: 'Users / Sessions', href: '/admin/users' },
    { icon: Shield, label: 'Resources', href: '/admin/resources' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  ];

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
            {navItems.map(item => (
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

        <main className="p-6 space-y-6">
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

              {/* Officer action center */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert size={18} /> Officer Action Center
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleExport('csv')}
                      disabled={exporting}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition disabled:opacity-50"
                    >
                      <FileSpreadsheet size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                    <button
                      onClick={() => void handleExport('json')}
                      disabled={exporting}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      <FileJson size={14} /> Export JSON
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                    <div className="text-[11px] text-red-700 font-medium">🔴 Critical (P1 open)</div>
                    <div className="text-2xl font-bold text-red-700">{actionCenter.critical}</div>
                  </div>
                  <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                    <div className="text-[11px] text-orange-700 font-medium">🟠 High (P2 open)</div>
                    <div className="text-2xl font-bold text-orange-700">{actionCenter.high}</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <div className="text-[11px] text-amber-700 font-medium">🟡 Normal (P3 / P4)</div>
                    <div className="text-2xl font-bold text-amber-700">{actionCenter.normal}</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                    <div className="text-[11px] text-rose-700 font-medium">⚠ SLA breach</div>
                    <div className="text-2xl font-bold text-rose-700">{actionCenter.breach}</div>
                  </div>
                  <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
                    <div className="text-[11px] text-sky-700 font-medium">📍 Nearby (5 km)</div>
                    <div className="text-2xl font-bold text-sky-700">{actionCenter.nearby}</div>
                  </div>
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                    <div className="text-[11px] text-violet-700 font-medium">🔁 Duplicates</div>
                    <div className="text-2xl font-bold text-violet-700">{actionCenter.duplicates}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                  <span>SLA breach = report older than its {PRIORITY_ORDER.map(p => `${SLA_DAYS[p]}d`).join(' / ')} target</span>
                  <span>· Duplicates = repeat reports merged into clusters</span>
                </div>
              </div>

              {/* Daily trend: reports vs resolved */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} /> Daily reports vs resolved (last 14 days)
                </h3>

                {/* Bengaluru Civic Pulse — today, real numbers only */}
                <div className="bg-slate-900 text-white rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-6">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-300">
                    Bengaluru Civic Pulse · TODAY · {pulse.today}
                  </span>
                  <span className="text-sm"><b className="text-2xl">{pulse.reportsToday}</b> Reports</span>
                  <span className="text-sm"><b className="text-2xl text-green-400">{pulse.resolvedToday}</b> Resolved</span>
                  <span className="text-sm"><b className="text-2xl text-amber-400">{pulse.open}</b> Open</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailySeries} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="reports" name="Reports" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <h4 className="font-bold text-gray-900 mt-5 mb-2 text-sm">Registered vs resolved — day by day</h4>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                      <tr>
                        <th className="text-left font-medium px-3 py-2">Date</th>
                        <th className="text-right font-medium px-3 py-2">Registered</th>
                        <th className="text-right font-medium px-3 py-2">Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...dailySeries].reverse().map(d => (
                        <tr key={d.date} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 font-mono text-gray-600">{d.date}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{d.reports}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-green-600">{d.resolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Priority + categories */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Priority mix</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={prioritySeries} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                          {prioritySeries.map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v}`, `${n}`]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2 space-y-0.5">
                    {PRIORITY_ORDER.map(p => (
                      <div key={p} className="flex justify-between">
                        <span style={{ color: PRIORITY_COLOR[p] }}>{p}</span>
                        <span>{SLA_DAYS[p]} day SLA</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Frequent categories</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart data={categorySeries} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis type="category" dataKey="category" width={86} tick={{ fontSize: 9, fill: '#6b7280' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#e41e20" radius={[0, 4, 4, 0]} />
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Frequent issues</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart data={issueSeries} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis type="category" dataKey="issue" width={104} tick={{ fontSize: 9, fill: '#6b7280' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Zoomable map of every problem + recurring hotspots */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPinned size={18} /> Bengaluru problem map - zoom, filter, inspect
                  </h3>
                  <span className="text-xs text-gray-500">
                    {mapPoints.length} pinned report(s) · {mapHotspots.length} recurring hotspot(s)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    onClick={() => setMapCats([])}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                      mapCats.length === 0
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    All categories
                  </button>
                  {getAllCategories().map(c => {
                    const active = mapCats.includes(c);
                    return (
                      <label
                        key={c}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
                          active
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            setMapCats(prev => (active ? prev.filter(x => x !== c) : [...prev, c]))
                          }
                          className="accent-blue-600"
                        />
                        {humanize(c)}
                      </label>
                    );
                  })}
                </div>

                <AdminIssueMap points={mapPoints} hotspots={mapHotspots} />

                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> P1</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#f97316' }} /> P2</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} /> P3</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#38bdf8' }} /> P4</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: '#f97316' }} /> Recurring hotspot (click for detail)</span>
                  <span className="ml-auto">Dashed ring = the same problem reported again and again in one place</span>
                </div>
              </div>
              {/* Priority queue + clusters */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> Priority queue
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                          <th className="py-2 px-2">ID</th>
                          <th className="py-2 px-2">Priority</th>
                          <th className="py-2 px-2">Ward / Place</th>
                          <th className="py-2 px-2">Police</th>
                          <th className="py-2 px-2 text-right">Support</th>
                          <th className="py-2 px-2 text-right">SLA</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {priorityQueue.map(inc => {
                          const p = (inc.priority || 'P3') as PriorityLevel;
                          const overdue = isOverdue(p, inc.created_at, inc.resolved_at);
                          return (
                            <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-2 font-mono text-xs text-gray-600">{inc.incident_id}</td>
                              <td className="py-2 px-2">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border" style={{ color: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p] }}>
                                  {p}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-gray-700">{wardTitle(inc)}</td>
                              <td className="py-2 px-2 text-gray-500 text-xs">{inc.police_station || '—'}</td>
                              <td className="py-2 px-2 text-right font-semibold text-gray-800">{inc.support_count || 0}</td>
                              <td className="py-2 px-2 text-right">
                                <span className={`text-xs ${overdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                  {overdue ? 'OVERDUE' : `${inc.sla_days || SLA_DAYS[p]}d`}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <a href={`/admin/reports/${inc.id}`} className="text-xs text-blue-600 hover:underline">Open</a>
                              </td>
                            </tr>
                          );
                        })}
                        {priorityQueue.length === 0 && (
                          <tr><td colSpan={7} className="py-6 text-center text-gray-400 text-sm">No open reports.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers size={18} /> Clusters — same issue, same place
                  </h3>
                  {clusters.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No duplicate clusters yet. When 2+ citizens report the same issue in the same ward, it appears here.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {clusters.map(c => (
                        <div key={c.key} className="border border-gray-200 rounded-xl p-3 hover:border-blue-300 transition">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-gray-900">{c.subcategory.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border" style={{ color: PRIORITY_COLOR[c.priority], borderColor: PRIORITY_COLOR[c.priority] }}>
                              {c.priority}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{c.ward || c.area || 'Unknown place'}</div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
                              <UsersRound size={12} /> {c.citizenCount} citizens reported this
                            </span>
                            <span className="text-gray-400">{c.reportCount} reports</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.incidentIds.map(id => (
                              <a key={id} href={`/admin/reports/${id}`} className="text-[10px] font-mono text-blue-600 hover:underline">{id}</a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top wards + most supported + flags */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Happening places</h3>
                  <div className="space-y-2">
                    {wardSeries.map(w => (
                      <div key={w.ward} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate">{w.ward}</span>
                        <span className="font-bold text-gray-900">{w.count}</span>
                      </div>
                    ))}
                    {wardSeries.length === 0 && <p className="text-gray-400 text-sm">No location data yet.</p>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Most supported by citizens</h3>
                  <div className="space-y-2">
                    {topSupported.map(i => (
                      <a key={i.id} href={`/admin/reports/${i.id}`} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50">
                        <span className="truncate">
                          <span className="font-mono text-xs text-gray-500">{i.incident_id}</span>
                          <span className="block text-gray-700 text-xs">{wardTitle(i)}</span>
                        </span>
                        <span className="font-bold text-pink-600">{i.support_count || 0}</span>
                      </a>
                    ))}
                    {topSupported.length === 0 && <p className="text-gray-400 text-sm">No reports yet.</p>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Flag size={16} /> Flagged for unclear description
                  </h3>
                  <div className="space-y-2">
                    {flaggedItems.map(i => (
                      <a key={i.id} href={`/admin/reports/${i.id}`} className="flex items-center justify-between text-sm border border-amber-100 bg-amber-50/50 rounded-lg px-3 py-2 hover:bg-amber-50">
                        <span className="truncate text-gray-700 text-xs">
                          <span className="font-mono text-gray-500">{i.incident_id}</span>
                          <span className="block">{wardTitle(i)}</span>
                        </span>
                        <span className="font-bold text-amber-700">{i.flag_count}</span>
                      </a>
                    ))}
                    {flaggedItems.length === 0 && <p className="text-gray-400 text-sm">Nothing flagged.</p>}
                  </div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4">By status</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'New', value: stats.new_count, icon: AlertCircle, color: 'text-orange-600' },
                      { label: 'Under review', value: stats.under_review, icon: Eye, color: 'text-yellow-600' },
                      { label: 'Missing info', value: stats.missing_info, icon: Clock, color: 'text-purple-600' },
                      { label: 'Proceeding', value: stats.proceeding, icon: TrendingUp, color: 'text-green-600' },
                      { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-700' },
                      { label: 'Closed', value: stats.closed, icon: XCircle, color: 'text-gray-600' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2">
                        <s.icon size={16} className={s.color} />
                        <span className="text-gray-600">{s.label}</span>
                        <span className="ml-auto font-bold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} /> Citizen sessions ({users.length})
                  </h3>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Session ID</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Language</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Reports</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono text-xs text-gray-600">{u.id.slice(0, 12)}...</td>
                            <td className="py-2 px-3 uppercase text-gray-700">{u.language}</td>
                            <td className="py-2 px-3 font-bold text-gray-900">{u.incident_count}</td>
                            <td className="py-2 px-3 text-gray-500 text-xs">{new Date(u.last_active).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
