'use client';

import { useOrganisationAccountBreadcrumb } from '@/src/features/organisation/account/hooks/useOrganisationAccountBreadcrumb';

export default function UsersPage() {
  useOrganisationAccountBreadcrumb('users', 'Users', '/dashboard/account/users');

  return (
    <div>
      <h1 className='text-2xl font-bold'>Users</h1>
      <p>Manage your users here.</p>
    </div>
  );
}
