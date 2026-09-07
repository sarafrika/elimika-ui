import type { User, UserSummary } from '@/services/client';

/**
 * Narrows a `GET /api/v1/users/{uuid}` payload to the privileged {@link User} record.
 *
 * The endpoint answers two different shapes, and which one a caller gets is the server's
 * decision, not the client's. `/users/{uuid}` is the platform's people directory — instructor
 * cards, rosters, enrolment tables, the calendar and the public profile page all resolve a name
 * and an avatar through it, for accounts the caller has no relationship with — so it is never
 * refused on identity grounds. What changes is the payload. The account holder, a platform
 * administrator, a manager of one of the account's organisations, and anyone in a working
 * relationship with them (the instructor whose register they are on, the course creator whose
 * course they applied to teach) receive the full {@link User}. Every other authenticated caller
 * receives the {@link UserSummary} projection: display identity only.
 *
 * The difference between the two is exactly the personal data the lockdown set out to protect —
 * email, phone number, date of birth, username, organisation affiliations, audit stamps — so a
 * component that reads those off an unnarrowed response is not merely mistyped, it renders
 * `undefined` for every caller the server declined to trust. Narrow first, and leave the row or
 * section out when the field did not come back; do not assume the privileged shape.
 *
 * Narrowing is on `email`, which `User` requires and `UserSummary` does not carry at all.
 */
export function isFullUser(user: User | UserSummary | null | undefined): user is User {
  return Boolean(user) && 'email' in (user as object);
}
