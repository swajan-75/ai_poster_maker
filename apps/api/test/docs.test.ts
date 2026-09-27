import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { makeTestDeps } from './helpers.js';

describe('api docs', () => {
  const app = createApp(makeTestDeps());

  it('GET /api-docs.json → 200 with an openapi spec', async () => {
    const res = await request(app).get('/api-docs.json').expect(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/api/auth/register']).toBeDefined();
  });

  it('GET /api-docs → 200 and serves the Swagger UI page', async () => {
    const res = await request(app).get('/api-docs/').expect(200);
    expect(res.text).toMatch(/swagger-ui/i);
  });
});
