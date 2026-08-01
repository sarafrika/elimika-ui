import type { ApiResponseUser, User } from '@/services/client';
import { client } from '@/services/client/client.gen';
import { getUserByUuidResponseTransformer } from '@/services/client/transformers.gen';

/**
 * The sign-in bootstrap.
 *
 * Every page load has to turn a session into a user record before it knows the caller's own uuid.
 * That used to be `/api/v1/users/search?email_eq=…`, which meant the endpoint had to stay open to
 * every authenticated caller — and an open search over the user table hands out everyone's email,
 * phone number and date of birth. `/api/v1/users/me` answers the same question from the access
 * token, so the search could be closed to platform admins.
 *
 * Called by hand rather than through the generated SDK because `/me` postdates the last client
 * regeneration. It still goes through the generated `client`, so it inherits the base URL, the
 * server-side token attachment and the query serializer, and it reuses the generated
 * `getUserByUuid` transformer — `/me` returns the same `ApiResponse<User>` envelope, so dates land
 * as `Date` exactly as they do everywhere else. Once the client is regenerated this becomes a
 * one-line delegation to the generated `getCurrentUser`.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const { data, error } = await client.get({
    url: '/api/v1/users/me',
    responseTransformer: getUserByUuidResponseTransformer,
    security: [{ scheme: 'bearer', type: 'http' }],
    // Identity is per-caller but the URL is not, and it changes the moment a user finishes
    // onboarding into a new domain. Nothing about it should sit in Next's data cache.
    next: { revalidate: 0 },
  });

  if (error || !data) {
    return null;
  }

  return (data as ApiResponseUser).data ?? null;
}

/** React Query key for {@link fetchCurrentUser}. Kept per-session so sign-out cannot serve a stale identity. */
export const currentUserQueryKey = (sessionKey?: string | null) =>
  ['current-user', sessionKey ?? null] as const;
