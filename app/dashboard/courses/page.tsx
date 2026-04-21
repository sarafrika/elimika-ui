import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerActiveDashboardDomain } from '@/src/features/dashboard/server/active-domain';
import { resolveDashboardEntryTarget } from '@/src/features/dashboard/server/entry-target';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type CoursesEntryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoursesEntryPage({ searchParams }: CoursesEntryPageProps) {
  const activeDomain = await getServerActiveDashboardDomain();
  const query = await searchParams;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      search.set(key, value);
    }
  }

  const queryString = search.toString();
  const nextPath = queryString
    ? `/dashboard/courses?${queryString}`
    : '/dashboard/courses';
  const target = await resolveDashboardEntryTarget(activeDomain, nextPath);

  redirect(target.redirectTo);
}
