import { isValidObjectId } from 'mongoose';
import type { Occasion, TemplateDTO } from '@poster/shared';
import { TemplateModel, type TemplateDoc } from '../../models/template.model.js';
import { notFound } from '../../lib/errors.js';

export function toTemplateDTO(t: TemplateDoc): TemplateDTO {
  return {
    id: t._id.toString(), slug: t.slug, title: t.title, occasion: t.occasion, layoutKey: t.layoutKey,
    photoSlots: t.photoSlots, thumbnailUrl: t.thumbnailUrl, defaultHeadline: t.defaultHeadline,
    palettes: t.palettes.map((p) => ({ id: p.id, name: p.name, primary: p.primary, secondary: p.secondary, accent: p.accent, text: p.text, footerBg: p.footerBg })),
  };
}

export function listTemplates(occasion?: Occasion): Promise<TemplateDoc[]> {
  return TemplateModel.find({ isActive: true, ...(occasion ? { occasion } : {}) }).sort({ createdAt: 1 });
}

export async function getActiveTemplate(id: string): Promise<TemplateDoc> {
  if (!isValidObjectId(id)) throw notFound('Template not found');
  const t = await TemplateModel.findOne({ _id: id, isActive: true });
  if (!t) throw notFound('Template not found');
  return t;
}
