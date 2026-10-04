'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';

const CONSENT_COOKIE = 'ns_cookie_consent';
const CONSENT_KEY = 'ns_cookie_consent';

function hasConsent(): boolean {
  if (typeof document !== 'undefined' && document.cookie.includes(`${CONSENT_COOKIE}=accepted`)) return true;
  try {
    return typeof window !== 'undefined' && !!window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return false;
  }
}

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. What Are Cookies',
    body: 'Cookies are small text files stored on your device when you browse our website. They help us remember preferences, maintain session state, and improve the overall experience.',
  },
  {
    heading: '2. Why We Use Cookies',
    body: 'We use cookies to keep your session active between visits, support secure administrator sign-in, and improve page performance. Some cookies are required for core website functions, while others are used for analytics and experience enhancement.',
  },
  {
    heading: '3. Types of Cookies We Use',
    body: 'Essential cookies are required for security, session continuity, and account login. Performance and analytics cookies help us understand traffic patterns and improve site features over time.',
  },
  {
    heading: '4. Managing Cookies',
    body: 'You can control or delete cookies using your browser settings, but disabling essential cookies may impact website functionality. By accepting our cookie notice, you consent to cookie usage as described in this policy.',
  },
  {
    heading: '5. Policy Changes',
    body: 'We may update this Cookie Policy periodically to reflect legal, technical, or operational changes. Any updates will be published on this page with the revised last updated date.',
  },
];

/**
 * Cookie notice shown on the first visit until the citizen accepts it.
 * The choice itself is remembered in a first-party cookie plus localStorage,
 * so the notice never flashes back on later visits.
 */
export default function CookieConsent() {
  const lang = useLanguage();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Decide after first paint so SSR and the client render the same tree.
    const init = async () => {
      await Promise.resolve();
      if (!hasConsent()) setVisible(true);
    };
    void init();
  }, []);

  const accept = () => {
    try {
      document.cookie = `${CONSENT_COOKIE}=accepted; max-age=31536000; path=/; same-site=lax`;
      window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      // Storage blocked — the in-memory state still hides it for this visit.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 px-3 pb-3 sm:pb-0" role="dialog" aria-modal="true" aria-label={t('cookie.title', lang)}>
      <div data-testid="cookie-consent" className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <Cookie size={18} className="text-amber-600" />
          <h2 className="font-bold text-gray-900 text-sm">{t('cookie.title', lang)}</h2>
        </div>

        <div className="px-5 pb-2 max-h-[55vh] overflow-y-auto">
          <div className={expanded ? '' : 'max-h-40 overflow-hidden relative after:absolute after:inset-x-0 after:bottom-0 after:h-10 after:bg-gradient-to after:from-white after:to-transparent'}>
            <div className="space-y-3 pb-1">
              {SECTIONS.map(s => (
                <div key={s.heading}>
                  <h3 className="text-xs font-semibold text-gray-900">{s.heading}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              {t('cookie.read_more', lang)}
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <button
            onClick={accept}
            data-testid="cookie-accept"
            className="w-full gradient-bg text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            {t('cookie.accept', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
