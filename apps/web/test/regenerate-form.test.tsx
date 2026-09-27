import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PosterDTO } from '@poster/shared';
import { RegenerateForm } from '@/components/RegenerateForm';

const poster: PosterDTO = {
  id: 'p1', templateId: 't1', status: 'completed', imageUrl: 'x', downloadUrls: { png: 'a', jpg: 'b' }, regenerationsLeft: 2, watermarked: false, size: 'portrait', error: null, createdAt: new Date().toISOString(),
  formData: { name: 'করিম', designation: 'সভাপতি', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: 'বিজয় দিবস', tagline: '' },
};

describe('RegenerateForm', () => {
  it('sends only changed fields', async () => {
    const onRegenerate = vi.fn();
    render(<RegenerateForm poster={poster} pending={false} onRegenerate={onRegenerate} />);
    const h = screen.getByLabelText('শিরোনাম');
    await userEvent.clear(h);
    await userEvent.type(h, 'মহান বিজয় দিবস');
    await userEvent.click(screen.getByRole('button', { name: /আবার তৈরি করুন/ }));
    expect(onRegenerate).toHaveBeenCalledWith({ headline: 'মহান বিজয় দিবস' });
  });

  it('shows remaining count and disables at zero', () => {
    const { rerender } = render(<RegenerateForm poster={poster} pending={false} onRegenerate={vi.fn()} />);
    expect(screen.getByText(/আর ২ বার/)).toBeInTheDocument();
    rerender(<RegenerateForm poster={{ ...poster, regenerationsLeft: 0 }} pending={false} onRegenerate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /আবার তৈরি করুন/ })).toBeDisabled();
  });
});
