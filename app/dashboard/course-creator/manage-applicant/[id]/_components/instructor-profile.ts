import type { Instructor, User, UserSummary } from '@/services/client';

function isInstructor(value: unknown): value is Instructor {
  return (
    !!value &&
    typeof value === 'object' &&
    'user_uuid' in value &&
    typeof value.user_uuid === 'string' &&
    !!value.user_uuid
  );
}

/** The instructor endpoint can return a bare profile or an API response envelope. */
export function resolveInstructorProfile(response: unknown): Instructor | undefined {
  if (!response || typeof response !== 'object') return undefined;
  if ('error' in response && response.error) return undefined;
  if ('success' in response && response.success === false) return undefined;

  const profile = 'data' in response ? response.data : response;
  return isInstructor(profile) ? profile : undefined;
}

export function instructorDisplayName(instructor?: Instructor, user?: User | UserSummary) {
  return (
    instructor?.full_name ||
    user?.full_name ||
    user?.display_name ||
    [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ')
  );
}
