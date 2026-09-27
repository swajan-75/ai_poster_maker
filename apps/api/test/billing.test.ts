import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { DEMO_BKASH_OTP, DEMO_BKASH_PIN, PLAN_PRICES_BDT } from '@poster/shared';
import { useTestDb } from './setup-db.js';
import { createApp } from '../src/http/app.js';
import { makeTestDeps, registerAgent } from './helpers.js';
import { UserModel } from '../src/models/user.model.js';
import { PaymentModel } from '../src/models/payment.model.js';

useTestDb();

let app: ReturnType<typeof createApp>;
beforeEach(() => { app = createApp(makeTestDeps()); });

const DAY = 86_400_000;
const good = { wallet: '01712345678', otp: DEMO_BKASH_OTP, pin: DEMO_BKASH_PIN };
type Agent = ReturnType<typeof request.agent>;
const checkout = (agent: Agent, plan: string) => agent.post('/api/billing/checkout').send({ plan });

describe('billing', () => {
  it('new users are on the free plan', async () => {
    const { agent, user } = await registerAgent(app);
    expect(user).toMatchObject({ plan: 'free', planExpiresAt: null });
    const sub = await agent.get('/api/billing/subscription').expect(200);
    expect(sub.body).toEqual({ plan: 'free', expiresAt: null, dailyLimit: 3, usedToday: 0, resetsAt: null, watermark: true });
  });

  it('checkout → pending bKash payment with the plan price', async () => {
    const { agent } = await registerAgent(app);
    const res = await checkout(agent, 'pro').expect(201);
    expect(res.body).toMatchObject({ plan: 'pro', amount: PLAN_PRICES_BDT.pro, currency: 'BDT', method: 'bkash', status: 'pending', trxId: null });
    await checkout(agent, 'free').expect(400);
  });

  it('execute with demo OTP/PIN → completed, plan active for 30 days', async () => {
    const { agent } = await registerAgent(app);
    const id = (await checkout(agent, 'ultra')).body.id;
    const res = await agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(200);
    expect(res.body.payment).toMatchObject({ status: 'completed', wallet: '017*****678' });
    expect(res.body.payment.trxId).toMatch(/^[0-9A-Z]{10}$/);
    expect(res.body.subscription).toMatchObject({ plan: 'ultra', dailyLimit: 100, watermark: false });
    const days = (new Date(res.body.subscription.expiresAt).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.plan).toBe('ultra');
    // Paying twice for the same session is rejected.
    const again = await agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(409);
    expect(again.body.error.code).toBe('PAYMENT_CLOSED');
  });

  it('renewing the same plan stacks another 30 days', async () => {
    const { agent } = await registerAgent(app);
    for (let i = 0; i < 2; i++) {
      const id = (await checkout(agent, 'pro')).body.id;
      await agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(200);
    }
    const sub = (await agent.get('/api/billing/subscription')).body;
    expect((new Date(sub.expiresAt).getTime() - Date.now()) / DAY).toBeGreaterThan(59.9);
  });

  it('cannot buy a lower plan while a higher one is active', async () => {
    const { agent, user } = await registerAgent(app);
    await UserModel.updateOne({ _id: user.id }, { plan: 'ultra', planExpiresAt: new Date(Date.now() + DAY) });
    const res = await checkout(agent, 'pro').expect(409);
    expect(res.body.error.code).toBe('PLAN_DOWNGRADE');
  });

  it('wrong OTP/PIN → 402; third failure closes the payment', async () => {
    const { agent } = await registerAgent(app);
    const id = (await checkout(agent, 'pro')).body.id;
    for (let i = 0; i < 3; i++) {
      const res = await agent.post(`/api/billing/payments/${id}/execute`).send({ ...good, pin: '00000' }).expect(402);
      expect(res.body.error.code).toBe('PAYMENT_FAILED');
    }
    expect((await PaymentModel.findById(id))!.status).toBe('failed');
    await agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(409);
    expect((await agent.get('/api/auth/me')).body.user.plan).toBe('free');
  });

  it('rejects malformed wallet numbers', async () => {
    const { agent } = await registerAgent(app);
    const id = (await checkout(agent, 'pro')).body.id;
    await agent.post(`/api/billing/payments/${id}/execute`).send({ ...good, wallet: '12345' }).expect(400);
  });

  it('expired checkout session → 409 PAYMENT_CLOSED', async () => {
    const { agent } = await registerAgent(app);
    const id = (await checkout(agent, 'pro')).body.id;
    await PaymentModel.updateOne({ _id: id }, { expiresAt: new Date(Date.now() - 1000) });
    await agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(409);
    expect((await PaymentModel.findById(id))!.status).toBe('failed');
  });

  it('cancel closes a pending payment', async () => {
    const { agent } = await registerAgent(app);
    const id = (await checkout(agent, 'pro')).body.id;
    const res = await agent.post(`/api/billing/payments/${id}/cancel`).expect(200);
    expect(res.body.status).toBe('cancelled');
    await agent.post(`/api/billing/payments/${id}/cancel`).expect(409);
  });

  it("other users' payments are 404; anonymous is 401", async () => {
    const a = await registerAgent(app);
    const b = await registerAgent(app);
    const id = (await checkout(a.agent, 'pro')).body.id;
    await b.agent.get(`/api/billing/payments/${id}`).expect(404);
    await b.agent.post(`/api/billing/payments/${id}/execute`).send(good).expect(404);
    await b.agent.get('/api/billing/payments/not-an-id').expect(404);
    await request(app).get('/api/billing/subscription').expect(401);
    const list = await a.agent.get('/api/billing/payments').expect(200);
    expect(list.body.items).toHaveLength(1);
  });
});
