'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { elimikaDesignSystem } from '@/lib/design-system';
import { useQueries, useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { useInstructor } from '../../../../context/instructor-context';
import {
  getClassDefinitionsForInstructorOptions,
  getEnrollmentsForClassOptions,
  getStudentByIdOptions
} from '../../../../services/client/@tanstack/react-query.gen';

const EnrollmentsPage = () => {
  const router = useRouter()
  const instructor = useInstructor();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { data: classesData } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { activeOnly: true }
    }),
    enabled: !!instructor?.uuid
  });

  const instructorClasses =
    classesData?.data?.map((item: any) => item.class_definition) || [];

  useEffect(() => {
    if (!selectedClassId && instructorClasses.length > 0) {
      setSelectedClassId(instructorClasses[0].uuid);
    }
  }, [instructorClasses, selectedClassId]);


  const enrollmentQueries = useQueries({
    queries: instructorClasses.map((classItem: any) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid },
      }),
      enabled: !!classItem.uuid,
    })),
  });

  const enrollmentCountsByClass = useMemo(() => {
    const counts: Record<string, number> = {};
    instructorClasses.forEach((classItem: any, index: number) => {
      const enrollments = enrollmentQueries[index]?.data?.data || [];
      // Count unique students
      counts[classItem.uuid] = new Set(enrollments.map((e: any) => e.student_uuid)).size;
    });
    return counts;
  }, [instructorClasses, enrollmentQueries]);

  // Get enrollments for selected class
  const selectedClassIndex = instructorClasses.findIndex(
    (c: any) => c.uuid === selectedClassId
  );
  const enrollmentsForSelectedClass =
    selectedClassIndex >= 0 ? enrollmentQueries[selectedClassIndex]?.data?.data || [] : [];
  const isLoadingEnrollments =
    selectedClassIndex >= 0 ? enrollmentQueries[selectedClassIndex]?.isLoading : false;

  const uniqueStudentUuids: string[] = Array.from(
    new Set(
      enrollmentsForSelectedClass
        .map((e: any) => e.student_uuid)
        .filter(Boolean)
    )
  );

  const studentQueries = useQueries({
    queries: uniqueStudentUuids.map((studentUuid: string) => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
    })),
  });

  const studentsData = studentQueries
    .map(q => q.data)
    .filter(Boolean);

  const students =
    studentsData?.map((item: any) => item.data) || [];

  const handleViewProfile = (studentUuid: string) => {
    router.push(`/dashboard/enrollments/${selectedClassId}?id=${studentUuid}`)
  };


  return (
    <div className={`${elimikaDesignSystem.components.pageContainer} px-4 sm:px-6`}>
      {/* Header */}
      <section className='mb-6'>
        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-foreground text-xl font-bold sm:text-2xl'>Enrollments</h1>
            <p className='text-muted-foreground text-sm'>
              Review all students enrolled in each class
            </p>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Class Selector (Mobile) */}
        <div className='flex flex-col gap-2 lg:hidden'>
          <p className='text-sm'>Select a class to see its enrollment details</p>
          <Select
            value={selectedClassId ?? undefined}
            onValueChange={value => setSelectedClassId(value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a class' />
            </SelectTrigger>

            <SelectContent>
              {instructorClasses.map((classItem: any) => {
                const enrollmentCount = enrollmentCountsByClass[classItem.uuid] || 0;

                return (
                  <SelectItem key={classItem.uuid} value={classItem.uuid}>
                    <div className='flex w-full items-center justify-between gap-2'>
                      <span className='truncate'>{classItem.title}</span>
                      <span className='text-muted-foreground text-xs'>
                        ({enrollmentCount})
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>

          </Select>
        </div>

        {/* Class List (Desktop) */}
        <div className='hidden space-y-2 lg:block lg:max-h-[calc(100vh-250px)] lg:w-1/3 lg:overflow-y-auto'>
          {instructorClasses.map((classItem: any) => {
            const enrollmentCount = enrollmentCountsByClass[classItem.uuid] || 0;
            const isSelected = selectedClassId === classItem.uuid;

            return (
              <button
                key={classItem.uuid}
                onClick={() => setSelectedClassId(classItem.uuid)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm transition-all ${isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background hover:bg-muted'
                  }`}
              >
                <span className='truncate font-medium'>
                  {classItem.title || 'Unnamed Class'}
                </span>

                <Badge variant='secondary' className='shrink-0'>
                  {enrollmentCount}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Right: Enrollments List */}
        <div className='space-y-4 lg:max-h-[calc(100vh-250px)] lg:w-2/3 lg:overflow-y-auto'>
          {selectedClassId === null ? (
            <Card className='p-6 text-center sm:p-12'>
              <CheckCircle2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-foreground text-lg font-medium'>Select a class</p>
              <p className='text-muted-foreground text-sm'>
                Choose a class on the left to view enrollments.
              </p>
            </Card>
          ) : isLoadingEnrollments ? (
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <Card key={i} className='p-4'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-40' />
                    </div>
                    <Skeleton className='h-9 w-24' />
                  </div>
                </Card>
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card className='p-6 text-center sm:p-12'>
              <CheckCircle2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-foreground text-lg font-medium'>No enrollments</p>
              <p className='text-muted-foreground text-sm'>
                No students have enrolled in this class yet.
              </p>
            </Card>
          ) : (
            students.map(student => (
              <Card
                key={student?.uuid}
                className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center'
              >
                <Avatar>
                  <AvatarImage src={student?.full_name} />
                  <AvatarFallback>
                    {student?.full_name?.split(' ')
                      .map((n: any) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate font-semibold'>{student?.full_name}</p>
                  {/* <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                    <Clock className='h-3 w-3 shrink-0' />
                    enrollment time
                  </p> */}
                </div>

                <Button
                  size='sm'
                  className='w-full sm:w-auto'
                  onClick={() => handleViewProfile(student?.uuid as string)}
                >
                  View Profile
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentsPage;