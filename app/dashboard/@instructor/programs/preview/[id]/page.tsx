'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { getProgramCoursesOptions, getProgramCoursesQueryKey, getTrainingProgramByUuidOptions, publishProgramMutation, removeProgramCourseMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Clock, Trash, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import HTMLTextPreview from '../../../../../../components/editors/html-text-preview';
import { AddProgramCourseDialog } from '../../../_components/program-management-form';

const cls = {
  uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
  name: 'Advanced Java Programming - July Cohort',
  description: 'A focused class for mastering enterprise Java patterns with hands-on support.',
  instructor: {
    name: 'Jane Doe',
    title: 'Senior Java Instructor',
  },
  class_limit: 25,
  duration_hours: 2,
  duration_minutes: 0,
  total_duration_display: '2 hours 0 minutes',
  thumbnail_url: 'https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg',
  banner_url: 'https://cdn.sarafrika.com/courses/java-advanced-banner.jpg',
  intro_video_url: 'https://cdn.sarafrika.com/courses/java-advanced-intro.mp4',
  objectives: [
    'Understand Java design patterns and when to use them',
    'Work with Spring Boot and Hibernate',
    'Build RESTful APIs and deploy Java apps',
  ],
  lessons: [
    {
      title: 'Enterprise Java Basics',
      duration_display: '2 hours',
      description: 'Covers JDBC, DAO patterns, and Java EE intro',
    },
    {
      title: 'Spring Boot Deep Dive',
      duration_display: '3 hours',
      description: 'Configuration, REST APIs, and Dependency Injection',
    },
    {
      title: 'Working with Hibernate',
      duration_display: '2.5 hours',
      description: 'Entity mapping, lazy loading, and transactions',
    },
  ],
};

