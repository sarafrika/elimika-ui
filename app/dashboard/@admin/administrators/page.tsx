import { AdminUserWorkspace } from '../users/_components/user-workspace';

export default function AdminAdministratorsPage() {
  return (
    <AdminUserWorkspace
      title='Admin roster'
      description='Review privileged accounts, confirm system access, and keep the administrator directory up to date.'
      badgeLabel='Admin oversight'
      fixedDomain='admin'
      searchPlaceholder='Search by name, email, or username…'
      emptyStateTitle='No administrators match your filters'
      emptyStateDescription='Adjust search criteria or filters to find other administrators.'
    />
  );
}
