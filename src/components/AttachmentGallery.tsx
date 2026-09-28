'use client';

import { useState, useEffect } from 'react';
import { Paperclip, X, Image as ImageIcon, Video, Loader2, Download } from 'lucide-react';
import { AttachmentMeta, formatSize, getAttachmentUrl } from '@/lib/file-store';

interface Props {
  attachments?: AttachmentMeta[] | null;
}

export default function AttachmentGallery({ attachments }: Props) {
  const list = attachments || [];
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (list.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Paperclip size={14} className="text-primary" />
        Photos & videos ({list.length})
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {list.map(a => (
          <GalleryItem key={a.id} meta={a} onOpen={() => setLightbox(a.id)} />
        ))}
      </div>

      {lightbox && (
        <Lightbox
          meta={list.find(a => a.id === lightbox)!}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function GalleryItem({ meta, onOpen }: { meta: AttachmentMeta; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const u = await getAttachmentUrl(meta.id);
      if (cancelled) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      objUrl = u;
      setUrl(u);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [meta.id]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 hover:border-primary transition"
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center text-gray-300">
          <Loader2 size={16} className="animate-spin" />
        </span>
      ) : url && !failed ? (
        meta.kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={meta.name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
            onError={() => setFailed(true)}
          />
        ) : (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover bg-black"
          />
        )
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1">
          {meta.kind === 'image' ? <ImageIcon size={18} /> : <Video size={18} />}
          <span className="text-[9px]">Unavailable</span>
        </span>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white px-1 py-0.5 text-left truncate">
        {formatSize(meta.size)}
      </span>
      {meta.kind === 'video' && !loading && url && (
        <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center">
          <Video size={11} />
        </span>
      )}
    </button>
  );
}

function Lightbox({ meta, onClose }: { meta: AttachmentMeta; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const u = await getAttachmentUrl(meta.id);
      if (cancelled) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      objUrl = u;
      setUrl(u);
    })();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [meta.id, onClose]);

  if (!meta) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition" aria-label="Close">
        <X size={20} />
      </button>
      <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        {url && !failed ? (
          meta.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={meta.name} className="max-h-[75vh] w-auto object-contain rounded-lg" onError={() => setFailed(true)} />
          ) : (
            <video src={url} controls playsInline className="max-h-[75vh] w-auto rounded-lg bg-black" />
          )
        ) : (
          <div className="text-white/70 text-center py-16">
            <p className="mb-2">This file is not available on this device.</p>
            <p className="text-xs text-white/50">Evidence is stored locally in your browser.</p>
          </div>
        )}
        <div className="flex items-center gap-3 text-white/70 text-xs">
          <span className="flex items-center gap-1">
            {meta.kind === 'image' ? <ImageIcon size={12} /> : <Video size={12} />}
            {meta.name}
          </span>
          <span>{formatSize(meta.size)}</span>
          {url && (
            <a href={url} download={meta.name} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Download size={12} /> Save
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
