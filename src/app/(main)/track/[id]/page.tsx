'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { Language, Incident, StatusHistory, Evidence } from '@/types';
import { getAllIncidents, getStatusHistory, getIncidentEvidence, getIncidentById } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { ArrowLeft, CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchId, setSearchId] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData();
    setLang(getStoredLanguage());
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    const allInc = await getAllIncidents();
    setIncidents(allInc);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    const inc = await getIncidentById(searchId.trim().toUpperCase());
    if (inc) {
      setSelectedIncident(inc);
      const internal = incidents.find(i => i.incident_id === searchId.trim().toUpperCase());
      if (internal) {
        const hist = await getStatusHistory(internal.id);
        setStatusHistory(hist);
        const ev = await getIncidentEvidence(internal.id);
        setEvidence(ev);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return <AlertCircle size={16} className="text-blue-500" />;
      case 'UNDER_REVIEW': return <Clock size={16} className="text-yellow-500" />;
      case 'PROCEEDING': return <CheckCircle size={16} className="text-green-500" />;
      case 'CLOSED': case 'RESOLVED': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Circle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">My Incidents</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by Incident ID (e.g., NS-8F42K)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
          <button onClick={handleSearch} className="px-6 py-3 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition">
            Search
          </button>
        </div>

        {/* Selected Incident Detail */}
        {selectedIncident && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">{selectedIncident.incident_id}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedIncident.status === 'PROCEEDING' ? 'bg-green-100 text-green-700' :
                selectedIncident.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                selectedIncident.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {t(`status.${selectedIncident.status}`, lang)}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Category:</span> {selectedIncident.subcategory.replace(/_/g, ' ')}
            </div>

            {selectedIncident.original_text && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Your report:</span>
                <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedIncident.original_text}</p>
              </div>
            )}

            {selectedIncident.location && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {selectedIncident.location}
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 text-sm">Status Timeline</h3>
              {statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  {getStatusIcon(h.new_status)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{t(`status.${h.new_status}`, lang)}</div>
                    {h.admin_note && <div className="text-xs text-gray-500 mt-0.5">{h.admin_note}</div>}
                    <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence */}
            {evidence.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-2">Evidence</h3>
                {evidence.map(ev => (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline truncate">{ev.url}</a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Incidents List */}
        {!selectedIncident && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 text-sm">No incidents yet. Start by reporting something.</p>
                <button onClick={() => router.push('/report')} className="mt-4 px-6 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
                  Report Something
                </button>
              </div>
            ) : (
              incidents.map(inc => (
                <div key={inc.id} onClick={() => { setSelectedIncident(inc); }}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-primary text-sm">{inc.incident_id}</div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{inc.subcategory.replace(/_/g, ' ')}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inc.status === 'PROCEEDING' ? 'bg-green-100 text-green-700' :
                      inc.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t(`status.${inc.status}`, lang)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{new Date(inc.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
