'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Phone } from 'lucide-react';
import { officialResources } from '@/data/resources';
import { OfficialResource } from '@/types';

export default function ResourcesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('ALL');

  const categories = ['ALL', ...new Set(officialResources.map(r => r.category))];
  const filtered = filter === 'ALL' ? officialResources : officialResources.filter(r => r.category === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">Official Resources</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === cat ? 'gradient-bg text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
              }`}>
              {cat === 'ALL' ? 'All' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Resources */}
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.authority}</p>
                  <p className="text-sm text-gray-600 mt-2">{r.description}</p>
                </div>
                <a href={r.official_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition flex-shrink-0">
                  <ExternalLink size={16} />
                </a>
              </div>
              {r.official_phone && (
                <a href={`tel:${r.official_phone}`}
                  className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone size={14} /> {r.official_phone}
                </a>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Last verified: {new Date(r.last_verified_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
