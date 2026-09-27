'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PosterFormData, TemplateDTO } from '@poster/shared';
import { useCreatePoster, useMe, useTemplate } from '@/lib/queries';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { PosterForm, type PosterPreview } from '@/components/PosterForm';
import { errorMessage } from '@/lib/error-messages';
import { formatDate, useLocale, useT } from '@/lib/i18n';
import { useTilt } from '@/lib/use-tilt';

// A rough, instant sketch of the poster so typing feels alive; the real design comes from the AI.
function LivePreview({ template, preview }: { template: TemplateDTO; preview?: PosterPreview }) {
  const tr = useT();
  const tilt = useTilt<HTMLDivElement>(6);
  const p = preview;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-rally" />{tr.createPage.livePreview}</span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-ink/55 ring-1 ring-line">{tr.occasion[template.occasion]}</span>
      </div>
      <div {...tilt} className="tilt card relative overflow-hidden" aria-hidden="true">
        <img src={template.thumbnailUrl} alt="" className="aspect-[3/4] w-full object-cover" />
        {p?.photoUrl && (
          <img key={p.photoUrl} src={p.photoUrl} alt="" className="pop absolute left-1/2 top-[14%] h-[34%] w-auto -translate-x-1/2 rounded-2xl object-cover shadow-2xl ring-4 ring-white" />
        )}
        {/* Dark panel hides any text baked into the thumbnail so the typed text reads cleanly. */}
        <div className="absolute inset-x-0 bottom-0 flex min-h-[38%] flex-col justify-end gap-1 bg-ink/90 p-5 text-white">
          <p className="font-display text-2xl font-extrabold leading-tight drop-shadow">{p?.headline || template.defaultHeadline}</p>
          {p?.tagline && <p className="text-sm text-marigold">{p.tagline}</p>}
          {(p?.name || p?.designation) && (
            <div className="mt-2 border-t border-white/25 pt-2">
              {p.name && <p className="font-bold">{p.name}</p>}
              <p className="text-xs text-white/75">{[p.designation, p.organization].filter(Boolean).join(' · ')}</p>
            </div>
          )}
        </div>
        <span className="shine" />
      </div>
      <p className="text-center text-xs text-ink/45">{tr.createPage.previewNote}</p>
    </div>
  );
}

export default function CreatePosterPage() {
  const tr = useT();
  const [locale] = useLocale();
  const { templateId } = useParams<{ templateId: string }>();
  const router = useRouter();
  const template = useTemplate(templateId);
  const create = useCreatePoster();
  const { data: me } = useMe({ optional: true });
  const [preview, setPreview] = useState<PosterPreview>();
  const templateIdOf = template.data?.id;
  const { mutate } = create;
  // Stable callback so the memoized form doesn't re-render on every preview keystroke.
  const onSubmit = useCallback(({ formData, photoIds }: { formData: PosterFormData; photoIds: string[] }) => {
    if (templateIdOf) mutate({ templateId: templateIdOf, formData, photoIds }, { onSuccess: (p) => router.push(`/posters/${p.id}`) });
  }, [templateIdOf, mutate, router]);

  if (template.isLoading) return <div className="grid gap-8 md:grid-cols-[1fr_340px]"><div className="skeleton h-[32rem]" /><div className="skeleton hidden aspect-[3/4] md:block" /></div>;
  if (template.error || !template.data) return <p role="alert" className="card p-4 text-rally">{errorMessage(template.error)}</p>;

  const t = template.data;
  const locked = !t.isFree && me?.plan === 'free';
  const errCode = create.error?.code;
  function limitBody() {
    const at = (create.error?.details as { resetsAt?: string | null } | undefined)?.resetsAt;
    return at ? tr.upgrade.limitBodyAt(formatDate(new Date(at), locale)) : tr.upgrade.limitBody;
  }
  // Hitting a plan limit is an upsell moment, not just an error line (Ultra has nowhere to go).
  const upsell = errCode === 'UPGRADE_REQUIRED' ? { title: tr.upgrade.premiumTitle, body: tr.upgrade.premiumBody }
    : errCode === 'DAILY_LIMIT' && me?.plan !== 'ultra' ? { title: tr.upgrade.limitTitle, body: limitBody() }
    : null;
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/templates" className="group inline-flex w-fit items-center gap-1 text-sm font-medium text-ink/55 transition hover:text-ink">
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>{tr.createPage.back}
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{tr.createPage.title}</h1>
        <p className="flex items-center gap-2 text-ink/55">{t.title}{!t.isFree && <span className="rounded-full bg-marigold px-2 py-0.5 text-[11px] font-bold text-ink">{tr.upgrade.premiumBadge}</span>}</p>
      </div>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_340px]">
        <div className="md:order-2 md:sticky md:top-24">
          <div className="mx-auto max-w-[260px] md:max-w-none"><LivePreview template={t} preview={preview} /></div>
        </div>
        <div className="flex flex-col gap-4 md:order-1">
          {locked ? <UpgradePrompt title={tr.upgrade.premiumTitle} body={tr.upgrade.premiumBody} cta={tr.upgrade.cta} /> : <>
          {upsell && <UpgradePrompt compact title={upsell.title} body={upsell.body} cta={tr.upgrade.cta} />}
          <PosterForm
            template={t}
            submitting={create.isPending}
            serverError={create.error ? errorMessage(create.error) : undefined}
            onPreviewChange={setPreview}
            onSubmit={onSubmit}
          />
          </>}
        </div>
      </div>
    </section>
  );
}
