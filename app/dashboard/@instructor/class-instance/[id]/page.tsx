'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useInstructor } from '@/context/instructor-context';
import { useInstructorClassesWithSchedules } from '@/hooks/use-instructor-classes-with-schedules';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
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

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center px-4 py-10'>
        <Card className='w-full max-w-xl'>
          <CardContent className='flex items-center gap-3 px-6 py-8 text-muted-foreground'>
            <Loader2 className='size-5 animate-spin text-primary' />
            Loading class instance details...
          </CardContent>
        </Card>
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
