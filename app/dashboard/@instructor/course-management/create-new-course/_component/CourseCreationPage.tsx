'use client';

import {
  CourseCreationForm,
  CourseFormRef,
} from '@/app/dashboard/@instructor/_components/course-creation-form';
import {
  AssessmentDialog,
  EditLessonDialog,
  LessonDialog,
  LessonFormValues,
  LessonList,
} from '@/app/dashboard/@instructor/_components/lesson-management-form';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { DifficultyLabel } from '@/components/labels/difficulty-label';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from '@/components/ui/stepper';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { tanstackClient } from '@/services/api/tanstack-client';
import {
  deleteCourseLesson,
  getAllContentTypes,
  getCourseByUuid,
  getCourseLesson,
  getCourseLessons,
  getLessonContent,
} from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, List } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getAllContentTypesQueryKey,
  getCourseByUuidQueryKey,
  getCourseLessonQueryKey,
} from '../../../../../../services/client/@tanstack/react-query.gen';
import { ICourse, TLesson } from '../../../_components/instructor-type';

export default function CourseCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const resolveId = courseId ? (courseId as string) : (createdCourseId as string);

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
        id: 'create-new-course',
        title: 'Create New Course',
        url: `/dashboard/course-management/create-new-course?id=id`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const formRef = useRef<CourseFormRef>(null);
  const queryClient = useQueryClient();

  const [addLessonModalOpen, setAddLessonModalOpen] = useState(false);
  const openAddLessonModal = () => setAddLessonModalOpen(true);

  const [selectedLesson, setSelectedLesson] = useState<TLesson | null>(null);
  const [editLessonModalOpen, setEditLessonModalOpen] = useState(false);
  const openEditLessonModal = (lesson: TLesson) => {
    setSelectedLesson(lesson);
    setEditLessonModalOpen(true);
  };

  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const openAddAssessmentModal = () => setAddAssessmentModalOpen(true);

  // GetContentTypes
  const useGetContentTypes = () => {
    return useQuery({
      queryKey: [getAllContentTypesQueryKey],
      queryFn: () => getAllContentTypes().then(res => res.data),
    });
  };
  const { data: contentTypeList } = useGetContentTypes();

  // GetCourseById
  const useCourseById = (uuid?: string) => {
    return useQuery({
      queryKey: [getCourseByUuidQueryKey, uuid],
      queryFn: () => getCourseByUuid({ path: { uuid: uuid! } }).then(res => res.data),
      enabled: !!uuid,
    });
  };
  const { data: course, isLoading, refetch } = useCourseById(resolveId);

  const [courseInitialValues, setCourseInitialValues] = useState<ICourse | undefined>(undefined);

  useEffect(() => {
    if (!courseId || !course?.data) return;

    const c = course.data;

    setCourseInitialValues({
      name: c.name || '',
      description: c.description || '',
      instructor: c.instructor_uuid || '',
      is_free: c.is_free ?? false,
      price: c.price ?? 0,
      sale_price: c.price ?? 0,
      currency: 'KES',
      objectives: c.objectives || [],
      categories: c.category_uuids || [],
      difficulty: c.difficulty_uuid || '',
      class_limit: c.class_limit ?? 0,
      prerequisites: c.prerequisites || '',
      duration_hours: c.duration_hours ?? 0,
      duration_minutes: c.duration_minutes ?? 0,
      age_lower_limit: c.age_lower_limit ?? 0,
      age_upper_limit: c.age_upper_limit ?? 0,
      thumbnail_url: c.thumbnail_url || '',
      intro_video_url: c.intro_video_url || '',
      banner_url: c.banner_url || '',
      status: c.status || '',
      active: c.active ?? true,
      // created_date: c.created_date || '',
      created_by: c.created_by || '',
      // updated_date: c.updated_date || '',
      updated_by: c.updated_by || '',
      is_published: c.is_published ?? false,
      total_duration_display: c.total_duration_display || '',
      is_draft: c.is_draft ?? false,
    });
  }, [courseId, course]);

  // GetLessons
  const useCourseLessons = (courseUuid?: string) => {
    return useQuery({
      queryKey: ['course-lessons', courseUuid],
      queryFn: () => getCourseLessons({ path: { courseUuid: courseUuid! } }).then(res => res.data),
      enabled: !!courseUuid,
      staleTime: 5 * 60 * 1000,
    });
  };
  const { data: courseLessons } = useCourseLessons(resolveId);

  // GetLesssonById
  const useLessonById = (courseUuid?: string, lessonUuid?: string) => {
    return useQuery({
      queryKey: ['lesson', courseUuid, lessonUuid],
      queryFn: () =>
        getCourseLesson({
          path: {
            courseUuid: courseUuid!,
            lessonUuid: lessonUuid!,
          },
        }).then(res => res?.data),
      enabled: !!courseUuid && !!lessonUuid,
      staleTime: 5 * 60 * 1000,
    });
  };
  const { data: lessonData } = useLessonById(resolveId, selectedLesson?.uuid as string);
  // @ts-ignore
  const lesson = lessonData?.data;

  // GetLessonContent
  const useLessonContent = (courseUuid?: string, lessonUuid?: string) => {
    return useQuery({
      queryKey: ['lesson-content', courseUuid, lessonUuid],
      queryFn: () =>
        getLessonContent({
          path: {
            courseUuid: courseUuid!,
            lessonUuid: lessonUuid!,
          },
        }).then(res => res.data),
      enabled: !!courseUuid && !!lessonUuid,
      staleTime: 5 * 60 * 1000, // Optional: cache duration
    });
  };
  const { data: lessonContentData, refetch: refetchLessonContent } = useLessonContent(
    resolveId,
    selectedLesson?.uuid as string
  );

  // const contentData = lessonContentData?.data?.[0];
  const lessonContent = lessonContentData?.data?.map((item: any) => ({
    content_type: item.content_type_uuid,
    title: item.title,
    value: item.content_text || item.file_url || '',
    duration_hours: lesson?.duration_hours ?? 0,
    duration_minutes: lesson?.duration_minutes ?? 0,
    content_category: item.content_category,
    uuid: item.uuid,
  }));

  // const getContentTypeName = (uuid: string) => {
  //   return contentTypeList.find((type) => type.uuid === uuid)?.name || ""
  // }

  const content =
    lesson && lessonContent
      ? lessonContent.map((item: any) => {
          const matchedType = Array.isArray(contentTypeList?.data)
            ? contentTypeList.data.find(ct => ct.uuid === item?.content_type)
            : undefined;

          const typeName = matchedType?.name ?? 'TEXT'; // fallback if undefined

          return {
            contentType: typeName.toUpperCase() as
              | 'AUDIO'
              | 'VIDEO'
              | 'TEXT'
              | 'LINK'
              | 'PDF'
              | 'YOUTUBE',
            title: item?.title || '',
            uuid: item?.uuid || '',
            value: typeName.toUpperCase() === 'TEXT' ? item?.value || '' : item?.file_url || '',
            duration:
              typeof item?.estimated_duration === 'string'
                ? parseInt(item.estimated_duration) || 0
                : 0,
            durationHours: item?.duration_hours || 0,
            durationMinutes: item?.duration_minutes || 0,
            contentUuid: item?.content_type || '',
            contentCategory: matchedType?.upload_category ?? '',
          };
        })
      : [];

  const lessonInitialValues: Partial<LessonFormValues> = {
    // resources: [],
    uuid: lesson?.uuid as string,
    title: lesson?.title,
    description: lesson?.description,
    objectives: lesson?.learning_objectives,
    number: lesson?.lesson_number,
    duration_hours: String(lesson?.duration_hours ?? '0'),
    duration_minutes: String(lesson?.duration_minutes ?? '0'),
    // map content if multiple content upload is allowed
    content: content,
  };

  const publishCourseMutation = tanstackClient.useMutation(
    'post',
    '/api/v1/courses/{uuid}/publish'
  );

  const handlePublishCourse = () => {
    if (!course?.data?.uuid) return;
    publishCourseMutation.mutate(
      { params: { path: { uuid: course?.data?.uuid as string } } },
      {
        onSuccess: data => {
          toast.success(data?.message);
          router.push('/dashboard/course-management/published');
        },
      }
    );
  };

  // MUTATE
  const { mutate: deleteLessonMutation, isPending: deleteLessonIsPending } = useMutation({
    mutationKey: [getCourseLessonQueryKey],
    mutationFn: ({ uuid, lessonUuid }: { uuid: string; lessonUuid: string }) =>
      deleteCourseLesson({ path: { courseUuid: uuid, lessonUuid: lessonUuid } }),
  });

  const handleDeleteLesson = (lessonId: string) => {
    if (!course?.data?.uuid) return;

    deleteLessonMutation(
      { lessonUuid: lessonId as string, uuid: course?.data?.uuid as string },
      {
        onSuccess: () => {
          toast.success('Lesson deleted successfully');
          queryClient.invalidateQueries();
        },
      }
    );
  };

  if (courseId && !courseInitialValues) {
    return (
      <div className='flex items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='container mx-auto'>
      <StepperRoot>
        <StepperList>
          <StepperTrigger step={0} title='Course Details' icon={BookOpen} />
          <StepperTrigger step={1} title='Content' icon={List} />
          <StepperTrigger step={2} title='Review' icon={Check} />
        </StepperList>

        <StepperContent
          step={0}
          title='Basic Course Information'
          description='Enter the fundamental details of your course. You can edit the details later, upload a thumbnail, banner and intro video for the course.'
          showNavigation
          nextButtonText={'Continue to Lesson Creation'}
          hideNextButton={true}
          hidePreviousButton={true}
        >
          <CourseCreationForm
            ref={formRef}
            showSubmitButton={true}
            courseId={createdCourseId as string}
            editingCourseId={courseId as string}
            initialValues={courseInitialValues as any}
            onSuccess={data => {
              setCreatedCourseId(data?.uuid);
              // refetchCourse();
            }}
          />
        </StepperContent>

        <StepperContent
          step={1}
          title='Course Content'
          description='Add lessons and content to your course'
          showNavigation
          nextButtonText='Continue to Review'
          previousButtonText='Back to Details'
        >
          <div className='space-y-4'>
            <LessonList
              // isLoading={lessonsIsLoading}
              isLoading={false}
              courseTitle={course?.data?.name as string}
              courseCategory={course?.data?.category_names}
              // @ts-ignore
              lessons={courseLessons?.data}
              lessonItems={lessonContentData?.data}
              onAddLesson={openAddLessonModal}
              onEditLesson={openEditLessonModal}
              onDeleteLesson={handleDeleteLesson}
              onAddAssessment={openAddAssessmentModal}
              onEditAssessment={() => {}}
              onReorderLessons={() => {}}
            />

            <LessonDialog
              isOpen={addLessonModalOpen}
              onOpenChange={setAddLessonModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
              // refetch={refetchLessons}
            />

            {editLessonModalOpen && selectedLesson && lesson && lessonContentData?.data && (
              <EditLessonDialog
                isOpen={editLessonModalOpen}
                onOpenChange={setEditLessonModalOpen}
                courseId={courseId as string}
                // @ts-ignore
                lessonId={selectedLesson?.uuid}
                initialValues={lessonInitialValues}
                onSuccess={data => {
                  setCreatedCourseId(data?.uuid);
                  // refetchLessons();
                  refetchLessonContent();
                }}
              />
            )}

            <AssessmentDialog
              isOpen={addAssessmentModalOpen}
              onOpenChange={setAddAssessmentModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
            />
          </div>
        </StepperContent>

        <StepperContent
          step={2}
          title='Review Course'
          description='Review your course before publishing'
          showNavigation
          previousButtonText='Back to Content'
          hideNextButton={true}
          customButton={
            <Button onClick={handlePublishCourse} disabled={!course} className='min-w-[150px]'>
              {publishCourseMutation.isPending ? <Spinner /> : 'Publish Course'}
            </Button>
          }
        >
          {course ? (
            <div className='space-y-8'>
              {/* Pricing Section */}
              <section>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>💰 Pricing</h3>
                <div className='space-y-2 text-gray-700'>
                  <p>
                    <span className='font-medium'>Free Course:</span>{' '}
                    {course?.data?.is_free ? 'Yes' : 'No'}
                  </p>
                  {!course?.data?.is_free && (
                    <div className='space-y-1'>
                      <p>
                        <span className='font-medium'>Original Price:</span> {course?.data?.price}{' '}
                        KES
                      </p>
                      <p>
                        <span className='font-medium'>Sale Price:</span>{' '}
                        <span className='font-semibold text-green-600'>
                          {course?.data?.price} KES
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Course Information */}
              <section>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>📘 Course Information</h3>
                <div className='space-y-3 text-gray-700'>
                  <p>
                    <span className='font-medium'>
                      <strong>Name</strong>:
                    </span>
                    {course?.data?.name}
                  </p>
                  <div className='html-text-preview'>
                    <div className='mb-1 font-bold'>Description:</div>
                    <RichTextRenderer htmlString={course?.data?.description as string} />
                  </div>
                </div>
              </section>

              {/* Learning Objectives */}
              <section>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>🎯 Learning Objectives</h3>
                <div className='html-text-preview text-gray-700'>
                  <HTMLTextPreview htmlContent={course?.data?.objectives as string} />
                </div>
              </section>

              <p>
                <span className='font-bold'>Difficulty:</span>{' '}
                <DifficultyLabel difficultyUuid={course?.data?.difficulty_uuid as string} />
              </p>

              {/* Categories */}
              <section>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>🏷️ Categories</h3>
                <div className='flex flex-wrap gap-2'>
                  {course?.data?.category_names?.map((category: string, idx: number) => (
                    <span
                      key={idx}
                      className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800'
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className='flex h-48 flex-col items-center justify-center text-center'>
              <p className='mb-4 text-gray-500'>Please complete the course details first</p>
            </div>
          )}
        </StepperContent>
      </StepperRoot>
    </div>
  );
}
