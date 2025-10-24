'use client';

import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllCoursesOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CourseCard } from '../../_components/course-card';

export default function MyCoursesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const size = 20;
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery(
    getAllCoursesOptions({ query: { pageable: { page, size } } })
  );

  const { data: c, isLoading: cIsLoading } = useQuery(
    listCatalogItemsOptions({ query: { active_only: false } })
  );

  const courses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;

  const filteredCourses = courses?.filter((course: any) => {
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubcategory =
      selectedSubcategory === '' || course.subcategory === selectedSubcategory;

    return matchesSearch && matchesSubcategory;
  });

  if (isLoading) {
    return (
      <div className='flex flex-col gap-6 space-y-2'>
        <Skeleton className='h-[150px] w-full' />

        <div className='flex flex-row items-center justify-between gap-4'>
          <Skeleton className='h-[250px] w-2/3' />
          <Skeleton className='h-[250px] w-1/3' />
        </div>

        <Skeleton className='h-[100px] w-full' />
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto'>
        {/* Search and Filters */}
        <div className='mb-8'>
          <div className='mb-6 flex gap-4'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='Search courses...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant='outline'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredCourses.map(course => (
            <CourseCard
              key={course.uuid}
              course={course as any}
              isStudentView={true}
              handleEnroll={() => { }}
              handleSearchInstructor={() => { }}
              // handleEnroll={() => router.push(`/dashboard/my-courses/instructor/123`)}
              // handleSearchInstructor={() => router.push(`/my/browse-courses/enroll/${course.uuid}`)}
              handleClick={() => router.push(`/dashboard/my-courses/${course.uuid}`)}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className='py-16 text-center'>
            <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
            <h3 className='mb-2'>No courses found</h3>
            <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
            <Button
              variant='outline'
              onClick={() => {
                setSearchQuery('');
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

        {/* @ts-ignore */}
        {paginationMetadata?.totalPages >= 1 && (
          <CustomPagination
            totalPages={paginationMetadata?.totalPages as number}
            onPageChange={page => {
              setPage(page - 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
