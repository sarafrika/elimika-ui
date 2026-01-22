'use client';

import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { BookCheck, MoveLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCourseCreator } from '../../../../../../context/course-creator-context';
import { queryClient } from '../../../../../../lib/query-client';
import { publishCourseMutation, publishCourseQueryKey, searchCoursesQueryKey } from '../../../../../../services/client/@tanstack/react-query.gen';
import CourseBuilderPage from './CourseBuilderPage';
import CoursePreviewPage from './CoursePreviewPage';

const CourseCreationPage = () => {
  const router = useRouter();
  const creator = useCourseCreator()
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('builder');

  const PublishCourse = useMutation(publishCourseMutation());
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
          onError: (error) => {
            toast.error(error?.message)
          }
        }
      );
    } catch (_err) { }
  };

  return (
    <div className='mx-auto space-y-5'>
      <div
        onClick={() => router.push('/dashboard/course-management/all')}
        className='flex w-fit cursor-pointer flex-row items-center gap-2 py-2 pr-3'
      >
        <MoveLeft size={18} className='h-5 w-5 cursor-pointer' />
        <h1 className='text-sm'>Back</h1>
      </div>

      <div className='mx-auto flex w-6xl flex-row items-center justify-between'>
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

          <Button variant={'ghost'} onClick={handlePublishCourse} className='border-muted-foreground/50 border px-12'>
            <BookCheck /> Publish
          </Button>
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
