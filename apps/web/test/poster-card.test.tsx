import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PosterDTO } from '@poster/shared';
import { PosterCard } from '@/components/PosterCard';

afterEach(() => vi.restoreAllMocks());
const poster: PosterDTO = {
  id: 'p1', templateId: 't', status: 'completed', imageUrl: 'data:image/png;base64,AA==', downloadUrls: { png: '/png', jpg: '/jpg' },
  regenerationsLeft: 3, error: null, createdAt: '2026-09-25T10:00:00.000Z',
  formData: { name: 'করিম', designation: 'সভাপতি', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: 'বিজয় দিবস', tagline: '' },
};

describe('PosterCard', () => {
  it('links to detail, offers download, and confirms before delete', async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<PosterCard poster={poster} onDelete={onDelete} deleting={false} />);
    expect(screen.getByRole('link', { name: /বিজয় দিবস/ })).toHaveAttribute('href', '/posters/p1');
    expect(screen.getByRole('link', { name: 'ডাউনলোড' })).toHaveAttribute('href', '/png');
    await userEvent.click(screen.getByRole('button', { name: 'মুছুন' }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'মুছুন' }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('hides download for unfinished posters', () => {
    render(<PosterCard poster={{ ...poster, status: 'generating', imageUrl: null, downloadUrls: null }} onDelete={vi.fn()} deleting={false} />);
    expect(screen.queryByRole('link', { name: 'ডাউনলোড' })).toBeNull();
  });
});
