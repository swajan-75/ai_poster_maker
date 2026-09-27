import jwt from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import type { UserRole } from '@poster/shared';
import type { Env } from '../../config/env.js';
import { unauthorized } from '../../lib/errors.js';

export const AUTH_COOKIE = 'pm_token';
const TTL_SECONDS = 7 * 24 * 60 * 60;

export function signToken(payload: { sub: string; role: UserRole }, secret: string): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: TTL_SECONDS });
}

export function verifyToken(token: string, secret: string): { sub: string; role: UserRole } {
  try {
    const p = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (typeof p === 'string' || typeof p.sub !== 'string') throw new Error('bad payload');
    return { sub: p.sub, role: p.role === 'admin' ? 'admin' : 'user' };
  } catch {
    throw unauthorized('Invalid or expired session');
  }
}

export function authCookieOptions(env: Env): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/', maxAge: TTL_SECONDS * 1000 };
}
