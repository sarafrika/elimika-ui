import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  PublicCoursesPage,
  type ServerCatalogue,
} from '@/src/features/catalogue/components/PublicCoursesPage';
import { listPublicCatalogueCourses } from '@/src/features/catalogue/server';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Courses',
  description:
    'Browse public Elimika courses and programmes, compare training options, and discover the next learning experience for your skills journey.',
  path: '/courses',
  keywords: ['courses', 'catalogue', 'training', 'learning programs', 'Elimika courses'],
});

/**
 * The public catalogue. The server's first page streams in behind the shell (crawlable,
 * and the fallback when search is down) while the client searches `/api/v1/catalogue/search`.
 */
export default function PublicCoursesRoute() {
  const cataloguePromise: Promise<ServerCatalogue> = listPublicCatalogueCourses().then(
    result => ({ items: result.items, hasError: false }),
    () => ({ items: [], hasError: true })
  );

  return (
    <Suspense>
      <PublicCoursesPage cataloguePromise={cataloguePromise} />
    </Suspense>
  );
}
