import { redirect } from 'next/navigation';

export default async function CourseCreatorEnrollmentStudentDetailPage({
  params,
}: {
  params: Promise<{ contentId: string; studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`/dashboard/course-creator/enrollments/students/${studentId}`);
}
