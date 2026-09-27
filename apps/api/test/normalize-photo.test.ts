import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { normalizePhoto } from '../src/modules/uploads/normalize-photo.js';
import { makeAvif, makeJpeg, makePng } from './fixtures.js';

describe('normalizePhoto', () => {
  it('outputs JPEG and strips EXIF', async () => {
    const out = await normalizePhoto(await makeJpeg(800, 600));
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.exif).toBeUndefined();
  });
  it('applies EXIF orientation (6 = rotate 90°)', async () => {
    const out = await normalizePhoto(await makeJpeg(800, 600, { orientation: 6 }));
    expect({ w: out.width, h: out.height }).toEqual({ w: 600, h: 800 });
  });
  it('flattens PNG alpha into JPEG', async () => {
    const out = await normalizePhoto(await makePng(500, 500));
    expect((await sharp(out.buffer).metadata()).hasAlpha).toBe(false);
  });
  it('downsizes to max 2000px long side', async () => {
    const out = await normalizePhoto(await makeJpeg(4000, 3000));
    expect(Math.max(out.width, out.height)).toBe(2000);
  });
  it('rejects too-small images', async () => {
    await expect(normalizePhoto(await makeJpeg(200, 200))).rejects.toMatchObject({ code: 'IMAGE_TOO_SMALL' });
  });
  it('rejects HEIF/AVIF and non-images', async () => {
    await expect(normalizePhoto(await makeAvif(500, 500))).rejects.toMatchObject({ code: 'UNSUPPORTED_IMAGE' });
    await expect(normalizePhoto(Buffer.from('not an image'))).rejects.toMatchObject({ code: 'UNSUPPORTED_IMAGE' });
  });
});
