import { Suspense } from 'react';
import { PeoplePage } from '@/src/features/admin/pages/people-page';
import AdminPeopleLoading from './loading';

export default function AdminPeopleRoute() {
  return (
    <Suspense fallback={<AdminPeopleLoading />}>
      <PeoplePage />
    </Suspense>
  );
}
