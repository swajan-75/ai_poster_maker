import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps, registerAgent } from './helpers.js';
import { UserModel } from '../src/models/user.model.js';

useTestDb();
const app = createApp(makeTestDeps());

describe('auth', () => {
  it('register sets an httpOnly cookie and returns public user', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'করিম', email: 'K@x.com', password: 'password123' }).expect(201);
    expect(res.body.user).toMatchObject({ name: 'করিম', email: 'k@x.com', role: 'user' });
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/pm_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('stores a bcrypt hash, not the password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'ক খ', email: 'h@x.com', password: 'password123' });
    const u = await UserModel.findOne({ email: 'h@x.com' }).lean();
    expect(u?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('duplicate email → 409 EMAIL_TAKEN', async () => {
    await registerAgent(app, { email: 'dup@x.com' });
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'কখ', email: 'DUP@x.com', password: 'password123' }).expect(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('login with wrong password and unknown email give the same 401', async () => {
    await registerAgent(app, { email: 'l@x.com' });
    const a = await request(app).post('/api/auth/login').send({ email: 'l@x.com', password: 'wrongpass' }).expect(401);
    const b = await request(app).post('/api/auth/login').send({ email: 'none@x.com', password: 'wrongpass' }).expect(401);
    expect(a.body).toEqual(b.body);
    expect(a.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('me requires auth; works with cookie; logout clears it', async () => {
    await request(app).get('/api/auth/me').expect(401);
    const { agent, user } = await registerAgent(app);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.id).toBe(user.id);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('tampered token → 401', async () => {
    await request(app).get('/api/auth/me').set('Cookie', 'pm_token=abc.def.ghi').expect(401);
  });

  it('invalid register body → 400 with field details', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'email' })]));
  });
});
