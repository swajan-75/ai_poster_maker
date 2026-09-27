import pino from 'pino';
import request from 'supertest';
import type { Express } from 'express';
import type { PublicUser } from '@poster/shared';
import { loadEnv, type Env } from '../src/config/env.js';
import type { AppDeps } from '../src/runtime-types.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import type { PosterQueue } from '../src/jobs/job-queue.js';
import { FakeRenderer } from '../src/render/fake-renderer.js';

export class FakeQueue implements PosterQueue {
  enqueued: string[] = [];
  enqueue(id: string) { this.enqueued.push(id); }
}

export function testEnv(overrides: Record<string, string> = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://127.0.0.1:1/unused',
    JWT_SECRET: 'x'.repeat(32),
    AI_MODE: 'fake',
    STORAGE_MODE: 'memory',
    ...overrides,
  });
}

export function makeTestDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return { env: testEnv(), logger: pino({ level: 'silent' }), storage: new MemoryStorage(), queue: new FakeQueue(), renderer: new FakeRenderer(), ...overrides };
}

let seq = 0;
export async function registerAgent(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  const agent = request.agent(app);
  const body = { name: 'টেস্ট ইউজার', email: `user${++seq}@test.com`, password: 'password123', ...overrides };
  const res = await agent.post('/api/auth/register').send(body).expect(201);
  return { agent, user: res.body.user as PublicUser };
}
