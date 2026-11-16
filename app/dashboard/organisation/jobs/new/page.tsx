import { redirect } from 'next/navigation';

import { postJobHref } from '@/src/features/organisation/class-builder/routes';

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Old Post job links open the Post job modal with the same prefill. */
export default async function OrganisationNewJobRedirect({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  redirect(
    postJobHref({
      jobUuid: first(params.jobUuid),
      repostFrom: first(params.repostFrom),
      courseUuid: first(params.courseUuid),
      programUuid: first(params.programUuid),
    })
  );
}
