import { redirect } from 'next/navigation';

export default function LegacyCourseManagementPage() {
  redirect('/dashboard/course-creator/course-management');
}
