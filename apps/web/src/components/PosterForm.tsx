'use client';
import { memo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isBallotLayout, posterFormSchema, type PosterFormData, type TemplateDTO, type UploadedPhotoDTO } from '@poster/shared';
import { FormField } from './FormField';
import { PhotoUploader } from './PhotoUploader';
import { useT } from '@/lib/i18n';

const input = 'field';

export type PosterPreview = Pick<PosterFormData, 'headline' | 'tagline' | 'name' | 'designation' | 'organization'> & { photoUrl?: string };

export const PosterForm = memo(function PosterForm({ template, submitting, serverError, onSubmit, upload, onPreviewChange }: {
  template: TemplateDTO; submitting: boolean; serverError?: string;
  onSubmit: (v: { formData: PosterFormData; photoIds: string[] }) => void;
  upload?: (f: File) => Promise<UploadedPhotoDTO>;
  onPreviewChange?: (p: PosterPreview) => void;
}) {
  const t = useT();
  const [photos, setPhotos] = useState<UploadedPhotoDTO[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const ballot = isBallotLayout(template.layoutKey);
  const b = t.posterForm.ballot;
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PosterFormData>({
    resolver: zodResolver(posterFormSchema),
    defaultValues: {
      name: '', designation: '', organization: '', union: '', thana: '', district: '', headline: template.defaultHeadline, tagline: '',
      ...(ballot ? { topLine: '', electionDate: '', symbol: '', appeal: '', campaignBy: '' } : {}),
    },
  });

  // Feed the live preview; watch() subscriptions don't re-render this form on each keystroke.
  useEffect(() => {
    if (!onPreviewChange) return;
    const emit = (v: Partial<PosterFormData>) => onPreviewChange({
      headline: v.headline ?? '', tagline: v.tagline ?? '', name: v.name ?? '', designation: v.designation ?? '', organization: v.organization ?? '', photoUrl: photos[0]?.url,
    });
    emit(watch());
    const sub = watch((v) => emit(v));
    return () => sub.unsubscribe();
  }, [watch, onPreviewChange, photos]);

  const submit = handleSubmit(
    (formData) => {
      if (photos.length === 0) return setPhotoError(t.posterForm.photoError);
      onSubmit({ formData, photoIds: photos.map((p) => p.publicId) });
    },
    () => { if (photos.length === 0) setPhotoError(t.posterForm.photoError); },
  );

  const section = 'card grid gap-4 p-5 sm:p-6 md:grid-cols-2';
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <fieldset className={section}>
        <div className="md:col-span-2">
          <FormField label={t.posterForm.headline} error={errors.headline?.message} hint={ballot ? b.headlineHint : t.posterForm.headlineHint}><input className={`${input} font-display text-lg font-semibold`} {...register('headline')} /></FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label={t.posterForm.tagline} error={errors.tagline?.message} hint={ballot ? b.taglineHint : t.posterForm.taglineHint}><input className={input} {...register('tagline')} /></FormField>
        </div>
      </fieldset>
      <fieldset className={section}>
        <FormField label={t.posterForm.name} error={errors.name?.message}><input className={input} {...register('name')} /></FormField>
        <FormField label={t.posterForm.designation} error={errors.designation?.message} hint={ballot ? b.designationHint : undefined}><input className={input} {...register('designation')} /></FormField>
        <div className="md:col-span-2">
          <FormField label={t.posterForm.organization} error={errors.organization?.message} hint={ballot ? b.organizationHint : undefined}><input className={input} {...register('organization')} /></FormField>
        </div>
        <FormField label={t.posterForm.union} error={errors.union?.message}><input className={input} {...register('union')} /></FormField>
        <FormField label={t.posterForm.thana} error={errors.thana?.message}><input className={input} {...register('thana')} /></FormField>
        <FormField label={t.posterForm.district} error={errors.district?.message}><input className={input} {...register('district')} /></FormField>
      </fieldset>
      {ballot && (
        <fieldset className={section}>
          <legend className="sr-only">{b.section}</legend>
          <p className="font-display text-base font-bold md:col-span-2">{b.section}</p>
          <FormField label={b.topLine} error={errors.topLine?.message} hint={b.topLineHint}><input className={input} {...register('topLine')} /></FormField>
          <FormField label={b.electionDate} error={errors.electionDate?.message} hint={b.electionDateHint}><input className={input} {...register('electionDate')} /></FormField>
          <FormField label={b.symbol} error={errors.symbol?.message} hint={b.symbolHint}><input className={input} {...register('symbol')} /></FormField>
          <FormField label={b.campaignBy} error={errors.campaignBy?.message} hint={b.campaignByHint}><input className={input} {...register('campaignBy')} /></FormField>
          <div className="md:col-span-2">
            <FormField label={b.appeal} error={errors.appeal?.message} hint={b.appealHint}><textarea rows={2} className={input} {...register('appeal')} /></FormField>
          </div>
        </fieldset>
      )}
      <fieldset className="card flex flex-col gap-2 p-5 sm:p-6">
        <p className="text-sm font-semibold text-ink/80">{t.posterForm.photosLabel(template.photoSlots)}</p>
        {ballot && <p className="text-xs text-ink/60">{b.photoRoles(template.photoSlots)}</p>}
        <PhotoUploader max={template.photoSlots} value={photos} upload={upload} onChange={(v) => { setPhotos(v); setPhotoError(null); }} />
        {photoError && <p role="alert" className="pop text-xs font-medium text-rally">{photoError}</p>}
      </fieldset>
      {serverError && <p role="alert" className="pop rounded-xl bg-rally/10 p-3 text-sm text-rally">{serverError}</p>}
      <div className="sticky bottom-3 z-10">
        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-4 text-lg shadow-2xl">
          {submitting
            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            : <span aria-hidden="true">✦</span>}
          {submitting ? t.posterForm.submitting : t.posterForm.submit}
        </button>
      </div>
    </form>
  );
});
