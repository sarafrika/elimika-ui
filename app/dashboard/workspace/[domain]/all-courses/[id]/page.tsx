import { redirect } from 'next/navigation';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';

type WorkspaceCourseDetailsPageProps = {
  params: Promise<{ domain: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkspaceCourseDetailsPage({
  params,
  searchParams,
}: WorkspaceCourseDetailsPageProps) {
  const { domain, id } = await params;
  const normalizedDomain = normalizeStoredUserDomain(domain);
  const query = await searchParams;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      search.set(key, value);
    }
  }

  const queryString = search.toString();
  const nextPath = queryString ? `/dashboard/courses/${id}?${queryString}` : `/dashboard/courses/${id}`;

  if (!normalizedDomain) {
    redirect(nextPath);
  }

  const target = await resolveDashboardEntryTarget(normalizedDomain, nextPath);

  redirect(target.redirectTo);
}
