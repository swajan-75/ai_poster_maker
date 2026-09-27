import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    CORS_ORIGINS: z.string().default('http://localhost:3000')
      .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
    AI_MODE: z.enum(['gemini', 'fake']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_TEXT_MODEL: z.string().default('gemini-3.5-flash'),
    GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-image'),
    STORAGE_MODE: z.enum(['cloudinary', 'memory']).default('cloudinary'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
    RENDER_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60_000),
    GENERATION_RATE_LIMIT: z.coerce.number().int().min(1).default(10),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .superRefine((e, ctx) => {
    if (e.AI_MODE === 'gemini' && !e.GEMINI_API_KEY)
      ctx.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'required when AI_MODE=gemini' });
    if (e.STORAGE_MODE === 'cloudinary' &&
        !(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET))
      ctx.addIssue({ code: 'custom', path: ['CLOUDINARY_CLOUD_NAME'], message: 'CLOUDINARY_* required when STORAGE_MODE=cloudinary' });
  });

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const r = schema.safeParse(source);
  if (!r.success) {
    const lines = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return r.data;
}
