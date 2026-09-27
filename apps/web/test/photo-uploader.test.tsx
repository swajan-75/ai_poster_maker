import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { UploadedPhotoDTO } from '@poster/shared';
import { PhotoUploader } from '@/components/PhotoUploader';
import { ApiError } from '@/lib/api';

const file = (n: string) => new File(['x'], n, { type: 'image/jpeg' });
let seq = 0;
const okUpload = vi.fn(async (): Promise<UploadedPhotoDTO> => ({ publicId: `p${++seq}`, url: 'data:image/png;base64,AA==', width: 600, height: 800 }));

function Harness({ max, upload = okUpload }: { max: number; upload?: (f: File) => Promise<UploadedPhotoDTO> }) {
  const [v, setV] = useState<UploadedPhotoDTO[]>([]);
  return <PhotoUploader max={max} value={v} onChange={setV} upload={upload} />;
}

describe('PhotoUploader', () => {
  it('uploads up to max and then disables the input', async () => {
    render(<Harness max={2} />);
    const input = screen.getByLabelText(/ছবি যোগ করুন/);
    await userEvent.upload(input, [file('a.jpg'), file('b.jpg'), file('c.jpg')]);
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2));
    expect(input).toBeDisabled();
  });

  it('removes a photo', async () => {
    render(<Harness max={3} />);
    await userEvent.upload(screen.getByLabelText(/ছবি যোগ করুন/), [file('a.jpg')]);
    await userEvent.click(await screen.findByRole('button', { name: 'ছবি ১ সরান' }));
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('shows a Bangla error when upload fails', async () => {
    render(<Harness max={3} upload={async () => { throw new ApiError(400, 'IMAGE_TOO_SMALL', 'x'); }} />);
    await userEvent.upload(screen.getByLabelText(/ছবি যোগ করুন/), [file('a.jpg')]);
    expect(await screen.findByRole('alert')).toHaveTextContent('ছবিটি খুব ছোট');
  });

  it('keeps photos from an earlier still-in-flight batch when a second batch finishes first', async () => {
    let resolveFirst!: (v: UploadedPhotoDTO) => void;
    const first = new Promise<UploadedPhotoDTO>((resolve) => { resolveFirst = resolve; });
    const upload = vi.fn()
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(async (): Promise<UploadedPhotoDTO> => ({ publicId: 'second', url: 'data:image/png;base64,BB==', width: 600, height: 800 }));

    render(<Harness max={5} upload={upload} />);
    const input = screen.getByLabelText(/ছবি যোগ করুন/);

    // Batch 1 starts and stays pending.
    await userEvent.upload(input, [file('a.jpg')]);
    // Batch 2 starts and resolves before batch 1.
    await userEvent.upload(input, [file('b.jpg')]);
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));

    // Now batch 1 finally resolves.
    resolveFirst({ publicId: 'first', url: 'data:image/png;base64,AA==', width: 600, height: 800 });
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2));
  });
});
