'use client';

import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';

export function useOrganisationAccountBreadcrumb(id: string, title: string, url: string) {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      { id, title, url, isLast: true },
    ]);
  }, [id, title, url, replaceBreadcrumbs]);
}
