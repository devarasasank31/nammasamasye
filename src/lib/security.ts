import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_SESSION_COOKIE = 'ns_admin_auth';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

function adminSecret(): string {
  return process.env.ADMIN_PASSWORD || 'nammasamasye2024';
}

/** Constant-time string comparison so password checks do not leak timing. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still burn a comparison so the early exit costs roughly the same.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function sign(payload: string): string {
  return createHmac('sha256', adminSecret()).update(payload).digest('hex');
}

/**
 * Admin session token: `<expiry>.<hmac>`.
 * The cookie never carries the password itself, so a leaked cookie cannot be
 * replayed as the admin password and cannot be forged without the secret.
 */
export function createAdminSessionToken(now: number = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${sign(`admin.${exp}`)}`;
}

export function isValidAdminSessionToken(token?: string | null): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  if (!expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (exp * 1000 <= Date.now()) return false;
  return timingSafeStringEqual(sig, sign(`admin.${exp}`));
}

// --- In-memory sliding-window rate limiter -------------------------------
// Stateless per request, so it scales horizontally (each instance protects
// itself) and needs no paid service. Keyed by IP + bucket name.

type Bucket = number[];
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 20_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size >= MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || v[v.length - 1] < now - windowMs) buckets.delete(k);
      if (buckets.size < MAX_KEYS) break;
    }
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }

  while (bucket.length > 0 && bucket[0] < now - windowMs) bucket.shift();

  if (bucket.length >= limit) return false;
  bucket.push(now);
  return true;
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

// --- Per-user daily budgets -------------------------------------------------
// Shared AI keys have a finite daily token quota. Every citizen gets a small
// personal allowance so one heavy user cannot drain the pool for everyone.
// Counters reset at UTC midnight and live in memory (fine for a single
// server; each instance protects itself).

export const LIMITS = {
  /** Chatbot requests per IP. */
  chatPerMinute: 15,
  chatPerDay: 120,
  /** External AI calls per IP per day (soft — chatbot keeps working locally). */
  aiCallsPerDay: 30,
  /** Translation per IP. */
  translatePerMinute: 15,
  translatePerDay: 60,
  /** Post-report context summary per IP. */
  contextPerDay: 50,
  /** Incident submission per IP (spam guard). */
  incidentPerHour: 10,
  incidentPerDay: 30,
  /** Local classify / priority endpoints per IP. */
  classifyPerMinute: 20,
  classifyPerDay: 200,
};

const dailyCounters = new Map<string, { day: string; count: number }>();
const MAX_DAILY_KEYS = 50_000;

/** Returns true (and consumes one unit) if the key is still under `limit`
 *  for the current UTC day. */
export function dailyAllow(key: string, limit: number): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const entry = dailyCounters.get(key);

  if (!entry || entry.day !== day) {
    if (dailyCounters.size >= MAX_DAILY_KEYS) {
      for (const [k, v] of dailyCounters) {
        if (v.day !== day) dailyCounters.delete(k);
      }
    }
    dailyCounters.set(key, { day, count: 1 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
