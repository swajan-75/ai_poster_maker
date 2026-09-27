import { Router } from 'express';
import sharp from 'sharp';
import { z } from 'zod';
import type { AppDeps } from '../../runtime-types.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { validateQuery } from '../../http/middleware/validate.js';
import { notFound } from '../../lib/errors.js';
import { canReadFile } from '../../services/storage/paths.js';

const fileQuery = z.object({
  format: z.enum(['png', 'jpg']).optional(),
  download: z.literal('1').optional(),
  width: z.coerce.number().int().min(16).max(2400).optional(),
  v: z.coerce.number().int().nonnegative().optional(),
});

// Resizing/encoding with sharp costs 100ms+ per image; keep recent results so repeat views are instant.
const CACHE_MAX = 64;

/** Serves images held by MemoryStorage (dev only; Cloudinary URLs never point here). */
export function filesRouter({ env, storage }: AppDeps): Router {
  const r = Router();
  const cache = new Map<string, { body: Buffer; format: 'png' | 'jpg' }>();
  r.get('/:publicId', requireAuth(env), validateQuery(fileQuery), async (req, res) => {
    const publicId = String(req.params.publicId);
    const user = req.user!;
    if (user.role !== 'admin' && !canReadFile(publicId, user.id)) throw notFound('File not found');
    const q = res.locals.query as z.infer<typeof fileQuery>;

    // Only versioned URLs are cached: an unversioned id can be overwritten in place.
    const key = q.v === undefined ? null : `${publicId}|${q.format ?? ''}|${q.width ?? ''}|${q.v}`;
    let hit = key ? cache.get(key) : undefined;
    if (!hit) {
      let img = sharp(await storage.fetchImage(publicId));
      if (q.width) img = img.resize({ width: q.width, withoutEnlargement: true });
      const format = q.format ?? ((await img.metadata()).format === 'png' ? 'png' : 'jpg');
      hit = { format, body: await (format === 'png' ? img.png() : img.jpeg({ quality: 92, mozjpeg: true })).toBuffer() };
      if (key) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
        cache.set(key, hit);
      }
    }
    const { format, body } = hit;

    res.type(format === 'png' ? 'image/png' : 'image/jpeg');
    res.set('Cache-Control', q.v === undefined ? 'private, max-age=300' : 'private, max-age=31536000, immutable');
    if (q.download) res.attachment(`poster.${format}`);
    res.send(body);
  });
  return r;
}
