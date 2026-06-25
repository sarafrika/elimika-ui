import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';

export default function TransactionsPage() {
  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Transactions'
          description='Payment and order activity across the platform.'
        />
        <EmptyState
          icon={Receipt}
          variant='card'
          title='Transactions are coming soon'
          description='Order and payment records will appear here once the commerce reporting endpoint is available.'
        />
      </div>
    </main>
  );
}
