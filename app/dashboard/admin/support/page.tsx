import { LifeBuoy } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';

export default function SupportPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Support'
          description='Help desk and support requests from platform users.'
        />
        <EmptyState
          icon={LifeBuoy}
          variant='card'
          title='Support tooling is coming soon'
          description='User support tickets and help-desk tools will be available here.'
        />
      </div>
    </main>
  );
}
