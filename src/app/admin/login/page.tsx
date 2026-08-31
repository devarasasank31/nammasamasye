'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/dashboard';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = from;
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-blue-900 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            NS
          </div>
          <h1 className="text-2xl font-bold text-white">Namma Samasye</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Access Only</p>
        </div>

        <form onSubmit={handleLogin} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-blue-900 text-white font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            {loading ? 'Verifying...' : 'Access Admin Panel'}
          </button>

          <div className="text-center">
            <a href="/" className="text-gray-500 text-xs hover:text-gray-300 transition">
              ← Back to Namma Samasye
            </a>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
