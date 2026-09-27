import { Schema, model } from 'mongoose';
const logSchema = new Schema(
  {
    posterId: { type: Schema.Types.ObjectId, ref: 'Poster' },
    kind: { type: String, enum: ['design', 'background'], required: true },
    model: { type: String, required: true },
    prompt: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, required: true },
    success: { type: Boolean, required: true },
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const GenerationLogModel = model('GenerationLog', logSchema);
