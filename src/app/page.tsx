'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '@/types';
import { getStoredLanguage, setStoredLanguage, getOrCreateSession } from '@/services/session';
import { seedDemoData } from '@/lib/demo-store';
import { t } from '@/lib/translations';
import { Shield, Globe, Mic, Paperclip, MapPin, ChevronRight, Menu, X } from 'lucide-react';

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const features = [
  { icon: Globe, title: 'Speak Your Language', desc: 'Kannada, English, Hindi, Telugu', color: '#e94560' },
  { icon: Shield, title: 'Stay Anonymous', desc: 'Your identity is never displayed', color: '#0f3460' },
  { icon: Mic, title: 'Voice + Text', desc: 'Talk or type your problem', color: '#1a936f' },
  { icon: Paperclip, title: 'Evidence Support', desc: 'Attach photos, videos, links', color: '#f59e0b' },
  { icon: MapPin, title: 'Location Aware', desc: 'Help us understand where', color: '#8b5cf6' },
];

export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [showLangModal, setShowLangModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    seedDemoData();
    const stored = getStoredLanguage();
    setLang(stored);
  }, []);

  const handleStart = async () => {
    setStoredLanguage(lang);
    await getOrCreateSession();
    router.push('/report');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm">NS</div>
            <span className="font-bold text-lg text-gray-900">Namma Samasye</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <button onClick={() => setShowLangModal(true)} className="hover:text-primary flex items-center gap-1">
              <Globe size={16} /> {languages.find(l => l.code === lang)?.native || 'English'}
            </button>
            <a href="/privacy" className="hover:text-primary">Privacy</a>
            <a href="/terms" className="hover:text-primary">Terms</a>
            <a href="/safety" className="hover:text-primary">Safety</a>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            <button onClick={() => { setShowLangModal(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700">Language</button>
            <a href="/privacy" className="block py-2 text-gray-700">Privacy</a>
            <a href="/terms" className="block py-2 text-gray-700">Terms</a>
            <a href="/safety" className="block py-2 text-gray-700">Safety</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-5" />
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Namma Samasye
            </h1>
            <p className="mt-2 text-xl md:text-2xl text-primary font-semibold">
              {t('app.tagline', lang)}
            </p>
            <p className="mt-1 text-lg md:text-xl text-gray-500" style={{ fontFamily: 'serif' }}>
              {t('app.tagline', 'kn')}
            </p>
            <p className="mt-4 text-base md:text-lg text-gray-600 max-w-xl">
              {t('app.description', lang)}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStart}
                className="gradient-bg text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {t('btn.start_anonymous', lang)} <ChevronRight size={20} />
              </button>
              <button
                onClick={() => router.push('/community')}
                className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
              >
                {t('btn.explore', lang)}
              </button>
            </div>

            {/* Language chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setStoredLanguage(l.code); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    lang === l.code
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">One place. Many problems.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition bg-gray-50">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.color + '15' }}>
                  <f.icon size={24} color={f.color} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Traffic, potholes, garbage, parking, safety, utilities and more.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: '🚗', label: 'Traffic / Accident' },
              { icon: '🕳️', label: 'Pothole' },
              { icon: '🗑️', label: 'Garbage' },
              { icon: '🅿️', label: 'Parking' },
              { icon: '💡', label: 'Streetlight' },
              { icon: '👮', label: 'Police Interaction' },
              { icon: '💰', label: 'Unofficial Payment' },
              { icon: '🛡️', label: 'Safety' },
              { icon: '💻', label: 'Cybercrime' },
              { icon: '🏠', label: 'Tenant Issue' },
              { icon: '🔊', label: 'Noise' },
              { icon: '⚡', label: 'Power Outage' },
            ].map((c, i) => (
              <div key={i} className="flex flex-col items-center p-4 rounded-xl bg-white border border-gray-100 hover:border-primary hover:shadow-md transition cursor-pointer" onClick={handleStart}>
                <span className="text-3xl mb-2">{c.icon}</span>
                <span className="text-xs text-center text-gray-600 font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> {t('disclaimer.main', lang)}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
            <span>Namma Samasye</span>
          </div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
            <a href="/safety" className="hover:text-white transition">Safety</a>
          </div>
          <span className="text-xs">Made for Bengaluru</span>
        </div>
      </footer>

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLangModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Select Language / ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ</h3>
            <div className="space-y-2">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setStoredLanguage(l.code); setShowLangModal(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition ${
                    lang === l.code ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {l.native} <span className="text-sm opacity-70">({l.label})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
