import type { ApiErrorBody, ErrorCode } from '@poster/shared';
import { getToken } from './auth-token';

export class ApiError extends Error {
  constructor(public status: number, public code: ErrorCode | 'NETWORK', message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  let body = rest.body;
  if (json !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(json); }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    // credentials stays same-origin so the pm_token cookie still rides along as a fallback
    // for routes that can't send this header (e.g. /api/files via <img>/<a>).
    res = await fetch(`/api${path}`, { ...rest, headers, body, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network error');
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? 'INTERNAL', data?.error?.message ?? res.statusText, data?.error?.details);
  }
  return data as T;
}
