import { redirect } from 'next/navigation';

export default function AssignmentsPage() {
  redirect('/dashboard/instructor/training-hub?tab=assignment');
}
