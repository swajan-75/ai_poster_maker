import { describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps, registerAgent } from './helpers.js';
import { makePng } from './fixtures.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import { generatedFolder } from '../src/services/storage/paths.js';

useTestDb();

describe('MemoryStorage with urlBase', () => {
  it('returns small API URLs instead of data URIs', async () => {
    const s = new MemoryStorage({ urlBase: '/api/files' });
    const img = await s.uploadImage(await makePng(400, 400), { folder: 'poster-maker/generated/u1', publicId: 'p1' });
    expect(img.url).toBe('/api/files/poster-maker%2Fgenerated%2Fu1%2Fp1');
    expect(s.getUrl(img.publicId, { format: 'jpg', download: true, width: 600 }))
      .toBe('/api/files/poster-maker%2Fgenerated%2Fu1%2Fp1?format=jpg&download=1&width=600');
  });
});

describe('GET /api/files/:publicId (memory storage)', () => {
  const storage = new MemoryStorage({ urlBase: '/api/files' });
  const app = createApp(makeTestDeps({ storage }));

  async function ownedImage(userId: string) {
    return (await storage.uploadImage(await makePng(400, 400), { folder: generatedFolder(userId), publicId: 'poster1' })).publicId;
  }

  it('serves the owner their image, converting and attaching on request', async () => {
    const { agent, user } = await registerAgent(app);
    const id = encodeURIComponent(await ownedImage(user.id));
    const png = await agent.get(`/api/files/${id}`).expect(200);
    expect(png.headers['content-type']).toBe('image/png');
    const jpg = await agent.get(`/api/files/${id}?format=jpg&download=1`).buffer(true).expect(200);
    expect(jpg.headers['content-type']).toBe('image/jpeg');
    expect(jpg.headers['content-disposition']).toMatch(/^attachment; filename="poster\.jpg"/);
    expect((await sharp(jpg.body as Buffer).metadata()).format).toBe('jpeg');
  });

  it('versioned URLs are browser-cacheable for a long time', async () => {
    const { agent, user } = await registerAgent(app);
    const publicId = await ownedImage(user.id);
    const url = storage.getUrl(publicId, { format: 'jpg', width: 200, version: 123 });
    expect(url).toMatch(/[?&]v=123(&|$)/);
    const res = await agent.get(url).expect(200);
    expect(res.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    await agent.get(storage.getUrl(publicId)).expect('cache-control', 'private, max-age=300');
  });

  it('401 without auth, 404 for another user or unknown id', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const id = encodeURIComponent(await ownedImage(a.user.id));
    await request(app).get(`/api/files/${id}`).expect(401);
    await b.agent.get(`/api/files/${id}`).expect(404);
    await a.agent.get(`/api/files/${encodeURIComponent(`${generatedFolder(a.user.id)}/missing`)}`).expect(404);
  });
});
