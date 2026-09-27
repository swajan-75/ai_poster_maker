import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { POSTER_STATUSES } from '@poster/shared';
import { designSchema } from './template.model.js';

const formSchema = new Schema(
  { name: String, designation: String, organization: String, union: String, thana: String,
    district: String, headline: String, tagline: String,
    topLine: String, electionDate: String, symbol: String, appeal: String, campaignBy: String },
  { _id: false },
);

const posterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    formData: { type: formSchema, required: true },
    photoIds: { type: [String], required: true },
    design: { type: designSchema, required: false },
    imagePublicId: String,
    imageUrl: String,
    status: { type: String, enum: POSTER_STATUSES, default: 'queued', required: true },
    regenerateCount: { type: Number, default: 0, min: 0 },
    watermarked: { type: Boolean, default: false, required: true },
    // Set by remove-watermark: re-render with the stored design instead of asking the AI again.
    reuseDesign: { type: Boolean, default: false },
    error: String,
  },
  { timestamps: true },
);
posterSchema.index({ userId: 1, createdAt: -1 });
posterSchema.index({ status: 1 });

export type Poster = InferSchemaType<typeof posterSchema>;
export type PosterDoc = HydratedDocument<Poster>;
export const PosterModel = model('Poster', posterSchema);
