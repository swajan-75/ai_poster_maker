'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  adminTemplateCreateSchema, HEADLINE_FONTS, LAYOUT_KEYS, MOTIFS, OCCASIONS,
  type AdminTemplateCreateInput, type AdminTemplateDTO,
} from '@poster/shared';
import { FormField } from './FormField';
import { useT } from '@/lib/i18n';

const input = 'field';

function emptyPalette(n: number) {
  return { id: `palette-${n}`, name: `Palette ${n}`, primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' };
}

export function AdminTemplateForm({ initial, submitting, serverError, onSubmit }: {
  initial?: AdminTemplateDTO;
  submitting: boolean;
  serverError?: string;
  onSubmit: (v: AdminTemplateCreateInput) => void;
}) {
  const t = useT();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<AdminTemplateCreateInput>({
    resolver: zodResolver(adminTemplateCreateSchema),
    defaultValues: initial ?? {
      slug: '', title: '', occasion: 'greetings', layoutKey: 'victory', photoSlots: 1,
      thumbnailUrl: '', defaultHeadline: '', palettes: [emptyPalette(1)], motifs: [],
      defaultDesign: { paletteId: 'palette-1', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [], tagline: '' },
    },
  });
  const palettes = useFieldArray({ control, name: 'palettes' });
  const paletteIds = watch('palettes')?.map((p) => p.id) ?? [];

  const section = 'card grid gap-4 p-5 sm:p-6 md:grid-cols-2';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && <p role="alert" className="pop text-sm font-medium text-rally">{serverError}</p>}

      <fieldset className={section}>
        <FormField label={t.admin.slug} error={errors.slug?.message}>
          <input className={input} {...register('slug')} />
        </FormField>
        <FormField label={t.admin.title} error={errors.title?.message}>
          <input className={input} {...register('title')} />
        </FormField>
        <FormField label={t.admin.occasion} error={errors.occasion?.message}>
          <select className={input} {...register('occasion')}>
            {OCCASIONS.map((o) => <option key={o} value={o}>{t.occasion[o]}</option>)}
          </select>
        </FormField>
        <FormField label={t.admin.layoutKey} error={errors.layoutKey?.message}>
          <select className={input} {...register('layoutKey')}>
            {LAYOUT_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </FormField>
        <FormField label={t.admin.photoSlots} error={errors.photoSlots?.message}>
          <input type="number" min={1} max={3} className={input} {...register('photoSlots', { valueAsNumber: true })} />
        </FormField>
        <FormField label={t.admin.thumbnailUrl} error={errors.thumbnailUrl?.message}>
          <input className={input} {...register('thumbnailUrl')} />
        </FormField>
        <FormField label={t.admin.defaultHeadline} error={errors.defaultHeadline?.message}>
          <input className={input} {...register('defaultHeadline')} />
        </FormField>
      </fieldset>

      <fieldset className="card flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-ink/80">{t.admin.palettes}</legend>
          <button type="button" className="btn btn-ghost px-3 py-1.5 text-xs" onClick={() => palettes.append(emptyPalette(palettes.fields.length + 1))}>
            {t.admin.addPalette}
          </button>
        </div>
        {errors.palettes?.message && <p className="text-xs font-medium text-rally">{errors.palettes.message}</p>}
        {palettes.fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-2 gap-3 rounded-xl bg-ink/5 p-3 sm:grid-cols-4">
            <FormField label="id" error={errors.palettes?.[i]?.id?.message}>
              <input className={input} {...register(`palettes.${i}.id`)} />
            </FormField>
            <FormField label={t.admin.paletteName} error={errors.palettes?.[i]?.name?.message}>
              <input className={input} {...register(`palettes.${i}.name`)} />
            </FormField>
            {(['primary', 'secondary', 'accent', 'text', 'footerBg'] as const).map((k) => (
              <FormField key={k} label={k} error={errors.palettes?.[i]?.[k]?.message}>
                <input type="color" className={`${input} h-10 p-1`} {...register(`palettes.${i}.${k}`)} />
              </FormField>
            ))}
            {palettes.fields.length > 1 && (
              <button type="button" className="btn btn-danger self-end px-3 py-1.5 text-xs" onClick={() => palettes.remove(i)}>
                {t.admin.removePalette}
              </button>
            )}
          </div>
        ))}
      </fieldset>

      <fieldset className="card flex flex-col gap-2 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-ink/80">{t.admin.motifs}</legend>
        {errors.motifs?.message && <p className="text-xs font-medium text-rally">{errors.motifs.message}</p>}
        <div className="flex flex-wrap gap-3">
          {MOTIFS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={m} {...register('motifs')} />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="text-sm font-semibold text-ink/80 md:col-span-2">{t.admin.defaultDesign}</legend>
        <FormField label={t.admin.paletteId} error={errors.defaultDesign?.paletteId?.message}>
          <select className={input} {...register('defaultDesign.paletteId')}>
            {paletteIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </FormField>
        <FormField label={t.admin.motif} error={errors.defaultDesign?.motif?.message}>
          <select className={input} {...register('defaultDesign.motif')}>
            {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label={t.admin.headlineFont} error={errors.defaultDesign?.headlineFont?.message}>
          <select className={input} {...register('defaultDesign.headlineFont')}>
            {HEADLINE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FormField>
        <FormField label={t.admin.headlineScale} error={errors.defaultDesign?.headlineScale?.message}>
          <input type="number" step={0.05} min={0.8} max={1.3} className={input} {...register('defaultDesign.headlineScale', { valueAsNumber: true })} />
        </FormField>
      </fieldset>

      <button type="submit" disabled={submitting} className="btn btn-primary self-start px-6 py-2.5">
        {submitting ? (initial ? t.admin.saving : t.admin.creating) : (initial ? t.admin.save : t.admin.create)}
      </button>
    </form>
  );
}
