import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../../lib/errors.js';

function issues(err: { issues: { path: PropertyKey[]; message: string }[] }) {
  return err.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }));
}

export const validateBody = (schema: ZodType): RequestHandler => (req, _res, next) => {
  const r = schema.safeParse(req.body ?? {});
  if (!r.success) throw badRequest('VALIDATION_ERROR', 'Invalid input', issues(r.error));
  req.body = r.data;
  next();
};

export const validateQuery = (schema: ZodType): RequestHandler => (req, res, next) => {
  const r = schema.safeParse(req.query);
  if (!r.success) throw badRequest('VALIDATION_ERROR', 'Invalid query', issues(r.error));
  res.locals.query = r.data;
  next();
};
