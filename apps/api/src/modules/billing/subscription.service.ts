import { PLAN_FEATURES, SUBSCRIPTION_DAYS, isPaidPlan, type PaidPlan, type Plan, type SubscriptionDTO } from '@poster/shared';
import { UserModel } from '../../models/user.model.js';
import { PosterModel } from '../../models/poster.model.js';
import { unauthorized } from '../../lib/errors.js';

const DAY_MS = 24 * 60 * 60 * 1000;

interface PlanHolder { plan?: Plan | null; planExpiresAt?: Date | null }

/** The plan the user is entitled to right now: an expired paid plan counts as free. */
export function effectivePlan(u: PlanHolder, now = new Date()): Plan {
  const plan = u.plan ?? 'free';
  return isPaidPlan(plan) && u.planExpiresAt && u.planExpiresAt > now ? plan : 'free';
}

export function planExpiry(u: PlanHolder, now = new Date()): Date | null {
  return effectivePlan(u, now) === 'free' ? null : u.planExpiresAt ?? null;
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const u = await UserModel.findById(userId, { plan: 1, planExpiresAt: 1 });
  if (!u) throw unauthorized();
  return effectivePlan(u);
}

export function postersToday(userId: string): Promise<number> {
  return PosterModel.countDocuments({ userId, createdAt: { $gte: new Date(Date.now() - DAY_MS) } });
}

export async function getSubscription(userId: string): Promise<SubscriptionDTO> {
  const u = await UserModel.findById(userId, { plan: 1, planExpiresAt: 1 });
  if (!u) throw unauthorized();
  const plan = effectivePlan(u);
  const features = PLAN_FEATURES[plan];
  return {
    plan,
    expiresAt: planExpiry(u)?.toISOString() ?? null,
    dailyLimit: features.dailyPosters,
    usedToday: await postersToday(userId),
    watermark: features.watermark,
  };
}

/**
 * Grants `plan` for SUBSCRIPTION_DAYS. Renewing the same active plan stacks onto the current end date;
 * switching plans (or renewing after expiry) starts from now. Single atomic update, so two payments
 * completing at once both count.
 */
export async function activatePlan(userId: string, plan: PaidPlan, now = new Date()): Promise<void> {
  const period = SUBSCRIPTION_DAYS * DAY_MS;
  await UserModel.updateOne({ _id: userId }, [
    {
      $set: {
        planExpiresAt: {
          $cond: [
            { $and: [{ $eq: ['$plan', plan] }, { $gt: ['$planExpiresAt', now] }] },
            { $add: ['$planExpiresAt', period] },
            new Date(now.getTime() + period),
          ],
        },
        plan,
      },
    },
  ]);
}
