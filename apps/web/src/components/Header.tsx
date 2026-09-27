'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLogout, useMe } from '@/lib/queries';
import { useLocale, useT } from '@/lib/i18n';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#15a466" />
          <stop offset="1" stopColor="#0a5e39" />
        </linearGradient>
      </defs>
      <rect x="4" y="2" width="28" height="36" rx="7" fill="url(#lm)" transform="rotate(-8 18 20)" />
      <rect x="9" y="4" width="26" height="33" rx="6" fill="#fff" stroke="#15171c" strokeOpacity=".1" />
      <circle cx="22" cy="15" r="5.5" fill="#e2383f" />
      <rect x="13" y="25" width="18" height="3" rx="1.5" fill="#15171c" />
      <rect x="15" y="30" width="14" height="2.4" rx="1.2" fill="#f4a524" />
    </svg>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={`relative rounded-full px-3 py-1.5 transition ${active ? 'bg-ink text-white' : 'text-ink/65 hover:bg-ink/5 hover:text-ink'}`}>
      {children}
    </Link>
  );
}

export function Header() {
  const { data: user, isPending } = useMe({ optional: true });
  const logout = useLogout();
  const router = useRouter();
  const t = useT();
  const [locale, setLocale] = useLocale();
  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <nav className="glass mx-auto flex max-w-6xl items-center gap-2 rounded-full py-1.5 pl-2 pr-2 text-sm sm:gap-4 sm:pl-3">
        <Link href="/templates" className="group flex items-center gap-2 pr-1">
          <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
          <span className="hidden font-display text-lg font-extrabold tracking-tight sm:inline">{t.common.appName}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLink href="/templates">{t.common.templates}</NavLink>
          {user && <NavLink href="/history">{t.common.myPosters}</NavLink>}
          {user?.role === 'admin' && <NavLink href="/admin">{t.common.admin}</NavLink>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={`Switch to ${t.common.switchToLabel}`}
            className="btn btn-ghost px-3 py-1.5 text-xs"
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
            {t.common.switchToLabel}
          </button>
          {isPending ? (
            <div className="skeleton h-8 w-20 rounded-full" aria-hidden="true" />
          ) : user ? (
            <>
              <span className="hidden items-center gap-2 text-ink/70 md:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft font-bold text-brand" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
                {user.name}
              </span>
              <button
                className="btn btn-ghost px-3 py-1.5"
                onClick={() => logout.mutate(undefined, { onSuccess: () => router.push('/login') })}
              >
                {t.common.logout}
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary px-4 py-1.5">{t.common.login}</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
