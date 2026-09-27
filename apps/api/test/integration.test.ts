import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { useTestDb } from './setup-db.js';
import { testEnv, registerAgent } from './helpers.js';
import { makeJpeg } from './fixtures.js';
import { buildRuntime } from '../src/runtime.js';
import { createApp } from '../src/http/app.js';
import { FakeRenderer } from '../src/render/fake-renderer.js';
import { seedTemplates } from '../scripts/seed-data.js';
import { TemplateModel } from '../src/models/template.model.js';

useTestDb();

describe('end-to-end API flow (fake AI, memory storage, fake renderer)', () => {
  it('upload → create → worker completes → poster has image', async () => {
    const rt = buildRuntime(testEnv(), pino({ level: 'silent' }), { renderer: new FakeRenderer() });
    const app = createApp(rt);
    await seedTemplates();
    const t = (await TemplateModel.findOne({ slug: 'election-campaign' }))!;
    const { agent } = await registerAgent(app);
    const photo = (await agent.post('/api/upload').attach('photo', await makeJpeg(700, 900), 'p.jpg').expect(201)).body.publicId;
    const created = await agent.post('/api/posters').send({
      templateId: t.id, photoIds: [photo],
      formData: { name: 'করিম', designation: 'প্রার্থী', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: 'ভোট দিন', tagline: '' },
    }).expect(202);
    await rt.jobQueue.onIdle();
    const res = await agent.get(`/api/posters/${created.body.id}`).expect(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.imageUrl).toMatch(/^\/api\/files\//);
    await agent.get(res.body.imageUrl).expect(200).expect('content-type', 'image/jpeg');
    await rt.renderer.close();
  });
});
