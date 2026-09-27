'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { posterFormSchema, type PosterDTO, type PosterFormData } from '@poster/shared';
import { FormField } from './FormField';
import { useT } from '@/lib/i18n';

const editable = posterFormSchema.pick({ headline: true, tagline: true, name: true, designation: true, organization: true });
type Editable = Pick<PosterFormData, 'headline' | 'tagline' | 'name' | 'designation' | 'organization'>;
const input = 'field';

export function RegenerateForm({ poster, pending, onRegenerate }: { poster: PosterDTO; pending: boolean; onRegenerate: (patch: Partial<PosterFormData>) => void }) {
  const t = useT();
  const f = poster.formData;
  const defaults: Editable = { headline: f.headline, tagline: f.tagline, name: f.name, designation: f.designation, organization: f.organization };
  const { register, handleSubmit, formState: { errors } } = useForm<Editable>({ resolver: zodResolver(editable), defaultValues: defaults });
  const disabled = pending || poster.regenerationsLeft <= 0;

  const submit = handleSubmit((v) => {
    const patch = Object.fromEntries(Object.entries(v).filter(([k, val]) => val !== defaults[k as keyof Editable]));
    onRegenerate(patch);
  });

  return (
    <form onSubmit={submit} noValidate className="card flex flex-col gap-3 p-5">
      <h2 className="font-display text-lg font-bold">{t.regenerate.title}</h2>
      <FormField label={t.posterForm.headline} error={errors.headline?.message}><input className={input} {...register('headline')} /></FormField>
      <FormField label={t.posterForm.tagline} error={errors.tagline?.message}><input className={input} {...register('tagline')} /></FormField>
      <FormField label={t.posterForm.name} error={errors.name?.message}><input className={input} {...register('name')} /></FormField>
      <FormField label={t.posterForm.designation} error={errors.designation?.message}><input className={input} {...register('designation')} /></FormField>
      <FormField label={t.posterForm.organization} error={errors.organization?.message}><input className={input} {...register('organization')} /></FormField>
      <p className="rounded-xl bg-brand-soft/60 p-2.5 text-xs text-ink/65">{t.regenerate.remaining(poster.regenerationsLeft)}</p>
      <button type="submit" disabled={disabled} className="btn btn-primary w-full py-3">{t.regenerate.submit}</button>
    </form>
  );
}
