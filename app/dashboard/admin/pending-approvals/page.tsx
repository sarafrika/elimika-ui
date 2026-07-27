import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { adminTheme } from '../_components/ui/admin-theme';
import { PendingApprovalsClient } from './_components/PendingApprovalsClient';

export default function PendingApprovalsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Pending approvals'
          description='Triage profile, organisation, and evidence approvals for instructors, course creators, and organisations.'
        />
        <PendingApprovalsClient />
      </div>
    </main>
  );
}
