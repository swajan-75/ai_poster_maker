import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps, registerAgent } from './helpers.js';
import { makeJpeg } from './fixtures.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import { isOwnedUpload } from '../src/services/storage/paths.js';

useTestDb();

describe('POST /api/upload', () => {
  const storage = new MemoryStorage();
  const app = createApp(makeTestDeps({ storage }));

  it('requires auth', async () => {
    await request(app).post('/api/upload').attach('photo', await makeJpeg(500, 500), 'a.jpg').expect(401);
  });

  it('stores a normalized photo under the user folder', async () => {
    const { agent, user } = await registerAgent(app);
    const res = await agent.post('/api/upload').attach('photo', await makeJpeg(800, 600), 'a.jpg').expect(201);
    expect(isOwnedUpload(res.body.publicId, user.id)).toBe(true);
    expect(res.body).toMatchObject({ width: 800, height: 600 });
    expect(storage.has(res.body.publicId)).toBe(true);
  });

  it('missing file → 400', async () => {
    const { agent } = await registerAgent(app);
    const res = await agent.post('/api/upload').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('file over 5 MB → 413 FILE_TOO_LARGE', async () => {
    const { agent } = await registerAgent(app);
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1);
    const res = await agent.post('/api/upload').attach('photo', big, 'big.jpg').expect(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('non-image → 400 UNSUPPORTED_IMAGE', async () => {
    const { agent } = await registerAgent(app);
    const res = await agent.post('/api/upload').attach('photo', Buffer.from('hello'), 'x.jpg').expect(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_IMAGE');
  });
});

describe('isOwnedUpload', () => {
  it('rejects other users and path traversal', () => {
    expect(isOwnedUpload('poster-maker/uploads/u1/abc', 'u1')).toBe(true);
    expect(isOwnedUpload('poster-maker/uploads/u2/abc', 'u1')).toBe(false);
    expect(isOwnedUpload('poster-maker/uploads/u1/../u2/abc', 'u1')).toBe(false);
    expect(isOwnedUpload('poster-maker/uploads/u1', 'u1')).toBe(false);
  });
});
