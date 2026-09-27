import { isValidObjectId } from 'mongoose';
import {
  MAX_REGENERATIONS, PLAN_FEATURES,
  type CreatePosterInput, type Plan, type PosterFormData, type RegenerateInput, type UserRole,
} from '@poster/shared';
import { AppError, badRequest, conflict, notFound, tooMany, unprocessable } from '../../lib/errors.js';
import { findBlockedTerm } from '../../lib/moderation.js';
import { PosterModel, type PosterDoc } from '../../models/poster.model.js';
import type { PosterQueue } from '../../jobs/job-queue.js';
import type { StorageService } from '../../services/storage/storage.js';
import { isOwnedUpload } from '../../services/storage/paths.js';
import { getActiveTemplate } from '../templates/templates.service.js';
import { TemplateModel } from '../../models/template.model.js';
import { getUserPlan, postersToday } from '../billing/subscription.service.js';

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

  const { dailyPosters, watermark } = PLAN_FEATURES[plan];
  if ((await postersToday(user.id)) >= dailyPosters)
    throw new AppError(429, 'DAILY_LIMIT', 'Daily poster limit reached', { plan, limit: dailyPosters });

  const poster = await PosterModel.create({
    userId: user.id, templateId: template._id, formData, photoIds: input.photoIds, watermarked: watermark,
  });
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
