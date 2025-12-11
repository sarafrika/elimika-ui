import { AddAdminDrawer } from './_components/add-admin-drawer';
import { AdminUserWorkspace } from '../users/_components/user-workspace';

export default function AdminAdministratorsPage() {
  return (
    <div className='space-y-6'>
      <AddAdminDrawer />
      <AdminUserWorkspace
        title='Admin roster'
        fixedDomain='admin'
        useAdminEndpoint
        emptyStateTitle='No administrators match your filters'
        emptyStateDescription='Adjust search criteria or filters to find other administrators.'
      />
    </div>
  );
}
