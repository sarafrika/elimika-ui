'use client';

import { useEffect } from 'react';
import { useBreadcrumb } from '@/context/breadcrumb-provider';

export default function UsersPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'account', title: 'Account', url: '/dashboard/account' },
      {
        id: 'users',
        title: 'Users',
        url: '/dashboard/account/users',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  return (
    <div>
      <h1 className='text-2xl font-bold'>Users</h1>
      <p>Manage your users here.</p>
    </div>
  );
}
