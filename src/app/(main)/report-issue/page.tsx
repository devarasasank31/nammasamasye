'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, CheckCircle2, Star } from 'lucide-react';
import { t } from '@/lib/translations';
import { useLanguage } from '@/hooks/useLanguage';
import { demoStore, FeedbackRecord } from '@/lib/demo-store';

// "Report Issue" = problems with this website/app itself (navbar).
// Civic complaints keep using the Report Now flow on the home page.

const ISSUE_TYPE_KEYS = [
  'fi.opt_page',
  'fi.opt_login',
  'fi.opt_search',
  'fi.opt_language',
  'fi.opt_performance',
  'fi.opt_broken',
  'fi.opt_other',
] as const;

const ISSUE_TYPE_IDS = ['page', 'login', 'search', 'language', 'performance', 'broken', 'other'] as const;

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

const SEVERITY_STYLE: Record<string, string> = {
  low: 'border-gray-200 text-gray-600',
  medium: 'border-yellow-300 text-yellow-700 bg-yellow-50',
  high: 'border-orange-300 text-orange-700 bg-orange-50',
  critical: 'border-red-300 text-red-700 bg-red-50',
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function ReportIssuePage() {
  const router = useRouter();
  const lang = useLanguage();

  const now = new Date();
  const [issueType, setIssueType] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [issueDate, setIssueDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  const [issueTime, setIssueTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [severity, setSeverity] = useState('');
  const [rating, setRating] = useState(0);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState('');

  const todayStr = issueDate; // already defaults to today; input max set below

  const reset = () => {
    setIssueType('');
    setWhatHappened('');
    setSeverity('');
    setRating(0);
    setError('');
    setFeedbackId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!issueType || whatHappened.trim().length < 5 || !issueDate || !issueTime || !severity || rating < 1) {
      setError(t('fi.required', lang));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: issueType,
          what_happened: whatHappened.trim(),
          issue_date: issueDate,
          issue_time: issueTime,
          severity,
          rating,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('fi.required', lang));
        return;
      }

      // Persist locally too (demo-store) so the record survives restarts
      // in this browser — same store pattern as incidents.
      const submitted = new Date();
      const record: FeedbackRecord = {
        feedback_id: data.feedback_id,
        submitted_date: `${submitted.getFullYear()}-${pad(submitted.getMonth() + 1)}-${pad(submitted.getDate())}`,
        submitted_time: `${pad(submitted.getHours())}:${pad(submitted.getMinutes())}:${pad(submitted.getSeconds())}`,
        issue_date: issueDate,
        issue_time: issueTime,
        issue_type: issueType,
        what_happened: whatHappened.trim(),
        severity,
        rating,
        status: 'New',
        created_at: submitted.toISOString(),
      };
      demoStore.addFeedback(record);

      setFeedbackId(data.feedback_id);
    } catch {
      setError('Could not save your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">{t('fi.title', lang)}</h1>
          <button
            onClick={() => router.push('/')}
            className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition"
          >
            <Home size={16} />
            <span className="text-xs font-medium">{t('nav.home', lang)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">{t('fi.subtitle', lang)}</p>

        {feedbackId ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <p className="font-medium text-gray-900">{t('fi.success', lang)}</p>
            <div className="inline-block px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">{t('fi.feedback_id', lang)}</div>
              <div className="font-mono font-semibold text-gray-900" data-testid="feedback-id">
                {feedbackId}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('fi.submit_another', lang)}
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium"
              >
                {t('nav.home', lang)}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
            {/* Q1 — issue type (dropdown) */}
            <div>
              <label htmlFor="fi-type" className="block text-sm font-medium text-gray-800 mb-1.5">
                1. {t('fi.q1', lang)}
              </label>
              <select
                id="fi-type"
                data-testid="fi-type"
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {ISSUE_TYPE_KEYS.map((k, i) => (
                  <option key={k} value={ISSUE_TYPE_IDS[i]}>
                    {t(k, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* Q2 — what happened */}
            <div>
              <label htmlFor="fi-text" className="block text-sm font-medium text-gray-800 mb-1.5">
                2. {t('fi.q2', lang)}
              </label>
              <textarea
                id="fi-text"
                data-testid="fi-text"
                value={whatHappened}
                onChange={e => setWhatHappened(e.target.value)}
                rows={4}
                maxLength={1000}
                className={inputCls}
              />
            </div>

            {/* Q3 — when */}
            <div>
              <span className="block text-sm font-medium text-gray-800 mb-1.5">3. {t('fi.q3', lang)}</span>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="fi-date" className="block text-xs text-gray-500 mb-1">
                    {t('fi.date', lang)}
                  </label>
                  <input
                    id="fi-date"
                    data-testid="fi-date"
                    type="date"
                    value={issueDate}
                    max={todayStr}
                    onChange={e => setIssueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="fi-time" className="block text-xs text-gray-500 mb-1">
                    {t('fi.time', lang)}
                  </label>
                  <input
                    id="fi-time"
                    data-testid="fi-time"
                    type="time"
                    value={issueTime}
                    onChange={e => setIssueTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Q4 — severity */}
            <div>
              <span className="block text-sm font-medium text-gray-800 mb-1.5">4. {t('fi.q4', lang)}</span>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITIES.map(s => (
                  <button
                    key={s}
                    type="button"
                    data-testid={`fi-sev-${s}`}
                    aria-pressed={severity === s}
                    onClick={() => setSeverity(s)}
                    className={`py-2 rounded-xl border text-sm font-medium transition ${
                      severity === s ? SEVERITY_STYLE[s] : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t(`fi.sev_${s}`, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5 — rating */}
            <div>
              <span className="block text-sm font-medium text-gray-800 mb-1.5">5. {t('fi.q5', lang)}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={t('fi.q5', lang)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n}/5`}
                    data-testid={`fi-star-${n}`}
                    onClick={() => setRating(n)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                  >
                    <Star
                      size={26}
                      className={n <= rating ? 'text-amber-400' : 'text-gray-300'}
                      fill={n <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600" data-testid="fi-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="fi-submit"
              className="w-full py-3 rounded-xl gradient-bg text-white font-medium disabled:opacity-60"
            >
              {submitting ? t('fi.submitting', lang) : t('fi.submit', lang)}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
