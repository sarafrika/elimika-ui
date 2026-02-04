'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
import { CustomPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstructor } from '@/context/instructor-context';
import { useUserDomain } from '@/context/user-domain-context';
import type { ApplicantTypeEnum } from '@/services/client';
import {
  getAllCoursesOptions,
  getAllTrainingProgramsOptions,
  searchProgramTrainingApplicationsOptions,
  searchProgramTrainingApplicationsQueryKey,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Filter, GraduationCap, Layers, Search, SortAsc, SortDesc } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrainCourseCard } from '../../../_components/train-course-card';
import { TrainProgramCard } from '../../../_components/train-program-card';

export default function CourseMangementPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const instructor = useInstructor();
  const userDomain = useUserDomain();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'courses' | 'programs'>('courses');

  // Shared filter states
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Application modal states
  const [applyModal, setApplyModal] = useState(false);
  const [applyingCourseId, setApplyingCourseId] = useState<string | null>(null);
  const [applyingCourse, setApplyingCourse] = useState<any | null>(null);
  const [applyingProgramId, setApplyingProgramId] = useState<string | null>(null);
  const [applyingProgram, setApplyingProgram] = useState<any | null>(null);

  // Separate pagination for courses and programs
  const size = 20;
  const [coursePage, setCoursePage] = useState(0);
  const [programPage, setProgramPage] = useState(0);

  // ============= PROGRAMS DATA =============
  const {
    data: allPrograms,
    isFetching: isProgramsFetching,
    isFetched: isProgramsFetched,
    isSuccess: isProgramsSuccess,
  } = useQuery(getAllTrainingProgramsOptions({
    query: { pageable: { page: programPage, size, sort: [] } }
  }));

  const { data: appliedPrograms } = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const combinedPrograms = React.useMemo(() => {
    if (!allPrograms?.data?.content || !appliedPrograms?.data?.content) return [];
    const appliedMap = new Map(
      appliedPrograms?.data?.content.map((app: any) => [app.program_uuid, app])
    );

    return allPrograms.data.content.map((program: any) => ({
      ...program,
      application: appliedMap.get(program.uuid) || null,
    }));
  }, [allPrograms, appliedPrograms]);

  const filteredPrograms = useMemo(() => {
    if (!Array.isArray(combinedPrograms)) return [];

    const filtered = combinedPrograms.filter(program => {
      const isActiveAndPublished = program.active === true;

      const matchesSearch =
        !searchQuery ||
        program?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program?.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !statusFilter || statusFilter === 'all' || program.application?.status === statusFilter;

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
  }, [combinedPrograms, searchQuery, statusFilter, sortOrder]);

  // ============= COURSES DATA =============
  const {
    data: allCourses,
    isSuccess: isCoursesSuccess,
    isFetched: isCoursesFetched,
    isFetching: isCoursesFetching,
  } = useQuery(getAllCoursesOptions({
    query: { pageable: { page: coursePage, size, sort: [] } }
  }));

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

  // ============= MUTATIONS =============
  const applyToTrain = useMutation(submitTrainingApplicationMutation());
  const applyToTrainProgramMut = useMutation(submitProgramTrainingApplicationMutation());

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
          applicant_type: userDomain?.activeDomain as ApplicantTypeEnum,
          applicant_uuid: instructor?.uuid as string,
          rate_card: {
            currency: data?.rate_currency,
            private_online_rate: data?.private_online_rate,
            private_inperson_rate: data?.private_inperson_rate,
            group_online_rate: data?.group_online_rate,
            group_inperson_rate: data?.group_inperson_rate,
          },
          application_notes: data?.notes,
        },
        path: { courseUuid: applyingCourseId },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({
              query: {
                pageable: {},
                searchParams: { applicant_uuid_eq: instructor?.uuid as string },
              },
            }),
          });
          toast.success(data?.message);
          setApplyModal(false);
          setApplyingCourseId(null);
          setApplyingCourse(null);
        },
        onError: data => {
          toast.error(data?.message);
          setApplyModal(false);
        },
      }
    );
  };

  const handleApplyToTrainProgram = (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
    rate_currency: string;
  }) => {
    if (!applyingProgramId) return;

    applyToTrainProgramMut.mutate(
      {
        body: {
          applicant_type: userDomain?.activeDomain as ApplicantTypeEnum,
          applicant_uuid: instructor?.uuid as string,
          rate_card: {
            currency: data?.rate_currency,
            private_online_rate: data?.private_online_rate,
            private_inperson_rate: data?.private_inperson_rate,
            group_online_rate: data?.group_online_rate,
            group_inperson_rate: data?.group_inperson_rate,
          },
          application_notes: data?.notes,
        },
        path: { programUuid: applyingProgramId },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: searchProgramTrainingApplicationsQueryKey({
              query: {
                pageable: {},
                searchParams: { applicant_uuid_eq: instructor?.uuid as string },
              },
            }),
          });
          toast.success(data?.message);
          setApplyModal(false);
          setApplyingProgramId(null);
          setApplyingProgram(null);
        },
        onError: data => {
          toast.error(data?.message);
          setApplyModal(false);
        },
      }
    );
  };

  // Reset filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'courses' | 'programs');
    setSearchQuery('');
    setStatusFilter('all');
  };

  const coursePaginationMetadata = allCourses?.data?.metadata;
  const programPaginationMetadata = allPrograms?.data?.metadata;

  return (
    <div className='h-auto'>
      <div className='container mx-auto'>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
          <TabsList className='mb-2 grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='courses' className='flex items-center gap-2'>
              <BookOpen className='h-4 w-4' />
              Courses
              {filteredCourses.length > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {filteredCourses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='programs' className='flex items-center gap-2'>
              <Layers className='h-4 w-4' />
              Programs
              {filteredPrograms.length > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {filteredPrograms.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters - Shared across tabs */}
          <div className='mb-3'>
            <div className='mb-6 flex gap-4'>
              <div className='relative flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className='pl-10'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className='flex flex-wrap gap-2'>
                <Select value={statusFilter || ''} onValueChange={setStatusFilter}>
                  <SelectTrigger className='flex-1 min-w-[150px]'>
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

          {/* Courses Tab Content */}
          <TabsContent value='courses' className='mt-0'>
            {/* Results count */}
            <div className='mb-6'>
              <div className='flex items-center justify-between'>
                <p className='text-muted-foreground text-sm'>
                  Browse available courses to train
                </p>
                <p className='text-muted-foreground text-sm'>
                  {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} found
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isCoursesFetching && !isCoursesFetched && !isCoursesSuccess && (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className='h-[450px] w-full' />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isCoursesFetching && isCoursesFetched && isCoursesSuccess && filteredCourses.length === 0 && (
              <div className='py-16 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>No courses found</h3>
                <p className='text-muted-foreground mb-4'>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No training courses are currently available.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Course Grid */}
            {filteredCourses.length > 0 && (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
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
                      setApplyingCourse(course as any);
                    }}
                    handleReapplyToTrain={() => {
                      setApplyModal(true);
                      setApplyingCourseId(course?.uuid as string);
                      setApplyingCourse(course as any);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {coursePaginationMetadata?.totalPages && coursePaginationMetadata.totalPages > 1 && (
              <div className='mt-8'>
                <CustomPagination
                  totalPages={coursePaginationMetadata.totalPages as number}
                  onPageChange={page => {
                    setCoursePage(page - 1);
                  }}
                />
              </div>
            )}
          </TabsContent>

          {/* Programs Tab Content */}
          <TabsContent value='programs' className='mt-0'>
            {/* Results count */}
            <div className='mb-6'>
              <div className='flex items-center justify-between'>
                <p className='text-muted-foreground text-sm'>
                  Browse available programs to train
                </p>
                <p className='text-muted-foreground text-sm'>
                  {filteredPrograms.length} program{filteredPrograms.length === 1 ? '' : 's'} found
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isProgramsFetching && !isProgramsFetched && !isProgramsSuccess && (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className='h-[450px] w-full' />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isProgramsFetching && isProgramsFetched && isProgramsSuccess && filteredPrograms.length === 0 && (
              <div className='py-16 text-center'>
                <GraduationCap className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>No programs found</h3>
                <p className='text-muted-foreground mb-4'>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No training programs are currently available.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Program Grid */}
            {filteredPrograms.length > 0 && (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
                {filteredPrograms.map(program => (
                  <TrainProgramCard
                    key={program.uuid}
                    program={program as any}
                    applicationStatus={program.application?.status || null}
                    applicationReviewNote={program.application?.review_notes || null}
                    handleClick={() => router.push(`/dashboard/programs/${program.uuid}`)}
                    handleQuickApply={() => {
                      setApplyModal(true);
                      setApplyingProgramId(program?.uuid as string);
                      setApplyingProgram(program as any);
                    }}
                    handleReapplyToTrain={() => {
                      setApplyModal(true);
                      setApplyingProgramId(program?.uuid as string);
                      setApplyingProgram(program as any);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {programPaginationMetadata?.totalPages && programPaginationMetadata.totalPages > 1 && (
              <div className='mt-8'>
                <CustomPagination
                  totalPages={programPaginationMetadata.totalPages as number}
                  onPageChange={page => {
                    setProgramPage(page - 1);
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Application Modals */}
        {applyingCourseId && (
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
        )}

        {applyingProgramId && (
          <NotesModal
            open={applyModal}
            setOpen={setApplyModal}
            title='Apply to Train a Program'
            description='Submit your application to become a program trainer.'
            onSave={handleApplyToTrainProgram}
            saveText='Submit application'
            cancelText='Cancel'
            placeholder='Enter your application notes here...'
            isLoading={applyToTrainProgramMut.isPending}
            minimum_rate={applyingProgram?.price}
          />
        )}
      </div>
    </div>
  );
}