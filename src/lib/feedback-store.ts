// Durable server-side store for app reviews (Report Issue submissions).
//
// Why a file: the admin page must show EVERY review from every browser, but
// demo-store's server copy lives only in process memory (lost on restart) and
// browser localStorage is invisible to the admin. Reviews are therefore
// appended to a JSON file under .data/ (gitignored) and reloaded on boot —
// nothing is ever deleted or regenerated.

import fs from 'fs';
import path from 'path';
import type { FeedbackRecord } from '@/lib/demo-store';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'app-reviews.json');

let cache: FeedbackRecord[] | null = null;

function load(): FeedbackRecord[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('[feedback-store] persist failed:', e);
  }
}

export const feedbackStore = {
  /** Newest first — what the admin page renders (created_at has ms precision). */
  getAll(): FeedbackRecord[] {
    return [...load()].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },

  has(feedbackId: string): boolean {
    return load().some(r => r.feedback_id === feedbackId);
  },

  /** Append a review; duplicate Feedback IDs are ignored (idempotent). */
  add(rec: FeedbackRecord): FeedbackRecord {
    const rows = load();
    if (!rows.some(r => r.feedback_id === rec.feedback_id)) {
      rows.push(rec);
      persist();
    }
    return rec;
  },
};
