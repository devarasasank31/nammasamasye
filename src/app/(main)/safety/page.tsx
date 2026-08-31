'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, ExternalLink } from 'lucide-react';

const emergencyResources = [
  { name: 'Police / Fire / Ambulance', number: '112', description: 'Immediate emergency response' },
  { name: 'Women Helpline', number: '181', description: '24x7 women safety helpline' },
  { name: 'Cyber Crime Helpline', number: '1930', description: 'Report cybercrime' },
  { name: 'Bangalore Traffic Police', number: '080-22943400', description: 'Traffic-related emergencies' },
  { name: 'Karnataka State Police', number: '100', description: 'General police assistance' },
];

export default function SafetyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">Safety & Emergency</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Emergency Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🚨</div>
          <h2 className="font-bold text-red-800 text-lg mb-2">In Immediate Danger?</h2>
          <p className="text-sm text-red-700 mb-4">Call emergency services immediately.</p>
          <a href="tel:112" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition">
            <Phone size={20} /> Call 112
          </a>
        </div>

        {/* Emergency Resources */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Emergency Resources</h2>
          <div className="space-y-3">
            {emergencyResources.map(r => (
              <a key={r.number} href={`tel:${r.number}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary hover:shadow-md transition">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">{r.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Important Notice</h2>
          <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
            <p>
              <strong>Namma Samasye is NOT an emergency-response service.</strong> We do not dispatch
              police, ambulances, or fire services.
            </p>
            <p>
              If you are in immediate danger, please call <strong>112</strong> directly.
            </p>
            <p>
              Namma Samasye helps you document and track incidents. It does not guarantee resolution
              or replace official channels.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
