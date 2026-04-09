import type { Metadata } from 'next';
import { PublicCoursesPage } from '@/src/features/catalogue/components/PublicCoursesPage';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Browse public Elimika courses, compare training options, and discover the next learning experience for your skills journey.',
  path: '/courses',
  keywords: ['courses', 'catalogue', 'training', 'learning programs', 'Elimika courses'],
});

export default async function PublicCoursesRoute() {
  try {
    const { items } = await listPublicCatalogueCourses();
    return <PublicCoursesPage items={items} />;
  } catch {
    return <PublicCoursesPage items={[]} hasError />;
  }
}
