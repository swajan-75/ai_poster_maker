import { Router } from 'express';
import { loginSchema, registerSchema } from '@poster/shared';
import type { AppDeps } from '../../runtime-types.js';
import { validateBody } from '../../http/middleware/validate.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { authLimiter } from '../../http/middleware/rate-limit.js';
import { UserModel } from '../../models/user.model.js';
import { unauthorized } from '../../lib/errors.js';
import { authenticate, registerUser, toPublicUser } from './auth.service.js';
import { AUTH_COOKIE, authCookieOptions, signToken } from './jwt.js';

export function authRouter({ env }: AppDeps): Router {
  const r = Router();
  const limiter = authLimiter();
  // Cookie is kept only so /api/files (<img>/<a>, no custom headers) still authenticates;
  // the returned token is the session mechanism the frontend actually uses (Authorization: Bearer).
  const setSession = (res: import('express').Response, id: string, role: 'user' | 'admin') => {
    const token = signToken({ sub: id, role }, env.JWT_SECRET);
    res.cookie(AUTH_COOKIE, token, authCookieOptions(env));
    return token;
  };

  r.post('/register', limiter, validateBody(registerSchema), async (req, res) => {
    const user = await registerUser(req.body);
    const token = setSession(res, user._id.toString(), user.role);
    res.status(201).json({ user: toPublicUser(user), token });
  });

  r.post('/login', limiter, validateBody(loginSchema), async (req, res) => {
    const user = await authenticate(req.body);
    const token = setSession(res, user._id.toString(), user.role);
    res.json({ user: toPublicUser(user), token });
  });

  r.post('/logout', (_req, res) => {
    const opts = authCookieOptions(env);
    delete opts.maxAge;
    res.clearCookie(AUTH_COOKIE, opts).status(204).end();
  });

  r.get('/me', requireAuth(env), async (req, res) => {
    const user = await UserModel.findById(req.user!.id);
    if (!user) throw unauthorized();
    res.json({ user: toPublicUser(user) });
  });
  return r;
}
