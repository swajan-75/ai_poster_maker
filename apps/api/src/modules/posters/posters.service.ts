import { isValidObjectId } from 'mongoose';
import sharp from 'sharp';
import {
  MAX_REGENERATIONS, PLAN_FEATURES,
  SIZE_SPECS, type CreatePosterInput, type PdfPaper, type Plan, type PosterFormData, type RegenerateInput, type UserRole,
} from '@poster/shared';
import { AppError, badRequest, conflict, notFound, tooMany, unprocessable } from '../../lib/errors.js';
import { findBlockedTerm } from '../../lib/moderation.js';
import { PosterModel, type PosterDoc } from '../../models/poster.model.js';
import type { PosterQueue } from '../../jobs/job-queue.js';
import type { StorageService } from '../../services/storage/storage.js';
import type { PosterRenderer } from '../../render/renderer.js';
import { isOwnedUpload } from '../../services/storage/paths.js';
import { getActiveTemplate } from '../templates/templates.service.js';
import { TemplateModel } from '../../models/template.model.js';
import { PosterUsageModel } from '../../models/poster-usage.model.js';
import { getUserPlan, reservePosterSlot } from '../billing/subscription.service.js';

export type AuthUser = { id: string; role: UserRole };

function normalizeForm<T extends Partial<PosterFormData>>(form: T): T {
  return Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.normalize('NFC') : v])) as T;
}

const upgradeRequired = (reason: 'premium_template' | 'watermark', msg: string) =>
  new AppError(403, 'UPGRADE_REQUIRED', msg, { reason });

function assertTemplateAllowed(template: { isFree: boolean }, plan: Plan): void {
  if (!template.isFree && !PLAN_FEATURES[plan].premiumTemplates)
    throw upgradeRequired('premium_template', 'This template needs a Pro or Ultra plan');
}

function assertClean(form: Partial<PosterFormData>): void {
  for (const v of Object.values(form)) {
    if (typeof v === 'string' && findBlockedTerm(v)) throw unprocessable('CONTENT_BLOCKED', 'Text contains prohibited content');
  }
}

export async function createPoster(user: AuthUser, input: CreatePosterInput, deps: { queue: PosterQueue }): Promise<PosterDoc> {
  const template = await getActiveTemplate(input.templateId).catch(() => {
    throw unprocessable('TEMPLATE_UNAVAILABLE', 'Template is not available');
  });
  const plan = await getUserPlan(user.id);
  assertTemplateAllowed(template, plan);
  if (input.photoIds.length > template.photoSlots)
    throw badRequest('VALIDATION_ERROR', `This template accepts at most ${template.photoSlots} photo(s)`);
  if (!input.photoIds.every((id) => isOwnedUpload(id, user.id)))
    throw new AppError(403, 'PHOTO_NOT_OWNED', 'One or more photos do not belong to you');

  const formData = normalizeForm(input.formData);
  assertClean(formData);

  const usageId = await reservePosterSlot(user.id, template.id, plan);
  let poster: PosterDoc;
  try {
    poster = await PosterModel.create({
      userId: user.id, templateId: template._id, formData, photoIds: input.photoIds, size: input.size, watermarked: PLAN_FEATURES[plan].watermark,
    });
  } catch (err) {
    await PosterUsageModel.deleteOne({ _id: usageId });
    throw err;
  }
  await PosterUsageModel.updateOne({ _id: usageId }, { posterId: poster._id });
  deps.queue.enqueue(poster.id);
  return poster;
}

export async function getPosterForUser(id: string, user: AuthUser): Promise<PosterDoc> {
  if (!isValidObjectId(id)) throw notFound('Poster not found');
  const p = await PosterModel.findById(id);
  if (!p || (p.userId.toString() !== user.id && user.role !== 'admin')) throw notFound('Poster not found');
  return p;
}

export async function listPosters(ownerId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    PosterModel.find({ userId: ownerId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    PosterModel.countDocuments({ userId: ownerId }),
  ]);
  return { items, total };
}

