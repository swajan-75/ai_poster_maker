import { isValidObjectId } from 'mongoose';
import type {
  AdminPosterDTO, AdminTemplateCreateInput, AdminTemplateDTO, AdminTemplateUpdateInput,
  AdminUserDTO, PosterStatus,
} from '@poster/shared';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { TemplateModel, type TemplateDoc } from '../../models/template.model.js';
import { PosterModel } from '../../models/poster.model.js';
import { UserModel, type UserDoc } from '../../models/user.model.js';
import type { StorageService } from '../../services/storage/storage.js';
import { toPosterDTO } from '../posters/poster.mapper.js';

export function toAdminTemplateDTO(t: TemplateDoc): AdminTemplateDTO {
  return {
    id: t._id.toString(), slug: t.slug, title: t.title, occasion: t.occasion, layoutKey: t.layoutKey,
    photoSlots: t.photoSlots, thumbnailUrl: t.thumbnailUrl, defaultHeadline: t.defaultHeadline,
    palettes: t.palettes.map((p) => ({ id: p.id, name: p.name, primary: p.primary, secondary: p.secondary, accent: p.accent, text: p.text, footerBg: p.footerBg })),
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
  const owners = await UserModel.find({ _id: { $in: [...new Set(rows.map((p) => p.userId.toString()))] } }, 'name email');
  const byId = new Map(owners.map((u) => [u._id.toString(), u]));
  const items = rows.map((p) => {
    const owner = byId.get(p.userId.toString());
    return { ...toPosterDTO(p, storage), ownerName: owner?.name ?? '', ownerEmail: owner?.email ?? '' };
  });
  return { items, total };
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
