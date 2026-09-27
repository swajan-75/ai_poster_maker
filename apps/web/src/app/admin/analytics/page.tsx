'use client';
import { PAYMENT_STATUSES, PLANS, POSTER_STATUSES, type AiCallStats, type DailyPoint } from '@poster/shared';
import { useAdminAnalytics } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { formatDate, formatNumber, useLocale, useT } from '@/lib/i18n';
import { BarChart, BarList } from '@/components/admin/Charts';
import { StatusBadge } from '@/components/StatusBadge';
import { PlanBadge } from '@/components/PlanBadge';

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <p className="text-sm font-medium text-ink/55">{label}</p>
      <p className="font-display text-3xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-ink/55">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const t = useT();
  const a = t.analytics;
  const [locale] = useLocale();
  const { data, isLoading, error, refetch, isFetching } = useAdminAnalytics();

  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>;
  if (error || !data) return <p role="alert" className="card p-4 text-rally">{errorMessage(error)}</p>;

  const num = (n: number) => formatNumber(n, locale);
  const taka = (n: number) => `৳${num(n)}`;
  const pct = (r: number | null) => (r === null ? '—' : `${num(Math.round(r * 100))}%`);
  const dayLabel = (iso: string) => {
    const [, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2000, m! - 1, d!)));
  };
  const series = (pick: (d: DailyPoint) => number) =>
    data.daily.map((d) => ({ key: d.date, label: dayLabel(d.date), value: pick(d) }));
  const tableLabels = { show: a.showTable, date: a.date, value: a.value };
  const { byPlan } = data.users;

  const aiRow = (name: string, s: AiCallStats) => (
    <tr className="border-t border-line">
      <td className="py-2 font-medium">{name}</td>
      <td className="py-2 text-right tabular-nums">{num(s.calls)}</td>
      <td className="py-2 text-right tabular-nums">{pct(s.successRate)}</td>
      <td className="py-2 text-right tabular-nums">{s.avgLatencyMs === null ? '—' : `${num(Math.round(s.avgLatencyMs / 100) / 10)}s`}</td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/55">
        <span>{a.updated(formatDate(new Date(data.generatedAt), locale))}</span>
        <button className="btn btn-ghost px-4 py-1.5 text-xs" disabled={isFetching} onClick={() => void refetch()}>{a.refresh}</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={a.users} value={num(data.users.total)} sub={a.usersSub(data.users.newLast7d, data.users.blocked)} />
        <StatTile label={a.posters} value={num(data.posters.createdTotal)}
          sub={`${a.postersSub(data.posters.createdLast24h, data.posters.createdLast7d)} · ${a.postersNote}`} />
        <StatTile label={a.revenue} value={taka(data.revenue.totalBdt)} sub={a.revenueSub(taka(data.revenue.last30dBdt), data.revenue.paidCount)} />
        <StatTile label={a.subscribers} value={num(byPlan.pro + byPlan.ultra)} sub={a.subscribersSub(byPlan.pro, byPlan.ultra)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarChart title={a.dailyPosters} subtitle={a.last14} data={series((d) => d.posters)} format={num} tableLabels={tableLabels} />
        <BarChart title={a.dailyUsers} subtitle={a.last14} data={series((d) => d.newUsers)} format={num} tableLabels={tableLabels} />
        <BarChart title={a.dailyRevenue} subtitle={a.last14} data={series((d) => d.revenueBdt)} format={taka} tableLabels={tableLabels} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={a.topTemplates}>
          {data.topTemplates.length === 0 ? <p className="text-sm text-ink/55">{a.noData}</p> : (
            <BarList format={num} rows={data.topTemplates.map((tpl) => ({
              key: tpl.templateId, value: tpl.posters,
              label: <span className="flex items-center gap-2">{tpl.title}{!tpl.isFree && <span className="rounded-full bg-marigold px-1.5 py-0.5 text-[10px] font-bold text-ink">{t.upgrade.premiumBadge}</span>}</span>,
            }))} />
          )}
        </Panel>
        <Panel title={a.planMix}>
          <BarList format={num} rows={PLANS.map((p) => ({ key: p, label: <PlanBadge plan={p} />, value: byPlan[p] }))} />
        </Panel>
        <Panel title={a.posterStatus}>
          <ul className="grid grid-cols-2 gap-3">
            {POSTER_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2">
                <StatusBadge status={s} /><span className="font-semibold tabular-nums">{num(data.posters.byStatus[s])}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink/60">{a.failureRate(pct(data.posters.failureRate))}</p>
        </Panel>
        <Panel title={a.payments}>
          <ul className="grid grid-cols-2 gap-3">
            {PAYMENT_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2 text-sm">
                <span>{a.paymentStatus[s]}</span><span className="font-semibold tabular-nums">{num(data.revenue.paymentsByStatus[s])}</span>
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-1 text-sm">
            {(['pro', 'ultra'] as const).map((p) => (
              <li key={p} className="flex items-center justify-between">
                <PlanBadge plan={p} />
                <span className="tabular-nums text-ink/70">{num(data.revenue.paidByPlan[p].count)} × · {taka(data.revenue.paidByPlan[p].amountBdt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={a.ai}>
        <table className="w-full text-left text-sm">
          <thead className="text-ink/55">
            <tr><th className="py-1" /><th className="py-1 text-right">{a.calls}</th><th className="py-1 text-right">{a.success}</th><th className="py-1 text-right">{a.latency}</th></tr>
          </thead>
          <tbody>{aiRow(a.aiDesign, data.ai.design)}{aiRow(a.aiBackground, data.ai.background)}</tbody>
        </table>
      </Panel>
    </div>
  );
}
