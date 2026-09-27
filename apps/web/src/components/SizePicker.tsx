'use client';
import { POSTER_SIZES, SIZE_SPECS, outputPixels, type PosterSize } from '@poster/shared';
import { formatNumber, useLocale, useT } from '@/lib/i18n';

/** Shape of the size, drawn to scale inside a fixed box. */
function Shape({ size }: { size: PosterSize }) {
  const { width, height } = SIZE_SPECS[size];
  const k = 30 / Math.max(width, height);
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center" aria-hidden="true">
      <span className="rounded-[3px] border-2 border-current" style={{ width: width * k, height: height * k }} />
    </span>
  );
}

export function SizePicker({ value, onChange }: { value: PosterSize; onChange: (s: PosterSize) => void }) {
  const t = useT();
  const [locale] = useLocale();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink/80">{t.sizes.label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
        {POSTER_SIZES.map((s) => {
          const px = outputPixels(s);
          const active = s === value;
          return (
            <label key={s}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl p-2.5 ring-1 transition ${active ? 'bg-brand-soft text-brand ring-2 ring-brand' : 'bg-white text-ink/70 ring-line hover:ring-ink/30'}`}>
              <input type="radio" name="poster-size" value={s} checked={active} onChange={() => onChange(s)} className="sr-only" />
              <Shape size={s} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-sm font-semibold">{t.sizes[s].name}</span>
                <span className="truncate text-[11px] opacity-70">{t.sizes[s].use}</span>
                <span className="text-[11px] tabular-nums opacity-60">{formatNumber(px.width, locale)}×{formatNumber(px.height, locale)}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-ink/50">{t.sizes.hint}</p>
    </fieldset>
  );
}
