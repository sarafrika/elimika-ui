import { redirect } from 'next/navigation';

import { createClassHref } from '@/src/features/organisation/class-builder/routes';

export default async function OrganisationCreateClassRedirect({
  params,
}: {
  params: Promise<{ jobUuid: string }>;
}) {
  const { jobUuid } = await params;
  redirect(createClassHref({ job: jobUuid }));
}
