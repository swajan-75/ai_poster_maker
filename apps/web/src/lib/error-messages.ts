import { ApiError } from './api';
import { getLocale, dictErrors } from './i18n';

export function errorMessage(err: unknown): string {
  const t = dictErrors[getLocale()];
  return err instanceof ApiError ? t[err.code as keyof typeof t] ?? t.FALLBACK : t.FALLBACK;
}
