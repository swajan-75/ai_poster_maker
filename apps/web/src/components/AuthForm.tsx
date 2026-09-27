'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema, registerSchema, type RegisterInput } from '@poster/shared';
import { FormField } from './FormField';
import { LogoMark } from './Header';
import { useLogin, useRegister } from '@/lib/queries';
import { errorMessage } from '@/lib/error-messages';
import { useT } from '@/lib/i18n';

const input = 'field';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const t = useT();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/templates';
  const login = useLogin();
  const register = useRegister();
  const m = isRegister ? register : login;
  const { register: field, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema) as never,
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit((v) =>
    (isRegister ? register.mutateAsync(v) : login.mutateAsync({ email: v.email, password: v.password }))
      .then(() => router.push(safeNext))
      .catch(() => undefined),
  );

  return (
    <div className="card mx-auto grid max-w-4xl overflow-hidden md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#15a466] via-brand to-brand-strong p-10 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-marigold/40 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-rally/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-2 font-display text-lg font-bold"><LogoMark />{t.common.appName}</div>
        <div className="relative flex flex-col gap-3">
          <p className="font-display text-3xl font-extrabold leading-tight">{t.auth.pitch}</p>
          <p className="text-white/80">{t.auth.pitchSub}</p>
        </div>
        <div className="relative flex gap-3" aria-hidden="true">
          {['-6deg', '4deg', '-2deg'].map((r, i) => (
            <div key={r} className="floaty h-24 w-[4.5rem] rounded-xl bg-white/15 p-1.5 ring-1 ring-white/25" style={{ rotate: r, animationDelay: `${-i * 1.5}s` }}>
              <div className="h-8 w-8 rounded-full bg-white/70" /><div className="mt-2 h-1.5 w-full rounded-full bg-white/60" /><div className="mt-1 h-1.5 w-2/3 rounded-full bg-marigold" />
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 p-6 sm:p-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{isRegister ? t.auth.newAccountTitle : t.auth.loginTitle}</h1>
        {isRegister && <FormField label={t.auth.name} error={errors.name?.message}><input className={input} autoComplete="name" {...field('name')} /></FormField>}
        <FormField label={t.auth.email} error={errors.email?.message}><input className={input} type="email" autoComplete="email" {...field('email')} /></FormField>
        <FormField label={t.auth.password} error={errors.password?.message}><input className={input} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} {...field('password')} /></FormField>
        {m.error && <p role="alert" className="pop rounded-xl bg-rally/10 p-3 text-sm text-rally">{errorMessage(m.error)}</p>}
        <button type="submit" disabled={m.isPending} className="btn btn-primary mt-2 w-full py-3 text-base">
          {m.isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {isRegister ? t.auth.createAccount : t.auth.loginButton}
        </button>
        <p className="text-center text-sm text-ink/65">
          {isRegister ? <>{t.auth.haveAccount} <Link className="font-semibold text-brand hover:underline" href="/login">{t.auth.loginLink}</Link></>
                      : <>{t.auth.noAccount} <Link className="font-semibold text-brand hover:underline" href="/register">{t.auth.registerLink}</Link></>}
        </p>
      </form>
    </div>
  );
}
