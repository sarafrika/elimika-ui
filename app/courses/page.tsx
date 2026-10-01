import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicCoursesPage } from '@/src/features/catalogue/components/PublicCoursesPage';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Browse public Elimika courses and programmes, compare training options, and discover the next learning experience for your skills journey.',
  path: '/courses',
  keywords: ['courses', 'catalogue', 'training', 'learning programs', 'Elimika courses'],
});

/**
 * The public catalogue. The server renders the catalogue's first page (crawlable, and
 * the fallback when search is down); the client searches courses and programmes through
 * `/api/v1/catalogue/search`.
 */
export default async function PublicCoursesRoute() {
  let catalogue: PublicCatalogueCourse[] = [];
  let hasError = false;
  try {
    catalogue = (await listPublicCatalogueCourses()).items;
  } catch {
    hasError = true;
  }

  return (
    <Suspense>
      <PublicCoursesPage catalogue={catalogue} hasError={hasError} />
    </Suspense>
  );
}
