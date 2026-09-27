'use client';
import { LogoMark } from './Header';
import { useT } from '@/lib/i18n';

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-6 text-sm text-ink/55">
        <LogoMark className="h-6 w-6" />
        <span className="font-display font-semibold text-ink/80">{t.common.appName}</span>
        <span aria-hidden="true">·</span>
        <span>{t.footer.tagline}</span>
      </div>
    </footer>
  );
}
