import { rateLimit } from 'express-rate-limit';
import type { Request } from 'express';
import type { ApiErrorBody } from '@poster/shared';

const body = (code: 'RATE_LIMITED'): ApiErrorBody => ({ error: { code, message: 'Too many requests, slow down' } });
const byUser = (req: Request) => req.user?.id ?? 'anon';

export const authLimiter = () =>
  rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: body('RATE_LIMITED') });

export const uploadLimiter = () =>
  rateLimit({ windowMs: 10 * 60_000, limit: 30, keyGenerator: byUser, standardHeaders: 'draft-7', legacyHeaders: false, message: body('RATE_LIMITED') });

export const generationLimiter = (limit: number) =>
  rateLimit({ windowMs: 10 * 60_000, limit, keyGenerator: byUser, standardHeaders: 'draft-7', legacyHeaders: false, message: body('RATE_LIMITED') });
