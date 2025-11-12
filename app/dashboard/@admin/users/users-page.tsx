import { AdminUserWorkspace } from './_components/user-workspace';

export default function AdminUsersPage() {
  return (
    <AdminUserWorkspace
      title='Manage users'
      description='Audit platform accounts, update key profile details, and manage domain permissions from a unified moderation hub.'
      badgeLabel='Admin operations'
    />
  );
}
