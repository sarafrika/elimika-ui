'use client';

import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BookCheck, MoveLeft, Undo2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCourseCreator } from '../../../../../../context/course-creator-context';
import { queryClient } from '../../../../../../lib/query-client';
import {
  getCourseByUuidOptions,
  getCourseByUuidQueryKey,
  publishCourseMutation,
  publishCourseQueryKey,
  searchCoursesQueryKey,
  unpublishCourseMutation,
  unpublishCourseQueryKey,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import CourseBuilderPage from './CourseBuilderPage';
import CoursePreviewPage from './CoursePreviewPage';

const CourseCreationPage = () => {
  const router = useRouter();
  const creator = useCourseCreator();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('builder');

  const { data: course } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });

  const PublishCourse = useMutation(publishCourseMutation());
  const UnpublishCourse = useMutation(unpublishCourseMutation());
  const handlePublishCourse = async () => {
    if (!courseId) return;

    try {
      await PublishCourse.mutateAsync(
        {
          path: { uuid: courseId as string },
        },
        {
          onSuccess(data, _variables, _context) {
            toast.success(data?.message);
            queryClient.invalidateQueries({
              queryKey: publishCourseQueryKey({ path: { uuid: courseId as string } }),
            });
            queryClient.invalidateQueries({
              queryKey: searchCoursesQueryKey({
                query: {
                  searchParams: { course_creator_uuid_eq: creator?.profile?.uuid },
                  pageable: {},
                },
              }),
            });
            router.push('/dashboard/course-management/all');
          },
          onError: error => {
            toast.error(error?.message);
          },
        }
      );
    } catch (_err) {}
  };

  const handleUnpublishCourse = async () => {
    if (!courseId) return;

    try {
      await UnpublishCourse.mutateAsync(
        {
          path: { uuid: courseId as string },
        },
        {
          onSuccess(data) {
            toast.success(data?.message || 'Course unpublished successfully');
            queryClient.invalidateQueries({
              queryKey: unpublishCourseQueryKey({ path: { uuid: courseId as string } }),
            });
            queryClient.invalidateQueries({
              queryKey: publishCourseQueryKey({ path: { uuid: courseId as string } }),
            });
            queryClient.invalidateQueries({
              queryKey: getCourseByUuidQueryKey({ path: { uuid: courseId as string } }),
            });
            queryClient.invalidateQueries({
              queryKey: searchCoursesQueryKey({
                query: {
                  searchParams: { course_creator_uuid_eq: creator?.profile?.uuid },
                  pageable: {},
                },
              }),
            });
          },
          onError: error => {
            toast.error(error?.message || 'Failed to unpublish course');
          },
        }
      );
    } catch (_err) {}
  };

  const isPublished = course?.data?.is_published === true || course?.data?.status === 'published';
  const isCourseActionPending = PublishCourse.isPending || UnpublishCourse.isPending;

  return (
    <div className='mx-auto space-y-5'>
      <div
        onClick={() => router.push('/dashboard/course-management/all')}
        className='flex w-fit cursor-pointer flex-row items-center gap-2 py-2 pr-3'
      >
        <MoveLeft size={18} className='h-5 w-5 cursor-pointer' />
        <h1 className='text-sm'>Back</h1>
      </div>

      <div className='flex w-auto max-w-6xl flex-row items-center justify-between'>
        <div className='flex flex-row items-center gap-4'>
          <Button
            onClick={() => setActiveTab('builder')}
            variant={activeTab === 'builder' ? 'default' : 'outline'}
          >
            Course Builder
          </Button>
        </div>

        <div className='flex flex-row items-center gap-4'>
          <Button
            onClick={() => setActiveTab('preview')}
            variant={activeTab === 'preview' ? 'default' : 'outline'}
          >
            Preview
          </Button>

          {isPublished ? (
            <Button
              variant='outline'
              onClick={handleUnpublishCourse}
              disabled={!courseId || isCourseActionPending}
              className='px-6'
            >
              {UnpublishCourse.isPending ? <Spinner /> : <Undo2 />}
              Unpublish
            </Button>
          ) : (
            <Button
              variant='ghost'
              onClick={handlePublishCourse}
              disabled={!courseId || isCourseActionPending}
              className='border-muted-foreground/50 border px-12'
            >
              {PublishCourse.isPending ? <Spinner /> : <BookCheck />}
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className=''>
        {activeTab === 'builder' && <CourseBuilderPage />}
        {activeTab === 'preview' && <CoursePreviewPage />}
      </div>
    </div>
  );
};

export default CourseCreationPage;
