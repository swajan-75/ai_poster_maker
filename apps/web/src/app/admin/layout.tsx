'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMe } from '@/lib/queries';
import { useT } from '@/lib/i18n';

function Tab({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link href={href} className={`btn ${active ? 'btn-primary' : 'btn-ghost'} px-4 py-2`}>{children}</Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const { data: user, isPending } = useMe({ optional: true });

  useEffect(() => {
    if (!isPending && user?.role !== 'admin') router.replace('/templates');
  }, [isPending, user, router]);

  if (isPending || user?.role !== 'admin') return <div className="skeleton h-40 w-full" aria-hidden="true" />;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t.admin.pageTitle}</h1>
      <nav className="flex flex-wrap gap-2">
        <Tab href="/admin/analytics">{t.admin.analyticsTab}</Tab>
        <Tab href="/admin/templates">{t.admin.templatesTab}</Tab>
        <Tab href="/admin/posters">{t.admin.postersTab}</Tab>
        <Tab href="/admin/users">{t.admin.usersTab}</Tab>
      </nav>
      {children}
    </section>
  );
}
