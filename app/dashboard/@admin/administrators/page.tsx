import { AdminUserWorkspace } from '../users/_components/user-workspace';

export default function AdminAdministratorsPage() {
  return (
    <AdminUserWorkspace
      title='Admin roster'
      fixedDomain='admin'
      searchPlaceholder='Search by name, email, or username…'
      emptyStateTitle='No administrators match your filters'
      emptyStateDescription='Adjust search criteria or filters to find other administrators.'
    />
  );
}
