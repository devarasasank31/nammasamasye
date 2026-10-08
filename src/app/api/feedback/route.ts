import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { FeedbackRecord } from '@/lib/demo-store';
import { feedbackStore } from '@/lib/feedback-store';
import {
  rateLimit,
  clientIp,
  dailyAllow,
  isExemptIp,
  LIMITS,
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from '@/lib/security';
import { appendFeedbackRow } from '@/lib/google-sheets';

// App/website feedback — NOT civic incidents (those go through /api/incidents).
// Flow: validate → mint Feedback ID → save to the durable .data store (admin
// page reads it) → sync row to the user's Google Sheet "App Issues" tab
// (dedupe by Feedback ID, retry+queue) when credentials are configured.

const ISSUE_TYPES = ['page', 'login', 'search', 'language', 'performance', 'broken', 'other'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

const ISSUE_LABELS: Record<string, string> = {
  page: 'Page not loading',
  login: 'Login/account',
  search: 'Search & filters',
  language: 'Language & translation',
  performance: 'Slow performance',
  broken: 'Broken link/button',
  other: 'Other',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

interface FeedbackBody {
  issue_type?: string;
  what_happened?: string;
  issue_date?: string;
  issue_time?: string;
  severity?: string;
  rating?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export async function POST(req: NextRequest) {
  // Generous by design (user-set limits): local e2e suites share the
  // 'unknown' IP, real users file a handful a day.
  const ip = clientIp(req.headers);
  if (!isExemptIp(ip) &&
      (!rateLimit(`fb:${ip}`, LIMITS.feedbackPerHour, 60 * 60 * 1000) ||
       !dailyAllow(`fb_day:${ip}`, LIMITS.feedbackPerDay))) {
    return NextResponse.json(
      { error: 'Too many feedback submissions from this device. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body: FeedbackBody = await req.json();

    if (!body.issue_type || !ISSUE_TYPES.includes(body.issue_type as (typeof ISSUE_TYPES)[number])) {
      return NextResponse.json({ error: 'Choose an issue type.' }, { status: 400 });
    }
    const whatHappened = (body.what_happened || '').trim();
    if (whatHappened.length < 5 || whatHappened.length > 1000) {
      return NextResponse.json({ error: 'Tell us what happened (5–1000 characters).' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.issue_date || '')) {
      return NextResponse.json({ error: 'Choose the issue date.' }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(body.issue_time || '')) {
      return NextResponse.json({ error: 'Choose the issue time.' }, { status: 400 });
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    if (body.issue_date! > todayStr) {
      return NextResponse.json({ error: 'Issue date cannot be in the future.' }, { status: 400 });
    }
    if (!SEVERITIES.includes(body.severity as (typeof SEVERITIES)[number])) {
      return NextResponse.json({ error: 'Choose a severity.' }, { status: 400 });
    }
    if (!Number.isInteger(body.rating) || body.rating! < 1 || body.rating! > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const submittedDate = todayStr;
    const submittedTime = `${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
    const ymd = submittedDate.slice(2).replace(/-/g, '');

    // Feedback ID: FB-YYMMDD-XXXX (XXXX = 4 hex chars, collision-checked).
    let feedbackId = '';
    for (let i = 0; i < 5; i++) {
      feedbackId = `FB-${ymd}-${randomBytes(2).toString('hex').toUpperCase()}`;
      if (!feedbackStore.has(feedbackId)) break;
    }

    const record: FeedbackRecord = {
      feedback_id: feedbackId,
      submitted_date: submittedDate,
      submitted_time: submittedTime,
      issue_date: body.issue_date!,
      issue_time: body.issue_time!,
      issue_type: body.issue_type!,
      what_happened: whatHappened,
      severity: body.severity!,
      rating: body.rating!,
      status: 'New',
      created_at: new Date().toISOString(),
    };
    feedbackStore.add(record);

    const sheet = await appendFeedbackRow([
      record.feedback_id,
      record.submitted_date,
      record.submitted_time,
      record.issue_date,
      record.issue_time,
      ISSUE_LABELS[record.issue_type] || record.issue_type,
      record.what_happened,
      SEVERITY_LABELS[record.severity] || record.severity,
      String(record.rating),
      record.status,
    ]);

    return NextResponse.json({ feedback_id: record.feedback_id, sheet }, { status: 201 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    console.error('[feedback] failed:', err);
    return NextResponse.json(
      { error: 'Could not save your report. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Admin listing — every review from every browser (durable .data store).
 * The proxy does not guard /api/*, so the admin cookie is checked here.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  return NextResponse.json({ feedbacks: feedbackStore.getAll() });
}
