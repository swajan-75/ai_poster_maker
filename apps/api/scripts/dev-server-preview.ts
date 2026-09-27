/**
 * TEMPORARY manual-testing bootstrap — not part of the plan's task list.
 * Task 14 (composition root) will replace this with the real src/server.ts,
 * including DB connection wiring, boot job recovery, and graceful shutdown.
 * This script exists only so the API + Swagger UI can be browsed locally
 * before that task lands. Safe to delete once src/server.ts exists.
 */
import pino from 'pino';
import { loadEnv } from '../src/config/env.js';
import { createApp } from '../src/http/app.js';
import { connectDb } from '../src/db/connect.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import { FakeRenderer } from '../src/render/fake-renderer.js';

const env = loadEnv();
const logger = pino({ level: env.LOG_LEVEL });

await connectDb(env.MONGODB_URI);
logger.info({ uri: env.MONGODB_URI }, 'connected to MongoDB');

const app = createApp({ env, logger, storage: new MemoryStorage(), queue: { enqueue: () => undefined }, renderer: new FakeRenderer() });
app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger UI:     http://localhost:${env.PORT}/api/docs`);
});
