import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard/instructor/enrollments?tab=waiting-list');
}
