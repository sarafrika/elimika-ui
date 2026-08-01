import { Suspense } from 'react';

import Spinner from '@/components/ui/spinner';
import { DashboardSettingsPage } from '@/src/features/dashboard/settings';

export default function OrganisationSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className='flex w-full justify-center px-2 py-10'>
          <Spinner className='h-6 w-6' />
        </div>
      }
    >
      <DashboardSettingsPage variant='organisation' />
    </Suspense>
  );
}
