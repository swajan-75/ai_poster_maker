import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { FakeQueue, makeTestDeps, registerAgent, testEnv } from './helpers.js';
import { FakeRenderer } from '../src/render/fake-renderer.js';
import { makeJpeg, sampleForm } from './fixtures.js';
import { seedTemplates } from '../scripts/seed-data.js';
import { TemplateModel } from '../src/models/template.model.js';
import { PosterModel } from '../src/models/poster.model.js';
import { UserModel } from '../src/models/user.model.js';
import { PosterUsageModel } from '../src/models/poster-usage.model.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';

useTestDb();

let queue: FakeQueue;
let renderer: FakeRenderer;
let storage: MemoryStorage;
let app: ReturnType<typeof createApp>;
let victoryId: string;
let tributeId: string;

beforeEach(async () => {
  queue = new FakeQueue();
  storage = new MemoryStorage();
  renderer = new FakeRenderer();
  app = createApp(makeTestDeps({ queue, storage, renderer, env: testEnv({ GENERATION_RATE_LIMIT: '100' }) }));
  await seedTemplates();
  victoryId = (await TemplateModel.findOne({ slug: 'victory-day-classic' }))!.id;
  tributeId = (await TemplateModel.findOne({ slug: 'tribute-mourning' }))!.id;
});

async function upload(agent: ReturnType<typeof request.agent>) {
  const res = await agent.post('/api/upload').attach('photo', await makeJpeg(600, 800), 'p.jpg').expect(201);
  return res.body.publicId as string;
}

async function create(agent: ReturnType<typeof request.agent>, over: Record<string, unknown> = {}) {
  const photoId = await upload(agent);
  return agent.post('/api/posters').send({ templateId: victoryId, formData: sampleForm, photoIds: [photoId], ...over });
}

async function completedPoster(agent: ReturnType<typeof request.agent>) {
  const id = (await create(agent)).body.id as string;
  await PosterModel.updateOne({ _id: id }, { status: 'completed' });
  return id;
}

describe('POST /api/posters', () => {
  it('creates a queued poster, enqueues it, returns 202 DTO', async () => {
    const { agent } = await registerAgent(app);
    const res = await create(agent);
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({ status: 'queued', imageUrl: null, regenerationsLeft: 3, error: null });
    expect(queue.enqueued).toEqual([res.body.id]);
  });

  it('NFC-normalizes text', async () => {
    const { agent } = await registerAgent(app);
    const decomposed = 'কো'.normalize('NFD');
    const res = await create(agent, { formData: { ...sampleForm, name: `${decomposed} করিম` } });
    const p = await PosterModel.findById(res.body.id);
    expect(p!.formData!.name).toBe(`${'কো'.normalize('NFC')} করিম`);
  });

  it('rejects photos not owned by the caller → 403 PHOTO_NOT_OWNED', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const foreign = await upload(a.agent);
    const res = await b.agent.post('/api/posters').send({ templateId: victoryId, formData: sampleForm, photoIds: [foreign] }).expect(403);
    expect(res.body.error.code).toBe('PHOTO_NOT_OWNED');
  });

  it('rejects more photos than the template has slots', async () => {
    const { agent } = await registerAgent(app);
    const ids = [await upload(agent), await upload(agent)];
    const res = await agent.post('/api/posters').send({ templateId: tributeId, formData: sampleForm, photoIds: ids }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects inactive/unknown template → 422 TEMPLATE_UNAVAILABLE', async () => {
    const { agent } = await registerAgent(app);
    await TemplateModel.updateOne({ _id: victoryId }, { isActive: false });
    const res = await create(agent);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('TEMPLATE_UNAVAILABLE');
  });

  it('blocked content → 422 CONTENT_BLOCKED', async () => {
    const { agent } = await registerAgent(app);
    const res = await create(agent, { formData: { ...sampleForm, headline: 'ওদের হত্যা করো' } });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CONTENT_BLOCKED');
  });

  it('enforces the daily quota → 429 DAILY_LIMIT', async () => {
    const { agent } = await registerAgent(app);
    for (let i = 0; i < 3; i++) expect((await create(agent)).status).toBe(202);
    const res = await create(agent);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('DAILY_LIMIT');
  });

  it('deleting posters does not give back daily slots', async () => {
    const { agent } = await registerAgent(app);
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push((await create(agent)).body.id);
    for (const id of ids) await agent.delete(`/api/posters/${id}`).expect(204);
    const res = await create(agent);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('DAILY_LIMIT');
    expect(new Date(res.body.error.details.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('slots free up 24h after each poster was created', async () => {
    const { agent } = await registerAgent(app);
    for (let i = 0; i < 3; i++) expect((await create(agent)).status).toBe(202);
    // createdAt is immutable through Mongoose, so shift it at the driver level.
    await PosterUsageModel.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 24 * 3600_000 - 1000) } });
    expect((await create(agent)).status).toBe(202);
  });

  it('parallel requests cannot exceed the limit', async () => {
    const { agent } = await registerAgent(app);
    const photoIds = await Promise.all(Array.from({ length: 5 }, () => upload(agent)));
    const results = await Promise.all(photoIds.map((id) =>
      agent.post('/api/posters').send({ templateId: victoryId, formData: sampleForm, photoIds: [id] })));
    expect(results.filter((r) => r.status === 202).length).toBeLessThanOrEqual(3);
    expect(await PosterModel.countDocuments()).toBeLessThanOrEqual(3);
  });

  it('requires auth', async () => {
    await request(app).post('/api/posters').send({}).expect(401);
  });
});

