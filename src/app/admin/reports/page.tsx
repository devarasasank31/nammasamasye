'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Incident } from '@/types';
import { Search, Filter, Download, ArrowLeft } from 'lucide-react';

export default function AdminReportsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  const filtered = incidents.filter(inc => {
    if (search && !inc.incident_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && inc.category_id !== categoryFilter) return false;
    return true;
  });

  const handleExport = () => {
    const csv = [
      'Incident ID,Category,Subcategory,Area,Status,Created At,Language',
      ...filtered.map(inc =>
        `${inc.incident_id},${inc.category_id},${inc.subcategory},${inc.location_area},${inc.status},${inc.created_at},${inc.language}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namma-samasye-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                  item.href === '/admin/reports' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="lg:hidden text-gray-500"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold text-gray-900">Reports ({filtered.length})</h1>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
            <Download size={16} /> Export CSV
          </button>
        </header>

        <main className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by Incident ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option value="ALL">All Status</option>
              {['NEW', 'UNDER_REVIEW', 'MISSING_INFORMATION', 'ON_HOLD', 'PROCEEDING', 'INVALID', 'CLOSED', 'RESOLVED'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option value="ALL">All Categories</option>
              {[...new Set(incidents.map(i => i.category_id))].map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Area</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No reports found.</td></tr>
                  ) : (
                    filtered.map(inc => (
                      <tr key={inc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{inc.incident_id}</td>
                        <td className="px-4 py-3 text-gray-700 capitalize">{inc.subcategory.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-gray-500">{inc.location_area || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inc.status === 'PROCEEDING' ? 'bg-green-100 text-green-700' :
                            inc.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                            inc.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                            inc.status === 'INVALID' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {inc.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inc.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => router.push(`/admin/reports/${inc.id}`)}
                            className="text-primary hover:underline text-xs font-medium">
                            View
                          </button>
                        </td>
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
