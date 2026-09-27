'use client';
import { useId, useState } from 'react';

export interface BarDatum { key: string; label: string; value: number }

const W = 420;
const H = 190;
const PAD = { top: 14, right: 6, bottom: 28, left: 52 };
const GAP = 2; // surface gap between adjacent bars

/** Round the axis maximum up to a friendly number so the single gridline reads cleanly. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= v)!;
  return step * mag;
}

/** Bar with 4px rounded top corners anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Single-series vertical bar chart: brand fill, recessive axes, hover tooltip per bar,
 * and a table view so the numbers are readable without the graphic.
 */
export function BarChart({ title, subtitle, data, format, tableLabels }: {
  title: string;
  subtitle: string;
  data: BarDatum[];
  format: (n: number) => string;
  tableLabels: { show: string; date: string; value: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, slot - GAP * 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const tickIdx = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  const hovered = hover === null ? null : data[hover];

  return (
    <figure className="card flex flex-col gap-3 p-5" aria-labelledby={titleId}>
      <figcaption className="flex items-baseline justify-between gap-2">
        <span id={titleId} className="font-display text-base font-bold">{title}</span>
        <span className="text-xs text-ink/50">{subtitle}</span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby={titleId}
          onMouseLeave={() => setHover(null)}>
          {/* recessive gridline at max + baseline */}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top} y2={PAD.top} stroke="var(--line)" strokeDasharray="3 4" />
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--line)" />
          <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" className="fill-ink/55 text-[14px]">{format(max)}</text>
          <text x={PAD.left - 6} y={PAD.top + plotH + 4} textAnchor="end" className="fill-ink/55 text-[14px]">{format(0)}</text>
          {data.map((d, i) => {
            const x = PAD.left + i * slot + GAP;
            const top = y(d.value);
            return (
              <g key={d.key}>
                {d.value > 0 && (
                  <path d={barPath(x, top, barW, PAD.top + plotH - top)} fill="var(--brand)"
                    opacity={hover === null || hover === i ? 1 : 0.45} />
                )}
                {/* hit target: full column height, wider than the mark */}
                <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent"
                  onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                  tabIndex={0} aria-label={`${d.label}: ${format(d.value)}`} />
                {tickIdx.has(i) && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-ink/55 text-[14px]">{d.label}</text>
                )}
              </g>
            );
          })}
        </svg>
        {hovered && hover !== null && (
          <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`, top: `${(y(hovered.value) / H) * 100}%` }}>
            <span className="text-white/70">{hovered.label}</span> <span className="font-semibold">{format(hovered.value)}</span>
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-ink/55 hover:text-ink">{tableLabels.show}</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-ink/55"><tr><th className="py-1">{tableLabels.date}</th><th className="py-1 text-right">{tableLabels.value}</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-line"><td className="py-1">{d.label}</td><td className="py-1 text-right tabular-nums">{format(d.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranked horizontal bars (magnitude only, one hue) with the value printed as text beside each bar. */
export function BarList({ rows, format }: { rows: { key: string; label: React.ReactNode; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink/5">
            <div className="h-2 rounded-full bg-brand" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? 4 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
