import { Router } from 'express';
import { bkashExecuteSchema, checkoutSchema, type ExecutePaymentResponse } from '@poster/shared';
import type { AppDeps } from '../../runtime-types.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { validateBody } from '../../http/middleware/validate.js';
import { cancelPayment, createCheckout, executePayment, getPayment, listPayments, toPaymentDTO } from './billing.service.js';
import { getSubscription } from './subscription.service.js';

export function billingRouter({ env }: AppDeps): Router {
  const r = Router();
  r.use(requireAuth(env));

  r.get('/subscription', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(await getSubscription(req.user!.id));
  });

  r.post('/checkout', validateBody(checkoutSchema), async (req, res) => {
    res.status(201).json(toPaymentDTO(await createCheckout(req.user!.id, req.body.plan)));
  });

  r.get('/payments', async (req, res) => {
    res.json({ items: (await listPayments(req.user!.id)).map(toPaymentDTO) });
  });

  r.get('/payments/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(toPaymentDTO(await getPayment(String(req.params.id), req.user!.id)));
  });

  r.post('/payments/:id/execute', validateBody(bkashExecuteSchema), async (req, res) => {
    const payment = await executePayment(String(req.params.id), req.user!.id, req.body);
    const body: ExecutePaymentResponse = { payment: toPaymentDTO(payment), subscription: await getSubscription(req.user!.id) };
    res.json(body);
  });

  r.post('/payments/:id/cancel', async (req, res) => {
    res.json(toPaymentDTO(await cancelPayment(String(req.params.id), req.user!.id)));
  });

  return r;
}
