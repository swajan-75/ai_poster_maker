import sharp from 'sharp';
import { MIN_PHOTO_DIMENSION } from '@poster/shared';
import { badRequest } from '../../lib/errors.js';

const ALLOWED = new Set(['jpeg', 'png', 'webp']);

export async function normalizePhoto(buf: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  let format: string | undefined;
  try {
    format = (await sharp(buf).metadata()).format;
  } catch {
    throw badRequest('UNSUPPORTED_IMAGE', 'File is not a supported image');
  }
  if (!format || !ALLOWED.has(format)) throw badRequest('UNSUPPORTED_IMAGE', 'Only JPG, PNG or WEBP images are supported');

  const { data, info } = await sharp(buf, { failOn: 'error' })
    .rotate() // apply EXIF orientation
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .toColorspace('srgb')
    .jpeg({ quality: 90, mozjpeg: true }) // metadata is dropped by default
    .toBuffer({ resolveWithObject: true });

  if (Math.min(info.width, info.height) < MIN_PHOTO_DIMENSION)
    throw badRequest('IMAGE_TOO_SMALL', `Image must be at least ${MIN_PHOTO_DIMENSION}px on each side`);
  return { buffer: data, width: info.width, height: info.height };
}
