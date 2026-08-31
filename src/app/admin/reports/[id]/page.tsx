'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Incident, StatusHistory, Evidence, AdminNote } from '@/types';
import { getIncidentInternal, getIncidentEvidence, getStatusHistory, getAdminNotes, addAdminNote, updateIncidentStatus } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { ArrowLeft, CheckCircle, ExternalLink, Users, BarChart3, FileText, Shield, LogOut } from 'lucide-react';

export default function AdminIncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [incident, setIncident] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData();
    loadIncident();
  }, [params.id]);

  const loadIncident = async () => {
    setLoading(true);
    const inc = await getIncidentInternal(params.id as string);
    setIncident(inc);

    if (inc) {
      const hist = await getStatusHistory(inc.id);
      setStatusHistory(hist);

      const ev = await getIncidentEvidence(inc.id);
      setEvidence(ev);

      const nt = await getAdminNotes(inc.id);
      setNotes(nt);

      const an = await getIncidentAnswers(inc.id);
      setAnswers(an);
    }
    setLoading(false);
  };

  const getIncidentAnswers = async (incidentId: string) => {
    const { isDemoMode } = await import('@/lib/supabase');
    if (isDemoMode) {
      const { demoStore } = await import('@/lib/demo-store');
      return demoStore.getIncidentAnswers(incidentId);
    }
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('incident_answers').select('*').eq('incident_id', incidentId);
    return data || [];
  };

  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!incident) return;
    await updateIncidentStatus(incident.id, newStatus as any, 'admin', note);
    loadIncident();
  };

  const handleAddNote = async () => {
    if (!incident || !newNote.trim()) return;
    const { isDemoMode } = await import('@/lib/supabase');
    if (isDemoMode) {
      const { demoStore } = await import('@/lib/demo-store');
      demoStore.addAdminNotePublic(incident.id, 'admin', newNote.trim(), !noteIsPublic);
    } else {
      await addAdminNote(incident.id, 'admin', newNote.trim());
    }
    setNewNote('');
    setNoteIsPublic(false);
    loadIncident();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">Loading...</div>;
  if (!incident) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">Incident not found.</div>;

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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  item.href === '/admin/reports' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/admin/reports')} className="text-gray-500 lg:hidden"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-gray-900">Incident: {incident.incident_id}</h1>
        </header>

        <main className="p-6 max-w-4xl space-y-6">
          {/* Status & Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                incident.status === 'PROCEEDING' ? 'bg-green-100 text-green-700' :
                incident.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {incident.status.replace(/_/g, ' ')}
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { status: 'UNDER_REVIEW', label: 'Review', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                  { status: 'MISSING_INFORMATION', label: 'Request Info', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                  { status: 'ON_HOLD', label: 'Hold', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                  { status: 'PROCEEDING', label: 'Proceed', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                  { status: 'INVALID', label: 'Invalid', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                  { status: 'CLOSED', label: 'Close', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                  { status: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                ].map(btn => (
                  <button key={btn.status} onClick={() => handleStatusChange(btn.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${btn.color}`}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Incident Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Incident Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-gray-500">Category:</span> <span className="text-gray-900 capitalize">{incident.category_id.replace(/_/g, ' ')}</span></div>
              <div><span className="font-medium text-gray-500">Subcategory:</span> <span className="text-gray-900 capitalize">{incident.subcategory.replace(/_/g, ' ')}</span></div>
              <div><span className="font-medium text-gray-500">Area:</span> <span className="text-gray-900">{incident.location_area || '-'}</span></div>
              <div><span className="font-medium text-gray-500">Language:</span> <span className="text-gray-900">{incident.language}</span></div>
              <div><span className="font-medium text-gray-500">Created:</span> <span className="text-gray-900">{new Date(incident.created_at).toLocaleString()}</span></div>
              <div><span className="font-medium text-gray-500">AI Confidence:</span> <span className="text-gray-900">{incident.ai_confidence}%</span></div>
            </div>

            {incident.original_text && (
              <div>
                <h3 className="font-medium text-gray-500 text-xs mb-1">Original User Statement</h3>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800">{incident.original_text}</div>
              </div>
            )}

            {incident.location && (
              <div>
                <h3 className="font-medium text-gray-500 text-xs mb-1">Location</h3>
                <div className="text-sm text-gray-800">{incident.location}</div>
              </div>
            )}

            {incident.ai_scenario_match && (
              <div>
                <h3 className="font-medium text-gray-500 text-xs mb-1">AI Scenario Match</h3>
                <div className="text-sm text-gray-800">{incident.ai_scenario_match} ({incident.ai_confidence}%)</div>
                {incident.ai_reason && <div className="text-xs text-gray-500 mt-1">{incident.ai_reason}</div>}
              </div>
            )}
          </div>

          {/* Answers */}
          {answers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Q&A</h2>
              <div className="space-y-3">
                {answers.map((a: any) => (
                  <div key={a.question_id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 capitalize">{a.question_id.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-800 mt-1">{a.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {evidence.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Evidence</h2>
              <div className="space-y-2">
                {evidence.map(ev => (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm text-primary">
                    <ExternalLink size={14} /> {ev.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Status History</h2>
            <div className="space-y-3">
              {statusHistory.map(h => (
                <div key={h.id} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{h.previous_status ? `${h.previous_status} → ` : ''}{h.new_status}</div>
                    {h.admin_note && <div className="text-xs text-gray-500 mt-0.5">{h.admin_note}</div>}
                    <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Admin Notes</h2>
            <div className="space-y-3 mb-4">
              {notes.map(n => (
                <div key={n.id} className={`p-3 rounded-lg ${n.is_private ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {n.is_private ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">Private</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-700">Visible to user</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-800">{n.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.admin_id} · {new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
              {notes.length === 0 && <div className="text-sm text-gray-400">No notes yet.</div>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setNoteIsPublic(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!noteIsPublic ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  🔒 Private
                </button>
                <button onClick={() => setNoteIsPublic(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${noteIsPublic ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  👁️ Visible to User
                </button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  placeholder={noteIsPublic ? "Write a note the user will see..." : "Add a private note..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none" />
                <button onClick={handleAddNote} className="px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition">
                  Add Note
                </button>
              </div>
              {noteIsPublic && (
                <p className="text-xs text-blue-600">This note will be visible to the user on their tracking page.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
