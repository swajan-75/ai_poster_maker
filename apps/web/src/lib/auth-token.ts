const KEY = 'pm_access_token';

// localStorage is per-tab-synchronous but shared across tabs via the storage event;
// module state just avoids re-reading it on every request in the common case.
let cached: string | null | undefined;

export function getToken(): string | null {
  if (cached !== undefined) return cached;
  if (typeof window === 'undefined') return null;
  try { cached = window.localStorage.getItem(KEY); } catch { cached = null; }
  return cached;
}

export function setToken(token: string): void {
  cached = token;
  try { window.localStorage.setItem(KEY, token); } catch { /* private-mode storage may throw */ }
}

export function clearToken(): void {
  cached = null;
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}
