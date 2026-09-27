import { z } from 'zod';
import type { UserRole } from './enums.js';
import type { Plan } from './subscription.js';

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password: z.string().min(8).max(72), // bcrypt only uses first 72 bytes
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });
export type LoginInput = z.infer<typeof loginSchema>;

export interface PublicUser { id: string; name: string; email: string; role: UserRole; plan: Plan; planExpiresAt: string | null }

export interface AuthResponse { user: PublicUser; token: string }

export interface AdminUserDTO { id: string; name: string; email: string; role: UserRole; isBlocked: boolean; createdAt: string }
export interface AdminUserListDTO { items: AdminUserDTO[]; total: number; page: number; limit: number }
