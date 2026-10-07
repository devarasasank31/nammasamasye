// ============================================================
// SCENARIO RETRIEVAL — server-only TF-IDF over the priority KB
// (data/priority-scenarios/train.jsonl, 86,910 labelled scenarios).
//
// The index is built lazily once per server process and cached on
// globalThis so dev HMR does not rebuild it. Used by /api/priority to
// hand the AI layer the closest historical scenarios (with their
// expected priority band) and to expose a scenarioMatch to the UI.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import type { PriorityLevel } from '../../types';
import type { RetrievalMatch } from './types';

interface RawDoc {
  id: string;
  text: string;
  category: string;
  subcategory: string;
  language: string;
  expectedPriority: PriorityLevel;
  archetype: string;
  explanation: string;
}

interface Index {
  docs: RawDoc[];
  /** term → [docIdx, tfidfWeight, docIdx, tfidfWeight, …] flat pairs */
  postings: Map<string, number[]>;
  /** term → idf */
  idf: Map<string, number>;
  /** docIdx → L2 norm of its tf-idf vector */
  norms: Float64Array;
  buildMs: number;
}

const TOKEN_RE = /[\p{L}\p{N}]+/gu;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN_RE) || [];
}

function tfMap(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
  return tf;
}

interface RetStore {
  index?: Index | null;
  indexPromise?: Promise<Index | null>;
}

function globalStore(): RetStore {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g.__nsPriorityRetrieval) g.__nsPriorityRetrieval = {};
  return g.__nsPriorityRetrieval as RetStore;
}

function kbPath(): string {
  return path.join(process.cwd(), 'data', 'priority-scenarios', 'train.jsonl');
}

async function buildIndex(): Promise<Index | null> {
  const started = Date.now();
  let raw: string;
  try {
    raw = await fs.promises.readFile(kbPath(), 'utf8');
  } catch (err) {
    console.warn('[priority-retrieval] KB not readable:', (err as Error).message);
    return null;
  }

  const docs: RawDoc[] = [];
  const df = new Map<string, number>();
  const tfs: Map<string, number>[] = [];

  for (const line of raw.split('\n')) {
    if (!line) continue;
    let row: {
      id?: string;
      input?: { text?: string; category?: string; subcategory?: string };
      category?: string;
      subcategory?: string;
      language?: string;
      expectedPriority?: string;
      archetype?: string;
      explanation?: string;
    };
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const text = row.input?.text;
    if (!text || !row.expectedPriority) continue;
    const tf = tfMap(tokenize(`${text} ${row.input?.subcategory || ''}`));
    tfs.push(tf);
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
    docs.push({
      id: row.id || `doc-${docs.length}`,
      text,
      category: row.category || row.input?.category || '',
      subcategory: row.subcategory || row.input?.subcategory || '',
      language: row.language || 'en',
      expectedPriority: row.expectedPriority as PriorityLevel,
      archetype: row.archetype || '',
      explanation: row.explanation || '',
    });
  }

  const n = docs.length;
  if (n === 0) return null;

  // idf with smoothing; drop terms in >40% of docs (stopword-like places)
  const idf = new Map<string, number>();
  const postings = new Map<string, number[]>();
  const norms = new Float64Array(n);

  for (const [term, d] of df) {
    if (d > n * 0.4) continue;
    idf.set(term, Math.log((n + 1) / (d + 1)) + 1);
  }

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const [term, freq] of tfs[i]) {
      const w = idf.get(term);
      if (w === undefined) continue;
      const weight = (1 + Math.log(freq)) * w;
      sum += weight * weight;
      const p = postings.get(term);
      if (p) p.push(i, weight);
      else postings.set(term, [i, weight]);
    }
    norms[i] = Math.sqrt(sum) || 1;
  }

  // postings map directly holds [docIdx, weight] pairs for cosine scoring
  const index: Index = {
    docs,
    postings,
    idf,
    norms,
    buildMs: Date.now() - started,
  };

  console.log(`[priority-retrieval] built ${n} docs, ${idf.size} terms in ${index.buildMs}ms`);
  return index;
}

function getIndex(): Promise<Index | null> {
  const store = globalStore();
  if (!store.indexPromise) {
    store.indexPromise = buildIndex()
      .then(idx => {
        store.index = idx;
        return idx;
      })
      .catch(() => null);
  }
  return store.indexPromise;
}

export interface RetrievalHit extends RetrievalMatch {
  text: string;
  subcategory: string;
  archetype: string;
  language: string;
}

export interface SearchResult {
  matched: boolean;
  top: RetrievalHit[];
  agreement: number;
  bestPriority: PriorityLevel | null;
  bestScore: number;
  buildMs?: number;
}

/** Top-k cosine neighbours of `query` in the scenario KB. Never throws. */
export async function searchScenarios(query: string, k = 3): Promise<SearchResult> {
  const empty: SearchResult = { matched: false, top: [], agreement: 0, bestPriority: null, bestScore: 0 };
  const q = (query || '').trim();
  if (q.length < 4) return empty;
  try {
    const index = await getIndex();
    if (!index) return empty;

    const qtf = tfMap(tokenize(q));
    const scores = new Map<number, number>();
    let qNormSq = 0;
    for (const [term, freq] of qtf) {
      const w = index.idf.get(term);
      if (w === undefined) continue;
      const qWeight = (1 + Math.log(freq)) * w;
      qNormSq += qWeight * qWeight;
      const pairs = index.postings.get(term);
      if (!pairs) continue;
      for (let p = 0; p < pairs.length; p += 2) {
        const d = pairs[p];
        scores.set(d, (scores.get(d) || 0) + qWeight * pairs[p + 1]);
      }
    }
    // cosine: divide by BOTH query and document norms → similarity in 0..1
    const qNorm = Math.sqrt(qNormSq) || 1;

    const ranked = [...scores.entries()]
      .map(([d, s]) => ({ d, s: s / (qNorm * index.norms[d]) }))
      .filter(x => x.s > 0.05)
      .sort((a, b) => b.s - a.s)
      .slice(0, Math.max(1, k));

    if (ranked.length === 0) return empty;

    const top: RetrievalHit[] = ranked.map(({ d, s }) => {
      const doc = index.docs[d];
      return {
        id: doc.id,
        expectedPriority: doc.expectedPriority,
        score: Number(s.toFixed(4)),
        category: doc.category,
        explanation: doc.explanation || undefined,
        text: doc.text,
        subcategory: doc.subcategory,
        archetype: doc.archetype,
        language: doc.language,
      };
    });

    const counts = new Map<PriorityLevel, number>();
    let best: PriorityLevel = top[0].expectedPriority;
    let bestScore = 0;
    let weightSum = 0;
    for (const hit of top) {
      counts.set(hit.expectedPriority, (counts.get(hit.expectedPriority) || 0) + hit.score);
      weightSum += hit.score;
      if (hit.score > bestScore) {
        bestScore = hit.score;
        best = hit.expectedPriority;
      }
    }
    let agreement = 0;
    for (const w of counts.values()) agreement = Math.max(agreement, w);
    agreement = weightSum > 0 ? Number((agreement / weightSum).toFixed(4)) : 0;

    return { matched: true, top, agreement, bestPriority: best, bestScore: Number(bestScore.toFixed(4)), buildMs: index.buildMs };
  } catch (err) {
    console.warn('[priority-retrieval] search failed:', (err as Error).message);
    return empty;
  }
}
