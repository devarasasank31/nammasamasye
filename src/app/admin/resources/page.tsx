'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { OfficialResource } from '@/types';
import { Plus, Trash2, Save } from 'lucide-react';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<OfficialResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newResource, setNewResource] = useState({
    title: '', category: 'TRAFFIC', authority: '', official_url: '', official_phone: '', description: '', source: '',
  });

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    setLoading(true);
    const { data } = await supabase.from('official_resources').select('*').order('category');
    setResources(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newResource.title || !newResource.official_url) return;
    await supabase.from('official_resources').insert({
      ...newResource,
      language: 'en',
      last_verified_at: new Date().toISOString(),
      active: true,
    });
    setNewResource({ title: '', category: 'TRAFFIC', authority: '', official_url: '', official_phone: '', description: '', source: '' });
    loadResources();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('official_resources').delete().eq('id', id);
    loadResources();
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
                  item.href === '/admin/resources' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Official Resources</h1>
        </header>

        <main className="p-6 max-w-4xl space-y-6">
          {/* Add New */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Add Resource</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Title" value={newResource.title} onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <select value={newResource.category} onChange={e => setNewResource(p => ({ ...p, category: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                {['TRAFFIC', 'CIVIC', 'PUBLIC_SAFETY', 'GOVERNMENT', 'HOUSING', 'ENVIRONMENT', 'UTILITIES', 'DIGITAL'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input type="text" placeholder="Authority" value={newResource.authority} onChange={e => setNewResource(p => ({ ...p, authority: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="url" placeholder="Official URL" value={newResource.official_url} onChange={e => setNewResource(p => ({ ...p, official_url: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="tel" placeholder="Phone" value={newResource.official_phone} onChange={e => setNewResource(p => ({ ...p, official_phone: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="text" placeholder="Source" value={newResource.source} onChange={e => setNewResource(p => ({ ...p, source: e.target.value }))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="text" placeholder="Description" value={newResource.description} onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))}
                className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button onClick={handleAdd} className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
              <Plus size={16} /> Add Resource
            </button>
          </div>

          {/* Existing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Existing Resources ({resources.length})</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
              ) : resources.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.authority} • {r.category}</div>
                    <div className="text-xs text-primary mt-0.5 truncate">{r.official_url}</div>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-red-400 hover:text-red-600 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
