import { Suspense } from 'react';

import { GroupsPageSkeleton } from '@/src/features/organisation/groups/components/GroupsPageSkeleton';
import GroupsRosterPage from '@/src/features/organisation/groups/pages/GroupsRosterPage';

export default function OrganisationGroupsPage() {
  // The roster reads its filters from `useSearchParams`, which needs a Suspense
  // boundary so the shell can still be prerendered.
  return (
    <Suspense fallback={<GroupsPageSkeleton />}>
      <GroupsRosterPage />
    </Suspense>
  );
}
