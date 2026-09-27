'use client';
import type { PosterStatus } from '@poster/shared';
import { useT } from '@/lib/i18n';

const COLOR: Record<PosterStatus, string> = { queued: 'bg-amber-100 text-amber-900', generating: 'bg-sky-100 text-sky-900', completed: 'bg-brand-soft text-brand-strong', failed: 'bg-rally/10 text-rally' };
const DOT: Record<PosterStatus, string> = { queued: 'bg-amber-500', generating: 'bg-sky-500 animate-pulse', completed: 'bg-brand', failed: 'bg-rally' };

export function StatusBadge({ status }: { status: PosterStatus }) {
  const t = useT();
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR[status]}`}><span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden="true" />{t.statusBadge[status]}</span>;
}