describe('GET /api/posters/:id & lists', () => {
  it('owner can read; other user gets 404; invalid id 404', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const id = (await create(a.agent)).body.id;
    await a.agent.get(`/api/posters/${id}`).expect(200);
    await b.agent.get(`/api/posters/${id}`).expect(404);
    await a.agent.get('/api/posters/xyz').expect(404);
  });

  it('completed poster exposes image + download URLs', async () => {
    const { agent } = await registerAgent(app);
    const id = (await create(agent)).body.id;
    const img = await storage.uploadImage(await makeJpeg(600, 800), { folder: 'poster-maker/generated/x', publicId: id });
    await PosterModel.updateOne({ _id: id }, { status: 'completed', imagePublicId: img.publicId, imageUrl: img.url });
    const res = await agent.get(`/api/posters/${id}`).expect(200);
    expect(res.body.imageUrl).toBeTruthy();
    expect(res.body.downloadUrls).toEqual({ png: expect.any(String), jpg: expect.any(String) });
  });

  it('/me paginates newest first', async () => {
    const { agent } = await registerAgent(app);
    const first = (await create(agent)).body.id;
    const second = (await create(agent)).body.id;
    const res = await agent.get('/api/posters/me?page=1&limit=1').expect(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 1 });
    expect(res.body.items[0].id).toBe(second);
    const p2 = await agent.get('/api/posters/me?page=2&limit=1').expect(200);
    expect(p2.body.items[0].id).toBe(first);
  });

  it('/user/:userId → only self or admin', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    await a.agent.get(`/api/posters/user/${a.user.id}`).expect(200);
    await b.agent.get(`/api/posters/user/${a.user.id}`).expect(403);
    await UserModel.updateOne({ _id: b.user.id }, { role: 'admin' });
    // role is in the JWT → re-login to pick up admin
    await b.agent.post('/api/auth/login').send({ email: b.user.email, password: 'password123' }).expect(200);
    await b.agent.get(`/api/posters/user/${a.user.id}`).expect(200);
  });
});

