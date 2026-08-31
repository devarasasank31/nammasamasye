'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllIncidents } from '@/services/incident';
import { seedDemoData } from '@/lib/demo-store';
import { Users, FileText, Clock, Globe, LogOut, BarChart3, Shield } from 'lucide-react';

interface UserData {
  session_id: string;
  language: string;
  first_report: string;
  last_report: string;
  incidents: { id: string; incident_id: string; subcategory: string; status: string; created_at: string }[];
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    seedDemoData();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const incidents = await getAllIncidents();
    const userMap: Record<string, UserData> = {};

    incidents.forEach((inc: any) => {
      if (!userMap[inc.session_id]) {
        userMap[inc.session_id] = {
          session_id: inc.session_id,
          language: inc.language,
          first_report: inc.created_at,
          last_report: inc.created_at,
          incidents: [],
        };
      }
      userMap[inc.session_id].incidents.push({
        id: inc.id,
        incident_id: inc.incident_id,
        subcategory: inc.subcategory,
        status: inc.status,
        created_at: inc.created_at,
      });
      if (new Date(inc.created_at) < new Date(userMap[inc.session_id].first_report)) {
        userMap[inc.session_id].first_report = inc.created_at;
      }
      if (new Date(inc.created_at) > new Date(userMap[inc.session_id].last_report)) {
        userMap[inc.session_id].last_report = inc.created_at;
      }
    });

    setUsers(Object.values(userMap).sort((a, b) => b.incidents.length - a.incidents.length));
    setLoading(false);
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
              { icon: Users, label: 'Users / Sessions', href: '/admin/users' },
              { icon: Shield, label: 'Resources', href: '/admin/resources' },
              { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  item.href === '/admin/users' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
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
          <h1 className="text-xl font-bold text-gray-900">Users / Sessions ({users.length})</h1>
          <button onClick={handleLogout} className="lg:hidden text-gray-500 hover:text-red-500"><LogOut size={20} /></button>
        </header>

        <main className="p-6 max-w-6xl">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading users...</div>
          ) : selectedUser ? (
            <div className="space-y-6">
              <button onClick={() => setSelectedUser(null)} className="text-primary text-sm hover:underline">
                ← Back to all users
              </button>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">User Session Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium text-gray-500">Session ID:</span> <span className="font-mono text-gray-900">{selectedUser.session_id}</span></div>
                  <div><span className="font-medium text-gray-500">Language:</span> <span className="uppercase text-gray-900">{selectedUser.language}</span></div>
                  <div><span className="font-medium text-gray-500">Total Reports:</span> <span className="font-bold text-gray-900">{selectedUser.incidents.length}</span></div>
                  <div><span className="font-medium text-gray-500">First Seen:</span> <span className="text-gray-900">{new Date(selectedUser.first_report).toLocaleString()}</span></div>
                  <div><span className="font-medium text-gray-500">Last Active:</span> <span className="text-gray-900">{new Date(selectedUser.last_report).toLocaleString()}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Reports by This User ({selectedUser.incidents.length})</h3>
                <div className="space-y-3">
                  {selectedUser.incidents.map(inc => (
                    <div key={inc.id} onClick={() => router.push(`/admin/reports/${inc.id}`)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition cursor-pointer">
                      <div>
                        <div className="font-mono font-bold text-primary text-sm">{inc.incident_id}</div>
                        <div className="text-xs text-gray-500 capitalize">{inc.subcategory.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inc.status === 'PROCEEDING' ? 'bg-green-100 text-green-700' :
                          inc.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">{new Date(inc.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-primary">{users.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Users</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.incidents.length > 1).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Repeat Users</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {users.reduce((sum, u) => sum + u.incidents.length, 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Reports</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {[...new Set(users.map(u => u.language))].length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Languages</div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Session ID</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Language</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Reports</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">First Seen</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Last Active</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.session_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.session_id.slice(0, 16)}...</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs uppercase font-medium text-gray-700">
                              <Globe size={12} /> {u.language}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">{u.incidents.length}</span>
                            {u.incidents.length > 1 && (
                              <span className="ml-1 text-xs text-orange-500">repeat</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.first_report).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.last_report).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedUser(u)}
                              className="text-primary hover:underline text-xs font-medium">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Privacy Notice:</strong> User sessions are anonymous. No personal information (name, phone, email, Aadhaar) is collected or displayed. Session IDs are random identifiers not linked to any identity.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
