'use client';
import '@/lib/zod-messages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import type { PublicUser } from '@poster/shared';
import { ApiError } from '@/lib/api';
import { LocaleProvider, type Locale } from '@/lib/i18n';
import { qk } from '@/lib/queries';

export function Providers({ initialLocale, initialUser, children }: {
  initialLocale: Locale;
  // undefined = server couldn't tell (API unreachable); let the client fetch /auth/me itself.
  initialUser: PublicUser | null | undefined;
  children: ReactNode;
}) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
        },
      },
    });
    if (initialUser !== undefined) qc.setQueryData(qk.me, initialUser);
    return qc;
  });
  return <LocaleProvider initialLocale={initialLocale}><QueryClientProvider client={client}>{children}</QueryClientProvider></LocaleProvider>;
}