describe('POST /api/posters/:id/regenerate', () => {
  async function completed(agent: ReturnType<typeof request.agent>) {
    const id = (await create(agent)).body.id as string;
    await PosterModel.updateOne({ _id: id }, { status: 'completed' });
    return id;
  }

  it('re-queues with merged text and counts one regeneration', async () => {
    const { agent } = await registerAgent(app);
    const id = await completed(agent);
    const res = await agent.post(`/api/posters/${id}/regenerate`).send({ formData: { headline: 'নতুন শিরোনাম' } }).expect(202);
    expect(res.body).toMatchObject({ status: 'queued', regenerationsLeft: 2 });
    expect(res.body.formData.headline).toBe('নতুন শিরোনাম');
    expect(res.body.formData.name).toBe(sampleForm.name);
    expect(queue.enqueued).toContain(id);
  });

  it('while generating → 409 POSTER_BUSY; double-click counts once', async () => {
    const { agent } = await registerAgent(app);
    const id = await completed(agent);
    const [r1, r2] = await Promise.all([
      agent.post(`/api/posters/${id}/regenerate`).send({}),
      agent.post(`/api/posters/${id}/regenerate`).send({}),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([202, 409]);
    expect((await PosterModel.findById(id))!.regenerateCount).toBe(1);
  });

  it('after 3 regenerations → 429 REGEN_LIMIT_REACHED', async () => {
    const { agent } = await registerAgent(app);
    const id = await completed(agent);
    await PosterModel.updateOne({ _id: id }, { regenerateCount: 3 });
    const res = await agent.post(`/api/posters/${id}/regenerate`).send({}).expect(429);
    expect(res.body.error.code).toBe('REGEN_LIMIT_REACHED');
  });

  it('retrying a failed poster does not consume a regeneration', async () => {
    const { agent } = await registerAgent(app);
    const id = (await create(agent)).body.id;
    await PosterModel.updateOne({ _id: id }, { status: 'failed', error: 'x' });
    const res = await agent.post(`/api/posters/${id}/regenerate`).send({}).expect(202);
    expect(res.body.regenerationsLeft).toBe(3);
    expect(res.body.error).toBeNull();
  });

  it('blocked text in regenerate → 422', async () => {
    const { agent } = await registerAgent(app);
    const id = await completed(agent);
    await agent.post(`/api/posters/${id}/regenerate`).send({ formData: { headline: 'kill them all' } }).expect(422);
  });
});

describe('DELETE /api/posters/:id', () => {
  it('owner deletes poster and its files; others get 404', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const id = (await create(a.agent)).body.id;
    const photoId = (await PosterModel.findById(id))!.photoIds[0]!;
    await b.agent.delete(`/api/posters/${id}`).expect(404);
    await a.agent.delete(`/api/posters/${id}`).expect(204);
    expect(await PosterModel.findById(id)).toBeNull();
    expect(storage.has(photoId)).toBe(false);
  });
});

const setPlan = (userId: string, plan: 'pro' | 'ultra', days = 30) =>
  UserModel.updateOne({ _id: userId }, { plan, planExpiresAt: new Date(Date.now() + days * 86_400_000) });

describe('subscription plans', () => {
  const royalId = async () => (await TemplateModel.findOne({ slug: 'victory-day-royal' }))!.id as string;

  it('free plan: premium template → 403 UPGRADE_REQUIRED; free template is watermarked', async () => {
    const { agent } = await registerAgent(app);
    const res = await create(agent, { templateId: await royalId() });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatchObject({ code: 'UPGRADE_REQUIRED', details: { reason: 'premium_template' } });
    const ok = await create(agent);
    expect(ok.status).toBe(202);
    expect(ok.body.watermarked).toBe(true);
  });

  it('pro plan: premium template allowed, no watermark', async () => {
    const { agent, user } = await registerAgent(app);
    await setPlan(user.id, 'pro');
    const res = await create(agent, { templateId: await royalId() });
    expect(res.status).toBe(202);
    expect(res.body.watermarked).toBe(false);
  });

  it('expired paid plan falls back to free', async () => {
    const { agent, user } = await registerAgent(app);
    await setPlan(user.id, 'ultra', -1);
    expect((await create(agent, { templateId: await royalId() })).status).toBe(403);
  });

  it.each([['pro', 50], ['ultra', 100]] as const)('%s daily limit is %i', async (plan, limit) => {
    const { agent, user } = await registerAgent(app);
    await setPlan(user.id, plan);
    const t = await TemplateModel.findById(victoryId);
    await PosterUsageModel.insertMany(Array.from({ length: limit - 1 }, () => ({ userId: user.id, templateId: t!._id, plan })));
    expect((await create(agent)).status).toBe(202);
    const res = await create(agent);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('DAILY_LIMIT');
  });

  it('regenerating a premium-template poster after the plan lapses → 403', async () => {
    const { agent, user } = await registerAgent(app);
    await setPlan(user.id, 'pro');
    const id = (await create(agent, { templateId: await royalId() })).body.id;
    await PosterModel.updateOne({ _id: id }, { status: 'completed' });
    await setPlan(user.id, 'pro', -1);
    const res = await agent.post(`/api/posters/${id}/regenerate`).send({}).expect(403);
    expect(res.body.error.code).toBe('UPGRADE_REQUIRED');
  });
});

describe('POST /api/posters/:id/remove-watermark', () => {
  it('free plan → 403 UPGRADE_REQUIRED (reason watermark)', async () => {
    const { agent } = await registerAgent(app);
    const id = await completedPoster(agent);
    const res = await agent.post(`/api/posters/${id}/remove-watermark`).expect(403);
    expect(res.body.error).toMatchObject({ code: 'UPGRADE_REQUIRED', details: { reason: 'watermark' } });
  });

  it('after upgrading: re-queues with the same design, free of regeneration cost', async () => {
    const { agent, user } = await registerAgent(app);
    const id = await completedPoster(agent);
    await setPlan(user.id, 'pro');
    queue.enqueued = [];
    const res = await agent.post(`/api/posters/${id}/remove-watermark`).expect(202);
    expect(res.body).toMatchObject({ status: 'queued', watermarked: false, regenerationsLeft: 3 });
    expect(queue.enqueued).toEqual([id]);
    expect((await PosterModel.findById(id))!.reuseDesign).toBe(true);
    // Second call while queued → busy
    await agent.post(`/api/posters/${id}/remove-watermark`).expect(409);
  });

  it('other users get 404', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const id = await completedPoster(a.agent);
    await setPlan(b.user.id, 'pro');
    await b.agent.post(`/api/posters/${id}/remove-watermark`).expect(404);
  });
});

