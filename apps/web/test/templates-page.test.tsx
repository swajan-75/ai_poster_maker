import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TemplatesPage from '@/app/templates/page';

afterEach(() => vi.restoreAllMocks());
const tpl = (id: string, title: string, occasion: string) => ({ id, slug: id, title, occasion, layoutKey: 'victory', photoSlots: 3, thumbnailUrl: `/templates/${id}.png`, defaultHeadline: title, palettes: [] });

describe('TemplatesPage', () => {
  it('lists templates and refetches by occasion', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      new Response(JSON.stringify({ items: String(url).includes('occasion=mourning') ? [tpl('b', 'শোক', 'mourning')] : [tpl('a', 'বিজয়', 'victory_day'), tpl('b', 'শোক', 'mourning')] })));
    render(<QueryClientProvider client={new QueryClient()}><TemplatesPage /></QueryClientProvider>);
    expect(await screen.findByText('বিজয়')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /বিজয়/ })).toHaveAttribute('href', '/create/a');
    await userEvent.click(screen.getByRole('button', { name: 'শোক/স্মরণ' }));
    expect(await screen.findByText('শোক')).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith('/api/templates?occasion=mourning', expect.anything());
  });
});
