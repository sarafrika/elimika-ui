import { redirect } from 'next/navigation';

import { createClassHref } from '@/src/features/organisation/class-builder/routes';

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Old Create class links open the Create class modal with the same prefill. */
export default async function OrganisationNewClassRedirect({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  redirect(
    createClassHref({
      job: first(params.job),
      instructorUuid: first(params.instructorUuid),
      courseUuid: first(params.courseUuid),
      programUuid: first(params.programUuid),
      date: first(params.date),
      startTime: first(params.startTime),
      endTime: first(params.endTime),
    })
  );
}
