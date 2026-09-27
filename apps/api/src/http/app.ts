import express, { type Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { AppDeps } from '../runtime-types.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { openapiSpec } from '../docs/openapi.js';
import { userRouter } from '../modules/user/user.routes.js';
import { templatesRouter } from '../modules/templates/templates.routes.js';
import { uploadsRouter } from '../modules/uploads/uploads.routes.js';
import { postersRouter } from '../modules/posters/posters.routes.js';
import { filesRouter } from '../modules/files/files.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';
import { billingRouter } from '../modules/billing/billing.routes.js';

export function createApp(deps: AppDeps, extend?: (router: Router) => void) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(requestId);
  app.use(pinoHttp({ logger: deps.logger, customProps: (_req, res) => ({ requestId: res.locals.requestId }) }));

  // Mounted before helmet: Swagger UI needs inline scripts that helmet's default CSP blocks.
  app.get('/api/docs.json', (_req, res) => { res.json(openapiSpec); });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use(helmet());
  app.use(cors({ origin: deps.env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

  const api = express.Router();
  api.use('/auth', authRouter(deps));
  api.use('/user', userRouter(deps));
  api.use('/templates', templatesRouter());
  api.use('/upload', uploadsRouter(deps));
  api.use('/posters', postersRouter(deps));
  api.use('/billing', billingRouter(deps));
  api.use('/admin', adminRouter(deps));
  if (deps.env.STORAGE_MODE !== 'cloudinary') api.use('/files', filesRouter(deps));
  extend?.(api);
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler(deps.logger));
  return app;
}
