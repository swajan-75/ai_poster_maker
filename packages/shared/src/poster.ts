import { z } from 'zod';
import { HEADLINE_FONTS, MOTIFS, type PosterStatus } from './enums.js';
import { MAX_PHOTOS } from './limits.js';
import { objectIdSchema } from './auth.js';
import { DEFAULT_POSTER_SIZE, POSTER_SIZES, type PosterSize } from './sizes.js';

// Control chars forbidden; ZWJ/ZWNJ (U+200C/U+200D) intentionally allowed.
// eslint-disable-next-line no-control-regex -- intentional: rejects control chars, preserves Bangla ZWJ/ZWNJ
const NO_CONTROL = /^[^\u0000-\u001F\u007F]*$/;
const text = (min: number, max: number) =>
  z.string().trim().min(min).max(max).regex(NO_CONTROL); // no custom message: web supplies Bangla messages via z.config (Task 15)

export const posterFormSchema = z.object({
  name: text(2, 60),
  designation: text(2, 80),
  organization: text(2, 100),
  union: text(0, 60),
  thana: text(0, 60),
  district: text(2, 40),
  headline: text(2, 100),
  tagline: text(0, 80),
  // Optional ballot-poster fields (rendered only by BALLOT_LAYOUTS).
  topLine: text(0, 60).optional(),
  electionDate: text(0, 60).optional(),
  symbol: text(0, 30).optional(),
  appeal: text(0, 140).optional(),
  campaignBy: text(0, 80).optional(),
});
export type PosterFormData = z.infer<typeof posterFormSchema>;

export const focusPointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export type FocusPoint = z.infer<typeof focusPointSchema>;

export const posterDesignSchema = z.object({
  paletteId: z.string().min(1).max(40),
  motif: z.enum(MOTIFS),
  headlineFont: z.enum(HEADLINE_FONTS),
  headlineScale: z.number().min(0.8).max(1.3),
  photoFocus: z.array(focusPointSchema).max(MAX_PHOTOS),
  tagline: z.string().trim().max(80).optional(),
});
export type PosterDesign = z.infer<typeof posterDesignSchema>;

export const createPosterSchema = z.object({
  templateId: objectIdSchema,
  formData: posterFormSchema,
  photoIds: z.array(z.string().min(1).max(200)).min(1).max(MAX_PHOTOS),
  size: z.enum(POSTER_SIZES).default(DEFAULT_POSTER_SIZE),
});
export type CreatePosterInput = z.infer<typeof createPosterSchema>;

export const regenerateSchema = z.object({ formData: posterFormSchema.partial().optional() });
export type RegenerateInput = z.infer<typeof regenerateSchema>;

export interface PosterDTO {
  id: string;
  templateId: string;
  size: PosterSize;
  formData: PosterFormData;
  status: PosterStatus;
  imageUrl: string | null;
  downloadUrls: { png: string; jpg: string } | null;
  regenerationsLeft: number;
  watermarked: boolean;
  error: string | null;
  /** The admin's note when the poster was rejected in moderation. */
  rejectionNote: string | null;
  createdAt: string;
}

export interface PosterListDTO { items: PosterDTO[]; total: number; page: number; limit: number }

export interface AdminPosterDTO extends PosterDTO {
  ownerName: string;
  ownerEmail: string;
}

export interface AdminPosterListDTO { items: AdminPosterDTO[]; total: number; page: number; limit: number }

/** A poster waiting in the moderation queue. It has no rendered image yet, so the admin reviews the text and photos. */
export interface ModerationItemDTO extends AdminPosterDTO {
  flagReason: string;
  flaggedAt: string;
  photoUrls: string[];
}

export interface ModerationListDTO { items: ModerationItemDTO[]; total: number; page: number; limit: number }

export const rejectPosterSchema = z.object({ note: z.string().trim().max(300).regex(NO_CONTROL).optional() });
export type RejectPosterInput = z.infer<typeof rejectPosterSchema>;

export interface UploadedPhotoDTO { publicId: string; url: string; width: number; height: number }
