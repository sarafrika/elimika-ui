'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import ClassTrainingPage from '../../classes/class-training/[id]/_components/ClassTrainingPage';

export default function ClassInstanceDetailsRoute() {
  const params = useParams<{ id: string }>();
  const instanceId = params?.id;
  const instructor = useInstructor();
  const { classes, isLoading, isError } = useInstructorClassesWithSchedules(instructor?.uuid);

  const selectedClass = useMemo(
    () =>
      classes.find(classItem =>
        (classItem.schedule ?? []).some(instance => instance.uuid === instanceId)
      ) ?? null,
    [classes, instanceId]
  );

  const requestedScheduleId = useMemo(() => instanceId ?? '', [instanceId]);

  if (isLoading && !selectedClass) {
    return (
      <div className='space-y-4 px-4 py-6'>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-56' />
            <Skeleton className='h-4 w-40' />
          </div>
          <Skeleton className='h-9 w-28' />
        </div>
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <Skeleton className='h-[520px] rounded-xl' />
          <Skeleton className='h-[520px] rounded-xl' />
        </div>
      </div>
    );
  }

  if (isError || !selectedClass?.uuid) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center px-4 py-10'>
        <Card className='w-full max-w-xl'>
          <CardContent className='px-6 py-8 text-center'>
            <p className='text-foreground text-lg font-semibold'>Class instance not found</p>
            <p className='text-muted-foreground mt-2 text-sm'>
              We could not match that instance to one of your instructor classes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ClassTrainingPage classId={selectedClass.uuid} requestedScheduleId={requestedScheduleId} />;
}
