import { Suspense } from 'react';
import { InboxPage } from '@/src/features/admin/pages/inbox-page';
import AdminInboxLoading from './loading';

export default function AdminInboxRoute() {
  return (
    <Suspense fallback={<AdminInboxLoading />}>
      <InboxPage />
    </Suspense>
  );
}
