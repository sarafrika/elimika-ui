import { redirect } from 'next/navigation';

export default async function CourseCreatorEnrollmentStudentsPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  await params;
  redirect('/dashboard/course-creator/enrollments');
}
