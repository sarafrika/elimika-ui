import { redirect } from 'next/navigation';

export default function CourseManagementPage() {
  redirect('/dashboard/course-creator/course-management/all?type=courses');
}
