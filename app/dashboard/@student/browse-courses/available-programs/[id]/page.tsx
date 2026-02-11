'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import {
  enrollStudentMutation,
  getProgramCoursesOptions,
  getStudentScheduleQueryKey,
  listCatalogItemsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addYears, format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '../../../../../../components/ui/label';
import { CustomLoadingState } from '../../../../@course_creator/_components/loading-state';
import EnrollCourseCard from '../../../../_components/enroll-course-card';

const EnrollmentPage = () => {
  const params = useParams();
  const programId = params?.id as string;
  const router = useRouter();

  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();
  const qc = useQueryClient();

  const [openEnrollModal, setOpenEnrollModal] = useState(false);
  const [enrollingClass, setEnrollingClass] = useState<any | null>(null);

  useEffect(() => {
    if (programId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        { id: 'courses', title: 'Browse Courses', url: `/dashboard/browse-courses` },
        {
          id: 'program-details',
          title: `Available programs`,
          url: `/dashboard/browse-courses/available-programs/${programId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs, programId]);

  const { data: courses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
  const courseId = courses?.data?.[0]?.uuid || ''

  // --- Date filter: default to a 1-year span, but classes won't load until user clicks Apply
  const today = new Date();
  const defaultStartDate = today;
  const defaultEndDate = addYears(today, 1);

  const toInputDate = (d: Date) => d.toISOString().slice(0, 10);
  const [startDateInput, setStartDateInput] = useState<string>(toInputDate(defaultStartDate));
  const [endDateInput, setEndDateInput] = useState<string>(toInputDate(defaultEndDate));

  const [appliedStart, setAppliedStart] = useState<string>(toInputDate(defaultStartDate));
  const [appliedEnd, setAppliedEnd] = useState<string>(toInputDate(defaultEndDate));
  const [dateError, setDateError] = useState<string | null>(null);

  const applyDates = () => {
    setDateError(null);
    if (!startDateInput || !endDateInput) {
      setDateError('Please select both start and end dates.');
      return;
    }
    const s = new Date(startDateInput);
    const e = new Date(endDateInput);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      setDateError('Invalid date format.');
      return;
    }
    if (s > e) {
      setDateError('Start date must be before end date.');
      return;
    }
    setAppliedStart(startDateInput);
    setAppliedEnd(endDateInput);
  };

  const clearDates = () => {
    const start = toInputDate(defaultStartDate);
    const end = toInputDate(defaultEndDate);

    setStartDateInput(start);
    setEndDateInput(end);
    setAppliedStart(start);
    setAppliedEnd(end);
    setDateError(null);
  };

  const { data: catalogues } = useQuery(listCatalogItemsOptions());
  const {
    classes = [],
    loading,
    isError,
  } = useBundledClassInfo(courseId, appliedStart ?? undefined, appliedEnd ?? undefined, student);

  const filteredClasses = classes.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!enrollingClass) {
      return { formattedStart: '', formattedEnd: '' };
    }

    try {
      const start = enrollingClass?.default_start_time
        ? new Date(enrollingClass.default_start_time)
        : null;
      const end = enrollingClass?.default_end_time
        ? new Date(enrollingClass.default_end_time)
        : null;

      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch (e) {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [enrollingClass]);

  const enrollStudent = useMutation(enrollStudentMutation());

  const handleEnrollStudent = () => {
    if (!student?.uuid) return toast.error('Student not found');
    if (!enrollingClass?.uuid) return toast.error('Class not found');

    enrollStudent.mutate(
      {
        body: {
          class_definition_uuid: enrollingClass.uuid,
          student_uuid: student.uuid,
        },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getStudentScheduleQueryKey({
              path: { studentUuid: student.uuid as string },
              query: {
                start: new Date('2025-11-02'),
                end: new Date('2026-12-19'),
              },
            }),
          });

          setOpenEnrollModal(false);
          toast.success(data?.message || 'Student enrolled successfully');
        },
        onError: err => {
          // @ts-expect-error
          toast.error(err?.error || 'Failed to enroll');
          setOpenEnrollModal(false);
        },
      }
    );
  };
  // @ts-ignore


  return (
    <div className='space-y-4 pb-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Explore Classes Open for Enrollment</h1>
          <p className='text-muted-foreground'>
            Discover courses designed to help you grow and succeed.
          </p>
        </div>
      </div>

      {/* Date filter controls */}
      <Card className='flex flex-row items-center justify-between space-y-4 p-4'>
        {/* Active range display */}
        <div className='flex items-center justify-between'>
          <div className='text-sm'>
            <span className='text-muted-foreground'>Date range</span>
            <div className='font-medium'>
              {!appliedStart || !appliedEnd ? (
                <span className='text-muted-foreground'>Default range</span>
              ) : (
                <>
                  {format(new Date(appliedStart), 'MMM dd, yyyy')}
                  <span className='text-muted-foreground mx-2'>→</span>
                  {format(new Date(appliedEnd), 'MMM dd, yyyy')}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className='flex flex-wrap items-end gap-3'>
          <div>
            <Label className='text-muted-foreground text-xs'>Start date</Label>
            <Input
              type='date'
              value={startDateInput}
              onChange={e => setStartDateInput(e.target.value)}
              className='mt-1 w-[160px]'
            />
          </div>

          <div>
            <Label className='text-muted-foreground text-xs'>End date</Label>
            <Input
              type='date'
              value={endDateInput}
              onChange={e => setEndDateInput(e.target.value)}
              className='mt-1 w-[160px]'
            />
          </div>

          <Button size='sm' onClick={applyDates}>
            Apply
          </Button>

          <Button size='sm' variant='outline' onClick={clearDates}>
            Reset
          </Button>
        </div>

        {dateError && <p className='text-destructive text-sm'>{dateError}</p>}
      </Card>

      {loading ? (
        <CustomLoadingState subHeading='Loading available classes...' />
      ) : (
        <>
          {!appliedStart || !appliedEnd ? (
            <Card className='text-muted-foreground flex flex-col items-center justify-center space-y-2 p-6 text-center'>
              <h3 className='text-foreground text-lg font-medium'>Select a date range</h3>
              <p className='text-muted-foreground text-sm'>
                Choose a start and end date then click Apply to view available classes.
              </p>
            </Card>
          ) : classes.length === 0 ? (
            <Card className='text-muted-foreground flex flex-col items-center justify-center space-y-2 p-6 text-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='text-muted-foreground h-10 w-10'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10m-9 4h4m-8 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
              <h3 className='text-foreground text-lg font-medium'>No Classes Available</h3>
              <p className='text-muted-foreground text-sm'>
                It looks like this course doesn’t have any classes yet.
              </p>
            </Card>
          ) : (
            <div className='flex flex-row flex-wrap gap-4'>
              {filteredClasses.map(cls => (
                <EnrollCourseCard
                  key={cls?.uuid}
                  href='#'
                  cls={cls}
                  isFull={false}
                  disableEnroll={false}
                  handleEnroll={() => {
                    setEnrollingClass(cls);
                    // setOpenEnrollModal(true);
                    router.push(
                      `/dashboard/browse-courses/available-classes/${courseId}/enroll?id=${cls?.uuid}`
                    );
                  }}
                  variant='full'
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default EnrollmentPage;
