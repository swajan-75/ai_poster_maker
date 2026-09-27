import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Baloo_Da_2, Hind_Siliguri } from 'next/font/google';
import type { PublicUser } from '@poster/shared';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LOCALE_COOKIE, parseLocale } from '@/lib/locale';

const hind = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '600', '700'], variable: '--font-bn' });
// Rounded display face for headings only; body text stays on Hind for legibility.
const baloo = Baloo_Da_2({ subsets: ['bengali', 'latin'], weight: ['600', '800'], variable: '--font-heading' });

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export const metadata: Metadata = { title: 'পোস্টার মেকার — AI রাজনৈতিক পোস্টার', description: 'মিনিটেই প্রিন্ট-রেডি পোস্টার তৈরি করুন' };

// Resolve the session on the server so the first paint already shows the right header.
// null = logged out; undefined = unknown (API down) → client falls back to fetching /auth/me.
async function getInitialUser(token: string | undefined): Promise<PublicUser | null | undefined> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: { cookie: `pm_token=${token}` }, cache: 'no-store' });
    if (res.status === 401) return null;
    if (!res.ok) return undefined;
    return ((await res.json()) as { user: PublicUser }).user;
  } catch {
    return undefined;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const initialUser = await getInitialUser(cookieStore.get('pm_token')?.value);
  return (
    <html lang={locale} className={`${hind.variable} ${baloo.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink">
        <div className="bg-canvas" aria-hidden="true" />
        <Providers initialLocale={locale} initialUser={initialUser}>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:pt-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
