import { z } from 'zod';
import { LAYOUT_KEYS, MOTIFS, OCCASIONS, type LayoutKey, type Occasion } from './enums.js';
import { posterDesignSchema } from './poster.js';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const paletteSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(40),
  primary: hex, secondary: hex, accent: hex, text: hex, footerBg: hex,
});
export type Palette = z.infer<typeof paletteSchema>;

export interface TemplateDTO {
  id: string;
  slug: string;
  title: string;
  occasion: Occasion;
  layoutKey: LayoutKey;
  photoSlots: number;
  thumbnailUrl: string;
  defaultHeadline: string;
  palettes: Palette[];
}

export interface AdminTemplateDTO extends TemplateDTO {
  motifs: (typeof MOTIFS)[number][];
  defaultDesign: z.infer<typeof posterDesignSchema>;
  isActive: boolean;
}

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens').min(2).max(60);

export const adminTemplateCreateSchema = z.object({
  slug,
  title: z.string().trim().min(2).max(80),
  occasion: z.enum(OCCASIONS),
  layoutKey: z.enum(LAYOUT_KEYS),
  photoSlots: z.number().int().min(1).max(3),
  thumbnailUrl: z.string().trim().min(1).max(2000),
  defaultHeadline: z.string().trim().min(1).max(80),
  palettes: z.array(paletteSchema).min(1),
  motifs: z.array(z.enum(MOTIFS)).min(1),
  defaultDesign: posterDesignSchema,
});
export type AdminTemplateCreateInput = z.infer<typeof adminTemplateCreateSchema>;

export const adminTemplateUpdateSchema = adminTemplateCreateSchema.partial();
export type AdminTemplateUpdateInput = z.infer<typeof adminTemplateUpdateSchema>;
