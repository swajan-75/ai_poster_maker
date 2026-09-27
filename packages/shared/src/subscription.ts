import { z } from 'zod';

export const PLANS = ['free', 'pro', 'ultra'] as const;
export type Plan = (typeof PLANS)[number];

export const PAID_PLANS = ['pro', 'ultra'] as const satisfies readonly Plan[];
export type PaidPlan = (typeof PAID_PLANS)[number];

export interface PlanFeatures { dailyPosters: number; watermark: boolean; premiumTemplates: boolean }

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: { dailyPosters: 3, watermark: true, premiumTemplates: false },
  pro: { dailyPosters: 50, watermark: false, premiumTemplates: true },
  ultra: { dailyPosters: 100, watermark: false, premiumTemplates: true },
};

/** Monthly price in BDT. */
export const PLAN_PRICES_BDT: Record<PaidPlan, number> = { pro: 199, ultra: 349 };

export const SUBSCRIPTION_DAYS = 30;

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, ultra: 2 };

export const isPaidPlan = (p: Plan): p is PaidPlan => p !== 'free';

export interface SubscriptionDTO {
  plan: Plan;
  /** ISO date the paid plan ends; null on the free plan. */
  expiresAt: string | null;
  dailyLimit: number;
  usedToday: number;
  watermark: boolean;
}

export const checkoutSchema = z.object({ plan: z.enum(PAID_PLANS) });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Demo bKash wallet: any valid-looking BD mobile number. OTP and PIN mirror the bKash sandbox values.
export const DEMO_BKASH_OTP = '123456';
export const DEMO_BKASH_PIN = '12121';

export const bkashExecuteSchema = z.object({
  wallet: z.string().trim().regex(/^01[3-9]\d{8}$/),
  otp: z.string().trim().regex(/^\d{6}$/),
  pin: z.string().trim().regex(/^\d{5}$/),
});
export type BkashExecuteInput = z.infer<typeof bkashExecuteSchema>;

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'cancelled'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentDTO {
  id: string;
  plan: PaidPlan;
  amount: number;
  currency: 'BDT';
  method: 'bkash';
  status: PaymentStatus;
  trxId: string | null;
  wallet: string | null;
  /** Checkout session deadline while pending. */
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface ExecutePaymentResponse { payment: PaymentDTO; subscription: SubscriptionDTO }
