'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import {
  getCourseByUuidOptions,
  getCourseLessonsOptions,
  searchAssessmentsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, BookOpenCheck, CheckCircle, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;
  const instructor = useInstructor();

  const { replaceBreadcrumbs } = useBreadcrumb();
  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'course-management',
        title: 'Course-management',
        url: '/dashboard/course-management/drafts',
      },
      {
        id: 'preview',
        title: 'Preview',
        url: `/dashboard/course-management/preview/${courseId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseId]);

  const [open, setOpen] = useState(false);
  const handleConfirm = () => {
    router.push(`/dashboard/course-management/create-new-course?id=${courseId}`);
  };

  // GET COURSE BY ID 
  const { data: courseDetail, isLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId
  });
  // @ts-ignore
  const course = courseDetail?.data;

  // GET COURSE LESSONS
  const { data: courseLessons } = useQuery({
    ...getCourseLessonsOptions({ path: { courseUuid: courseId as string }, query: {} }),
    enabled: !!courseId,
  });

  // GET COURSE ASSESSMENTS
  const { data: assessmentData } = useQuery(searchAssessmentsOptions({ query: { searchParams: { courseUuid: courseId as string }, } }));


  if (isLoading)
    return (
      <div className="flex flex-col gap-4 text-[12px] sm:text-[14px]">
        <div className="h-20 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className='mt-10 flex items-center justify-center'>
          <Spinner />
        </div>
        <div className="h-16 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>

      </div>

    );

  return (
    <div className='mx-auto max-w-4xl space-y-8 p-4'>
      <div>
        <Image src={course?.banner_url as string} alt='banner' width={128} height={128} className='w-full max-h-[250px]' />
      </div>

      <div className='space-y-4'>
        <div className='flex flex-row gap-4 items-center' >
          <Image src={course?.thumbnail_url as string || "/illustration.png"} alt="thumbnail" width={48} height={48} className='rounded-md bg-stone-300 min-h-12 min-w-12' />

          <h1 className='text-4xl font-bold tracking-tight md:max-w-[90%]'>{course?.name}</h1>
        </div>
        <div className='px-4 py-4'>
          <HTMLTextPreview htmlContent={course?.description as string} />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium'>Categories:</span>
          {course?.category_names?.map((i: any) => (
            <Badge key={i} variant='outline'>
              {i}
            </Badge>
          ))}
        </div>
      </div>

      <div className=''>
        <div className='col-span-1 space-y-6 md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='grid grid-cols-1'>
                <li className='flex items-start gap-2'>
                  <span className='min-h-4 min-w-4'>
                    <CheckCircle className='mt-1 h-4 w-4 text-green-500' />
                  </span>
                  <div className=''>
                    <HTMLTextPreview htmlContent={course?.objectives as string} />
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='mt-4'>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='mt-2 flex flex-col gap-2 space-y-4'>
                {courseLessons?.data?.content
                  ?.slice()
                  ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
                  ?.map((lesson: any, i: any) => (
                    <div key={i} className='flex flex-row gap-2 border-b pb-4 last:border-none last:pb-4'>
                      <div>
                        <span className='min-h-4 min-w-4'>
                          <CheckCircle className='mt-1 h-4 w-4 text-green-500' />
                        </span>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <h3 className='font-semibold'>{lesson.title}</h3>
                        <RichTextRenderer
                          htmlString={(lesson?.description as string) || 'No lesson provided'}
                        />

                        {/* <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">{lecture.duration}</span>
                        </li>
                      ))}
                    </ul> */}

                        <h3 className='font-semibold'>
                          <span>📅 Duration:</span> {lesson.duration_display}
                        </h3>
                      </div>

                    </div>
                  ))}

                {courseLessons?.data?.content?.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                    <BookOpen className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">No lessons available</p>
                    <p className="mt-1 text-sm">Start by adding your first lesson to this course.</p>
                    <Button variant="outline" className="mt-4" onClick={() =>
                      router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
                    }>
                      + Add Lesson
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='mt-4'>
              <CardTitle>Course Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='mt-2 flex flex-col gap-2 space-y-4'>
                {assessmentData?.data?.content
                  ?.slice()
                  ?.map((assessment: any, i: any) => (
                    <div key={i} className='flex flex-row gap-2 border-b pb-4 last:border-none last:pb-4'>
                      <div>
                        <span className='min-h-4 min-w-4'>
                          <BookOpenCheck className='mt-1 h-4 w-4' />
                        </span>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <h3 className='font-semibold'>{assessment.title}</h3>
                        <RichTextRenderer
                          htmlString={(assessment?.description as string) || 'No assessment provided'}
                        />

                        <h3 className='font-semibold'>
                          <span>📅 Duration:</span> {assessment.duration_display}
                        </h3>
                      </div>

                    </div>
                  ))}

                {assessmentData?.data?.content?.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                    <BookOpenCheck className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">No assessment available</p>
                    <p className="mt-1 text-sm">Start by adding lessons to your course, then add assessments under each lesson.</p>
                    <Button variant="outline" className="mt-4" onClick={() =>
                      router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
                    }>
                      + Add Lesson
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>

            <div className='mt-4 flex max-w-[300px] flex-col gap-2 self-end'>
              <CardHeader className='flex gap-2'>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>by {instructor?.full_name}</CardDescription>
              </CardHeader>

              <CardContent className='space-y-2'>
                <div className='flex items-center'>
                  <Users className='mr-2 h-4 w-4' />
                  <span>
                    {course?.class_limit === 0
                      ? 'Unlimited'
                      : `Up to ${course?.class_limit} students`}
                  </span>
                </div>
                <div className='flex items-center'>
                  <Clock className='mr-2 h-4 w-4' />
                  <span>Approx. {course?.total_duration_display} to complete</span>
                </div>

                <Button size='lg' className='mt-4 w-full'>
                  Enroll Now
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='w-full'
                  // onClick={() => setOpen(true)}
                  onClick={handleConfirm}
                >
                  Edit Course
                </Button>

                {/* Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogContent className='sm:max-w-md'>
                    <DialogTitle />
                    <DialogHeader>
                      <h3 className='text-xl font-semibold text-gray-900'>Edit Course</h3>
                      <p className='text-sm text-gray-500'>
                        Are you sure you want to edit this course?
                      </p>
                    </DialogHeader>

                    <div className='mt-4 space-y-3 text-sm text-gray-700'>
                      <p>
                        This action will <strong>unpublish</strong> the course. You&apos;`ll need to
                        re-publish it after making your changes.
                      </p>
                      <p>
                        Any currently enrolled students will retain access, but the course will no
                        longer be discoverable publicly until it&apos;`s re-published.
                      </p>
                    </div>

                    <DialogFooter className='pt-6'>
                      <Button
                        variant='outline'
                        onClick={() => setOpen(false)}
                        className='w-full sm:w-auto'
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleConfirm} className='w-full sm:w-auto'>
                        Confirm & Continue
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
