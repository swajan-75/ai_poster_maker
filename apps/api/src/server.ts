import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { connectDb, disconnectDb } from './db/connect.js';
import { buildRuntime } from './runtime.js';
import { createApp } from './http/app.js';
import { recoverJobs } from './jobs/recover.js';

const env = loadEnv();
const logger = createLogger(env);
await connectDb(env.MONGODB_URI);
const rt = buildRuntime(env, logger);
const app = createApp(rt);
const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'api listening'));
await recoverJobs(rt.queue, logger);

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');
  server.close();
  await rt.jobQueue.drain(20_000);
  await rt.renderer.close();
  await disconnectDb();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandledRejection'));
