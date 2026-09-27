import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps } from './helpers.js';
import { SEED_TEMPLATES, seedTemplates } from '../scripts/seed-data.js';
import { TemplateModel } from '../src/models/template.model.js';

useTestDb();
const app = createApp(makeTestDeps());

describe('templates', () => {
  it('seed is idempotent and creates every seed template', async () => {
    await seedTemplates();
    await seedTemplates();
    expect(await TemplateModel.countDocuments()).toBe(SEED_TEMPLATES.length);
  });

  it('seeded defaultDesign references its own palette and motif', async () => {
    await seedTemplates();
    for (const t of await TemplateModel.find()) {
      expect(t.palettes.map((p) => p.id)).toContain(t.defaultDesign.paletteId);
      expect(t.motifs).toContain(t.defaultDesign.motif);
    }
  });

  it('GET /api/templates lists active templates and filters by occasion', async () => {
    await seedTemplates();
    await TemplateModel.updateOne({ slug: 'election-campaign' }, { isActive: false });
    const all = await request(app).get('/api/templates').expect(200);
    expect(all.body.items).toHaveLength(SEED_TEMPLATES.length - 1);
    const v = await request(app).get('/api/templates?occasion=victory_day').expect(200);
    expect(v.body.items.map((t: { slug: string }) => t.slug).sort()).toEqual(['victory-day-classic', 'victory-day-royal']);
    const royal = v.body.items.find((t: { slug: string }) => t.slug === 'victory-day-royal');
    expect(royal.isFree).toBe(false);
  });

  it('invalid occasion → 400', async () => {
    await request(app).get('/api/templates?occasion=bogus').expect(400);
  });

  it('GET /api/templates/:id → DTO; invalid or inactive id → 404', async () => {
    await seedTemplates();
    const t = await TemplateModel.findOne({ slug: 'tribute-mourning' });
    const res = await request(app).get(`/api/templates/${t!._id}`).expect(200);
    expect(res.body).toMatchObject({ slug: 'tribute-mourning', photoSlots: 1, layoutKey: 'tribute' });
    expect(res.body.defaultDesign).toBeUndefined();
    await request(app).get('/api/templates/not-an-id').expect(404);
    await TemplateModel.updateOne({ _id: t!._id }, { isActive: false });
    await request(app).get(`/api/templates/${t!._id}`).expect(404);
  });
});
