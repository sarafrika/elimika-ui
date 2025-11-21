'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
import { CustomPagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import type { ApplicantTypeEnum } from '@/services/client';
import {
  getAllCoursesOptions,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrainCourseCard } from '../../../_components/train-course-card';

export default function CourseMangementPage() {
  const qc = useQueryClient()
  const router = useRouter();
  const instructor = useInstructor();
  const profile = useUserProfile();

  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyModal, setApplyModal] = useState(false);
  const [applyingCourseId, setApplyingCourseId] = useState<string | null>(null);
  const [applyingCourse, setApplyingCourse] = useState<any | null>(null);


  const size = 20;
  const [page, setPage] = useState(0);

  const {
    data: allCourses,
    isLoading,
    isSuccess,
    isFetched,
    isFetching,
  } = useQuery(getAllCoursesOptions({ query: { pageable: { page, size, sort: [] } } }));

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const combinedCourses = React.useMemo(() => {
    if (!allCourses?.data?.content || !appliedCourses?.data?.content) return [];
    const appliedMap = new Map(
      appliedCourses.data.content.map((app: any) => [app.course_uuid, app])
    );

    return allCourses.data.content.map((course: any) => ({
      ...course,
      application: appliedMap.get(course.uuid) || null,
    }));
  }, [allCourses, appliedCourses]);

  const filteredCourses = useMemo(() => {
    if (!Array.isArray(combinedCourses)) return [];

    const filtered = combinedCourses.filter(course => {
      const isActiveAndPublished = course.active === true && course.is_published === true;

      const matchesSearch =
        !searchQuery ||
        course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course?.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !statusFilter || statusFilter === 'all' || course.application?.status === statusFilter;

      return isActiveAndPublished && matchesSearch && matchesStatus;
    });

    if (sortOrder) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.application?.reviewed_at || 0).getTime();
        const dateB = new Date(b.application?.reviewed_at || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  }, [combinedCourses, searchQuery, statusFilter, sortOrder]);

  const applyToTrain = useMutation(submitTrainingApplicationMutation());
  const handleApplyToTrain = (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
    rate_currency: string;
  }) => {
    if (!applyingCourseId) return;

    applyToTrain.mutate(
      {
        body: {
          applicant_type: profile?.activeDomain as ApplicantTypeEnum,
          applicant_uuid: instructor?.uuid as string,
          rate_card: {
            currency: data?.rate_currency,
            private_online_rate: data?.private_online_rate,
            private_inperson_rate: data?.private_inperson_rate,
            group_online_rate: data?.group_online_rate,
            group_inperson_rate: data?.group_inperson_rate
          },
          application_notes: data?.notes,
        },
        path: { courseUuid: applyingCourseId },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({ query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } } }),
          });
          toast.success(data?.message);
          setApplyModal(false);
        },
        onError: data => {
          toast.error(data?.message);
          setApplyModal(false);
        },
      }
    );
  };

  const paginationMetadata = allCourses?.data?.metadata;

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

            <div className='flex flex-wrap gap-2'>
              <Select value={statusFilter || ''} onValueChange={setStatusFilter}>
                <SelectTrigger className='flex-1 bg-white'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='approved'>Approved</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='rejected'>Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='sm'
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className='flex-shrink-0'
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className='h-4 w-4' />
                ) : (
                  <SortDesc className='h-4 w-4' />
                )}
                <span className='ml-1 hidden sm:inline'>Date</span>
              </Button>
            </div>
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
              applicationStatus={course.application?.status || null}
              applicationReviewNote={course.application?.review_notes || null}
              handleClick={() => router.push(`/dashboard/courses/${course.uuid}`)}
              handleQuickApply={() => {
                setApplyModal(true);
                setApplyingCourseId(course?.uuid as string);
                setApplyingCourse(course as any)
              }}
              handleReapplyToTrain={() => {
                setApplyModal(true);
                setApplyingCourseId(course?.uuid as string);
                setApplyingCourse(course as any)
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
          title='Apply to Train a Course'
          description='Submit your application to become a course trainer.'
          onSave={handleApplyToTrain}
          saveText='Submit application'
          cancelText='Cancel'
          placeholder='Enter your application notes here...'
          isLoading={applyToTrain.isPending}
          minimum_rate={applyingCourse?.minimum_training_fee}
        />
      </div>
    </div>
  );
}
