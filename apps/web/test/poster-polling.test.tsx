import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PosterDTO } from '@poster/shared';
import { usePoster } from '@/lib/queries';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

const poster = (status: PosterDTO['status']): PosterDTO => ({
  id: 'p1', templateId: 't', status, imageUrl: status === 'completed' ? 'x' : null, downloadUrls: null,
  regenerationsLeft: 3, watermarked: false, size: 'portrait', error: null, createdAt: '2026-09-25T10:00:00.000Z',
  formData: { name: '', designation: '', organization: '', union: '', thana: '', district: '', headline: 'h', tagline: '' },
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePoster polling', () => {
  it('keeps polling while queued/generating and stops once completed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let call = 0;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      call += 1;
      const status = call <= 2 ? 'generating' : 'completed';
      return new Response(JSON.stringify(poster(status)), { status: 200 });
    });

    const { result } = renderHook(() => usePoster('p1'), { wrapper });
    await waitFor(() => expect(result.current.data?.status).toBe('generating'));
    expect(spy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(result.current.data?.status).toBe('completed'));
    expect(spy).toHaveBeenCalledTimes(3);

    const countAfterCompletion = spy.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(spy.mock.calls.length).toBe(countAfterCompletion);
  });
});
