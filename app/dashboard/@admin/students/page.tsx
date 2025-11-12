import { AdminUserWorkspace } from '../users/_components/user-workspace';

export default function AdminStudentsPage() {
  return (
    <AdminUserWorkspace
      title='Student directory'
      fixedDomain='student'
      emptyStateTitle='No students match these filters'
      emptyStateDescription='Refine the search terms or adjust filters to continue with student moderation.'
    />
  );
}
