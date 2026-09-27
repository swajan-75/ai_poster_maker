import type { PosterStatus } from './enums.js';
import type { PaidPlan, PaymentStatus, Plan } from './subscription.js';

export interface AiCallStats { calls: number; successRate: number | null; avgLatencyMs: number | null }

export interface DailyPoint {
  /** YYYY-MM-DD in Asia/Dhaka. */
  date: string;
  posters: number;
  newUsers: number;
  revenueBdt: number;
}

export interface TemplateUsage { templateId: string; title: string; isFree: boolean; posters: number }

export interface AdminAnalyticsDTO {
  generatedAt: string;
  users: { total: number; newLast7d: number; blocked: number; byPlan: Record<Plan, number> };
  posters: {
    /** Every poster ever created, including deleted ones. */
    createdTotal: number;
    createdLast24h: number;
    createdLast7d: number;
    /** Posters that currently exist, by status. */
    byStatus: Record<PosterStatus, number>;
    /** failed / (completed + failed); null when nothing has finished. */
    failureRate: number | null;
  };
  revenue: {
    totalBdt: number;
    last30dBdt: number;
    paidCount: number;
    paymentsByStatus: Record<PaymentStatus, number>;
    paidByPlan: Record<PaidPlan, { count: number; amountBdt: number }>;
  };
  ai: { design: AiCallStats; background: AiCallStats };
  /** Last 14 days, oldest first, zero-filled. */
  daily: DailyPoint[];
  /** Most-used templates in the last 30 days. */
  topTemplates: TemplateUsage[];
}
