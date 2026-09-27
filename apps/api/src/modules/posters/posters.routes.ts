import { Router } from 'express';
import { z } from 'zod';
import { createPosterSchema, objectIdSchema, regenerateSchema, type PosterListDTO } from '@poster/shared';
import type { AppDeps } from '../../runtime-types.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { generationLimiter } from '../../http/middleware/rate-limit.js';
import { validateBody, validateQuery } from '../../http/middleware/validate.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { toPosterDTO } from './poster.mapper.js';
import { createPoster, deletePoster, getPosterForUser, listPosters, regeneratePoster, removeWatermark } from './posters.service.js';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export function postersRouter(deps: AppDeps): Router {
  const { env, storage, queue } = deps;
  const r = Router();
  const gen = generationLimiter(env.GENERATION_RATE_LIMIT);
  r.use(requireAuth(env));

  r.post('/', gen, validateBody(createPosterSchema), async (req, res) => {
    const p = await createPoster(req.user!, req.body, { queue });
    res.status(202).json(toPosterDTO(p, storage));
  });

  const sendList = async (ownerId: string, q: z.infer<typeof pageQuery>, res: import('express').Response) => {
    const { items, total } = await listPosters(ownerId, q.page, q.limit);
    const body: PosterListDTO = { items: items.map((p) => toPosterDTO(p, storage)), total, page: q.page, limit: q.limit };
    res.json(body);
  };

  r.get('/me', validateQuery(pageQuery), (req, res) => sendList(req.user!.id, res.locals.query, res));

  r.get('/user/:userId', validateQuery(pageQuery), (req, res) => {
    const userId = String(req.params.userId);
    if (!objectIdSchema.safeParse(userId).success) throw notFound();
    if (req.user!.id !== userId && req.user!.role !== 'admin') throw forbidden();
    return sendList(userId, res.locals.query, res);
  });

  r.get('/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(toPosterDTO(await getPosterForUser(req.params.id, req.user!), storage));
  });

  r.post('/:id/regenerate', gen, validateBody(regenerateSchema), async (req, res) => {
    const p = await regeneratePoster(String(req.params.id), req.user!, req.body, { queue });
    res.status(202).json(toPosterDTO(p, storage));
  });

  r.post('/:id/remove-watermark', async (req, res) => {
    const p = await removeWatermark(String(req.params.id), req.user!, { queue });
    res.status(202).json(toPosterDTO(p, storage));
  });

  r.delete('/:id', async (req, res) => {
    await deletePoster(req.params.id, req.user!, { storage });
    res.status(204).end();
  });
  return r;
}
