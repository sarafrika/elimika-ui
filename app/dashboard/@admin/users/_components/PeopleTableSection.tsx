import { getAllUsers } from '@/services/client';
import type { User } from '@/services/client';
import { UsersTable } from './UsersTable';

function hasDomain(user: User, domain: string): boolean {
  const raw = user.user_domain;
  const domains = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
  return domains.includes(domain);
}

/**
 * Server component: fetches users (optionally filtered to a single domain) and renders the
 * powerful table. Used by the Users page and every role page so they all share one 360° view.
 */
export async function PeopleTableSection({ domain }: { domain?: string }) {
  const { data } = await getAllUsers({
    query: { pageable: { page: 0, size: 500, sort: ['created_date,desc'] } },
  }).catch(() => ({ data: undefined }));

  let users = (data?.data?.content ?? []) as User[];
  if (domain) users = users.filter(user => hasDomain(user, domain));

  return <UsersTable users={users} hideRoleFilter={Boolean(domain)} />;
}
