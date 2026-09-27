'use client';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DEMO_BKASH_OTP, DEMO_BKASH_PIN } from '@poster/shared';
import { useCancelPayment, useExecutePayment, useMe, usePayment } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { formatDate, formatNumber, useLocale, useT } from '@/lib/i18n';

// Demo stand-in for the bKash hosted checkout: wallet number → OTP → PIN → execute.
const BKASH_PINK = '#E2136E';
type Step = 'wallet' | 'otp' | 'pin';
const RULES: Record<Step, RegExp> = { wallet: /^01[3-9]\d{8}$/, otp: /^\d{6}$/, pin: /^\d{5}$/ };
const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : null);

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto flex w-full max-w-md flex-col gap-4">{children}</section>;
}

function PayContent() {
  const t = useT();
  const [locale] = useLocale();
  const { id } = useParams<{ id: string }>();
  const next = safePath(useSearchParams().get('next'));
  const payment = usePayment(id);
  const execute = useExecutePayment(id);
  const cancel = useCancelPayment(id);
  const { data: me } = useMe({ optional: true });
  const [step, setStep] = useState<Step>('wallet');
  const [values, setValues] = useState<Record<Step, string>>({ wallet: '', otp: '', pin: '' });
  const [touched, setTouched] = useState(false);

  if (payment.isLoading) return <Shell><div className="skeleton h-96 w-full" /></Shell>;
  if (payment.error || !payment.data) return <Shell><p role="alert" className="card p-4 text-rally">{errorMessage(payment.error)}</p></Shell>;
  const p = payment.data;
  const planName = t.plans[p.plan];

  if (p.status === 'completed') {
    const until = execute.data?.subscription.expiresAt ?? me?.planExpiresAt;
    return (
      <Shell>
        <div className="pop card flex flex-col items-center gap-4 p-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-3xl text-white" aria-hidden="true">✓</span>
          <h1 className="font-display text-2xl font-extrabold">{t.payment.successTitle}</h1>
          {until && <p className="text-ink/70">{t.payment.successBody(planName, formatDate(new Date(until), locale))}</p>}
          <dl className="w-full rounded-2xl bg-ink/5 p-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/55">{t.payment.trxId}</dt><dd className="font-mono font-semibold">{p.trxId}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/55">{t.payment.amount}</dt><dd className="font-semibold">৳{formatNumber(p.amount, locale)}</dd></div>
          </dl>
          <Link href={next ?? '/templates'} className="btn btn-primary w-full">{t.payment.goCreate}</Link>
        </div>
      </Shell>
    );
  }

  if (p.status !== 'pending') {
    return (
      <Shell>
        <div role="alert" className="card flex flex-col items-center gap-4 p-8 text-center">
          <h1 className="font-display text-xl font-bold">{t.payment.closedTitle}</h1>
          <p className="text-ink/65">{t.payment.closedBody}</p>
          <Link href={`/pricing${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="btn btn-primary">{t.payment.backToPricing}</Link>
        </div>
      </Shell>
    );
  }

  const value = values[step];
  const valid = RULES[step].test(value);
  const minutesLeft = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 60_000));
  const field = {
    wallet: { label: t.payment.walletLabel, hint: t.payment.walletPlaceholder, error: t.payment.walletError, max: 11, type: 'tel' },
    otp: { label: t.payment.otpLabel, hint: t.payment.otpHint(DEMO_BKASH_OTP), error: t.payment.otpError, max: 6, type: 'text' },
    pin: { label: t.payment.pinLabel, hint: t.payment.pinHint(DEMO_BKASH_PIN), error: t.payment.pinError, max: 5, type: 'password' },
  }[step];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setTouched(false);
    if (step === 'wallet') setStep('otp');
    else if (step === 'otp') setStep('pin');
    else execute.mutate(values);
  };

  return (
    <Shell>
      <p role="note" className="rounded-2xl bg-marigold/15 px-4 py-2 text-center text-xs font-semibold text-[#8a5400]">{t.payment.demoBanner}</p>
      <div className="card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 text-white" style={{ background: BKASH_PINK }}>
          <span className="font-display text-2xl font-extrabold tracking-tight">bKash</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase">Demo</span>
        </header>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 text-sm">
          <div>
            <p className="font-semibold">{t.payment.merchant}</p>
            <p className="text-ink/55">{t.payment.plan(planName)}</p>
            <p className="text-xs text-ink/45">{t.payment.invoice}: {p.id.slice(-8).toUpperCase()}</p>
          </div>
          <p className="font-display text-2xl font-extrabold" style={{ color: BKASH_PINK }}>৳{formatNumber(p.amount, locale)}</p>
        </div>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-2 text-center">
            <span className="text-sm font-semibold text-ink/80">{field.label}</span>
            <input
              key={step} autoFocus inputMode="numeric" autoComplete="off" type={field.type} maxLength={field.max}
              placeholder={step === 'wallet' ? field.hint : undefined} value={value}
              onChange={(e) => setValues((v) => ({ ...v, [step]: e.target.value.replace(/\D/g, '') }))}
              aria-invalid={touched && !valid}
              className="rounded-xl border border-line bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none placeholder:font-sans placeholder:tracking-normal focus:border-[#E2136E]"
            />
            {step !== 'wallet' && <span className="text-xs text-ink/50">{field.hint}</span>}
            {touched && !valid && <span className="text-xs font-medium text-rally">{field.error}</span>}
          </label>
          {execute.error && <p role="alert" className="pop text-center text-sm font-medium text-rally">{errorMessage(execute.error)}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-ghost" disabled={execute.isPending || cancel.isPending}
              onClick={() => (step === 'wallet' ? cancel.mutate() : setStep(step === 'pin' ? 'otp' : 'wallet'))}>
              {step === 'wallet' ? t.payment.cancel : t.payment.back}
            </button>
            <button type="submit" className="btn text-white" style={{ background: BKASH_PINK }} disabled={execute.isPending}>
              {execute.isPending ? t.payment.processing : step === 'pin' ? t.payment.confirm : t.payment.proceed}
            </button>
          </div>
          <p className="text-center text-xs text-ink/45">{t.payment.expiresIn(minutesLeft)}</p>
        </form>
      </div>
    </Shell>
  );
}

export default function PayPage() {
  return <Suspense fallback={<div className="skeleton mx-auto h-96 w-full max-w-md" />}><PayContent /></Suspense>;
}
