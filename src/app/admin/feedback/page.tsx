'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, ArrowLeft, Users, BarChart3, FileText, Shield, LogOut, MessageSquare, FileJson } from 'lucide-react';
import { FeedbackRecord } from '@/lib/demo-store';
import { exportRowsToCsv, exportRowsToJson, downloadTextFile, ExportRow } from '@/lib/analytics';

// Admin "App Reviews" — every website/app issue submitted via the navbar
// Report Issue form, from every browser (durable server store via GET
// /api/feedback). Downloadable as CSV or JSON.

const ISSUE_LABELS: Record<string, string> = {
  page: 'Page not loading',
  login: 'Login/account',
  search: 'Search & filters',
  language: 'Language & translation',
  performance: 'Slow performance',
  broken: 'Broken link/button',
  other: 'Other',
};

const SEVERITY_BADGE: Record<string, string> = {
  low: 'bg-gray-50 text-gray-600 border-gray-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/feedback', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/admin/login?from=/admin/feedback');
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(data.feedbacks || []);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const filtered = items.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.feedback_id.toLowerCase().includes(q) && !r.what_happened.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'ALL' && r.issue_type !== typeFilter) return false;
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
    return true;
  });

  const toRows = (recs: FeedbackRecord[]): ExportRow[] =>
    recs.map(r => ({
      'Feedback ID': r.feedback_id,
      'Submitted Date': r.submitted_date,
      'Submitted Time': r.submitted_time,
      'Issue Date': r.issue_date,
      'Issue Time': r.issue_time,
      'Issue Type': ISSUE_LABELS[r.issue_type] || r.issue_type,
      'What Happened': r.what_happened,
      'Severity': r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
      'Rating': r.rating,
      'Status': r.status,
    })) as unknown as ExportRow[];

  const stamp = () => new Date().toISOString().slice(0, 10);

  const handleDownload = (fmt: 'csv' | 'json') => {
    const rows = toRows(filtered);
    if (rows.length === 0) return;
    if (fmt === 'csv') {
      downloadTextFile(`namma-samasye-app-reviews-${stamp()}.csv`, exportRowsToCsv(rows), 'text/csv');
    } else {
      downloadTextFile(`namma-samasye-app-reviews-${stamp()}.json`, exportRowsToJson(rows), 'application/json');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

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
              { icon: MessageSquare, label: 'App Reviews', href: '/admin/feedback' },
              { icon: Users, label: 'Users / Sessions', href: '/admin/users' },
              { icon: Shield, label: 'Resources', href: '/admin/resources' },
              { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
            ].map(item => (
              <a key={item.href} href={item.href}
                data-testid={`nav-${item.href}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  item.href === '/admin/feedback' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.icon && <item.icon size={18} />} {item.label}
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
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="lg:hidden text-gray-500"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-900">App Reviews ({filtered.length})</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleDownload('csv')} disabled={filtered.length === 0}
              data-testid="dl-csv"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
              <Download size={16} /> CSV
            </button>
            <button onClick={() => handleDownload('json')} disabled={filtered.length === 0}
              data-testid="dl-json"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
              <FileJson size={16} /> JSON
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                data-testid="fb-search"
                placeholder="Search by Feedback ID or text..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              data-testid="fb-type-filter"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option value="ALL">All Types</option>
              {Object.keys(ISSUE_LABELS).map(k => (
                <option key={k} value={k}>{ISSUE_LABELS[k]}</option>
              ))}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              data-testid="fb-sev-filter"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option value="ALL">All Severity</option>
              {['low', 'medium', 'high', 'critical'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Feedback ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Issue Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">What Happened</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Severity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Issue When</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400" data-testid="fb-loading">Loading...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={8} className="text-center py-8 text-red-500" data-testid="fb-error">Failed to load: {error}</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400" data-testid="fb-empty">No app reviews yet.</td></tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.feedback_id} className="border-b border-gray-100 hover:bg-gray-50" data-testid="fb-row">
                        <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{r.feedback_id}</td>
                        <td className="px-4 py-3 text-gray-700">{ISSUE_LABELS[r.issue_type] || r.issue_type}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[280px] truncate" title={r.what_happened}>{r.what_happened}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${SEVERITY_BADGE[r.severity] || ''}`}>
                            {r.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-amber-500 tracking-tighter" title={`${r.rating}/5`}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.issue_date} {r.issue_time}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.submitted_date} {r.submitted_time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
