'use client';
import Link from 'next/link';
import type { TemplateDTO } from '@poster/shared';
import { useT } from '@/lib/i18n';
import { useTilt } from '@/lib/use-tilt';

export function TemplateCard({ t: template }: { t: TemplateDTO }) {
  const t = useT();
  const tilt = useTilt<HTMLAnchorElement>();
  return (
    <Link href={`/create/${template.id}`} {...tilt}
      className="tilt card group relative block overflow-hidden focus-visible:outline-offset-4">
      <div className="relative overflow-hidden">
        <img src={template.thumbnailUrl} alt="" loading="lazy" decoding="async"
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
          {t.occasion[template.occasion]}
        </span>
        <span aria-hidden="true"
          className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-marigold text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 p-3.5">
        <p className="truncate font-display text-base font-semibold">{template.title}</p>
        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{t.common.photoCount(template.photoSlots)}</span>
      </div>
    </Link>
  );
}
