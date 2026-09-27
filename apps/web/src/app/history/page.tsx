'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDeletePoster, useMyPosters } from '@/lib/queries';
import { PosterCard } from '@/components/PosterCard';
import { errorMessage } from '@/lib/error-messages';
import { formatNumber, useLocale, useT } from '@/lib/i18n';

export default function HistoryPage() {
  const t = useT();
  const [locale] = useLocale();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyPosters(page);
  const del = useDeletePoster();
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  useEffect(() => {
    if (data && page > pages) setPage(pages);
  }, [data, page, pages]);

  const pager = 'btn btn-ghost px-4 py-2';
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t.historyPage.title}</h1>
          {data && data.total > 0 && <p className="text-ink/55">{t.historyPage.count(data.total)}</p>}
        </div>
        {data && data.total > 0 && <Link href="/templates" className="btn btn-primary"><span aria-hidden="true">+</span>{t.posterDetail.createAnother}</Link>}
      </div>
      {isLoading && <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>}
      {error && <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>}
      {del.error && <p role="alert" className="pop text-rally">{errorMessage(del.error)}</p>}
      {data && data.items.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="floaty grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-3xl" aria-hidden="true">🖼️</span>
          <p className="text-ink/60">{t.historyPage.empty}</p>
          <Link href="/templates" className="btn btn-primary mt-1">{t.historyPage.createFirst}</Link>
        </div>
      )}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((p, i) => (
            <div key={p.id} className="rise" style={{ '--i': i } as React.CSSProperties}>
              <PosterCard poster={p} deleting={del.isPending && del.variables === p.id} onDelete={(id) => del.mutate(id)} />
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label={t.historyPage.pagination}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={pager}><span aria-hidden="true">←</span>{t.historyPage.prev}</button>
          <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">{formatNumber(page, locale)} / {formatNumber(pages, locale)}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className={pager}>{t.historyPage.next}<span aria-hidden="true">→</span></button>
        </nav>
      )}
    </section>
  );
}
