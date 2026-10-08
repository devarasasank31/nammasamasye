'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Incident, IncidentStatus, StatusHistory, Evidence, AdminNote } from '@/types';
import { getIncidentInternal, getIncidentEvidence, getStatusHistory, getAdminNotes, addAdminNote, updateIncidentStatus } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { ArrowLeft, CheckCircle, ExternalLink, Users, BarChart3, FileText, Shield, LogOut, MessageSquare } from 'lucide-react';
import { getStatusBadgeClass, getStatusColor } from '@/lib/status-colors';
import { formatIncidentWhen } from '@/lib/incident-when';
import AttachmentGallery from '@/components/AttachmentGallery';
import dynamic from 'next/dynamic';
const StaticMap = dynamic(() => import('@/components/StaticMap'), { ssr: false, loading: () => <div className="h-[200px] rounded-xl bg-gray-100 animate-pulse" /> });

interface IncidentAnswerRow { question_id: string; answer: string }

async function getIncidentAnswers(incidentId: string): Promise<IncidentAnswerRow[]> {
  const { isDemoMode } = await import('@/lib/supabase');
  if (isDemoMode) {
    const { demoStore } = await import('@/lib/demo-store');
    return demoStore.getIncidentAnswers(incidentId);
  }
  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase.from('incident_answers').select('*').eq('incident_id', incidentId);
  return data || [];
}

