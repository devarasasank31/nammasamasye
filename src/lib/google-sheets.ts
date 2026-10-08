// Google Sheets sync for "Report Issue" feedback.
//
// Credentials live ONLY in .env.local as GOOGLE_SERVICE_ACCOUNT_JSON — either
// the raw JSON or base64 of it (what we store). This module never returns or
// logs the key material; it is imported by the API route only (server-side),
// never by client components.
//
// The sheet keeps ONE row per submission: before appending we read the
// Feedback ID column and skip anything already present, so retries and
// duplicate requests can never create a second row. Appends retry with
// backoff; if the sheet stays unreachable the row is queued in memory and
// flushed automatically on the next successful sync.

import { google, sheets_v4 } from 'googleapis';

const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || '10-cFJn6TY-2Sz8sx6xduiognqBj2BxnOhhz7fw9c92Y';
const SHEET_TAB = 'App Issues';
const HEADER = [
  'Feedback ID',
  'Submitted Date',
  'Submitted Time',
  'Issue Date',
  'Issue Time',
  'Issue Type',
  'What Happened',
  'Severity',
  'Rating',
  'Status',
];

export type SyncResult = 'appended' | 'duplicate' | 'unconfigured' | 'failed';

interface SheetCredentials {
  client_email: string;
  private_key: string;
}

function loadCredentials(): SheetCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const creds = JSON.parse(json);
    if (!creds.client_email || !creds.private_key) return null;
    return creds;
  } catch {
    return null;
  }
}

let sheetsClient: sheets_v4.Sheets | null = null;

async function getSheets(): Promise<sheets_v4.Sheets | null> {
  if (sheetsClient) return sheetsClient;
  const creds = loadCredentials();
  if (!creds) return null;
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  await auth.authorize();
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Retry with backoff — transient Google failures heal themselves. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(500 * 2 ** i); // 0.5s, 1s
    }
  }
  throw lastErr;
}

async function ensureTab(sheets: sheets_v4.Sheets): Promise<void> {
  try {
    await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, ranges: [`${SHEET_TAB}!A1`] });
  } catch {
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
      })
    );
  }
  // Header row once, when empty.
  const head = await withRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_TAB}!A1:J1` })
  );
  if (!head.data.values || head.data.values.length === 0) {
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_TAB}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADER] },
      })
    );
  }
}

async function existingIds(sheets: sheets_v4.Sheets): Promise<Set<string>> {
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_TAB}!A2:A` })
  );
  const ids = (res.data.values || []).map(r => String(r?.[0] ?? '').trim()).filter(Boolean);
  return new Set(ids);
}

// Rows that could not be written yet — flushed on the next sync attempt.
// Server process memory only; the record itself is already saved locally
// (demo-store) so nothing is ever lost, the sheet catch-up is best-effort.
let pendingRows: string[][] = [];
const MAX_PENDING = 50;

async function appendRows(sheets: sheets_v4.Sheets, rows: string[][]): Promise<void> {
  if (rows.length === 0) return;
  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    })
  );
}

/**
 * Write one feedback row to the "App Issues" tab.
 * Guarantees at most one row per Feedback ID.
 */
export async function appendFeedbackRow(row: string[]): Promise<SyncResult> {
  const sheets = await getSheets();
  if (!sheets) return 'unconfigured';

  try {
    await ensureTab(sheets);
    const seen = await existingIds(sheets);

    // Flush anything that failed earlier (skipping ids already written).
    if (pendingRows.length > 0) {
      const backlog = pendingRows.filter(r => !seen.has(r[0]));
      await appendRows(sheets, backlog);
      backlog.forEach(r => seen.add(r[0]));
      pendingRows = pendingRows.filter(r => seen.has(r[0]) === false && !backlog.includes(r));
    }

    if (seen.has(row[0])) return 'duplicate';
    await appendRows(sheets, [row]);
    return 'appended';
  } catch (e) {
    // Keep the row for a later automatic flush (cap the queue).
    if (!pendingRows.some(r => r[0] === row[0])) {
      pendingRows.push(row);
      if (pendingRows.length > MAX_PENDING) pendingRows.shift();
    }
    console.error('Sheets sync failed, queued for retry:', e instanceof Error ? e.message : e);
    return 'failed';
  }
}