export default function ProgramPreviewPage() {
  const params = useParams();
  const programId = params?.id as string;
  const queryClient = useQueryClient()

  // GET TRAINING PROGRAM BY ID
  const { data, isLoading, isFetching, } = useQuery(getTrainingProgramByUuidOptions({ path: { uuid: programId } }))
  // @ts-ignore
  const programData = data?.data

  // GET TRAINING PROGRAM COURSES
  const { data: programCourses, refetch } = useQuery(getProgramCoursesOptions({ path: { programUuid: programId } }))

  const { replaceBreadcrumbs } = useBreadcrumb();
  useEffect(() => {
    const title = isLoading || isFetching || !programData?.title
      ? 'Preview - ...'
      : `Preview - ${programData.title}`;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'programs', title: 'Programs', url: '/dashboard/programs' },
      {
        id: 'preview',
        title,
        url: `/dashboard/programs/preview/${programId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, programId, programData?.title, isLoading, isFetching]);



  const [isAddClassCourseDialog, setIsAddClassCourseDialog] = useState(false);
  const openAddClassCourseDialog = () => {
    setIsAddClassCourseDialog(true)
  }


  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const confirmDelete = (course: any) => {
    setCourseToDelete(course);
    setIsDialogOpen(true);
  };

  // MUTATION
  const removeProgramCourse = useMutation(removeProgramCourseMutation())

  const handleConfirm = () => {
    if (courseToDelete) {
      removeProgramCourse.mutate({ path: { courseUuid: courseToDelete?.uuid, programUuid: programId } }, {
        onSuccess: () => {
          toast.success("")
          setIsDialogOpen(false);
          setCourseToDelete(null);
          queryClient.invalidateQueries({
            queryKey: getProgramCoursesQueryKey({ path: { programUuid: programId } })
          });
        },
        onError: (error) => {
          toast.error(error?.message)
        }
      })
    }
  };

  const publishProgram = useMutation(publishProgramMutation())

  const handlePublishProgram = () => {
    if (!programId) return

    publishProgram.mutate({ path: { uuid: programId } }, {
      onSuccess: (data) => {
        // @ts-ignore
        toast.success(data?.message)
      },
      onError: (error) => {
        // @ts-ignore
        toast.error(error?.message)
      }
    })
  }

  if (isLoading)
    return (
      <div className="flex flex-col gap-4 text-[12px] sm:text-[14px]">
        <div className="h-20 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className='mt-10 flex items-center justify-center'>
          {/* <Spinner /> */}
        </div>
        <div className="h-16 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>

      </div>
    );

  return (
    <div className='mx-auto mb-10 max-w-5xl space-y-10 sm:p-4'>
      {/* Banner */}
      {/* {cls.banner_url && (
        <div className='overflow-hidden rounded-md shadow-md'>
          <Image
            src={"https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg"}
            alt={`${cls.name} banner`}
            className='h-64 w-full bg-stone-200 object-cover'
            width={64}
            height={64}
          />
        </div>
      )} */}

      {/* Header section */}
      <div className='space-y-2'>
        <h1 className='text-4xl font-bold tracking-tight'>{programData?.title}</h1>
        <div className='text-muted-foreground text-sm' >
          <HTMLTextPreview htmlContent={programData?.description as string} />
        </div>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <span>Instructor:</span>
          <Badge variant='outline'>{programData?.instructor_uuid}</Badge>
          <span className='text-xs text-gray-500'>({programData?.instructor_uuid})</span>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2 text-sm text-gray-700'>
          <span className='font-medium'>Program Size:</span>
          <span className='flex items-center gap-1'>
            <Users className='h-5 w-5 text-gray-600' />
            {programData?.class_limit === 0 ? 'Unlimited students' : `Up to ${programData?.class_limit} students`}
          </span>
        </div>

        <div className='flex items-center gap-2 text-sm text-gray-700'>
          <span className='font-medium'>Duration:</span>
          <span className='flex items-center gap-1'>
            <Clock className='h-5 w-5 text-gray-600' />
            Approx. {programData?.total_duration_display}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className='col-span-1 space-y-6 md:col-span-3'>
        {/* Objectives */}
        <Card>
          <CardHeader>
            <CardTitle>What You’ll Learn</CardTitle>
            <CardDescription>Key learning outcomes of this program</CardDescription>
          </CardHeader>
          <CardContent>
            <HTMLTextPreview htmlContent={programData?.objectives as string} />
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>A breakdown of courses in this program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {programCourses?.data?.length === 0 ?
                <div className='bg-muted/20 rounded-md border py-4 text-center'>
                  <BookOpen className='text-muted-foreground mx-auto h-8 w-8' />
                  <h3 className='mt-4 text-base font-medium'>No added courses</h3>
                  <p className='text-muted-foreground text-sm mt-2'>
                    You don&apos;t have any courses added to this program.
                  </p>
                  <Button className='mt-4' onClick={openAddClassCourseDialog} asChild>
                    <p>
                      Add Your First Course
                    </p>
                  </Button>
                </div>
                : <>
                  {programCourses?.data?.map((c, i) => (
                    <div key={i} className='border-b pb-4 last:border-none last:pb-0'>
                      <div className='flex items-center justify-between'>
                        <h3 className='flex items-center gap-2 text-base font-semibold'>
                          <BookOpen className='h-4 w-4 text-blue-500' />
                          {c?.name}
                        </h3>
                        <button
                          onClick={() => confirmDelete(c as any)}
                          className='text-red-500 hover:text-red-700 mx-2 cursor-pointer'
                          aria-label='Remove course'
                        >
                          <Trash className='h-4 w-4' />
                        </button>
                      </div>

                      <div className='w-[95%] line-clamp-3 text-muted-foreground text-sm' >
                        <HTMLTextPreview htmlContent={c?.description as string} />
                      </div>

                      <Badge className='mt-1' variant='secondary'>
                        {c?.total_duration_display}
                      </Badge>
                    </div>
                  ))}
                </>
              }
            </div>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Class Content</CardTitle>
            <CardDescription>A breakdown of lessons in this program</CardDescription>
          </CardHeader>
          <CardContent>
            {/* <div className='space-y-6'>
              {cls.lessons.map((lesson, i) => (
                <div key={i} className='border-b pb-4 last:border-none last:pb-0'>
                  <h3 className='flex items-center gap-2 text-base font-semibold'>
                    <Video className='h-4 w-4 text-blue-500' />
                    {lesson.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>{lesson.description}</p>
                  <Badge className='mt-1' variant='secondary'>
                    {lesson.duration_display}
                  </Badge>
                </div>
              ))}
            </div> */}
          </CardContent>
        </Card>

        <div className="w-full flex justify-end">
          <Button onClick={handlePublishProgram} className='min-w-30'>
            {publishProgram?.isPending ? <Spinner /> : "Publish Program"}
          </Button>
        </div>


        <AddProgramCourseDialog isOpen={isAddClassCourseDialog} onOpenChange={setIsAddClassCourseDialog} programId={programId} onSuccess={() => refetch()} />

        {/* Confirm Remove Program Course Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className='flex max-w-2xl flex-col' >
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className='py-3' >
                Are you sure you want to remove{' '}
                <span className='font-semibold'>&quot;{courseToDelete?.name}&quot;</span>{' '}
                from this program? This action cannot be undone.
              </DialogDescription>

            </DialogHeader>
            <DialogFooter>
              <Button variant='secondary' onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={handleConfirm} className='min-w-[80px]' >
                {removeProgramCourse?.isPending ? <Spinner /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
