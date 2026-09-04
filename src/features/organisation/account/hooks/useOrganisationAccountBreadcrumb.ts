'use client';

import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';

export function useOrganisationAccountBreadcrumb(id: string, title: string, url: string) {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { activeDomain } = useUserDomain();

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'account',
        title: 'Account',
        url: roleScopedDashboardPath(activeDomain, '/dashboard/account'),
      },
      { id, title, url: roleScopedDashboardPath(activeDomain, url), isLast: true },
    ]);
  }, [activeDomain, id, title, url, replaceBreadcrumbs]);
}
