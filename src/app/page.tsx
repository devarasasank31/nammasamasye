'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '@/types';
import { getStoredLanguage, setStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { Globe, ChevronRight, Menu, X, FileSearch, Sparkles, ArrowRight, Shield, Mic, Paperclip, TrendingUp, Sun, Moon } from 'lucide-react';

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const features = [
  { icon: Globe, title: 'Speak Your Language', desc: 'Kannada, English, Hindi, Telugu', color: '#e94560' },
  { icon: Shield, title: '100% Anonymous', desc: 'No login, no phone, no tracking', color: '#0f3460' },
  { icon: Mic, title: 'Voice + Text', desc: 'Talk or type naturally', color: '#1a936f' },
  { icon: Sparkles, title: 'AI-Powered', desc: 'Smart bot identifies your problem', color: '#f59e0b' },
  { icon: Paperclip, title: 'Evidence Support', desc: 'Attach photos, videos, docs', color: '#8b5cf6' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Real-time status updates', color: '#06b6d4' },
];

const categories = [
  { icon: '🚗', label: 'Traffic' },
  { icon: '🕳️', label: 'Potholes' },
  { icon: '🗑️', label: 'Garbage' },
  { icon: '💡', label: 'Streetlights' },
  { icon: '🚰', label: 'Drainage' },
  { icon: '💧', label: 'Water' },
  { icon: '👮', label: 'Police' },
  { icon: '💰', label: 'Bribes' },
  { icon: '🛡️', label: 'Safety' },
  { icon: '💻', label: 'Cybercrime' },
  { icon: '⚡', label: 'Power' },
  { icon: '📄', label: 'Govt Service' },
];

export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [showLangModal, setShowLangModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredLanguage();
    setLang(stored);
    const savedTheme = localStorage.getItem('ns_theme');
    setDarkMode(savedTheme ? savedTheme === 'dark' : true);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('ns_theme', newMode ? 'dark' : 'light');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const bg = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const navBg = darkMode ? 'bg-gray-950/80 border-white/10' : 'bg-white/80 border-gray-200';

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl ${navBg} border-b transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/30">NS</div>
            <span className="font-bold text-lg">Namma Samasye</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => setShowLangModal(true)} className="hover:text-primary flex items-center gap-1 transition">
              <Globe size={16} /> {languages.find(l => l.code === lang)?.native || 'English'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 transition">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/privacy" className="hover:text-primary transition">Privacy</a>
            <a href="/safety" className="hover:text-primary transition">Safety</a>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 transition">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${darkMode ? 'border-white/10 bg-gray-900/90' : 'border-gray-200 bg-white/90'} backdrop-blur-xl px-4 py-4 space-y-3`}>
            <button onClick={() => { setShowLangModal(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2">
              <Globe size={16} className="inline mr-2" />Language
            </button>
            <a href="/privacy" className="block py-2">Privacy</a>
            <a href="/safety" className="block py-2">Safety</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-white/10 border-white/20' : 'bg-gray-100 border-gray-200'} border text-sm mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Sparkles size={14} className="text-primary" />
              <span className={textSecondary}>Bengaluru&apos;s First AI-Powered Civic Platform</span>
            </div>

            <h1 className={`text-5xl md:text-7xl font-extrabold leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">Namma</span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">Samasye</span>
            </h1>

            <p className={`mt-4 text-xl md:text-2xl font-medium transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${textSecondary}`}>
              {t('app.tagline', lang)}
            </p>

            <p className={`mt-4 text-base md:text-lg max-w-xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${textSecondary}`}>
              {t('app.description', lang)}
            </p>

            <div className={`mt-8 flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <button
                onClick={() => { setStoredLanguage(lang); router.push('/report'); }}
                className="group gradient-bg text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 flex items-center justify-center gap-2"
              >
                {t('home.report_now', lang)}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => { setStoredLanguage(lang); router.push('/track'); }}
                className={`${darkMode ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} border px-8 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2`}
              >
                <FileSearch size={20} /> {t('home.track_now', lang)}
              </button>
            </div>

            <div className={`mt-8 flex flex-wrap gap-3 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    lang === l.code
                      ? 'gradient-bg text-white shadow-lg shadow-primary/30'
                      : `${darkMode ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} border`
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`relative z-10 py-16 ${darkMode ? 'border-white/10' : 'border-gray-200'} border-y`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '20+', label: 'Categories', icon: '📋' },
              { value: '4', label: 'Languages', icon: '🌍' },
              { value: '1000+', label: 'AI Scenarios', icon: '🤖' },
              { value: '24/7', label: 'Available', icon: '⚡' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">{stat.value}</div>
                <div className={`text-sm mt-1 ${textSecondary}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Why Namma Samasye?</h2>
            <p className={textSecondary}>Built for Bengaluru. Built for you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`group p-6 rounded-2xl ${cardBg} backdrop-blur-sm transition-all hover:scale-105 hover-lift`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}88)` }}>
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className={`text-sm ${textSecondary}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={`relative z-10 py-20 ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Report Anything</h2>
            <p className={textSecondary}>20+ categories — from potholes to cybercrime</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {categories.map((c, i) => (
              <button key={i} onClick={() => { setStoredLanguage(lang); router.push('/report'); }}
                className={`group flex flex-col items-center p-4 rounded-2xl ${cardBg} hover:scale-105 transition-all cursor-pointer`}>
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</span>
                <span className={`text-xs font-medium ${textSecondary}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className={`p-8 md:p-12 rounded-3xl ${darkMode ? 'bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 border border-white/10' : 'bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-gray-200'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to make a change?</h2>
            <p className={`mb-8 max-w-xl mx-auto ${textSecondary}`}>
              Your voice matters. Report an issue, track its progress, and help build a better Bengaluru.
            </p>
            <button
              onClick={() => { setStoredLanguage(lang); router.push('/report'); }}
              className="gradient-bg text-white px-10 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 inline-flex items-center gap-2"
            >
              Start Reporting <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 py-8 ${darkMode ? 'border-white/10' : 'border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
            <span className={textSecondary}>Namma Samasye</span>
          </div>
          <div className={`text-sm ${textSecondary}`}>Made for Bengaluru with ❤️</div>
        </div>
      </footer>

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLangModal(false)}>
          <div className={`${darkMode ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-200'} border rounded-2xl p-6 w-full max-w-sm`} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Choose Language</h3>
            <div className="space-y-2">
              {languages.map(l => (
                <button key={l.code} onClick={() => { handleLanguageChange(l.code); setShowLangModal(false); }}
                  className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between ${
                    lang === l.code ? 'gradient-bg text-white' : `${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`
                  }`}>
                  <span className="font-medium">{l.native}</span>
                  <span className="text-sm opacity-70">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