describe('poster sizes', () => {
  it('defaults to portrait; stores the chosen size; rejects unknown sizes', async () => {
    const { agent } = await registerAgent(app);
    expect((await create(agent)).body.size).toBe('portrait');
    const res = await create(agent, { size: 'story' });
    expect(res.status).toBe(202);
    expect(res.body.size).toBe('story');
    expect((await PosterModel.findById(res.body.id))!.size).toBe('story');
    expect((await create(agent, { size: 'a0' })).status).toBe(400);
  });
});

describe('GET /api/posters/:id/pdf', () => {
  async function completedWithImage(agent: ReturnType<typeof request.agent>, size = 'portrait') {
    const id = (await create(agent, { size })).body.id as string;
    const p = (await PosterModel.findById(id))!;
    const stored = await storage.uploadImage(await makeJpeg(900, 1200), { folder: `poster-maker/generated/${p.userId}`, publicId: id });
    await PosterModel.updateOne({ _id: id }, { status: 'completed', imagePublicId: stored.publicId });
    return id;
  }

  it('returns an A4 PDF by default, A3 on request, landscape page for landscape posters', async () => {
    const { agent } = await registerAgent(app);
    const id = await completedWithImage(agent);
    const res = await agent.get(`/api/posters/${id}/pdf`).expect(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(`attachment; filename="poster-${id}-a4.pdf"`);
    expect(renderer.pdfCalls.at(-1)).toEqual({ paper: 'a4', landscape: false });
    expect(renderer.calls.at(-1)).toContain('data:image/jpeg;base64,');

    const wide = await completedWithImage(agent, 'landscape');
    await agent.get(`/api/posters/${wide}/pdf?paper=a3`).expect(200);
    expect(renderer.pdfCalls.at(-1)).toEqual({ paper: 'a3', landscape: true });
    await agent.get(`/api/posters/${wide}/pdf?paper=letter`).expect(400);
  });

  it('not finished → 409 POSTER_NOT_READY; other users → 404', async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const pending = (await create(a.agent)).body.id;
    const res = await a.agent.get(`/api/posters/${pending}/pdf`).expect(409);
    expect(res.body.error.code).toBe('POSTER_NOT_READY');
    const done = await completedWithImage(a.agent);
    await b.agent.get(`/api/posters/${done}/pdf`).expect(404);
  });
});