export async function regeneratePoster(id: string, user: AuthUser, input: RegenerateInput, deps: { queue: PosterQueue }): Promise<PosterDoc> {
  if (!isValidObjectId(id)) throw notFound('Poster not found');
  const existing = await PosterModel.findOne({ _id: id, userId: user.id }, { templateId: 1 });
  if (!existing) throw notFound('Poster not found');
  const plan = await getUserPlan(user.id);
  const template = await TemplateModel.findById(existing.templateId, { isFree: 1 });
  if (template) assertTemplateAllowed(template, plan);
  // The watermark follows the plan at the time of (re)generation.
  const $set: Record<string, unknown> = { status: 'queued', watermarked: PLAN_FEATURES[plan].watermark, reuseDesign: false };
  if (input.formData) {
    const patch = normalizeForm(input.formData);
    assertClean(patch);
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) $set[`formData.${k}`] = v;
  }
  const base = { _id: id, userId: user.id };
  // Retry after failure: free. Regenerate a completed poster: costs one.
  const updated =
    (await PosterModel.findOneAndUpdate({ ...base, status: 'failed' }, { $set, $unset: { error: 1 } }, { new: true })) ??
    (await PosterModel.findOneAndUpdate(
      { ...base, status: 'completed', regenerateCount: { $lt: MAX_REGENERATIONS } },
      { $set, $inc: { regenerateCount: 1 }, $unset: { error: 1 } },
      { new: true },
    ));
  if (!updated) {
    const p = await PosterModel.findOne(base);
    if (!p) throw notFound('Poster not found');
    if (p.status === 'queued' || p.status === 'generating') throw conflict('POSTER_BUSY', 'Poster is already being generated');
    throw tooMany('REGEN_LIMIT_REACHED', 'Regeneration limit reached');
  }
  deps.queue.enqueue(updated.id);
  return updated;
}

export async function deletePoster(id: string, user: AuthUser, deps: { storage: StorageService }): Promise<void> {
  const p = await getPosterForUser(id, user);
  await PosterModel.deleteOne({ _id: p._id });
  const files = [...p.photoIds, ...(p.imagePublicId ? [p.imagePublicId] : [])];
  await Promise.allSettled(files.map((f) => deps.storage.deleteImage(f)));
}

/** Re-renders a completed poster with the same design, minus the watermark. Paid plans only; free of charge. */
export async function removeWatermark(id: string, user: AuthUser, deps: { queue: PosterQueue }): Promise<PosterDoc> {
  if (!isValidObjectId(id)) throw notFound('Poster not found');
  const plan = await getUserPlan(user.id);
  if (PLAN_FEATURES[plan].watermark) throw upgradeRequired('watermark', 'Upgrade to Pro or Ultra to remove the watermark');
  const updated = await PosterModel.findOneAndUpdate(
    { _id: id, userId: user.id, status: 'completed', watermarked: true },
    { $set: { status: 'queued', watermarked: false, reuseDesign: true }, $unset: { error: 1 } },
    { new: true },
  );
  if (!updated) {
    const p = await PosterModel.findOne({ _id: id, userId: user.id });
    if (!p) throw notFound('Poster not found');
    if (p.status === 'queued' || p.status === 'generating') throw conflict('POSTER_BUSY', 'Poster is already being generated');
    return p; // already clean (or failed): nothing to do
  }
  deps.queue.enqueue(updated.id);
  return updated;
}

const PDF_MARGIN_MM = 8;

/**
 * Print-ready PDF: the finished image centred on an A4/A3 page (landscape page for landscape posters),
 * scaled to fill the printable area. The watermark, if any, is part of the image.
 */
export async function getPosterPdf(
  id: string, user: AuthUser, paper: PdfPaper, deps: { storage: StorageService; renderer: PosterRenderer },
): Promise<{ pdf: Buffer; filename: string }> {
  const p = await getPosterForUser(id, user);
  if (p.status !== 'completed' || !p.imagePublicId) throw conflict('POSTER_NOT_READY', 'Poster is not ready yet');
  const image = await sharp(await deps.storage.fetchImage(p.imagePublicId)).jpeg({ quality: 95 }).toBuffer();
  const landscape = SIZE_SPECS[p.size].orientation === 'landscape';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page{margin:0}
*{margin:0;padding:0}
html,body{width:100%;height:100%}
body{display:flex;align-items:center;justify-content:center}
img{max-width:calc(100vw - ${PDF_MARGIN_MM * 2}mm);max-height:calc(100vh - ${PDF_MARGIN_MM * 2}mm);object-fit:contain}
</style></head><body><img src="data:image/jpeg;base64,${image.toString('base64')}" alt=""><script>window.__fitDone = true</script></body></html>`;
  const pdf = await deps.renderer.renderPdf(html, { paper, landscape });
  return { pdf, filename: `poster-${p.id}-${paper}.pdf` };
}
