import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { ModerationQueueClient } from './_components/ModerationQueueClient';

export default function ModerationPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Content moderation'
          description='Review and action content submitted for approval across the platform.'
        />
        <ModerationQueueClient />
      </div>
    </main>
  );
}
