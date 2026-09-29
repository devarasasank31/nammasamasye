'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '@/types';
import { getStoredLanguage, setStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { heritage } from '@/lib/heritage';
import LandingBackground from '@/components/LandingBackground';
import { Globe, Menu, X, FileSearch, Sparkles, ArrowRight, Shield, Mic, Paperclip, TrendingUp, Sun, Moon, Monitor } from 'lucide-react';

type ThemePref = 'system' | 'dark' | 'light';

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const features = [
  { icon: Globe, title: 'Speak Your Language', desc: 'Kannada, English, Hindi, Telugu', color: '#e41e20', dark: false },
  { icon: Shield, title: '100% Anonymous', desc: 'No login, no phone, no tracking', color: '#ffce00', dark: true },
  { icon: Mic, title: 'Voice + Text', desc: 'Talk or type naturally', color: '#1a936f', dark: false },
  { icon: Sparkles, title: 'AI-Powered', desc: 'Smart bot identifies your problem', color: '#e41e20', dark: false },
  { icon: Paperclip, title: 'Evidence Support', desc: 'Attach photos, videos, docs', color: '#8b5cf6', dark: false },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Real-time status updates', color: '#ffce00', dark: true },
];

const categories = [
  { icon: '🚗', label: 'Traffic' },
  { icon: '🕳️', label: 'Potholes' },
  { icon: '🗑️', label: 'Garbage' },
  { icon: '💡', label: 'Streetlights' },
  { icon: '🚰', label: 'Drainage' },
  { icon: '💧', label: 'Water' },
  { icon: '👮', label: 'Police' },
  { icon: '🚨', label: 'Civic Sense' },
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
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [systemDark, setSystemDark] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Defer hydration-dependent state to a microtask so React finishes
      // its initial effect flush before we read localStorage.
      await Promise.resolve();
      setMounted(true);
      setLang(getStoredLanguage());
    };
    void init();

    // Follow the operating system unless this visitor picked dark or light
    // themselves — and keep following the OS if they change it later.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const saved = localStorage.getItem('ns_theme');
      const pref: ThemePref = saved === 'dark' || saved === 'light' ? saved : 'system';
      setThemePref(pref);
      setSystemDark(media.matches);
      setDarkMode(pref === 'system' ? media.matches : pref === 'dark');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const toggleTheme = () => {
    // system -> the opposite of what is on screen (always a visible change)
    // -> the other one -> back to system.
    const next: ThemePref = themePref === 'system'
      ? (darkMode ? 'light' : 'dark')
      : themePref === 'dark' ? 'light' : 'system';
    setThemePref(next);
    setDarkMode(next === 'system' ? systemDark : next === 'dark');
    localStorage.setItem('ns_theme', next);
  };

  const themeLabel = themePref === 'system'
    ? `Theme: system (${systemDark ? 'dark' : 'light'}) — click to set ${systemDark ? 'light' : 'dark'}`
    : `Theme: ${themePref} — click for ${themePref === 'dark' ? 'light' : 'system default'}`;
  const themeIcon = themePref === 'system' ? <Monitor size={18} /> : darkMode ? <Sun size={18} /> : <Moon size={18} />;

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
    <div className={`landing-ka min-h-screen ${bg} ${text} transition-colors duration-300`}>
      {/* Scroll-driven backdrop: Badami to Bengaluru */}
      <LandingBackground darkMode={darkMode} />

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl ${navBg} border-b transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl ka-gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#e41e20]/30">NS</div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">ನಮ್ಮ ಸಮಸ್ಯೆ</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60 leading-tight">Namma Samasye</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => setShowLangModal(true)} className="hover:text-primary flex items-center gap-1 transition">
              <Globe size={16} /> {languages.find(l => l.code === lang)?.native || 'English'}
            </button>
            <button onClick={toggleTheme} title={themeLabel} aria-label={themeLabel} className="p-2 rounded-lg hover:bg-white/10 transition">
              {themeIcon}
            </button>
            <a href="/privacy" className="hover:text-primary transition">Privacy</a>
            <a href="/safety" className="hover:text-primary transition">Safety</a>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme} title={themeLabel} aria-label={themeLabel} className="p-2 rounded-lg hover:bg-white/10 transition">
              {themeIcon}
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
      <section className="relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-3xl">
            <h1 className={`text-5xl md:text-7xl font-extrabold leading-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="ka-text-gradient bg-clip-text text-transparent">Namma</span>
              <br />
              <span className="ka-text-gradient-reverse bg-clip-text text-transparent">Samasye</span>
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
                className="group ka-gradient-bg text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-[#e41e20]/30 hover:shadow-xl hover:shadow-[#e41e20]/40 flex items-center justify-center gap-2"
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
                      ? 'ka-gradient-bg text-white shadow-lg shadow-[#e41e20]/30'
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
                  <f.icon size={24} className={f.dark ? 'text-gray-900' : 'text-white'} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className={`text-sm ${textSecondary}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={`relative z-10 py-20 ${darkMode ? 'bg-white/5' : 'bg-white/45'}`}>
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

      {/* Heritage */}
      <section className={`relative z-10 py-20 ${darkMode ? 'bg-white/5' : 'bg-white/45'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">From Badami to Bengaluru</h2>
            <p className="text-lg font-semibold text-[#e41e20]">ಬಾದಾಮಿಯಿಂದ ಬೆಂಗಳೂರಿನವರೆಗೆ</p>
            <p className={`mt-2 ${textSecondary}`}>Seven stops that made the state this city stands in.</p>
          </div>
          <ol className="relative">
            <span className="ka-timeline-rail absolute left-[11px] top-3 bottom-3 w-0.5 rounded-full" aria-hidden="true" />
            {heritage.map((h, i) => (
              <li
                key={h.title}
                className={`relative pl-10 pb-8 last:pb-0 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className="ka-timeline-dot absolute left-0 top-1.5 w-6 h-6 rounded-full" aria-hidden="true" />
                <div className={`p-5 rounded-2xl ${cardBg} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e41e20] text-white text-[11px] font-bold uppercase tracking-wider">{h.era}</span>
                    <h3 className="font-bold text-lg">{h.title}</h3>
                    <span className={`text-sm ${textSecondary}`}>{h.native}</span>
                  </div>
                  <p className={`text-sm mt-2 ${textSecondary}`}>{h.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className={`p-8 md:p-12 rounded-3xl ka-cta-bg ${darkMode ? 'border border-white/10' : 'border border-gray-200'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to make a change?</h2>
            <p className={`mb-8 max-w-xl mx-auto ${textSecondary}`}>
              Your voice matters. Report an issue, track its progress, and help build a better Bengaluru.
            </p>
            <button
              onClick={() => { setStoredLanguage(lang); router.push('/report'); }}
              className="ka-gradient-bg text-white px-10 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-[#e41e20]/30 hover:shadow-xl hover:shadow-[#e41e20]/40 inline-flex items-center gap-2"
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
            <div className="w-7 h-7 rounded-lg ka-gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
            <div className="flex flex-col">
              <span className={`font-bold leading-tight ${textSecondary}`}>ನಮ್ಮ ಸಮಸ್ಯೆ</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60 leading-tight">Namma Samasye</span>
            </div>
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
                    lang === l.code ? 'ka-gradient-bg text-white' : `${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`
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
