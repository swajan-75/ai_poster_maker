'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CrownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 18H5L3 7.5Zm2 12.5h14v1.5H5V20Z" />
    </svg>
  );
}

/** Explains why a feature is locked and links to the pricing page, returning here after payment. */
export function UpgradePrompt({ title, body, cta, compact = false }: { title: string; body: string; cta: string; compact?: boolean }) {
  const next = usePathname();
  return (
    <div role="status" className={`pop card flex flex-col gap-3 border-l-4 border-marigold ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marigold/20 text-[#b36f00]"><CrownIcon /></span>
        <p className="font-display text-lg font-bold">{title}</p>
      </div>
      <p className="text-sm text-ink/70">{body}</p>
      <Link href={`/pricing?next=${encodeURIComponent(next)}`} className="btn btn-primary w-fit px-5 py-2.5">{cta}</Link>
    </div>
  );
}
