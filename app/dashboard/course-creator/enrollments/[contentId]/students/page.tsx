import { CourseCreatorEnrollmentStudentsTable } from "./_components/CourseCreatorEnrollmentStudentsTable";


export default async function CourseCreatorEnrollmentStudentsPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;

  return <CourseCreatorEnrollmentStudentsTable contentId={contentId} />;
}
