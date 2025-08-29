'use client';

import {
  CourseCreationForm,
  CourseFormRef,
} from '@/app/dashboard/@instructor/_components/course-creation-form';
import {
  AssessmentDialog,
  AssessmentList,
  ContentFormValues,
  EditLessonDialog,
  LessonContentDialog,
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
import {
  deleteCourseLessonMutation,
  deleteLessonContentMutation,
  getAllContentTypesOptions,
  getCourseByUuidOptions,
  getCourseLessonOptions,
  getCourseLessonQueryKey,
  getCourseLessonsOptions,
  getCourseLessonsQueryKey,
  getLessonContentOptions,
  getLessonContentQueryKey,
  publishCourseMutation,
  publishCourseQueryKey,
  searchAssessmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BookOpenCheck, Check, CheckCircle, List } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ICourse, TLesson, TLessonContentItem } from '../../../_components/instructor-type';

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

  const [selectedContent, setSelectedContent] = useState<TLessonContentItem | null>(null);
  const [addContentModalOpen, setAddContentModalOpen] = useState(false);
  const openAddContentModal = (lesson: any) => {
    setSelectedLesson(lesson);
    setAddContentModalOpen(true);
  };

  const openEditContentModal = (content: TLessonContentItem) => {
    setAddContentModalOpen(true);
    setSelectedContent(content);
  };

  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const openAddAssessmentModal = () => setAddAssessmentModalOpen(true);

  // GET COURSE CONTENT TYPES
  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  // GET COURSE BY ID
  const { data: course } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: resolveId } }),
    enabled: !!resolveId,
  });

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
      created_by: c.created_by || '',
      updated_by: c.updated_by || '',
      is_published: c.is_published ?? false,
      total_duration_display: c.total_duration_display || '',
      is_draft: c.is_draft ?? false,
    });
  }, [courseId, course]);

  // GET COURSE LESSONS
  const { data: courseLessons, isLoading: lessonsIsLoading } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: resolveId },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!resolveId,
  });

  // GET COURSE LESSON BY ID
  const { data: lessonData } = useQuery({
    ...getCourseLessonOptions({
      path: { courseUuid: resolveId, lessonUuid: selectedLesson?.uuid as string },
    }),
    enabled: !!resolveId && !!selectedLesson?.uuid,
  });
  // @ts-ignore
  const lesson = lessonData?.data;

  const lessonContentQueries = useQueries({
    queries: (courseLessons?.data?.content || []).map(lesson => {
      const options = getLessonContentOptions({
        path: { courseUuid: resolveId, lessonUuid: lesson?.uuid as string },
      });

      return {
        queryKey: getLessonContentQueryKey({
          path: {
            courseUuid: resolveId,
            lessonUuid: lesson?.uuid as string,
          },
        }),
        queryFn: options.queryFn,
        enabled: !!resolveId,
      };
    }),
  });

  const lessonContentMap = new Map();

  (courseLessons?.data?.content || []).forEach((lesson, index) => {
    const query = lessonContentQueries[index];
    const contents = query?.data?.data || [];
    lessonContentMap.set(lesson.uuid, contents);
  });

  // GET COURSE LESSON CONTENT
  const { data: lessonContentData } = useQuery({
    ...getLessonContentOptions({
      path: { courseUuid: resolveId, lessonUuid: selectedLesson?.uuid as string },
    }),
    enabled: !!resolveId && !!selectedLesson?.uuid,
  });

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
          contentTypeUuid: item?.content_type || '',
          contentCategory: matchedType?.upload_category ?? '',
        };
      })
      : [];

  const lessonInitialValues: Partial<LessonFormValues> = {
    uuid: lesson?.uuid as string,
    title: lesson?.title,
    description: lesson?.description,
    objectives: lesson?.learning_objectives,
    number: lesson?.lesson_number,
    duration_hours: String(lesson?.duration_hours ?? '0'),
    duration_minutes: String(lesson?.duration_minutes ?? '0'),
    // resources: [],
  };

  const contentInitialValues: Partial<ContentFormValues> = {
    uuid: selectedContent?.uuid,
    display_order: selectedContent?.display_order,
    title: selectedContent?.title,
    content_category: selectedContent?.content_category,
    content_type_uuid: selectedContent?.content_type_uuid,
    value: selectedContent?.content_text as any,
    description: selectedContent?.description
    // content_type: selectedContent?.content_type || "",
    // duration_hours: selectedContent?.duration_hours,
    // duration_minutes: selectedContent?.duration_minutes,
    // estimated_duration: "",
  };

  // GET COURSE ASSESSMENTS
  const { data: assessmentData, isLoading: assessmentLoading } = useQuery(
    searchAssessmentsOptions({
      query: { searchParams: { courseUuid: resolveId }, pageable: { page: 0, size: 100 } },
    })
  );

  // PUBLISH COURSE MUTATION
  const PublishCourse = useMutation(publishCourseMutation());
  const handlePublishCourse = async () => {
    if (!course?.data?.uuid) return;

    try {
      await PublishCourse.mutateAsync(
        {
          path: { uuid: course?.data?.uuid as string },
        },
        {
          onSuccess(data, variables, context) {
            toast.success(data?.message);
            queryClient.invalidateQueries({
              queryKey: publishCourseQueryKey({ path: { uuid: course?.data?.uuid as string } }),
            });
            router.push('/dashboard/course-management/published');
          },
        }
      );
    } catch (err) { }
  };

  // DELETE LESSON MUTATION
  const DeleteLesson = useMutation(deleteCourseLessonMutation());
  const handleDeleteLesson = async (lessonId: string) => {
    if (!course?.data?.uuid) return;

    try {
      await DeleteLesson.mutateAsync(
        {
          path: { courseUuid: course?.data?.uuid as string, lessonUuid: lessonId },
        },
        {
          onSuccess: () => {
            toast.success('Lesson deleted successfully');
            queryClient.invalidateQueries({
              queryKey: getCourseLessonsQueryKey({
                path: { courseUuid: course?.data?.uuid as string },
                query: { pageable: { page: 0, size: 100 } },
              }),
            });
          },
        }
      );
    } catch (err) { }
  };

  const deleteLessonContent = useMutation(deleteLessonContentMutation());
  const handleDeleteContent = async (resolvedId: any, lessonId: any, contentId: any) => {
    if (!course?.data?.uuid) return;

    try {
      await deleteLessonContent.mutateAsync(
        {
          path: {
            courseUuid: course?.data?.uuid as string,
            lessonUuid: lessonId,
            contentUuid: contentId as string,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getLessonContentQueryKey({
                path: { courseUuid: resolvedId, lessonUuid: lessonId },
              }),
            });
            toast.success('Lesson content deleted successfully');
          },
        }
      );
    } catch (err) { }
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
          <StepperTrigger step={2} title='Assessment' icon={BookOpenCheck} />
          <StepperTrigger step={3} title='Review' icon={Check} />
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
            successResponse={data => {
              setCreatedCourseId(data?.uuid);
            }}
          />
        </StepperContent>

        <StepperContent
          step={1}
          title='Course Content'
          description='Add lessons and content to your course'
          showNavigation
          nextButtonText='Continue to Assessment'
          previousButtonText='Back to Details'
        >
          <div className='space-y-4'>
            <LessonList
              isLoading={lessonsIsLoading}
              courseTitle={course?.data?.name as string}
              courseId={resolveId}
              lessonId={selectedLesson?.uuid as string}
              courseCategory={course?.data?.category_names}
              // lessons
              lessons={courseLessons?.data}
              lessonItems={lessonContentData?.data}
              onAddLesson={openAddLessonModal}
              onEditLesson={openEditLessonModal}
              onDeleteLesson={handleDeleteLesson}
              onReorderLessons={() => { }}
              // lesson content
              lessonContentsMap={lessonContentMap}
              onAddLessonContent={openAddContentModal}
              onEditLessonContent={openEditContentModal}
              onDeleteLessonContent={handleDeleteContent}
            />

            <LessonDialog
              isOpen={addLessonModalOpen}
              onOpenChange={setAddLessonModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
              lessonId={selectedLesson?.uuid as string}
              onCancel={() => setAddLessonModalOpen(false)}
            />

            {editLessonModalOpen && selectedLesson && lesson && lessonContentData?.data && (
              <EditLessonDialog
                isOpen={editLessonModalOpen}
                onOpenChange={setEditLessonModalOpen}
                courseId={courseId as string}
                lessonId={selectedLesson?.uuid}
                initialValues={lessonInitialValues}
                onCancel={() => { }}
                onSuccess={data => {
                  setCreatedCourseId(data?.uuid);

                  queryClient.invalidateQueries({
                    queryKey: getCourseLessonsQueryKey({
                      path: { courseUuid: courseId as string },
                      query: { pageable: { page: 0, size: 100 } },
                    }),
                  });

                  queryClient.invalidateQueries({
                    queryKey: getCourseLessonQueryKey({
                      path: {
                        courseUuid: courseId as string,
                        lessonUuid: selectedLesson?.uuid as string,
                      },
                    }),
                  });

                  queryClient.invalidateQueries({
                    queryKey: getLessonContentQueryKey({
                      path: {
                        courseUuid: courseId as string,
                        lessonUuid: selectedLesson?.uuid as string,
                      },
                    }),
                  });
                }}
              />
            )}

            <LessonContentDialog
              courseId={resolveId}
              lessonId={selectedLesson?.uuid || (selectedContent?.lesson_uuid as string)}
              contentId={selectedContent?.uuid as string || ''}
              isOpen={addContentModalOpen}
              onOpenChange={setAddContentModalOpen}
              onCancel={() => {
                setSelectedContent(null);
                setAddContentModalOpen(false);
              }}
              initialValues={contentInitialValues}
            />

            <AssessmentDialog
              isOpen={addAssessmentModalOpen}
              onOpenChange={setAddAssessmentModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
              onCancel={() => setAddAssessmentModalOpen(false)}
            />
          </div>
        </StepperContent>

        <StepperContent
          step={2}
          title='Assessment'
          description='Manage the assessments created for your lessons'
          showNavigation
          nextButtonText='Continue to Review'
          previousButtonText='Back to Content'
        >
          <div className='space-y-4'>
            <AssessmentList
              courseTitle={course?.data?.name as string}
              isLoading={assessmentLoading}
              assessments={assessmentData?.data}
              lessonItems={lessonContentData?.data}
              courseId={resolveId}
              onAddAssessment={openAddAssessmentModal}
            />

            <AssessmentDialog
              isOpen={addAssessmentModalOpen}
              onOpenChange={setAddAssessmentModalOpen}
              courseId={createdCourseId ? createdCourseId : (courseId as string)}
              onCancel={() => setAddAssessmentModalOpen(false)}
            />
          </div>
        </StepperContent>

        <StepperContent
          step={3}
          title='Review Course'
          description='Review your course before publishing'
          showNavigation
          previousButtonText='Back to Content'
          hideNextButton={true}
          customButton={
            <Button onClick={handlePublishCourse} disabled={!course} className='min-w-[150px]'>
              {PublishCourse.isPending ? <Spinner /> : 'Publish Course'}
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
                <div>
                  <Image
                    src={(course?.data?.banner_url as string) || '/illustration.png'}
                    alt='upload-banner'
                    width={128}
                    height={128}
                    className='mb-8 max-h-[250px] w-full bg-stone-300 text-sm'
                  />
                </div>

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
              <section className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
                <h3 className='text-xl font-semibold text-gray-800'>🏷️ Categories</h3>
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

              {/* course content */}
              <div className='mt-4'>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>Course Content</h3>
              </div>
              <section>
                <div className='-mt-2 flex flex-col gap-2 space-y-4'>
                  {courseLessons?.data?.content
                    ?.slice()
                    ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
                    ?.map((lesson: any, i: any) => (
                      <div key={i} className='flex flex-row gap-2'>
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

                          <h3 className='font-semibold'>
                            <span>📅 Duration:</span> {lesson.duration_display}
                          </h3>
                        </div>
                      </div>
                    ))}

                  {courseLessons?.data?.content?.length === 0 && (
                    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                      <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
                      <p className='font-medium'>No lessons available</p>
                    </div>
                  )}
                </div>
              </section>

              {/* assessments */}
              <div className='mt-4'>
                <h3 className='mb-3 text-xl font-semibold text-gray-800'>Assessments</h3>
              </div>
              <section>
                <div className='-mt-2 flex flex-col gap-2 space-y-4'>
                  {assessmentData?.data?.content?.slice()?.map((assessment: any, i: any) => (
                    <div key={i} className='flex flex-row gap-2'>
                      <div>
                        <span className='min-h-4 min-w-4'>
                          <BookOpenCheck className='mt-1 h-4 w-4' />
                        </span>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <h3 className='font-semibold'>{assessment.title}</h3>
                        <RichTextRenderer
                          htmlString={
                            (assessment?.description as string) || 'No assessment provided'
                          }
                        />

                        {/* <h3 className='font-semibold'>
                          <span>📅 Duration:</span> {assessment.duration_display}
                        </h3> */}
                      </div>
                    </div>
                  ))}

                  {assessmentData?.data?.content?.length === 0 && (
                    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                      <BookOpenCheck className='text-muted-foreground mb-2 h-8 w-8' />
                      <p className='font-medium'>No assessments available</p>
                    </div>
                  )}
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
