import { UserDetailView } from "../../../../../admin/users/_components/UserDetailView";

export default async function CourseCreatorEnrollmentStudentDetailPage({
  params,
}: {
  params: Promise<{ contentId: string; studentId: string }>;
}) {
  const { contentId, studentId } = await params;

  return (
    <UserDetailView
      uuid={studentId}
      backHref={`/dashboard/course-creator/enrollments/${contentId}/students`}
      backLabel='Back to students'
    />
  );
}
