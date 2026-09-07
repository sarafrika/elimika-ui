import type { User } from '@/services/client';
import { getCurrentUser } from '@/services/client/sdk.gen';

/**
 * The sign-in bootstrap.
 *
 * Every page load has to turn a session into a user record before it knows the caller's own uuid.
 * That used to be `/api/v1/users/search?email_eq=…`, which meant the endpoint had to stay open to
 * every authenticated caller — and an open search over the user table hands out everyone's email,
 * phone number and date of birth. `/api/v1/users/me` answers the same question from the access
 * token, so the search could be closed to platform admins.
 *
 * This was a hand-rolled `client.get` while `/me` postdated the last client regeneration. It no
 * longer does, so it is the one-line delegation that comment always promised: the generated
 * `getCurrentUser` carries the URL, the `ApiResponse<User>` envelope and the date transformer.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const { data, error } = await getCurrentUser({
    security: [{ scheme: 'bearer', type: 'http' }],
    // Identity is per-caller but the URL is not, and it changes the moment a user finishes
    // onboarding into a new domain. Nothing about it should sit in Next's data cache.
    next: { revalidate: 0 },
  });

  if (error || !data) {
    return null;
  }

  return data.data ?? null;
}

/** React Query key for {@link fetchCurrentUser}. Kept per-session so sign-out cannot serve a stale identity. */
export const currentUserQueryKey = (sessionKey?: string | null) =>
  ['current-user', sessionKey ?? null] as const;
