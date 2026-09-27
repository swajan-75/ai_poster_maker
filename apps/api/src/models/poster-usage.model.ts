import { Schema, model, type InferSchemaType } from 'mongoose';
import { PLANS } from '@poster/shared';

/**
 * One row per poster creation. Never deleted with the poster, so deleting a poster does not
 * give back a daily-quota slot, and analytics still count it.
 */
const posterUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    posterId: { type: Schema.Types.ObjectId, ref: 'Poster' },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    plan: { type: String, enum: PLANS, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
posterUsageSchema.index({ userId: 1, createdAt: -1 });
posterUsageSchema.index({ createdAt: -1 });

export type PosterUsage = InferSchemaType<typeof posterUsageSchema>;
export const PosterUsageModel = model('PosterUsage', posterUsageSchema);
