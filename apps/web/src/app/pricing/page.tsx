'use client';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PLAN_FEATURES, PLAN_PRICES_BDT, PLAN_RANK, PLANS, isPaidPlan, type Plan } from '@poster/shared';
import { useCheckout, useMe, useSubscription } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { formatDate, formatNumber, useLocale, useT } from '@/lib/i18n';
import { CrownIcon } from '@/components/UpgradePrompt';

const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : null);

function Feature({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${ok ? 'text-ink/80' : 'text-ink/45'}`}>
      <span aria-hidden="true" className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${ok ? 'bg-brand text-white' : 'bg-ink/10 text-ink/50'}`}>
        {ok ? '✓' : '–'}
      </span>
      {children}
    </li>
  );
}

function PricingContent() {
  const t = useT();
  const [locale] = useLocale();
  const router = useRouter();
  const next = safePath(useSearchParams().get('next'));
  const { data: me, isPending: meLoading } = useMe({ optional: true });
  const sub = useSubscription({ enabled: !!me });
  const checkout = useCheckout();
  const current: Plan = sub.data?.plan ?? me?.plan ?? 'free';

  const buy = (plan: Plan) => {
    if (!isPaidPlan(plan)) return;
    checkout.mutate(plan, {
      onSuccess: (p) => router.push(`/billing/pay/${p.id}${next ? `?next=${encodeURIComponent(next)}` : ''}`),
    });
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t.pricingPage.title}</h1>
        <p className="text-ink/60">{t.pricingPage.sub}</p>
        {sub.data && (
          <p className="text-sm text-ink/55">
            {t.pricingPage.usedToday(sub.data.usedToday, sub.data.dailyLimit)}
            {sub.data.expiresAt && <> · {t.pricingPage.activeUntil(formatDate(new Date(sub.data.expiresAt), locale))}</>}
            {sub.data.usedToday >= sub.data.dailyLimit && sub.data.resetsAt && <> · {t.pricingPage.nextSlot(formatDate(new Date(sub.data.resetsAt), locale))}</>}
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const f = PLAN_FEATURES[plan];
          const isCurrent = plan === current;
          const lower = PLAN_RANK[plan] < PLAN_RANK[current];
          const featured = plan === 'pro';
          return (
            <article key={plan}
              className={`card relative flex flex-col gap-5 p-6 ${featured ? 'ring-2 ring-brand' : ''} ${isCurrent ? 'bg-brand-soft/40' : ''}`}>
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{t.pricingPage.popular}</span>
              )}
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
                  {plan !== 'free' && <CrownIcon className="h-5 w-5 text-marigold" />}{t.plans[plan]}
                </h2>
                {isCurrent && me && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">{t.pricingPage.current}</span>}
              </div>
              <p className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold">৳{formatNumber(isPaidPlan(plan) ? PLAN_PRICES_BDT[plan] : 0, locale)}</span>
                <span className="text-sm text-ink/55">{t.pricingPage.perMonth}</span>
              </p>
              <ul className="flex flex-col gap-2">
                <Feature ok>{t.pricingPage.dailyPosters(f.dailyPosters)}</Feature>
                <Feature ok={!f.watermark}>{f.watermark ? t.pricingPage.watermark : t.pricingPage.noWatermark}</Feature>
                <Feature ok={f.premiumTemplates}>{f.premiumTemplates ? t.pricingPage.premiumTemplates : t.pricingPage.freeTemplatesOnly}</Feature>
              </ul>
              <div className="mt-auto">
                {!isPaidPlan(plan) ? null
                  : meLoading ? <div className="skeleton h-11 w-full rounded-full" />
                  : !me ? <Link href="/login?next=/pricing" className="btn btn-ghost w-full">{t.pricingPage.loginToBuy}</Link>
                  : lower ? <button className="btn btn-ghost w-full" disabled>{t.pricingPage.included}</button>
                  : (
                    <button className={`btn w-full ${featured ? 'btn-primary' : 'btn-ghost'}`}
                      disabled={checkout.isPending} onClick={() => buy(plan)}>
                      {isCurrent ? t.pricingPage.renew : t.pricingPage.buy}
                    </button>
                  )}
              </div>
            </article>
          );
        })}
      </div>
      {checkout.error && <p role="alert" className="pop text-center text-sm font-medium text-rally">{errorMessage(checkout.error)}</p>}
    </section>
  );
}

export default function PricingPage() {
  return <Suspense fallback={<div className="skeleton h-96 w-full" />}><PricingContent /></Suspense>;
}
