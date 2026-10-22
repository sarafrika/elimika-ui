import { StudentEnrollmentGate } from '@/src/features/dashboard/courses/components/StudentEnrollmentGate';

type StartCoursePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StartCoursePage({ searchParams }: StartCoursePageProps) {
  const { next } = await searchParams;
  return <StudentEnrollmentGate nextPath={typeof next === 'string' ? next : undefined} />;
}
