// Local file storage for photo/video evidence.
// Blobs live in IndexedDB (localStorage would blow the ~5MB quota);
// only metadata is kept on the incident record.

import type { AttachmentMeta } from '@/types';
export type { AttachmentMeta };

export const MAX_FILE_SIZE = 8 * 1024 * 1024;
export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'];
export const ACCEPTED_MIME = [...IMAGE_MIME, ...VIDEO_MIME];
export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/3gpp';

const DB_NAME = 'ns_evidence';
const STORE = 'files';
const dbVersion = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function kindForMime(mime: string): 'image' | 'video' | null {
  if (IMAGE_MIME.includes(mime)) return 'image';
  if (VIDEO_MIME.includes(mime)) return 'video';
  return null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  kind?: 'image' | 'video';
}

export function validateFile(file: File): ValidationResult {
  const kind = kindForMime(file.type);
  if (!kind) {
    const name = file.name || 'file';
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { ok: true, kind: 'image' };
    if (['mp4', 'webm', 'mov', 'm4v', '3gp'].includes(ext)) return { ok: true, kind: 'video' };
    return {
      ok: false,
      error: 'Unsupported format. Use JPG, PNG or WebP for photos; MP4 or WebM for video.',
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: `File is ${formatSize(file.size)} — maximum allowed is 8 MB.`,
    };
  }
  if (file.size === 0) return { ok: false, error: 'This file is empty.' };
  return { ok: true, kind };
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

export async function getBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as Blob) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  } catch {
    return null;
  }
}

export async function deleteBlob(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
}

export async function getAttachmentUrl(id: string): Promise<string | null> {
  const blob = await getBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
