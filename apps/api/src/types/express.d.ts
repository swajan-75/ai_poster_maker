import type { UserRole } from '@poster/shared';
declare global {
  namespace Express {
    interface Request { user?: { id: string; role: UserRole } }
  }
}
export {};
