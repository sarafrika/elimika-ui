'use client';

import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAllInstructorsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBreadcrumb } from '../../../../../../context/breadcrumb-provider';
import BookInstructorCard from '../../../../_components/book-instructor-card';

const CourseInstructorDetails = () => {
  const params = useParams();
  const courseId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        {
          id: 'courses',
          title: 'Browse Courses',
          url: `/dashboard/browse-courses`,
        },
        {
          id: 'instructors-details',
          title: `Instructors`,
          url: `/dashboard/browse-courses/instructors/${courseId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  const size = 20;
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isFetching } = useQuery(
    getAllInstructorsOptions({ query: { pageable: { page, size } } })
  )
  const instructors = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;


  const filteredInstructors = instructors?.filter((instructor: any) => {
    const matchesSearch =
      searchQuery === '' ||
      instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor?.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor?.professional_headline?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });


  return (
    <div className='space-y-6 flex flex-col'>
      <p>Available Instructors</p>


      <div className='mb-6 flex gap-4'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search instructor...'
            className='pl-10'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInstructors?.map((instructor) => (
          <BookInstructorCard key={instructor.uuid} instructor={instructor} />
        ))}
      </div>

      {(!isLoading || !isFetching) && filteredInstructors.length === 0 && (
        <div className='py-16 text-center'>
          <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
          <h3 className='mb-2'>No Instructors found</h3>
          <p className='text-muted-foreground mb-4'>Try adjusting your search or filters</p>
          <Button
            variant='outline'
            onClick={() => {
              setSearchQuery('');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <div className='mt-6 mb-10'>
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
    </div>);
};

export default CourseInstructorDetails;
