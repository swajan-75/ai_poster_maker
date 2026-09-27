import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { PLANS, USER_ROLES } from '@poster/shared';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'user', required: true },
    isBlocked: { type: Boolean, default: false, required: true },
    plan: { type: String, enum: PLANS, default: 'free', required: true },
    planExpiresAt: { type: Date },
  },
  { timestamps: true },
);
export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model('User', userSchema);
