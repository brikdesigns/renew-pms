import 'server-only';

export {
  getAuthUser,
  requireAuth,
  requirePlatformAdmin,
  requirePracticeAdmin,
  isAuthError,
  isPlatformAdmin,
  isAdmin,
} from '@/lib/auth';
export type { AuthUser, SystemRole, PracticeRole, Permission } from '@/lib/auth';
