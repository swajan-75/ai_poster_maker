'use client';
import { useState } from 'react';
import { OCCASIONS, type Occasion, type TemplateDTO } from '@poster/shared';
import { useTemplates } from '@/lib/queries';
import { TemplateCard } from '@/components/TemplateCard';
import { errorMessage } from '@/lib/error-messages';
import { formatNumber, useLocale, useT } from '@/lib/i18n';

const STACK = [
  { cls: 'left-[6%] top-[12%] z-10', r: '-9deg', delay: '0s' },
  { cls: 'left-[30%] top-0 z-20', r: '2deg', delay: '-2s' },
  { cls: 'left-[54%] top-[14%] z-10', r: '10deg', delay: '-4s' },
];
const FALLBACK_BG = ['from-brand to-brand-strong', 'from-rally to-[#9e1d23]', 'from-marigold to-[#c77a06]'];

function PosterStack({ templates }: { templates?: TemplateDTO[] }) {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[20rem] sm:max-w-md" aria-hidden="true">
      {STACK.map((s, i) => {
        const tpl = templates?.[i];
        return (
          <div key={i} className={`floaty absolute w-[40%] ${s.cls}`} style={{ animationDelay: s.delay, rotate: s.r }}>
            <div className="overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_24px_50px_-20px_rgb(21_23_28/0.45)] ring-1 ring-line">
              {tpl
                ? <img src={tpl.thumbnailUrl} alt="" className="aspect-[3/4] w-full rounded-xl object-cover" />
                : <div className={`flex aspect-[3/4] w-full flex-col justify-end gap-1.5 rounded-xl bg-gradient-to-br p-3 ${FALLBACK_BG[i]}`}>
                    <span className="h-2 w-3/4 rounded-full bg-white/80" /><span className="h-1.5 w-1/2 rounded-full bg-white/60" />
                  </div>}
            </div>
          </div>
        );
      })}
      <div className="pop absolute bottom-[6%] right-[4%] z-30 flex items-center gap-2 rounded-2xl bg-ink px-3 py-2 text-xs font-semibold text-white shadow-xl" style={{ animationDelay: '0.5s' }}>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-marigold text-ink">✦</span> AI
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const tr = useT();
  const [locale] = useLocale();
  const [occasion, setOccasion] = useState<Occasion | undefined>();
  const { data, isLoading, error, refetch } = useTemplates(occasion);
  const { data: all } = useTemplates(undefined);

  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-5">
          <span className="rise inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand ring-1 ring-line">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rally" />{tr.templatesPage.eyebrow}
          </span>
          <p className="rise font-display text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl" style={{ '--i': 1 } as React.CSSProperties}>
            {tr.templatesPage.heroA}<br /><span className="text-gradient">{tr.templatesPage.heroB}</span>
          </p>
          <p className="rise max-w-md text-lg text-ink/65" style={{ '--i': 2 } as React.CSSProperties}>{tr.templatesPage.heroSub}</p>
          <ol className="rise flex flex-wrap gap-2" style={{ '--i': 3 } as React.CSSProperties}>
            {tr.templatesPage.steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-medium ring-1 ring-line">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-bold text-white">{formatNumber(i + 1, locale)}</span>{s}
              </li>
            ))}
          </ol>
          <a href="#gallery" className="rise btn btn-primary w-fit px-6 py-3 text-base" style={{ '--i': 4 } as React.CSSProperties}>
            {tr.templatesPage.cta}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </a>
        </div>
        <PosterStack templates={all} />
      </section>

      <section id="gallery" className="flex scroll-mt-24 flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{tr.templatesPage.title}</h1>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={tr.occasion.all}>
            <button className="chip" aria-pressed={!occasion} onClick={() => setOccasion(undefined)}>{tr.occasion.all}</button>
            {OCCASIONS.map((o) => (
              <button key={o} className="chip" aria-pressed={occasion === o} onClick={() => setOccasion(o)}>{tr.occasion[o]}</button>
            ))}
          </div>
        </div>
        {isLoading && <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>}
        {error && <p role="alert" className="card flex items-center gap-3 p-4 text-rally">{errorMessage(error)} <button className="btn btn-ghost py-1.5" onClick={() => refetch()}>{tr.common.retry}</button></p>}
        {data && data.length === 0 && (
          <div className="card flex flex-col items-center gap-2 p-10 text-center text-ink/55">
            <span className="text-4xl" aria-hidden="true">🗂️</span>{tr.templatesPage.emptyForOccasion}
          </div>
        )}
        {data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {data.map((t, i) => <div key={t.id} className="rise" style={{ '--i': i } as React.CSSProperties}><TemplateCard t={t} /></div>)}
          </div>
        )}
      </section>
    </div>
  );
}
