'use client';
import { useId, useState } from 'react';
import type { UploadedPhotoDTO } from '@poster/shared';
import { uploadPhoto } from '@/lib/queries';
import { resizeImageFile } from '@/lib/resize-image';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

const defaultUpload = async (f: File) => uploadPhoto(await resizeImageFile(f));

export function PhotoUploader({ max, value, onChange, upload = defaultUpload }: {
  max: number; value: UploadedPhotoDTO[]; onChange: (v: UploadedPhotoDTO[] | ((prev: UploadedPhotoDTO[]) => UploadedPhotoDTO[])) => void; upload?: (f: File) => Promise<UploadedPhotoDTO>;
}) {
  const t = useT();
  const id = useId();
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const remaining = max - value.length - pending;

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const picked = Array.from(files).slice(0, Math.max(0, remaining));
    setPending((p) => p + picked.length);
    const results: UploadedPhotoDTO[] = [];
    for (const f of picked) {
      try { results.push(await upload(f)); }
      catch (e) { setError(errorMessage(e)); }
      finally { setPending((p) => p - 1); }
    }
    if (results.length) onChange((prev) => [...prev, ...results]);
  }

  const full = remaining <= 0;
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id}
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!full) void onFiles(e.dataTransfer.files); }}
        className={`group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition ${
          dragging ? 'scale-[1.01] border-brand bg-brand-soft' : 'border-ink/15 bg-white hover:border-brand/60 hover:bg-brand-soft/40'
        } ${full ? 'pointer-events-none opacity-50' : ''}`}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">{t.photoUploader.addPhotoLabel(value.length, max)}</span>
          <span className="text-xs text-ink/50">{t.photoUploader.dropHint}</span>
        </span>
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only"
        disabled={full} onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
      {(value.length > 0 || pending > 0) && (
        <div className="flex flex-wrap gap-3">
          {value.map((p, i) => (
            <div key={p.publicId} className="pop relative">
              <img src={p.url} alt={t.photoUploader.photoAlt(i + 1)} className={`h-32 w-24 rounded-xl object-cover shadow-md ${i === 0 ? 'ring-2 ring-marigold ring-offset-2' : ''}`} />
              {i === 0 && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-marigold px-2 py-0.5 text-[10px] font-bold text-ink">{t.photoUploader.primary}</span>}
              <button type="button" aria-label={t.photoUploader.removeAlt(i + 1)} onClick={() => onChange((prev) => prev.filter((x) => x.publicId !== p.publicId))}
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-white shadow-md transition hover:scale-110 hover:bg-rally">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
          ))}
          {pending > 0 && (
            <div role="status" aria-live="polite" className="contents">
              <span className="sr-only">{t.photoUploader.uploading}</span>
              {Array.from({ length: pending }, (_, i) => <div key={`p${i}`} className="skeleton h-32 w-24 rounded-xl" />)}
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-ink/50">{t.photoUploader.hint}</p>
      {error && <p role="alert" className="pop text-sm font-medium text-rally">{error}</p>}
    </div>
  );
}
