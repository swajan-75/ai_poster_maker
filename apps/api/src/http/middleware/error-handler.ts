import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@poster/shared';
import { AppError } from '../../lib/errors.js';
import type { Logger } from '../../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
  res.status(404).json(body);
};

type HttpishError = { type?: string; status?: number; code?: string };

export const errorHandler = (logger: Logger): ErrorRequestHandler => (err, req, res, _next) => {
  let appErr: AppError;
  const e = err as HttpishError;
  if (err instanceof AppError) appErr = err;
  else if (e.type === 'entity.parse.failed') appErr = new AppError(400, 'VALIDATION_ERROR', 'Malformed JSON body');
  else if (e.type === 'entity.too.large' || e.code === 'LIMIT_FILE_SIZE')
    appErr = new AppError(413, 'FILE_TOO_LARGE', 'Payload too large');
  else {
    logger.error({ err, requestId: res.locals.requestId, path: req.path }, 'unhandled error');
    appErr = new AppError(500, 'INTERNAL', 'Something went wrong');
  }
  const body: ApiErrorBody = { error: { code: appErr.code, message: appErr.message } };
  if (appErr.details !== undefined) body.error.details = appErr.details;
  res.status(appErr.status).json(body);
};
