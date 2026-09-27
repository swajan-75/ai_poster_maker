import { Router } from 'express';
import { z } from 'zod';
import { OCCASIONS } from '@poster/shared';
import { validateQuery } from '../../http/middleware/validate.js';
import { getActiveTemplate, listTemplates, toTemplateDTO } from './templates.service.js';

const listQuery = z.object({ occasion: z.enum(OCCASIONS).optional() });

export function templatesRouter(): Router {
  const r = Router();
  r.get('/', validateQuery(listQuery), async (_req, res) => {
    const { occasion } = res.locals.query as z.infer<typeof listQuery>;
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ items: (await listTemplates(occasion)).map(toTemplateDTO) });
  });
  r.get('/:id', async (req, res) => {
    res.json(toTemplateDTO(await getActiveTemplate(req.params.id)));
  });
  return r;
}
