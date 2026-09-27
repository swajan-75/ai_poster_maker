import bcrypt from 'bcryptjs';
import type { LoginInput, PublicUser, RegisterInput } from '@poster/shared';
import { UserModel, type UserDoc } from '../../models/user.model.js';
import { AppError, conflict } from '../../lib/errors.js';
import { effectivePlan, planExpiry } from '../billing/subscription.service.js';

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

export async function registerUser(input: RegisterInput): Promise<UserDoc> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await UserModel.create({ name: input.name.normalize('NFC'), email: input.email, passwordHash });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw conflict('EMAIL_TAKEN', 'Email already registered');
    throw e;
  }
}

export async function authenticate(input: LoginInput): Promise<UserDoc> {
  const user = await UserModel.findOne({ email: input.email });
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  if (user.isBlocked) throw new AppError(403, 'FORBIDDEN', 'This account has been blocked');
  return user;
}

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    id: u._id.toString(), name: u.name, email: u.email, role: u.role,
    plan: effectivePlan(u), planExpiresAt: planExpiry(u)?.toISOString() ?? null,
  };
}




