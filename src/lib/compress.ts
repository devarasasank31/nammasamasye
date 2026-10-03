// Fast in-browser evidence compression. Photos are re-encoded to ~200 KB the
// moment the citizen picks them, so review is instant, storage stays tiny
// enough for free tiers, and 4G phones are not stuck uploading 8 MB files.

export const IMAGE_TARGET_BYTES = 200 * 1024;
export const VIDEO_MAX_BYTES = 2 * 1024 * 1024;

const MAX_DIMENSION = 1600;
const MIN_DIMENSION = 640;
const QUALITIES = [0.8, 0.65, 0.5, 0.4, 0.3, 0.2];
const MAX_ENCODE_ATTEMPTS = 12;

export interface CompressedImage {
  file: File;
  originalSize: number;
  compressed: boolean;
}

function jpgName(name: string): string {
  const base = (name || 'photo').replace(/\.[^.]+$/, '').trim() || 'photo';
  return `${base}.jpg`;
}

function toFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/**
 * Shrinks a photo so the stored file is at most `targetBytes` (200 KB).
 * Keeps the original untouched if it already fits, and always returns a
 * usable file — on any decode failure the original is passed through.
 */
export async function compressImage(file: File, targetBytes = IMAGE_TARGET_BYTES): Promise<CompressedImage> {
  const originalSize = file.size;
  if (originalSize <= targetBytes) return { file, originalSize, compressed: false };

  try {
    const bitmap = await createImageBitmap(file);
    const longSide = Math.max(bitmap.width, bitmap.height);
    const startScale = Math.min(1, MAX_DIMENSION / longSide);
    const minScale = Math.min(startScale, MIN_DIMENSION / longSide);
    let attempts = 0;
    let best: { blob: Blob; scale: number } | null = null;

    for (let scale = startScale; scale >= minScale * 0.999 && attempts < MAX_ENCODE_ATTEMPTS; scale *= 0.7) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of QUALITIES) {
        attempts++;
        const blob = await encode(canvas, quality);
        if (!blob) break;
        if (!best || blob.size < best.blob.size) best = { blob, scale };
        if (blob.size <= targetBytes) {
          bitmap.close?.();
          return {
            file: toFile(blob, jpgName(file.name)),
            originalSize,
            compressed: true,
          };
        }
        if (attempts >= MAX_ENCODE_ATTEMPTS) break;
      }
    }

    bitmap.close?.();
    if (best && best.blob.size < originalSize) {
      return {
        file: toFile(best.blob, jpgName(file.name)),
        originalSize,
        compressed: true,
      };
    }
  } catch {
    // Fall through — an undecodable image is attached as-is.
  }

  return { file, originalSize, compressed: false };
}
