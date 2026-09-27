import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps, registerAgent } from './helpers.js';
import { seedTemplates, SEED_TEMPLATES } from '../scripts/seed-data.js';
import { TemplateModel } from '../src/models/template.model.js';
import { UserModel } from '../src/models/user.model.js';

useTestDb();
const app = createApp(makeTestDeps());

async function makeAdmin(overrides: Partial<{ email: string }> = {}) {
  const a = await registerAgent(app, overrides);
  await UserModel.updateOne({ _id: a.user.id }, { role: 'admin' });
  // role is baked into the JWT → re-login to pick up admin
  await a.agent.post('/api/auth/login').send({ email: a.user.email, password: 'password123' }).expect(200);
  return a;
}

const newTemplate = {
  slug: 'new-occasion', title: 'নতুন টেমপ্লেট', occasion: 'greetings', layoutKey: 'victory', photoSlots: 1,
  thumbnailUrl: '/templates/new.png', defaultHeadline: 'শুভেচ্ছা',
  palettes: [{ id: 'a', name: 'A', primary: '#111111', secondary: '#222222', accent: '#333333', text: '#ffffff', footerBg: '#000000' }],
  motifs: ['doves'],
  defaultDesign: { paletteId: 'a', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
};

describe('admin: access control', () => {
  it('non-admin gets 403 on every admin route', async () => {
    const u = await registerAgent(app);
    await u.agent.get('/api/admin/templates').expect(403);
    await u.agent.post('/api/admin/templates').send(newTemplate).expect(403);
    await u.agent.get('/api/admin/posters').expect(403);
    await u.agent.get('/api/admin/users').expect(403);
    await u.agent.patch(`/api/admin/users/${u.user.id}/block`).expect(403);
  });

  it('logged-out gets 401', async () => {
    await request(app).get('/api/admin/templates').expect(401);
  });
});

describe('admin: templates', () => {
  it('CRUD round trip: create, list (incl. inactive), update, soft-delete', async () => {
    const admin = await makeAdmin();
    const created = await admin.agent.post('/api/admin/templates').send(newTemplate).expect(201);
    expect(created.body).toMatchObject({ slug: 'new-occasion', isActive: true, motifs: ['doves'] });

    const patched = await admin.agent.patch(`/api/admin/templates/${created.body.id}`).send({ title: 'পরিবর্তিত' }).expect(200);
    expect(patched.body.title).toBe('পরিবর্তিত');

    await admin.agent.delete(`/api/admin/templates/${created.body.id}`).expect(204);
    const t = await TemplateModel.findById(created.body.id);
    expect(t!.isActive).toBe(false);

    const list = await admin.agent.get('/api/admin/templates').expect(200);
    expect(list.body.items.map((x: { id: string }) => x.id)).toContain(created.body.id);
    expect(list.body.items.find((x: { id: string }) => x.id === created.body.id).isActive).toBe(false);
  });

  it('duplicate slug → 409 SLUG_TAKEN', async () => {
    const admin = await makeAdmin();
    await admin.agent.post('/api/admin/templates').send(newTemplate).expect(201);
    const res = await admin.agent.post('/api/admin/templates').send(newTemplate).expect(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it('invalid body → 400', async () => {
    const admin = await makeAdmin();
    await admin.agent.post('/api/admin/templates').send({ slug: 'x' }).expect(400);
  });
});

describe('admin: moderation queue', () => {
  it('lists posters across all users with owner info and status filter', async () => {
    const admin = await makeAdmin();
    await seedTemplates();
    const template = await TemplateModel.findOne({ slug: SEED_TEMPLATES[0]!.slug });
    const owner = await registerAgent(app);
    const { PosterModel } = await import('../src/models/poster.model.js');
    await PosterModel.create({
      userId: owner.user.id, templateId: template!._id, formData: { name: 'ক', designation: 'খ', organization: 'গ', district: 'ঘ', headline: 'ঙ' },
      photoIds: ['x'], status: 'completed',
    });

    const res = await admin.agent.get('/api/admin/posters').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({ ownerEmail: owner.user.email, status: 'completed' });

    const filtered = await admin.agent.get('/api/admin/posters?status=failed').expect(200);
    expect(filtered.body.total).toBe(0);
  });
});

describe('admin: user block/flag', () => {
  it('lists, blocks and unblocks a user; blocked user cannot log in', async () => {
    const admin = await makeAdmin();
    const target = await registerAgent(app);

    const list = await admin.agent.get('/api/admin/users').expect(200);
    expect(list.body.items.map((u: { id: string }) => u.id)).toContain(target.user.id);

    await admin.agent.patch(`/api/admin/users/${target.user.id}/block`).expect(204);
    await request(app).post('/api/auth/login').send({ email: target.user.email, password: 'password123' }).expect(403);

    const blockedList = await admin.agent.get('/api/admin/users?blocked=true').expect(200);
    expect(blockedList.body.items.map((u: { id: string }) => u.id)).toContain(target.user.id);

    await admin.agent.patch(`/api/admin/users/${target.user.id}/unblock`).expect(204);
    await request(app).post('/api/auth/login').send({ email: target.user.email, password: 'password123' }).expect(200);
  });

  it('an admin cannot block their own account', async () => {
    const admin = await makeAdmin();
    await admin.agent.patch(`/api/admin/users/${admin.user.id}/block`).expect(403);
  });
});
