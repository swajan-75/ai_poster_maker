import { randomBytes } from 'node:crypto';
import { isValidObjectId } from 'mongoose';
import {
  DEMO_BKASH_OTP, DEMO_BKASH_PIN, PLAN_PRICES_BDT, PLAN_RANK,
  type BkashExecuteInput, type PaidPlan, type PaymentDTO,
} from '@poster/shared';
import { AppError, conflict, notFound } from '../../lib/errors.js';
import { PaymentModel, type PaymentDoc } from '../../models/payment.model.js';
import { activatePlan, getUserPlan } from './subscription.service.js';

const CHECKOUT_TTL_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 3;

export function toPaymentDTO(p: PaymentDoc): PaymentDTO {
  return {
    id: p.id, plan: p.plan, amount: p.amount, currency: p.currency, method: p.method, status: p.status,
    trxId: p.trxId ?? null, wallet: p.wallet ?? null, expiresAt: p.expiresAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString(),
  };
}

const maskWallet = (w: string) => `${w.slice(0, 3)}*****${w.slice(-3)}`;
// bKash-style 10-char uppercase transaction id.
const newTrxId = () => randomBytes(8).readBigUInt64BE().toString(36).toUpperCase().padStart(10, '0').slice(-10);

export async function createCheckout(userId: string, plan: PaidPlan): Promise<PaymentDoc> {
  const current = await getUserPlan(userId);
  if (PLAN_RANK[current] > PLAN_RANK[plan])
    throw conflict('PLAN_DOWNGRADE', `You already have the ${current} plan`);
  return PaymentModel.create({
    userId, plan, amount: PLAN_PRICES_BDT[plan], expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
  });
}

export async function getPayment(id: string, userId: string): Promise<PaymentDoc> {
  if (!isValidObjectId(id)) throw notFound('Payment not found');
  const p = await PaymentModel.findOne({ _id: id, userId });
  if (!p) throw notFound('Payment not found');
  return p;
}

export function listPayments(userId: string): Promise<PaymentDoc[]> {
  return PaymentModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

async function assertOpen(p: PaymentDoc): Promise<void> {
  if (p.status !== 'pending') throw conflict('PAYMENT_CLOSED', 'This payment is no longer open');
  if (p.expiresAt <= new Date()) {
    await PaymentModel.updateOne({ _id: p._id, status: 'pending' }, { $set: { status: 'failed' } });
    throw conflict('PAYMENT_CLOSED', 'Payment session expired');
  }
}

/** Demo bKash "execute": accepts the sandbox OTP/PIN, then activates the plan. */
export async function executePayment(id: string, userId: string, input: BkashExecuteInput): Promise<PaymentDoc> {
  const p = await getPayment(id, userId);
  await assertOpen(p);

  if (input.otp !== DEMO_BKASH_OTP || input.pin !== DEMO_BKASH_PIN) {
    const failed = await PaymentModel.findOneAndUpdate(
      { _id: p._id, status: 'pending' }, { $inc: { failedAttempts: 1 } }, { new: true },
    );
    if (failed && failed.failedAttempts >= MAX_FAILED_ATTEMPTS)
      await PaymentModel.updateOne({ _id: p._id, status: 'pending' }, { $set: { status: 'failed' } });
    throw new AppError(402, 'PAYMENT_FAILED', 'Invalid OTP or PIN');
  }

  // Claim atomically so a double-submit can only activate the plan once.
  const paid = await PaymentModel.findOneAndUpdate(
    { _id: p._id, status: 'pending' },
    { $set: { status: 'completed', trxId: newTrxId(), wallet: maskWallet(input.wallet), paidAt: new Date() } },
    { new: true },
  );
  if (!paid) throw conflict('PAYMENT_CLOSED', 'This payment is no longer open');
  await activatePlan(userId, paid.plan);
  return paid;
}

export async function cancelPayment(id: string, userId: string): Promise<PaymentDoc> {
  const p = await getPayment(id, userId);
  const cancelled = await PaymentModel.findOneAndUpdate(
    { _id: p._id, status: 'pending' }, { $set: { status: 'cancelled' } }, { new: true },
  );
  if (!cancelled) throw conflict('PAYMENT_CLOSED', 'This payment is no longer open');
  return cancelled;
}
