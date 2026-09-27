import type { Env } from './config/env.js';
import type { Logger } from './lib/logger.js';
import type { StorageService } from './services/storage/storage.js';
import type { PosterQueue } from './jobs/job-queue.js';
import type { PosterRenderer } from './render/renderer.js';

export interface AppDeps {
  env: Env;
  logger: Logger;
  storage: StorageService;
  queue: PosterQueue;
  /** Also used by the API itself to print PDFs. */
  renderer: PosterRenderer;
}
