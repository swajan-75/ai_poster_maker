import type { RequestHandler } from 'express';
import type { UserRole } from '@poster/shared';
import type { Env } from '../../config/env.js';
import { AUTH_COOKIE, verifyToken } from '../../modules/auth/jwt.js';
import { forbidden, unauthorized } from '../../lib/errors.js';

// Bearer header is the primary session mechanism; the httpOnly cookie is kept only as a
// fallback for requests that can't set custom headers (e.g. <img>/<a> hitting /api/files).
export const requireAuth = (env: Env): RequestHandler => (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const token: unknown = bearer ?? req.cookies?.[AUTH_COOKIE];
  if (typeof token !== 'string' || !token) throw unauthorized();
  const p = verifyToken(token, env.JWT_SECRET);
  req.user = { id: p.sub, role: p.role };
  next();
};

export const requireRole = (role: UserRole): RequestHandler => (req, _res, next) => {
  if (req.user?.role !== role) throw forbidden();
  next();
};
