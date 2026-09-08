import type { Metadata } from 'next';
import { PublicCoursesPage } from '@/src/features/catalogue/components/PublicCoursesPage';
import { filterCatalogueCourses } from '@/src/features/catalogue/format';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Browse public Elimika courses, compare training options, and discover the next learning experience for your skills journey.',
  path: '/courses',
  keywords: ['courses', 'catalogue', 'training', 'learning programs', 'Elimika courses'],
});

type PublicCoursesRouteProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

const readQuery = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? '';
};

export default async function PublicCoursesRoute({ searchParams }: PublicCoursesRouteProps) {
  const query = readQuery((await searchParams).q);

  try {
    const { items } = await listPublicCatalogueCourses();
    return <PublicCoursesPage items={filterCatalogueCourses(items, query)} query={query} />;
  } catch {
    return <PublicCoursesPage items={[]} hasError query={query} />;
  }
}
