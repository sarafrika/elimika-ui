'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { User } from '@/services/client';
import { getAllUsersOptions } from '@/services/client/@tanstack/react-query.gen';
import { UsersTable } from './UsersTable';

function hasDomain(user: User, domain: string): boolean {
  const raw = user.user_domain;
  const domains = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
  return domains.includes(domain);
}

/**
 * Client component: fetches users through the proxy (carrying the admin session) and
 * renders the table. Optionally filters to a single domain.
 */
export function PeopleTableSection({ domain }: { domain?: string }) {
  const { data, isLoading } = useQuery(
    getAllUsersOptions({
      query: {
        pageable: { page: 0, size: 100, sort: ['createdDate,desc', 'lastModifiedDate,desc'] },
      },
    })
  );

  const users = useMemo(() => {
    let list = (data?.data?.content ?? []) as User[];
    if (domain) list = list.filter(user => hasDomain(user, domain));
    return list;
  }, [data?.data?.content, domain]);

  return <UsersTable users={users} hideRoleFilter={Boolean(domain)} isLoading={isLoading} />;
}