export default function AdminIncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [answers, setAnswers] = useState<IncidentAnswerRow[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [requestInfoText, setRequestInfoText] = useState('');
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadIncident = useCallback(async () => {
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
  }, [params.id]);

  useEffect(() => {
    const init = async () => {
      seedDemoData();
      await loadIncident();
    };
    void init();
  }, [loadIncident]);

  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!incident) return;
    await updateIncidentStatus(incident.id, newStatus as IncidentStatus, 'admin', note);
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

  const handleRequestInfo = async () => {
    if (!incident || !requestInfoText.trim()) return;
    // Add as public note visible to user
    const { isDemoMode } = await import('@/lib/supabase');
    if (isDemoMode) {
      const { demoStore } = await import('@/lib/demo-store');
      demoStore.addAdminNotePublic(incident.id, 'admin', `📋 REQUEST INFO: ${requestInfoText.trim()}`, false);
    } else {
      await addAdminNote(incident.id, 'admin', `📋 REQUEST INFO: ${requestInfoText.trim()}`);
    }
    // Update status to MISSING_INFORMATION
    await updateIncidentStatus(incident.id, 'MISSING_INFORMATION', 'admin', `Requested: ${requestInfoText.trim()}`);
    setRequestInfoText('');
    setShowRequestInfo(false);
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
              { icon: MessageSquare, label: 'App Reviews', href: '/admin/feedback' },
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
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeClass(incident.status)}`}>
                {incident.status.replace(/_/g, ' ')}
              </span>
              <div className="flex gap-2 flex-wrap">
                {([
                  { status: 'UNDER_REVIEW', label: 'Review' },
                  { status: 'MISSING_INFORMATION', label: 'Request Info', isRequestInfo: true },
                  { status: 'ON_HOLD', label: 'Hold' },
                  { status: 'PROCEEDING', label: 'Proceed' },
                  { status: 'INVALID', label: 'Invalid' },
                  { status: 'CLOSED', label: 'Close' },
                  { status: 'RESOLVED', label: 'Resolved' },
                ] as { status: IncidentStatus; label: string; isRequestInfo?: boolean }[]).map(btn => {
                  const colors = getStatusColor(btn.status);
                  return (
                    <button key={btn.status}
                      onClick={() => {
                        if (btn.isRequestInfo) {
                          setShowRequestInfo(!showRequestInfo);
                        } else {
                          handleStatusChange(btn.status);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${colors.bg} ${colors.text} ${colors.hover}`}>
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Request Info Form */}
            {showRequestInfo && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                <h4 className="font-bold text-purple-900 text-sm">📋 What information do you need?</h4>
                <p className="text-xs text-purple-700">This will be visible to the user. They can reply with the requested info.</p>
                <textarea
                  value={requestInfoText}
                  onChange={e => setRequestInfoText(e.target.value)}
                  placeholder="e.g., Please share the vehicle number, exact time of incident, witness contact details..."
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-sm focus:border-purple-500 outline-none resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={handleRequestInfo}
                    disabled={!requestInfoText.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition disabled:opacity-40">
                    Send Request to User
                  </button>
                  <button onClick={() => { setShowRequestInfo(false); setRequestInfoText(''); }}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Incident Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Incident Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-gray-500">Category:</span> <span className="text-gray-900 capitalize">{incident.category_id.replace(/_/g, ' ')}</span></div>
              <div><span className="font-medium text-gray-500">Subcategory:</span> <span className="text-gray-900 capitalize">{incident.subcategory.replace(/_/g, ' ')}</span></div>
              <div><span className="font-medium text-gray-500">Ward:</span> <span className="text-gray-900">{incident.ward || '-'}</span></div>
              <div><span className="font-medium text-gray-500">Zone:</span> <span className="text-gray-900">{incident.zone || '-'}</span></div>
              <div className="col-span-2"><span className="font-medium text-gray-500">Nearest police station:</span> <span className="text-gray-900">{incident.police_station || '-'}</span>{typeof incident.ward_distance_km === 'number' && <span className="text-gray-400 text-xs"> ({incident.ward_distance_km} km from ward centre)</span>}</div>
              <div><span className="font-medium text-gray-500">Area:</span> <span className="text-gray-900">{incident.location_area || '-'}</span></div>
              <div><span className="font-medium text-gray-500">Language:</span> <span className="text-gray-900">{incident.language}</span></div>
              {/* Spec §20: incident time vs submission time, kept separate. */}
              <div className="col-span-2">
                <span className="font-medium text-gray-500">Incident happened:</span>{' '}
                <span className="text-gray-900">
                  {formatIncidentWhen(incident)
                    || (incident.date_of_incident ? new Date(incident.date_of_incident).toLocaleString() : 'Not stated')}
                </span>
                {incident.incident_time_precision && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    incident.incident_time_precision === 'ONGOING' ? 'bg-red-100 text-red-700'
                    : incident.incident_time_precision === 'EXACT' ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {incident.incident_time_precision}
                  </span>
                )}
              </div>
              <div><span className="font-medium text-gray-500">Created (reported at):</span> <span className="text-gray-900">{new Date(incident.created_at).toLocaleString()}</span></div>
              <div><span className="font-medium text-gray-500">AI Confidence:</span> <span className="text-gray-900">{incident.ai_confidence}%</span></div>
            </div>

            {/* Priority engine output */}
            <div className={`rounded-xl border p-4 ${
              incident.priority === 'P1' ? 'bg-red-50 border-red-200'
              : incident.priority === 'P2' ? 'bg-orange-50 border-orange-200'
              : incident.priority === 'P3' ? 'bg-amber-50 border-amber-200'
              : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Priority: {incident.priority || 'P3'}</span>
                  {incident.priority_base && incident.priority !== incident.priority_base && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                      escalated from {incident.priority_base}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  Score {incident.priority_score ?? '-'} · SLA {incident.sla_days || 21} days
                  {incident.resolved_at ? ` · resolved ${new Date(incident.resolved_at).toLocaleDateString()}` : ''}
                </span>
              </div>
              {incident.priority_reason && <p className="text-xs text-gray-700 mt-2">{incident.priority_reason}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-700">
                <span><b>{incident.support_count || 0}</b> citizen supports</span>
                <span><b>{incident.cluster_citizens || 1}</b> citizens reported this issue here</span>
                <span className={((incident.flag_count || 0) > 0) ? 'text-amber-700 font-semibold' : ''}>
                  <b>{incident.flag_count || 0}</b> clarity flags
                </span>
              </div>
            </div>

            {/* Priority analysis audit trail (engine + retrieval + AI) */}
            {incident.priority_analysis && (() => {
              const pa = incident.priority_analysis;
              const a = pa.analysis;
              const b = a.breakdown;
              const dims = ([
                ['life safety', b.lifeSafety, b.weights.lifeSafety],
                ['injury', b.injury, b.weights.injury],
                ['danger', b.immediateDanger, b.weights.immediateDanger],
                ['exposure', b.publicExposure, b.weights.publicExposure],
                ['people', b.population, b.weights.population],
                ['access', b.emergencyAccess, b.weights.emergencyAccess],
                ['infra', b.infraCriticality, b.weights.infraCriticality],
                ['persistence', b.persistence, b.weights.persistence],
              ] as [string, number, number][]).filter(([, v]) => v > 0);
              return (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-gray-900">Priority analysis</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 font-semibold uppercase">{pa.source}</span>
                  </div>
                  {pa.source !== 'local' && (
                    <p className="text-xs text-gray-700">
                      Local engine: <b>{a.basePriority}</b> → final: <b>{a.priority}</b>
                      {a.provider !== 'local' ? ` (validated by ${a.provider}${a.model ? ` ${a.model}` : ''})` : ''}
                    </p>
                  )}
                  <div className="text-xs text-gray-700">
                    Confidence — classification {a.confidences.classification}% · severity {a.confidences.severity}% · priority {a.confidences.priority}% · retrieval {a.confidences.retrieval}% · AI {a.confidences.ai ?? '—'}% · {a.latencyMs ?? '-'} ms
                  </div>
                  {a.safetyOverride && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.safetyRules.map(r => (
                        <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-semibold">{r.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                  {dims.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {dims.map(([label, v, w]) => (
                        <span key={label} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-300 text-gray-700">{label} {v}/{w}</span>
                      ))}
                    </div>
                  )}
                  {a.retrieval?.matched && a.retrieval.top[0] && (
                    <p className="text-xs text-gray-700">
                      KB match: <b>{a.retrieval.top[0].id}</b> → {a.retrieval.top[0].expectedPriority}
                      {' '}(similarity {Math.round(a.retrieval.top[0].score * 100)}%, top-3 agreement {Math.round(a.retrieval.agreement * 100)}%)
                    </p>
                  )}
                  {a.outOfDistribution && (
                    <p className="text-xs text-amber-700 font-semibold">Unrecognised report — human review required.</p>
                  )}
                  <p className="text-[11px] text-gray-500">Captured {new Date(pa.created_at).toLocaleString()} · non-LLM facts and the safety override are final; the AI layer can only escalate, never downgrade.</p>
                </div>
              );
            })()}

            {/* Spam / abuse moderation score */}
            <div className={`rounded-xl border p-4 ${
              incident.risk_level === 'critical' ? 'bg-red-50 border-red-200'
              : incident.risk_level === 'high' ? 'bg-orange-50 border-orange-200'
              : incident.risk_level === 'review' ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm">
                  Moderation risk: {(incident.risk_level || 'clean').toUpperCase()}
                </span>
                <span className="text-xs text-gray-600">
                  Score {incident.risk_score ?? 0} / 100 · review 25-49 · high 50-74 · critical 75+
                </span>
              </div>
              {(incident.risk_flags || []).length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {incident.risk_flags!.map(f => (
                    <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-white/70 border border-gray-300 text-gray-700 font-medium">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600 mt-2">No spam or abuse signals detected.</p>
              )}
              <p className="text-[11px] text-gray-500 mt-2">
                Risk only highlights a report for a human look. Nothing is auto-blocked or auto-banned.
              </p>
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

            <AttachmentGallery attachments={incident.attachments} />

            {typeof incident.location_lat === 'number' && typeof incident.location_lng === 'number' && (
              <StaticMap lat={incident.location_lat} lng={incident.location_lng} label={incident.location} height={240} />
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
                {answers.map((a) => (
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
              {notes.map(n => {
                const isUserReply = n.content.startsWith('📩 USER REPLY:');
                const content = n.content.replace('📩 USER REPLY: ', '');

                if (isUserReply) {
                  return (
                    <div key={n.id} className="p-3 rounded-lg bg-green-50 border-2 border-green-300">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-200 text-green-700 font-bold">📩 User Reply — Info Received</span>
                      </div>
                      <div className="text-sm text-green-900 font-medium">{content}</div>
                      <div className="text-xs text-green-600 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  );
                }

                return (
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
                );
              })}
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
