import { redirect } from 'next/navigation';

/**
 * Retired. This wizard published through the program update, which now ignores
 * lifecycle fields; programs are built in the course-creator program editor and
 * published with its lifecycle actions. Old links land there.
 */
export default async function RetiredCreateNewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const programId = Array.isArray(id) ? id[0] : id;
  redirect(
    programId
      ? `/dashboard/course-creator/courses/create-program?id=${encodeURIComponent(programId)}`
      : '/dashboard/course-creator/courses/create-program'
  );
}
