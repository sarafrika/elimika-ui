// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { surfaceTheme } from '@/components/data-display';
import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { useSearchIssue } from '@/hooks/use-search-query';
import { useUrlSearchQuery } from '@/hooks/use-url-search-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course } from '@/services/client';
import { getAllCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { PageMetadata } from '@/services/client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BookOpen, Filter } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CourseCard } from '../../../_components/course-card';

const _sidebarNavItems = [
  {
    title: 'Drafts',
    href: '/dashboard/instructor/courses/drafts',
  },
  {
    title: 'Published',
    href: '/dashboard/instructor/courses/published',
  },
];

export default function CourseMangementPage() {
  const router = useRouter();
  const _pathname = usePathname();

  const [_selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  // Free text goes to the server as `q` (search index, typo-tolerant); a new term starts at page 1.
  const search = useUrlSearchQuery();

  const size = 20;
  const [paging, setPaging] = useState({ q: search.q, page: 0 });
  const page = paging.q === search.q ? paging.page : 0;
  const setPage = (next: number) => setPaging({ q: search.q, page: next });

  const coursesQuery = useQuery({
    ...getAllCoursesOptions({
      query: { pageable: { page, size }, ...(search.q ? { q: search.q } : {}) },
    }),
    placeholderData: keepPreviousData,
  });
  const { data, isSuccess, isFetched, isFetching } = coursesQuery;
  const searchIssue = useSearchIssue(search, coursesQuery.error);
  const courses: Course[] = data?.data?.content ?? [];
  const paginationMetadata: PageMetadata | undefined = data?.data?.metadata;

  const filteredCourses = courses.filter(
    (course: Course) => selectedSubcategory === '' || course.subcategory === selectedSubcategory
  );

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto'>
        {/* Search and Filters */}
        <div className='mb-8'>
          <div className='mb-6 flex gap-4'>
            <SearchQueryInput search={search} placeholder='Search courses…' />
            <Button variant='outline'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>
          <SearchNotice issue={searchIssue} onReset={search.clear} />
        </div>

        {/* Results */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>
              Undertake more courses to boost your instructor profile
            </p>
            <p className='text-muted-foreground text-sm'>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className={surfaceTheme.cardGrid}>
          {filteredCourses.map(course => (
            <CourseCard
              key={course.uuid}
              course={course}
              isStudentView={true}
              handleEnroll={() =>
                router.push(`/dashboard/instructor/learning/enroll/${course.uuid}`)
              }
              handleSearchInstructor={() =>
                router.push(`/dashboard/instructor/learning/instructor/${course.uuid}`)
              }
              handleClick={() => router.push(`/dashboard/instructor/learning/${course.uuid}`)}
            />
          ))}
        </div>

        {isFetching && !isFetched && !isSuccess && (
          <div className='flex flex-col gap-6 space-y-2'>
            <Skeleton className='h-[150px] w-full' />

            <div className='flex flex-row items-center justify-between gap-4'>
              <Skeleton className='h-[250px] w-2/3' />
              <Skeleton className='h-[250px] w-1/3' />
            </div>

            <Skeleton className='h-[100px] w-full' />
          </div>
        )}

        {!isFetching && isFetched && isSuccess && filteredCourses.length === 0 && (
          <div className='py-16 text-center'>
            <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
            <h3 className='mb-2'>No courses found</h3>
            <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
            <Button
              variant='outline'
              onClick={() => {
                search.clear();
                setSelectedCategory('all');
                setSelectedSubcategory('');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredCourses.length > 0 && (
          <div className='my-12 text-center'>
            <Button variant='outline'>Load More Courses</Button>
          </div>
        )}

        {paginationMetadata && paginationMetadata.totalPages >= 1 && (
          <CustomPagination
            totalPages={paginationMetadata.totalPages}
            onPageChange={page => {
              setPage(page - 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
