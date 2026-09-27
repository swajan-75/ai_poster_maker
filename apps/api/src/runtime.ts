import { GoogleGenAI } from '@google/genai';
import type { Env } from './config/env.js';
import type { Logger } from './lib/logger.js';
import type { AppDeps } from './runtime-types.js';
import type { StorageService } from './services/storage/storage.js';
import { CloudinaryStorage } from './services/storage/cloudinary-storage.js';
import { MemoryStorage } from './services/storage/memory-storage.js';
import type { DesignProvider } from './services/ai/design-provider.js';
import { GeminiDesignProvider } from './services/ai/gemini-design-provider.js';
import { FakeDesignProvider } from './services/ai/fake-design-provider.js';
import type { BackgroundProvider } from './services/ai/background-provider.js';
import { GeminiBackgroundProvider } from './services/ai/gemini-background-provider.js';
import { FakeBackgroundProvider } from './services/ai/fake-background-provider.js';
import { createBackgroundService } from './services/background/background.service.js';
import type { PosterRenderer } from './render/renderer.js';
import { PuppeteerRenderer } from './render/puppeteer-renderer.js';
import { JobQueue } from './jobs/job-queue.js';
import { generatePoster } from './jobs/generate-poster.js';

export interface Runtime extends AppDeps { renderer: PosterRenderer; jobQueue: JobQueue; queue: JobQueue }

type Overrides = Partial<{ storage: StorageService; designProvider: DesignProvider; backgroundProvider: BackgroundProvider; renderer: PosterRenderer }>;

export function buildRuntime(env: Env, logger: Logger, o: Overrides = {}): Runtime {
  const storage = o.storage ?? (env.STORAGE_MODE === 'memory' ? new MemoryStorage({ urlBase: '/api/files' })
    : new CloudinaryStorage({ cloudName: env.CLOUDINARY_CLOUD_NAME!, apiKey: env.CLOUDINARY_API_KEY!, apiSecret: env.CLOUDINARY_API_SECRET! }));

  const genai = env.AI_MODE === 'gemini' ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! }) : null;
  const designProvider = o.designProvider ?? (genai ? new GeminiDesignProvider(genai, env.GEMINI_TEXT_MODEL) : new FakeDesignProvider());
  const backgroundProvider = o.backgroundProvider ?? (genai ? new GeminiBackgroundProvider(genai, env.GEMINI_IMAGE_MODEL) : new FakeBackgroundProvider());
  const renderer = o.renderer ?? new PuppeteerRenderer({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH });
  const backgrounds = createBackgroundService({ provider: backgroundProvider, storage, logger });

  const jobQueue = new JobQueue(
    (id) => generatePoster(id, { storage, designProvider, backgrounds, renderer, logger, renderTimeoutMs: env.RENDER_TIMEOUT_MS }),
    { concurrency: env.WORKER_CONCURRENCY, logger },
  );
  return { env, logger, storage, renderer, jobQueue, queue: jobQueue };
}
