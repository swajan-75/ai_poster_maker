import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/error-messages';

afterEach(() => vi.restoreAllMocks());

describe('apiFetch', () => {
  it('prefixes /api, sends JSON and parses the response', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    const r = await apiFetch<{ ok: number }>('/x', { method: 'POST', json: { a: 1 } });
    expect(r).toEqual({ ok: 1 });
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe('/api/x');
    expect(new Headers(init!.headers).get('Content-Type')).toBe('application/json');
    expect(init!.body).toBe('{"a":1}');
  });
  it('returns undefined on 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch('/x')).resolves.toBeUndefined();
  });
  it('throws ApiError with server code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code: 'DAILY_LIMIT', message: 'x' } }), { status: 429 }));
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 429, code: 'DAILY_LIMIT' });
  });
  it('network failure → ApiError NETWORK', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiFetch('/x')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});

describe('errorMessage', () => {
  it('maps codes to Bangla and falls back', () => {
    expect(errorMessage(new ApiError(429, 'DAILY_LIMIT', 'x'))).toMatch(/আজকের/);
    expect(errorMessage(new Error('boom'))).toMatch(/কিছু একটা ভুল/);
  });
});
