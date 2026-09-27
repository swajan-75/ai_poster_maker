import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TemplateDTO } from '@poster/shared';
import { PosterForm } from '@/components/PosterForm';

const template: TemplateDTO = { id: 't1', slug: 'v', title: 'মহান বিজয় দিবস', occasion: 'victory_day', layoutKey: 'victory', photoSlots: 3, thumbnailUrl: '/x.png', defaultHeadline: 'মহান বিজয় দিবস', palettes: [] };
const upload = vi.fn(async () => ({ publicId: 'p1', url: 'data:image/png;base64,AA==', width: 600, height: 800 }));

describe('PosterForm', () => {
  it('prefills the headline and requires at least one photo', async () => {
    const onSubmit = vi.fn();
    render(<PosterForm template={template} submitting={false} onSubmit={onSubmit} upload={upload} />);
    expect(screen.getByLabelText('শিরোনাম')).toHaveValue('মহান বিজয় দিবস');
    await userEvent.type(screen.getByLabelText('নাম'), 'মোঃ করিম');
    await userEvent.type(screen.getByLabelText('পদবি'), 'সভাপতি');
    await userEvent.type(screen.getByLabelText('দল / সংগঠন'), 'ওয়ার্ড কমিটি');
    await userEvent.type(screen.getByLabelText('জেলা'), 'ঢাকা');
    await userEvent.click(screen.getByRole('button', { name: 'পোস্টার তৈরি করুন' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('কমপক্ষে ১টি ছবি দিন');
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.upload(screen.getByLabelText(/ছবি যোগ করুন/), [new File(['x'], 'a.jpg', { type: 'image/jpeg' })]);
    await screen.findByRole('img');
    await userEvent.click(screen.getByRole('button', { name: 'পোস্টার তৈরি করুন' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      photoIds: ['p1'],
      formData: expect.objectContaining({ name: 'মোঃ করিম', district: 'ঢাকা', headline: 'মহান বিজয় দিবস', union: '', tagline: '' }),
    }));
  });

  it('shows field errors in Bangla', async () => {
    render(<PosterForm template={template} submitting={false} onSubmit={vi.fn()} upload={upload} />);
    await userEvent.click(screen.getByRole('button', { name: 'পোস্টার তৈরি করুন' }));
    expect((await screen.findAllByText('কমপক্ষে ২ অক্ষর লিখুন')).length).toBeGreaterThan(0);
  });

  it('does not show election-only fields for non-ballot templates', async () => {
    render(<PosterForm template={template} submitting={false} onSubmit={vi.fn()} upload={upload} />);
    expect(screen.queryByLabelText('প্রতীক / মার্কা (ঐচ্ছিক)')).toBeNull();
  });
});
