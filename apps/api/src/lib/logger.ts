import pino, { type Logger } from 'pino';
import type { Env } from '../config/env.js';
export type { Logger };
export function createLogger(env: Env): Logger {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
  });
}
