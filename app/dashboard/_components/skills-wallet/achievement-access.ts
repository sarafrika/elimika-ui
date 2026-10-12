import type { User } from '@/services/client/types.gen';

export type AchievementWalletRole = 'student' | 'instructor' | 'course_creator';

// /me/profile uses the authenticated user's wallet. The API exposes domains,
// rather than individual achievement permissions; never infer access from a URL.
export function canAddWalletAchievement(
  profile:
    | (Partial<Pick<User, 'uuid' | 'active'>> & {
        user_domain?: string | readonly string[];
        isLoading?: boolean;
      })
    | null
    | undefined,
  role: AchievementWalletRole
) {
  if (!profile?.uuid || profile.isLoading || profile.active !== true) return false;
  const domains = profile.user_domain;
  return Array.isArray(domains) ? domains.includes(role) : domains === role;
}
