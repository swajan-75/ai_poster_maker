'use client';
import Link from 'next/link';
import type { PosterDTO } from '@poster/shared';
import { StatusBadge } from './StatusBadge';
import { formatDate, useLocale, useT } from '@/lib/i18n';

export function PosterCard({ poster: p, onDelete, deleting }: { poster: PosterDTO; onDelete: (id: string) => void; deleting: boolean }) {
  const t = useT();
  const [locale] = useLocale();
  return (
    <article className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--line),0_24px_40px_-24px_rgb(21_23_28/0.4)]">
      <Link href={`/posters/${p.id}`} className="block">
        <div className="relative overflow-hidden">
          {p.imageUrl
            // Grid cells stay 3:4; other sizes are shown whole (contain) rather than cropped.
            ? <img src={p.imageUrl} alt="" className={`aspect-[3/4] w-full transition-transform duration-700 group-hover:scale-[1.05] ${p.size === 'portrait' ? 'object-cover' : 'bg-ink/5 object-contain'}`} loading="lazy" decoding="async" />
            : <div className={`flex aspect-[3/4] items-center justify-center ${p.status === 'failed' || p.status === 'rejected' ? 'bg-rally/5' : p.status === 'pending_review' ? 'bg-violet-50' : 'skeleton rounded-none'}`}><StatusBadge status={p.status} /></div>}
          {p.imageUrl && <span className="absolute left-2.5 top-2.5"><StatusBadge status={p.status} /></span>}
        </div>
        <div className="p-3.5">
          <p className="truncate font-display font-semibold">{p.formData.headline}</p>
          <p className="truncate text-xs text-ink/50">{p.formData.name} · {formatDate(new Date(p.createdAt), locale)}</p>
        </div>
      </Link>
      <div className="mt-auto flex items-center gap-2 px-3 pb-3 text-sm">
        {p.downloadUrls && (
          <a href={p.downloadUrls.png} download className="btn btn-primary flex-1 px-3 py-2 text-xs">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
            {t.posterCard.download}
          </a>
        )}
        <button className={`btn btn-ghost px-3 py-2 text-xs text-rally hover:!bg-rally/10 ${p.downloadUrls ? '' : 'ml-auto'}`} disabled={deleting}
          onClick={() => { if (window.confirm(t.posterCard.confirmDelete)) onDelete(p.id); }}>{t.posterCard.delete}</button>
      </div>
    </article>
  );
}
