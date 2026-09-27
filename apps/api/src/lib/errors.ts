import type { ErrorCode } from '@poster/shared';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: ErrorCode, msg: string, details?: unknown) => new AppError(400, code, msg, details);
export const unauthorized = (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg);
export const conflict = (code: ErrorCode, msg: string) => new AppError(409, code, msg);
export const unprocessable = (code: ErrorCode, msg: string) => new AppError(422, code, msg);
export const tooMany = (code: ErrorCode, msg: string) => new AppError(429, code, msg);
