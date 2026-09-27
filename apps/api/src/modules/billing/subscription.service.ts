import { PLAN_FEATURES, SUBSCRIPTION_DAYS, isPaidPlan, type PaidPlan, type Plan, type SubscriptionDTO } from '@poster/shared';
import { UserModel } from '../../models/user.model.js';
import { PosterUsageModel } from '../../models/poster-usage.model.js';
import { AppError, unauthorized } from '../../lib/errors.js';

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

// The daily quota is a rolling 24-hour window: each poster frees its slot 24h after it was created.
const windowStart = () => new Date(Date.now() - DAY_MS);

/** Posters created in the last 24h, including ones the user has since deleted. */
export function postersToday(userId: string): Promise<number> {
  return PosterUsageModel.countDocuments({ userId, createdAt: { $gte: windowStart() } });
}

/** When the oldest poster in the window drops out, i.e. when one more slot opens up. */
export async function nextSlotAt(userId: string): Promise<Date | null> {
  const oldest = await PosterUsageModel.findOne({ userId, createdAt: { $gte: windowStart() } }, { createdAt: 1 }).sort({ createdAt: 1 });
  return oldest ? new Date(oldest.createdAt.getTime() + DAY_MS) : null;
}

/**
 * Claims one quota slot before the poster is created. Reserving first and counting after (only
 * rows up to our own) means two simultaneous requests can't both squeeze past the limit.
 * Returns the usage id so the caller can attach the poster id, or release it on failure.
 */
export async function reservePosterSlot(userId: string, templateId: string, plan: Plan): Promise<string> {
  const limit = PLAN_FEATURES[plan].dailyPosters;
  const usage = await PosterUsageModel.create({ userId, templateId, plan });
  const used = await PosterUsageModel.countDocuments({ userId, createdAt: { $gte: windowStart() }, _id: { $lte: usage._id } });
  if (used > limit) {
    await PosterUsageModel.deleteOne({ _id: usage._id });
    const resetsAt = await nextSlotAt(userId);
    throw new AppError(429, 'DAILY_LIMIT', 'Daily poster limit reached', { plan, limit, resetsAt: resetsAt?.toISOString() ?? null });
  }
  return usage.id as string;
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
    resetsAt: (await nextSlotAt(userId))?.toISOString() ?? null,
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
