import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PosterDTO } from '@poster/shared';
import HistoryPage from '@/app/history/page';

afterEach(() => vi.restoreAllMocks());

const poster = (n: number): PosterDTO => ({
  id: `p${n}`, templateId: 't', status: 'completed', imageUrl: 'data:image/png;base64,AA==', downloadUrls: { png: '/png', jpg: '/jpg' },
  regenerationsLeft: 3, watermarked: false, size: 'portrait', error: null, rejectionNote: null, createdAt: '2026-09-25T10:00:00.000Z',
  formData: { name: 'করিম', designation: 'সভাপতি', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: `poster-${n}`, tagline: '' },
});

function wrap(ui: React.ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('HistoryPage', () => {
  it('clamps back to the last valid page after deleting the only item on the current page', async () => {
    let dataset = Array.from({ length: 13 }, (_, i) => poster(i + 1));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const u = new URL(String(url), 'http://x');
      if (init?.method === 'DELETE') {
        const id = u.pathname.split('/').pop();
        dataset = dataset.filter((p) => p.id !== id);
        return new Response(null, { status: 204 });
      }
      const page = Number(u.searchParams.get('page') ?? '1');
      const limit = 12;
      const items = dataset.slice((page - 1) * limit, page * limit);
      return new Response(JSON.stringify({ items, total: dataset.length, page, limit }), { status: 200 });
    });

    wrap(<HistoryPage />);
    await screen.findByText('poster-1');
    await userEvent.click(screen.getByRole('button', { name: 'পরের' }));
    await screen.findByText('poster-13');

    await userEvent.click(screen.getByRole('button', { name: 'মুছুন' }));

    await waitFor(() => expect(screen.getByText('poster-1')).toBeInTheDocument());
    expect(screen.queryByText(/^২ \/ ২$/)).toBeNull();
  });
});
