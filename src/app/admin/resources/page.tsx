'use client';

import { useState, useEffect } from 'react';
import { isDemoMode } from '@/lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  category: string;
  authority: string;
  official_url: string;
  official_phone: string;
  description: string;
  language: string;
  last_verified_at: string;
  source: string;
  active: boolean;
}

const demoResources: Resource[] = [
  { id: 'res-1', title: 'Bangalore Traffic Police', category: 'TRAFFIC', authority: 'Bangalore City Traffic Police', official_url: 'https://www.bangaloretrafficpolice.gov.in', official_phone: '080-22943400', description: 'Traffic complaints and accident reports.', language: 'en', last_verified_at: new Date().toISOString(), source: 'Official website', active: true },
  { id: 'res-2', title: 'BBMP', category: 'CIVIC', authority: 'BBMP', official_url: 'https://bbmp.gov.in', official_phone: '1918', description: 'Civic issues: potholes, garbage, streetlights, drainage.', language: 'en', last_verified_at: new Date().toISOString(), source: 'Official website', active: true },
  { id: 'res-3', title: 'BESCOM', category: 'UTILITIES', authority: 'BESCOM', official_url: 'https://bescom.karnataka.gov.in', official_phone: '1912', description: 'Power outage and electricity complaints.', language: 'en', last_verified_at: new Date().toISOString(), source: 'Official website', active: true },
  { id: 'res-4', title: 'Cyber Crime Portal', category: 'DIGITAL', authority: 'MHA', official_url: 'https://cybercrime.gov.in', official_phone: '1930', description: 'Report cybercrime and online fraud.', language: 'en', last_verified_at: new Date().toISOString(), source: 'Official website', active: true },
  { id: 'res-5', title: 'Karnataka Police', category: 'PUBLIC_SAFETY', authority: 'KSP', official_url: 'https://karnataka.gov.in/police', official_phone: '100', description: 'Public safety and emergency.', language: 'en', last_verified_at: new Date().toISOString(), source: 'Official website', active: true },
];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    setLoading(true);
    if (isDemoMode) {
      setResources(demoResources);
    } else {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.from('official_resources').select('*').order('category');
      setResources(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setResources(prev => prev.filter(r => r.id !== id));
    } else {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('official_resources').delete().eq('id', id);
      loadResources();
    }
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
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Existing Resources ({resources.length})</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="text-gray-400 text-sm">Loading...</div>
              ) : resources.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.authority} · {r.category}</div>
                    <div className="text-xs text-primary mt-0.5 truncate">{r.official_url}</div>
                    {r.official_phone && <div className="text-xs text-gray-400 mt-0.5">📞 {r.official_phone}</div>}
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
