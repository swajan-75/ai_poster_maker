import { Schema, model } from 'mongoose';
import { MOTIFS } from '@poster/shared';
const bgSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    paletteId: { type: String, required: true },
    motif: { type: String, enum: MOTIFS, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const BackgroundCacheModel = model('BackgroundCache', bgSchema);
