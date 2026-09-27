import { Router } from 'express';
import { z } from 'zod';
import { adminTemplateCreateSchema, adminTemplateUpdateSchema, objectIdSchema, POSTER_STATUSES } from '@poster/shared';
import type { AppDeps } from '../../runtime-types.js';
import { requireAuth, requireRole } from '../../http/middleware/auth.js';
import { validateBody, validateQuery } from '../../http/middleware/validate.js';
import { notFound } from '../../lib/errors.js';
import {
  createTemplate, deactivateTemplate, listAllPosters, listAllTemplates, listUsers,
  setUserBlocked, toAdminTemplateDTO, updateTemplate,
} from './admin.service.js';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const posterQuery = pageQuery.extend({ status: z.enum(POSTER_STATUSES).optional() });
const userQuery = pageQuery.extend({ blocked: z.coerce.boolean().optional() });
const idParam = objectIdSchema;

export function adminRouter(deps: AppDeps): Router {
  const { env, storage } = deps;
  const r = Router();
  r.use(requireAuth(env), requireRole('admin'));

  // --- Templates ---
  r.get('/templates', async (_req, res) => {
    res.json({ items: (await listAllTemplates()).map(toAdminTemplateDTO) });
  });

  r.post('/templates', validateBody(adminTemplateCreateSchema), async (req, res) => {
    res.status(201).json(toAdminTemplateDTO(await createTemplate(req.body)));
  });

  r.patch('/templates/:id', validateBody(adminTemplateUpdateSchema), async (req, res) => {
    const id = String(req.params.id);
    if (!idParam.safeParse(id).success) throw notFound('Template not found');
    res.json(toAdminTemplateDTO(await updateTemplate(id, req.body)));
  });

  r.delete('/templates/:id', async (req, res) => {
    const id = String(req.params.id);
    if (!idParam.safeParse(id).success) throw notFound('Template not found');
    await deactivateTemplate(id);
    res.status(204).end();
  });

  // --- Moderation queue ---
  r.get('/posters', validateQuery(posterQuery), async (req, res) => {
    const q = res.locals.query as z.infer<typeof posterQuery>;
    const { items, total } = await listAllPosters(q.page, q.limit, q.status, storage);
    res.json({ items, total, page: q.page, limit: q.limit });
  });

  // --- Users ---
  r.get('/users', validateQuery(userQuery), async (req, res) => {
    const q = res.locals.query as z.infer<typeof userQuery>;
    const { items, total } = await listUsers(q.page, q.limit, q.blocked);
    res.json({ items, total, page: q.page, limit: q.limit });
  });

  r.patch('/users/:id/block', async (req, res) => {
    const id = String(req.params.id);
    if (!idParam.safeParse(id).success) throw notFound('User not found');
    await setUserBlocked(id, true, req.user!.id);
    res.status(204).end();
  });

  r.patch('/users/:id/unblock', async (req, res) => {
    const id = String(req.params.id);
    if (!idParam.safeParse(id).success) throw notFound('User not found');
    await setUserBlocked(id, false, req.user!.id);
    res.status(204).end();
  });

  return r;
}
