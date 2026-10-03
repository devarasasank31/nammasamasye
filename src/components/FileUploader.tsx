'use client';

import { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Video, X, Plus, AlertCircle, Loader2, UploadCloud } from 'lucide-react';
import {
  ACCEPT_ATTR, AttachmentMeta, formatSize,
  saveBlob, validateFile,
} from '@/lib/file-store';
import { compressImage, VIDEO_MAX_BYTES } from '@/lib/compress';
import { t } from '@/lib/translations';
import type { Language } from '@/types';

interface Props {
  attachments: AttachmentMeta[];
  onChange: (next: AttachmentMeta[]) => void;
  compact?: boolean;
  lang?: Language;
  onAddLink?: (url: string) => boolean;
}

export default function FileUploader({ attachments, onChange, compact, lang = 'en', onAddLink }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState('');
  const [oversize, setOversize] = useState<{ name: string; size: number } | null>(null);
  const [driveUrl, setDriveUrl] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const picked: AttachmentMeta[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      // Oversized videos are handled before the generic validator so the
      // citizen gets the Google Drive walkthrough instead of a dead end.
      const looksLikeVideo = (file.type || '').startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name || '');
      if (looksLikeVideo && file.size > VIDEO_MAX_BYTES) {
        setOversize({ name: file.name || 'video.mp4', size: file.size });
        continue;
      }
      const result = validateFile(file);
      if (!result.ok) {
        errors.push(result.error!);
        continue;
      }
      if (attachments.some(a => a.name === file.name && a.size === file.size)) {
        errors.push(`${file.name} is already attached.`);
        continue;
      }

      let stored = file;
      if (result.kind === 'image') {
        // Compress straight away — by the time the citizen sees the
        // thumbnail it is already at (or near) 200 KB.
        setBusy(true);
        setWorking(t('file.compressing', lang));
        const compressed = await compressImage(file);
        stored = compressed.file;
        setWorking('');
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setBusy(true);
      try {
        await saveBlob(id, stored);
        picked.push({
          id,
          name: stored.name || (result.kind === 'image' ? 'photo.jpg' : 'video.mp4'),
          kind: result.kind!,
          mime: stored.type || (result.kind === 'image' ? 'image/jpeg' : 'video/mp4'),
          size: stored.size,
          added_at: new Date().toISOString(),
        });
      } catch {
        errors.push(`Could not save ${stored.name}. Storage may be full.`);
      }
      setBusy(false);
      setWorking('');
    }

    if (picked.length) onChange([...attachments, ...picked]);
    setError(errors.slice(0, 2).join(' '));
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
    import('@/lib/file-store').then(m => m.deleteBlob(id));
  };

  const submitDriveLink = () => {
    if (!oversize) return;
    if (onAddLink && onAddLink(driveUrl)) {
      setDriveUrl('');
      setOversize(null);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {attachments.length > 0 && (
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-3'} gap-2`}>
          {attachments.map(a => (
            <div key={a.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <Thumb meta={a} />
              <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 flex items-center justify-between">
                <span className="text-[9px] text-white truncate max-w-[70%]">{a.name}</span>
                <span className="text-[9px] text-white/80">{formatSize(a.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition"
                aria-label={`Remove ${a.name}`}
              >
                <X size={11} />
              </button>
              <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                {a.kind === 'image' ? <ImageIcon size={11} /> : <Video size={11} />}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {working || 'Attach photo or video'}
        <span className="text-[10px] text-gray-400 font-normal">photos auto-compress · video ≤ 2 MB</span>
      </button>

      {oversize && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 space-y-2">
          <p className="flex items-start gap-1.5 text-xs font-bold text-orange-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              {oversize.name} — {formatSize(oversize.size)}
              <br />
              <span className="font-semibold">
                {t('file.too_large_title', lang).replace('{size}', formatSize(oversize.size))}
              </span>
            </span>
          </p>
          <p className="text-[11px] text-orange-700 leading-relaxed">{t('file.too_large_body', lang)}</p>
          <ol className="space-y-1 list-decimal list-inside text-[11px] text-orange-900 leading-relaxed">
            <li>{t('file.drive_step1', lang)}</li>
            <li>{t('file.drive_step2', lang)}</li>
            <li>{t('file.drive_step3', lang)}</li>
            <li>{t('file.drive_step4', lang)}</li>
          </ol>
          <div className="flex gap-2">
            <input
              type="url"
              value={driveUrl}
              onChange={e => setDriveUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitDriveLink(); } }}
              placeholder={t('file.drive_paste', lang)}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-orange-300 bg-white text-xs outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={submitDriveLink}
              disabled={!driveUrl.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition disabled:opacity-40"
            >
              <UploadCloud size={13} />
              {t('file.drive_add', lang)}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setOversize(null); setDriveUrl(''); }}
            className="text-[10px] text-orange-500 underline"
          >
            {t('file.dismiss', lang)}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function Thumb({ meta }: { meta: AttachmentMeta }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const { getAttachmentUrl } = await import('@/lib/file-store');
      const u = await getAttachmentUrl(meta.id);
      if (cancelled) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      objectUrl = u;
      setUrl(u);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [meta.id]);

  if (meta.kind === 'image') {
    return url && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={meta.name} className="w-full h-20 object-cover" onError={() => setFailed(true)} />
    ) : (
      <div className="w-full h-20 bg-gray-100 flex items-center justify-center text-gray-400">
        <ImageIcon size={18} />
      </div>
    );
  }

  return url ? (
    <video src={url} muted playsInline preload="metadata" className="w-full h-20 object-cover bg-black" />
  ) : (
    <div className="w-full h-20 bg-gray-100 flex items-center justify-center text-gray-400">
      <Video size={18} />
    </div>
  );
}
