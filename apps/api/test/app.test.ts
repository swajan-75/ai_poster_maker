import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { AppError } from '../src/lib/errors.js';
import { makeTestDeps } from './helpers.js';

describe('app skeleton', () => {
  const app = createApp(makeTestDeps());

  it('GET /health → 200', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });

  it('sets security headers and a request id', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toMatch(/\S+/);
  });

  it('unknown route → 404 NOT_FOUND envelope', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('malformed JSON → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/anything').set('Content-Type', 'application/json').send('{bad').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('AppError and unknown errors are mapped; no stack leaks', async () => {
    const app2 = createApp(makeTestDeps(), (r) => {
      r.get('/boom-app', () => { throw new AppError(409, 'POSTER_BUSY', 'busy'); });
      r.get('/boom-raw', () => { throw new Error('secret internals'); });
    });
    const a = await request(app2).get('/boom-app').expect(409);
    expect(a.body).toEqual({ error: { code: 'POSTER_BUSY', message: 'busy' } });
    const b = await request(app2).get('/boom-raw').expect(500);
    expect(b.body).toEqual({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
  });
});
