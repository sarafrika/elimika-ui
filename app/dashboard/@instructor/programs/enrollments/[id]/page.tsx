'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import {
  getProgramEnrollmentsOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ProgramEnrollmentPage() {
  const params = useParams();
  const programId = params?.id as string;
  const qc = useQueryClient();
  const user = useUserProfile();

  const { data, isLoading, isFetching } = useQuery(
    getTrainingProgramByUuidOptions({ path: { uuid: programId } })
  );
  const programData = data?.data;

  // GET PROGRAM ENROLLMENTS
  const { data: enrollments } = useQuery(
    getProgramEnrollmentsOptions({ path: { programUuid: programId }, query: { pageable: {} } })
  );

  const { replaceBreadcrumbs } = useBreadcrumb();
  useEffect(() => {
    const title =
      isLoading || isFetching || !programData?.title
        ? 'Enrollments - ...'
        : `Enrollments - ${programData.title}`;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'programs', title: 'Programs', url: '/dashboard/programs' },
      {
        id: 'preview',
        title,
        url: `/dashboard/programs/enrollments/${programId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, programId, programData?.title, isLoading, isFetching]);

  // MUTATION

  if (isLoading)
    return (
      <div className='flex flex-col gap-4 text-[12px] sm:text-[14px]'>
        <div className='h-20 w-full animate-pulse rounded bg-gray-200'></div>
        <div className='mt-10 flex items-center justify-center'>{/* <Spinner /> */}</div>
        <div className='h-16 w-full animate-pulse rounded bg-gray-200'></div>
        <div className='h-12 w-full animate-pulse rounded bg-gray-200'></div>
      </div>
    );

  return (
    <div className='mx-auto mb-10 max-w-5xl space-y-10 sm:p-4'>
      <h1 className='text-3xl font-bold tracking-tight'>Program Enrollments</h1>
      {/* Header section */}
      <div className='space-y-2'>
        <h1 className='text-xl font-bold tracking-tight'>{programData?.title}</h1>
        <div className='text-muted-foreground text-sm'>
          <HTMLTextPreview htmlContent={programData?.description as string} />
        </div>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span>Instructor:</span>
          <Badge variant='outline'>{user?.display_name}</Badge>
          <span className='text-xs text-gray-500'>({user?.instructor?.professional_headline})</span>
        </div>
      </div>

      <div className='flex flex-row gap-4'>
        <div className='flex w-1/2 items-center gap-2 text-sm text-gray-700'>
          <span className='font-semibold text-black'>Program Size:</span>
          <span className='flex items-center gap-1'>
            <Users className='h-4 w-4 text-gray-600' />
            {programData?.class_limit === 0
              ? 'Unlimited students'
              : `Up to ${programData?.class_limit} students`}
          </span>
        </div>

        <div className='flex w-1/2 items-center gap-2 text-sm text-gray-700'>
          <span className='font-semibold text-black'>Duration:</span>
          <span className='flex items-center gap-1'>
            <Clock className='h-4 w-4 text-gray-600' />
            Approx. {programData?.total_duration_display}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className='col-span-1 space-y-6 md:col-span-3'>List of enrolled students</div>
    </div>
  );
}
