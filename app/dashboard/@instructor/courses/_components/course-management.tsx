'use client';

import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import {
  getAllCoursesOptions,
  submitTrainingApplicationMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import NotesModal from '../../../../../components/custom-modals/notes-modal';
import { useUserProfile } from '../../../../../context/profile-context';
import { TrainCourseCard } from '../../../_components/train-course-card';

export default function CourseMangementPage() {
  const router = useRouter();
  const instructor = useInstructor();
  const profile = useUserProfile()

  const [searchQuery, setSearchQuery] = useState('');
  const [applyModal, setApplyModal] = useState(false)
  const [applyingCourseId, setApplyingCourseId] = useState<string | null>(null)

  const size = 20;
  const [page, setPage] = useState(0);

  // const { data, isLoading, isSuccess, isFetched, isFetching } = useQuery({
  //   ...getCoursesByInstructorOptions({
  //     path: { instructorUuid: instructor?.uuid as string },
  //     query: { pageable: { page, size, sort: [] } },
  //   }),
  //   enabled: !!instructor?.uuid,
  // });

  const { data: allCourses, isLoading, isSuccess, isFetched, isFetching } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

  const courses = allCourses?.data?.content;
  const paginationMetadata = allCourses?.data?.metadata;

  const filteredCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [];

    return courses.filter(course => {
      if (!searchQuery) return true;
      const normalizedQuery = searchQuery.toLowerCase();
      return (
        course?.name?.toLowerCase().includes(normalizedQuery) ||
        course?.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [courses, searchQuery]);

  const applyToTrain = useMutation(submitTrainingApplicationMutation())
  const handleApplyToTrain = (notes: string) => {
    if (!applyingCourseId) return

    applyToTrain.mutate({
      body: {
        // applicant_type: profile?.activeDomain as ApplicantTypeEnum,
        applicant_type: "instructor",
        applicant_uuid: instructor?.uuid as string,
        application_notes: notes
      },
      path: { courseUuid: applyingCourseId }
    },
      {
        onSuccess: (data) => {
          toast.success(data?.message)
          setApplyModal(false)
        },
        onError: (data) => {
          toast.error(data?.message)
          setApplyModal(false)
        }
      })
  }

  return (
    <div className='h-auto'>
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
            <Button variant='outline' disabled>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-sm'>List of courses you can train</p>
            <p className='text-muted-foreground text-sm'>
              {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} found
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredCourses.map(course => (
            <TrainCourseCard
              key={course.uuid}
              course={course as any}
              handleClick={() => router.push(`/dashboard/courses/${course.uuid}`)}
              handleQuickApply={() => {
                setApplyModal(true);
                setApplyingCourseId(course?.uuid as string)
              }}
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
            <h3 className='mb-2'>No assigned courses yet</h3>
            <p className='text-muted-foreground mb-4'>
              You do not have any courses assigned. Reach out to a course creator to request access.
            </p>
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

        <NotesModal
          open={applyModal}
          setOpen={setApplyModal}
          title="Apply to Train a Course"
          description="Submit your application to become a course trainer."
          onSave={handleApplyToTrain}
          saveText="Submit application"
          cancelText="Cancel"
          placeholder='Enter your application notes here...'
          isLoading={applyToTrain.isPending}
        />
      </div>
    </div>
  );
}
