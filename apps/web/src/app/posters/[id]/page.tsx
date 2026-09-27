'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { SIZE_SPECS, type PdfPaper } from '@poster/shared';
import { useMe, usePoster, useRegenerate, useRemoveWatermark } from '@/lib/queries';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { StatusBadge } from '@/components/StatusBadge';
import { RegenerateForm } from '@/components/RegenerateForm';
import { errorMessage } from '@/lib/error-messages';
import { ApiError, apiDownload } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function PosterPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const poster = usePoster(id);
  const regen = useRegenerate(id);
  const unmark = useRemoveWatermark(id);
  const { data: me } = useMe({ optional: true });
  const [pdfBusy, setPdfBusy] = useState<PdfPaper | null>(null);
  const [pdfError, setPdfError] = useState<unknown>(null);
  const downloadPdf = async (paper: PdfPaper) => {
    setPdfBusy(paper);
    setPdfError(null);
    try { await apiDownload(`/posters/${id}/pdf?paper=${paper}`, `poster-${id}-${paper}.pdf`); }
    catch (err) { setPdfError(err); }
    finally { setPdfBusy(null); }
  };

  if (poster.isLoading) return <div className="skeleton mx-auto aspect-[3/4] max-w-md" />;
  if (poster.error) {
    const nf = poster.error instanceof ApiError && poster.error.status === 404;
    return <p role="alert" className="card p-4 text-rally">{nf ? t.posterDetail.notFound : errorMessage(poster.error)}</p>;
  }
  const p = poster.data!;
  const busy = p.status === 'queued' || p.status === 'generating';

  return (
    <section className="grid items-start gap-8 md:grid-cols-[1fr_360px]">
      <div className="flex flex-col items-center gap-5">
        <div className="flex w-full max-w-md flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{p.formData.headline}</h1>
          <StatusBadge status={p.status} />
        </div>
        {busy && (
          <div className="card relative flex w-full max-w-md flex-col items-center justify-center gap-4 overflow-hidden" aria-live="polite"
            style={{ aspectRatio: `${SIZE_SPECS[p.size].width} / ${SIZE_SPECS[p.size].height}` }}>
            <div className="skeleton absolute inset-0 rounded-none opacity-60" aria-hidden="true" />
            <div className="absolute inset-x-8 top-10 flex flex-col gap-3 opacity-70" aria-hidden="true">
              <div className="skeleton mx-auto h-28 w-28 rounded-full" /><div className="skeleton h-5 w-full" /><div className="skeleton mx-auto h-4 w-2/3" />
            </div>
            <div className="relative mt-32 flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-6 py-5 text-center">
              <div className="spinner" />
              <p className="max-w-[16rem] text-sm text-ink/70">{t.posterDetail.generatingMessage}</p>
            </div>
          </div>
        )}
        {p.status === 'completed' && p.imageUrl && (
          <>
            <a href={p.imageUrl} target="_blank" rel="noreferrer" className="pop group relative block w-full max-w-md">
              <img src={p.imageUrl} alt={p.formData.headline} className="w-full rounded-3xl shadow-[0_30px_60px_-25px_rgb(21_23_28/0.5)] ring-1 ring-line transition duration-500 group-hover:-translate-y-1" />
            </a>
            {p.downloadUrls && (
              <div className="flex flex-wrap justify-center gap-3">
                <a href={p.downloadUrls.png} download className="btn btn-primary px-5 py-3">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                  {t.posterDetail.downloadPng}
                </a>
                <a href={p.downloadUrls.jpg} download className="btn btn-ghost px-5 py-3">{t.posterDetail.downloadJpg}</a>
                {(['a4', 'a3'] as const).map((paper) => (
                  <button key={paper} type="button" className="btn btn-ghost px-5 py-3" disabled={pdfBusy !== null}
                    title={t.pdf.note} onClick={() => void downloadPdf(paper)}>
                    {pdfBusy === paper ? t.pdf.preparing : t.pdf[paper]}
                  </button>
                ))}
              </div>
            )}
            {pdfError !== null && <p role="alert" className="pop text-sm font-medium text-rally">{errorMessage(pdfError)}</p>}
            {p.watermarked && (
              <div className="w-full max-w-md">
                {me?.plan === 'free' ? (
                  <UpgradePrompt compact title={t.upgrade.watermarkTitle} body={t.upgrade.watermarkBody} cta={t.upgrade.cta} />
                ) : (
                  <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="text-sm text-ink/65">{t.upgrade.watermarkedNote}</p>
                    <button className="btn btn-primary px-4 py-2" disabled={unmark.isPending} onClick={() => unmark.mutate()}>
                      {unmark.isPending ? t.upgrade.removing : t.upgrade.removeWatermark}
                    </button>
                  </div>
                )}
                {unmark.error && <p role="alert" className="pop mt-2 text-sm font-medium text-rally">{errorMessage(unmark.error)}</p>}
              </div>
            )}
          </>
        )}
        {p.status === 'failed' && (
          <div role="alert" className="card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-rally/10 text-2xl text-rally" aria-hidden="true">!</span>
            <p className="text-ink/75">{t.posterDetail.failedMessage}</p>
            <button className="btn btn-danger px-5" disabled={regen.isPending} onClick={() => regen.mutate({})}>{t.posterDetail.retry}</button>
          </div>
        )}
        {regen.error && <p role="alert" className="pop text-sm font-medium text-rally">{errorMessage(regen.error)}</p>}
      </div>
      <aside className="flex flex-col gap-4 md:sticky md:top-24">
        {p.status === 'completed' && (
          <RegenerateForm key={p.id + p.regenerationsLeft} poster={p} pending={regen.isPending}
            onRegenerate={(patch) => regen.mutate({ formData: Object.keys(patch).length ? patch : undefined })} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/templates" className="btn btn-ghost text-sm">{t.posterDetail.createAnother}</Link>
          <Link href="/history" className="btn btn-ghost text-sm">{t.posterDetail.allPosters}</Link>
        </div>
      </aside>
    </section>
  );
}
