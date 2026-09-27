import {
  PAID_PLANS, PAYMENT_STATUSES, POSTER_STATUSES,
  type AdminAnalyticsDTO, type AiCallStats, type DailyPoint, type PaidPlan, type PaymentStatus, type PosterStatus,
} from '@poster/shared';
import { UserModel } from '../../models/user.model.js';
import { PosterModel } from '../../models/poster.model.js';
import { PosterUsageModel } from '../../models/poster-usage.model.js';
import { PaymentModel } from '../../models/payment.model.js';
import { GenerationLogModel } from '../../models/generation-log.model.js';
import { TemplateModel } from '../../models/template.model.js';

const TZ = 'Asia/Dhaka';
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_DAYS = 14;
const TOP_TEMPLATES = 5;

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const byDay = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } };

type Bucket<K extends string = string> = { _id: K; n: number; sum?: number };
const toMap = <K extends string>(rows: Bucket<K>[], field: 'n' | 'sum' = 'n') =>
  new Map(rows.map((r) => [r._id, r[field] ?? 0]));

async function aiStats(kind: 'design' | 'background', since: Date): Promise<AiCallStats> {
  const [r] = await GenerationLogModel.aggregate<{ calls: number; ok: number; latency: number }>([
    { $match: { kind, createdAt: { $gte: since } } },
    { $group: { _id: null, calls: { $sum: 1 }, ok: { $sum: { $cond: ['$success', 1, 0] } }, latency: { $avg: '$latencyMs' } } },
  ]);
  if (!r) return { calls: 0, successRate: null, avgLatencyMs: null };
  return { calls: r.calls, successRate: r.ok / r.calls, avgLatencyMs: Math.round(r.latency) };
}

export async function getAnalytics(now = new Date()): Promise<AdminAnalyticsDTO> {
  const ago = (days: number) => new Date(now.getTime() - days * DAY_MS);
  // Start of the first bucket day, with a day of slack; zero-filling below trims to exactly DAILY_DAYS.
  const dailySince = ago(DAILY_DAYS + 1);
  const paid = { status: 'completed' as const };

  const [
    usersTotal, usersNew7d, usersBlocked, activePaid,
    createdTotal, created24h, created7d, statusRows,
    revenueRows, revenue30d, paymentStatusRows,
    design, background,
    dailyPosters, dailyUsers, dailyRevenue, topRows,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ createdAt: { $gte: ago(7) } }),
    UserModel.countDocuments({ isBlocked: true }),
    UserModel.aggregate<Bucket<PaidPlan>>([
      { $match: { plan: { $in: PAID_PLANS }, planExpiresAt: { $gt: now } } },
      { $group: { _id: '$plan', n: { $sum: 1 } } },
    ]),
    PosterUsageModel.countDocuments(),
    PosterUsageModel.countDocuments({ createdAt: { $gte: ago(1) } }),
    PosterUsageModel.countDocuments({ createdAt: { $gte: ago(7) } }),
    PosterModel.aggregate<Bucket<PosterStatus>>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    PaymentModel.aggregate<Bucket<PaidPlan>>([
      { $match: paid },
      { $group: { _id: '$plan', n: { $sum: 1 }, sum: { $sum: '$amount' } } },
    ]),
    PaymentModel.aggregate<{ sum: number }>([
      { $match: { ...paid, paidAt: { $gte: ago(30) } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    PaymentModel.aggregate<Bucket<PaymentStatus>>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    aiStats('design', ago(30)),
    aiStats('background', ago(30)),
    PosterUsageModel.aggregate<Bucket>([
      { $match: { createdAt: { $gte: dailySince } } },
      { $group: { _id: byDay, n: { $sum: 1 } } },
    ]),
    UserModel.aggregate<Bucket>([
      { $match: { createdAt: { $gte: dailySince } } },
      { $group: { _id: byDay, n: { $sum: 1 } } },
    ]),
    PaymentModel.aggregate<Bucket>([
      { $match: { ...paid, paidAt: { $gte: dailySince } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: TZ } }, n: { $sum: 1 }, sum: { $sum: '$amount' } } },
    ]),
    PosterUsageModel.aggregate<{ _id: unknown; n: number }>([
      { $match: { createdAt: { $gte: ago(30) } } },
      { $group: { _id: '$templateId', n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: TOP_TEMPLATES },
    ]),
  ]);

  const paidPlans = toMap(activePaid);
  const pro = paidPlans.get('pro') ?? 0;
  const ultra = paidPlans.get('ultra') ?? 0;

  const statuses = toMap(statusRows);
  const byStatus = Object.fromEntries(POSTER_STATUSES.map((s) => [s, statuses.get(s) ?? 0])) as Record<PosterStatus, number>;
  const finished = byStatus.completed + byStatus.failed;

  const revCount = toMap(revenueRows);
  const revSum = toMap(revenueRows, 'sum');
  const paidByPlan = Object.fromEntries(PAID_PLANS.map((p) => [p, { count: revCount.get(p) ?? 0, amountBdt: revSum.get(p) ?? 0 }])) as
    AdminAnalyticsDTO['revenue']['paidByPlan'];
  const payStatus = toMap(paymentStatusRows);

  const posterDays = toMap(dailyPosters);
  const userDays = toMap(dailyUsers);
  const revenueDays = toMap(dailyRevenue, 'sum');
  const daily: DailyPoint[] = Array.from({ length: DAILY_DAYS }, (_, i) => {
    const date = dayKey(ago(DAILY_DAYS - 1 - i));
    return { date, posters: posterDays.get(date) ?? 0, newUsers: userDays.get(date) ?? 0, revenueBdt: revenueDays.get(date) ?? 0 };
  });

  const templates = await TemplateModel.find({ _id: { $in: topRows.map((r) => r._id) } }, { title: 1, isFree: 1 });
  const tplById = new Map(templates.map((t) => [t._id.toString(), t]));
  const topTemplates = topRows.map((r) => {
    const id = String(r._id);
    const t = tplById.get(id);
    return { templateId: id, title: t?.title ?? '—', isFree: t?.isFree ?? true, posters: r.n };
  });

  return {
    generatedAt: now.toISOString(),
    users: { total: usersTotal, newLast7d: usersNew7d, blocked: usersBlocked, byPlan: { free: usersTotal - pro - ultra, pro, ultra } },
    posters: {
      createdTotal, createdLast24h: created24h, createdLast7d: created7d, byStatus,
      failureRate: finished ? byStatus.failed / finished : null,
    },
    revenue: {
      totalBdt: PAID_PLANS.reduce((s, p) => s + paidByPlan[p].amountBdt, 0),
      last30dBdt: revenue30d[0]?.sum ?? 0,
      paidCount: PAID_PLANS.reduce((s, p) => s + paidByPlan[p].count, 0),
      paymentsByStatus: Object.fromEntries(PAYMENT_STATUSES.map((s) => [s, payStatus.get(s) ?? 0])) as Record<PaymentStatus, number>,
      paidByPlan,
    },
    ai: { design, background },
    daily,
    topTemplates,
  };
}
