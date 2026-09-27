import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { HEADLINE_FONTS, LAYOUT_KEYS, MOTIFS, OCCASIONS } from '@poster/shared';

const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = { type: String, required: true, match: HEX };

const paletteSchema = new Schema(
  { id: { type: String, required: true }, name: { type: String, required: true },
    primary: hex, secondary: hex, accent: hex, text: hex, footerBg: hex },
  { _id: false },
);

export const designSchema = new Schema(
  {
    paletteId: { type: String, required: true },
    motif: { type: String, enum: MOTIFS, required: true },
    headlineFont: { type: String, enum: HEADLINE_FONTS, required: true },
    headlineScale: { type: Number, min: 0.8, max: 1.3, required: true },
    photoFocus: { type: [{ x: Number, y: Number, _id: false }], default: [] },
    tagline: { type: String, maxlength: 80 },
  },
  { _id: false },
);

const templateSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    occasion: { type: String, enum: OCCASIONS, required: true, index: true },
    layoutKey: { type: String, enum: LAYOUT_KEYS, required: true },
    photoSlots: { type: Number, required: true, min: 1, max: 3 },
    thumbnailUrl: { type: String, required: true },
    defaultHeadline: { type: String, required: true },
    palettes: { type: [paletteSchema], validate: (v: unknown[]) => v.length > 0 },
    motifs: { type: [{ type: String, enum: MOTIFS }], validate: (v: unknown[]) => v.length > 0 },
    defaultDesign: { type: designSchema, required: true },
    isActive: { type: Boolean, default: true },
    isFree: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
export type Template = InferSchemaType<typeof templateSchema>;
export type TemplateDoc = HydratedDocument<Template>;
export const TemplateModel = model('Template', templateSchema);
