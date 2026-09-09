import { BookOpen, CircleAlert } from 'lucide-react';
import Link from 'next/link';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';
import { CataloguePageShell } from './CataloguePageShell';
import { CatalogueStatusCard } from './CatalogueStatusCard';
import { PublicCourseCard } from './PublicCourseCard';

export function PublicCoursesPage({
  items,
  hasError = false,
  query = '',
}: {
  items: PublicCatalogueCourse[];
  hasError?: boolean;
  query?: string;
}) {
  const isSearching = query.length > 0;

  return (
    <CataloguePageShell>
      <header className='border-border bg-card space-y-6 rounded-[36px] border p-8 shadow-xl backdrop-blur-sm lg:p-12'>
        <div className='border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.4em] uppercase'>
          Catalogue
        </div>
        <div className='space-y-4'>
          <h1 className='text-foreground text-3xl font-semibold sm:text-4xl'>
            {isSearching ? `Courses matching “${query}”` : 'Browse our course catalogue'}
          </h1>
          <p className='text-muted-foreground max-w-3xl text-base'>
            Explore our comprehensive catalogue of courses created by expert instructors and
            organizations. Find the right course to advance your skills and learning goals.
          </p>
          {isSearching ? (
            <Link
              href='/courses'
              className='text-primary hover:text-primary/80 inline-flex text-sm font-semibold'
            >
              Clear search
            </Link>
          ) : null}
        </div>
      </header>

      <section className='space-y-6'>
        {hasError ? (
          <CatalogueStatusCard
            title='Unable to load courses'
            description='Please refresh the page or try again later. If the issue persists, contact support.'
            icon={CircleAlert}
            tone='error'
          />
        ) : items.length === 0 ? (
          <CatalogueStatusCard
            title={isSearching ? 'No courses matched your search' : 'No courses available'}
            description={
              isSearching
                ? 'Try a shorter search, a different spelling, or clear the search to see the whole catalogue.'
                : 'Our catalogue is being updated. Check back soon for new courses or contact us to explore custom learning opportunities.'
            }
            icon={BookOpen}
          />
        ) : (
          <>
            <div className='flex items-center justify-between'>
              <div className='text-muted-foreground text-sm'>
                <span className='text-foreground font-semibold'>{items.length}</span>{' '}
                {items.length === 1 ? 'course' : 'courses'} {isSearching ? 'found' : 'available'}
              </div>
            </div>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {items.map(item => (
                <PublicCourseCard key={item.course.uuid} item={item} />
              ))}
            </div>
          </>
        )}
      </section>
    </CataloguePageShell>
  );
}
