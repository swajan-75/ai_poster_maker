// Shared by the server layout and the client i18n provider (so no 'use client' here).
export type Locale = 'bn' | 'en';

// Cookie (not localStorage) so the server can render the right language on first paint.
export const LOCALE_COOKIE = 'pm_locale';

export function parseLocale(value: string | undefined | null): Locale {
  return value === 'en' ? 'en' : 'bn';
}
