import { isValidObjectId } from 'mongoose';
import type {
  AdminPosterDTO, AdminTemplateCreateInput, AdminTemplateDTO, AdminTemplateUpdateInput,
  AdminUserDTO, ModerationItemDTO, PosterStatus,
} from '@poster/shared';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import type { PosterQueue } from '../../jobs/job-queue.js';
import { TemplateModel, type TemplateDoc } from '../../models/template.model.js';
import { PosterModel, type PosterDoc } from '../../models/poster.model.js';
import { UserModel, type UserDoc } from '../../models/user.model.js';
import type { StorageService } from '../../services/storage/storage.js';
import { toPosterDTO } from '../posters/poster.mapper.js';

export function toAdminTemplateDTO(t: TemplateDoc): AdminTemplateDTO {
  return {
    id: t._id.toString(), slug: t.slug, title: t.title, occasion: t.occasion, layoutKey: t.layoutKey,
    photoSlots: t.photoSlots, thumbnailUrl: t.thumbnailUrl, defaultHeadline: t.defaultHeadline,
    palettes: t.palettes.map((p) => ({ id: p.id, name: p.name, primary: p.primary, secondary: p.secondary, accent: p.accent, text: p.text, footerBg: p.footerBg })),
    isFree: t.isFree,
    motifs: [...t.motifs],
    defaultDesign: {
      paletteId: t.defaultDesign.paletteId, motif: t.defaultDesign.motif, headlineFont: t.defaultDesign.headlineFont,
      headlineScale: t.defaultDesign.headlineScale, tagline: t.defaultDesign.tagline ?? undefined,
      photoFocus: t.defaultDesign.photoFocus.map((f) => ({ x: f.x ?? 0, y: f.y ?? 0 })),
    },
    isActive: t.isActive,
  };
}

export function listAllTemplates(): Promise<TemplateDoc[]> {
  return TemplateModel.find().sort({ createdAt: 1 });
}

export async function createTemplate(input: AdminTemplateCreateInput): Promise<TemplateDoc> {
  try {
    return await TemplateModel.create(input);
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw conflict('SLUG_TAKEN', 'A template with this slug already exists');
    throw e;
  }
}

async function getTemplateOr404(id: string): Promise<TemplateDoc> {
  if (!isValidObjectId(id)) throw notFound('Template not found');
  const t = await TemplateModel.findById(id);
  if (!t) throw notFound('Template not found');
  return t;
}

export async function updateTemplate(id: string, input: AdminTemplateUpdateInput): Promise<TemplateDoc> {
  const t = await getTemplateOr404(id);
  Object.assign(t, input);
  try {
    return await t.save();
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw conflict('SLUG_TAKEN', 'A template with this slug already exists');
    throw e;
  }
}

export async function deactivateTemplate(id: string): Promise<void> {
  const t = await getTemplateOr404(id);
  t.isActive = false;
  await t.save();
}

export async function listAllPosters(
  page: number, limit: number, status: PosterStatus | undefined, storage: StorageService,
): Promise<{ items: AdminPosterDTO[]; total: number }> {
  const filter = status ? { status } : {};
  const [rows, total] = await Promise.all([
    PosterModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    PosterModel.countDocuments(filter),
  ]);
  return { items: await withOwners(rows, storage), total };
}

async function withOwners(rows: PosterDoc[], storage: StorageService): Promise<AdminPosterDTO[]> {
  const owners = await UserModel.find({ _id: { $in: [...new Set(rows.map((p) => p.userId.toString()))] } }, 'name email');
  const byId = new Map(owners.map((u) => [u._id.toString(), u]));
  return rows.map((p) => {
    const owner = byId.get(p.userId.toString());
    return { ...toPosterDTO(p, storage), ownerName: owner?.name ?? '', ownerEmail: owner?.email ?? '' };
  });
}

/** Posters held for review, oldest first so nobody waits at the back of the queue. */
export async function listModerationQueue(
  page: number, limit: number, storage: StorageService,
): Promise<{ items: ModerationItemDTO[]; total: number }> {
  const filter = { status: 'pending_review' as const };
  const [rows, total] = await Promise.all([
    PosterModel.find(filter).sort({ createdAt: 1, _id: 1 }).skip((page - 1) * limit).limit(limit),
    PosterModel.countDocuments(filter),
  ]);
  const base = await withOwners(rows, storage);
  const items = rows.map((p, i) => ({
    ...base[i]!,
    flagReason: p.moderation?.flagReason ?? '',
    flaggedAt: (p.moderation?.flaggedAt ?? p.createdAt).toISOString(),
    photoUrls: p.photoIds.map((id) => storage.getUrl(id, { format: 'jpg', width: 400 })),
  }));
  return { items, total };
}

async function decide(id: string, adminId: string, decision: 'approved' | 'rejected', extra: Record<string, unknown>): Promise<PosterDoc> {
  if (!isValidObjectId(id)) throw notFound('Poster not found');
  const updated = await PosterModel.findOneAndUpdate(
    { _id: id, status: 'pending_review' },
    { $set: { 'moderation.decision': decision, 'moderation.reviewedBy': adminId, 'moderation.reviewedAt': new Date(), ...extra } },
    { new: true },
  );
  if (updated) return updated;
  if (!(await PosterModel.exists({ _id: id }))) throw notFound('Poster not found');
  throw conflict('POSTER_NOT_PENDING', 'Poster is not waiting for review');
}

/** Releases a held poster into the generation queue. */
export async function approvePoster(id: string, adminId: string, queue: PosterQueue): Promise<PosterDoc> {
  const p = await decide(id, adminId, 'approved', { status: 'queued' });
  queue.enqueue(p.id);
  return p;
}

/** Refuses a held poster for good. Its quota slot is not given back. */
export function rejectPoster(id: string, adminId: string, note: string | undefined): Promise<PosterDoc> {
  return decide(id, adminId, 'rejected', { status: 'rejected', ...(note ? { 'moderation.note': note } : {}) });
}

export async function listUsers(page: number, limit: number, blocked?: boolean): Promise<{ items: AdminUserDTO[]; total: number }> {
  const filter = blocked === undefined ? {} : { isBlocked: blocked };
  const [rows, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    UserModel.countDocuments(filter),
  ]);
  const items = rows.map((u) => ({
    id: u._id.toString(), name: u.name, email: u.email, role: u.role, isBlocked: u.isBlocked, createdAt: u.createdAt.toISOString(),
  }));
  return { items, total };
}

export async function setUserBlocked(id: string, blocked: boolean, actingUserId: string): Promise<UserDoc> {
  if (!isValidObjectId(id)) throw notFound('User not found');
  if (id === actingUserId) throw forbidden('You cannot block your own account');
  const u = await UserModel.findById(id);
  if (!u) throw notFound('User not found');
  u.isBlocked = blocked;
  await u.save();
  return u;
}
