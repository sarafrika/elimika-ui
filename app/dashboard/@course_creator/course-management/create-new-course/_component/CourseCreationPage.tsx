'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { DifficultyLabel } from '@/components/labels/difficulty-label';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { StepperContent, StepperList, StepperRoot, StepperTrigger } from '@/components/ui/stepper';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import {
  deleteCourseLessonMutation,
  deleteLessonContentMutation,
  getAllAssignmentsOptions,
  getAllContentTypesOptions,
  getAllQuizzesOptions,
  getCourseByUuidOptions,
  getCourseLessonOptions,
  getCourseLessonQueryKey,
  getCourseLessonsOptions,
  getCourseLessonsQueryKey,
  getLessonContentOptions,
  getLessonContentQueryKey,
  publishCourseMutation,
  publishCourseQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Eye,
  FileQuestion,
  GraduationCap,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardDescription } from '../../../../../../components/ui/card';
import { AssignmentDialog, AssignmentList } from '../../../_components/assignment-management-form';
import CourseBrandingForm from '../../../_components/course-branding-form';
import { CourseCreationForm, type CourseFormRef } from '../../../_components/course-creation-form';
import CourseLicensingForm from '../../../_components/course-licensing-form';
import type { ICourse, TLesson, TLessonContentItem } from '../../../_components/instructor-type';
import {
  AssessmentDialog,
  type ContentFormValues,
  EditLessonDialog,
  LessonContentDialog,
  LessonDialog,
  type LessonFormValues,
  LessonList,
} from '../../../_components/lesson-management-form';
import {
  CourseCreatorEmptyState,
  CourseCreatorLoadingState,
  CustomLoadingState,
} from '../../../_components/loading-state';
import { QuizDialog, QuizList } from '../../../_components/quiz-management-form';
import RubricsCreationPage from '../../../rubric-management/rubric-creation';

export default function CourseCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const resolveId = courseId ? (courseId as string) : (createdCourseId as string);
  const { isLoading: creatorLoading, profile: creatorProfile } = useCourseCreator();
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

  const [_selectedQuiz, setSelectedQuiz] = useState<any>();
  const [addQuizModal, setAddQuizModal] = useState(false);
  const _openAddQuizModal = (quiz: any) => {
    setSelectedQuiz(quiz);
    setAddQuizModal(true);
  };

  const [addAssignmentModal, setAddAssignmentModal] = useState(false);
  const _openAddAssignmentModal = (lesson: any) => {
    setSelectedLesson(lesson);
    setAddAssignmentModal(true);
  };

  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const _openAddAssessmentModal = () => setAddAssessmentModalOpen(true);

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
      instructor: c.course_creator_uuid || '',
      is_free: c.is_free ?? false,
      price: c.price ?? 0,
      // sale_price: c.sale_price ?? c.price ?? 0,
      // currency: c.currency || 'KES',
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
      minimum_training_fee: c?.minimum_training_fee ?? 0,
      creator_share_percentage: c.creator_share_percentage ?? 0,
      instructor_share_percentage: c.instructor_share_percentage ?? 0,
      revenue_share_notes: c.revenue_share_notes ?? '',
      // @ts-expect-error
      training_requirements: Array.isArray(c.training_requirements)
        ? c.training_requirements.map(req => ({
          uuid: req.uuid,
          requirement_type: req.requirement_type,
          name: req.name,
          description: req.description ?? '',
          quantity: req.quantity ?? undefined,
          unit: req.unit ?? '',
          provided_by: req.provided_by ?? 'course_creator',
          is_mandatory: !!req.is_mandatory,
        }))
        : [],
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
  const lessons = courseLessons?.data?.content;
  const lessonUuids = lessons?.map((lesson: any) => lesson.uuid) || [];

  // GET COURSE LESSON BY ID
  const { data: lessonData } = useQuery({
    ...getCourseLessonOptions({
      path: { courseUuid: resolveId, lessonUuid: selectedLesson?.uuid as string },
    }),
    enabled: !!resolveId && !!selectedLesson?.uuid,
  });
  // @ts-expect-error
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

  const _content =
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
              ? parseInt(item.estimated_duration, 10) || 0
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
    description: selectedContent?.description,
    // content_type: selectedContent?.content_type || "",
    // duration_hours: selectedContent?.duration_hours,
    // duration_minutes: selectedContent?.duration_minutes,
    // estimated_duration: "",
  };

  // GET COURSE QUIZZES
  const { data: quizData, isLoading: quizDataIsLoading } = useQuery(
    getAllQuizzesOptions({ query: { pageable: {} } })
  );
  const quizzes = quizData?.data?.content; // Array of quizzes
  const filteredQuizzes =
    quizzes?.filter((quiz: any) => lessonUuids.includes(quiz.lesson_uuid)) || [];

  // GET COURSE ASSIGNMENTS
  const { data: assignmentData, isLoading: assignmentIsLoading } = useQuery(
    getAllAssignmentsOptions({ query: { pageable: {} } })
  );
  const assignments = assignmentData?.data?.content;
  const filteredAssignments =
    assignments?.filter((assignment: any) => lessonUuids.includes(assignment.lesson_uuid)) || [];

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
          onSuccess(data, _variables, _context) {
            toast.success(data?.message);
            queryClient.invalidateQueries({
              queryKey: publishCourseQueryKey({ path: { uuid: course?.data?.uuid as string } }),
            });
            router.push('/dashboard/courses');
          },
        }
      );
    } catch (_err) { }
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
    } catch (_err) { }
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
    } catch (_err) { }
  };

  if (creatorLoading) {
    return <CourseCreatorLoadingState headline='Preparing the course creation workspace…' />;
  }

  if (!creatorProfile) {
    return <CourseCreatorEmptyState />;
  }

  if (courseId && !courseInitialValues) {
    return <CourseCreatorLoadingState headline='Loading existing course details…' />;
  }

  return (
    <div className='relative overflow-hidden'>
      <div className='absolute top-20 left-[-6rem] h-72 w-72 rounded-full bg-blue-400/20 blur-3xl'></div>
      <div className='absolute right-[-4rem] bottom-[-4rem] h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl'></div>

      <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 lg:px-6 lg:py-16'>
        <header className='rounded-[36px] border border-blue-200/40 bg-white/80 p-8 shadow-xl shadow-blue-200/30 backdrop-blur lg:p-12 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'>
          <span className='inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold tracking-[0.4em] text-blue-600 uppercase dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'>
            Course creator studio
          </span>
          <h1 className='mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl dark:text-white'>
            Design learning experiences that match your vision
          </h1>
          <p className='mt-3 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300'>
            Outline your course blueprint, orchestrate lessons, and refine assessments with
            guardrails that echo the Elimika brand.
          </p>
        </header>

        <StepperRoot>
          <StepperList>
            <StepperTrigger step={0} title='Course Details' icon={BookOpen} />
            <StepperTrigger step={1} title='Skills & Resources' icon={GraduationCap} />
            <StepperTrigger step={2} title='Assessment' icon={SlidersHorizontal} />
            <StepperTrigger step={3} title='Quizzes' icon={FileQuestion} />
            <StepperTrigger step={4} title='Assignment' icon={ClipboardList} />
            <StepperTrigger step={5} title='Branding' icon={Palette} />
            <StepperTrigger step={6} title='Course Licensing' icon={BadgeCheck} />
            <StepperTrigger step={7} title='Review' icon={Eye} />
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
            title='Course Skills & Resources'
            description='Add skills and learning materials for your course'
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
                contentId={selectedContent?.uuid as string}
                isOpen={addContentModalOpen}
                onOpenChange={setAddContentModalOpen}
                onCancel={() => {
                  setSelectedContent(null);
                  setAddContentModalOpen(false);
                }}
                initialValues={contentInitialValues}
              />

              <AssignmentDialog
                isOpen={addAssignmentModal}
                setOpen={setAddAssignmentModal}
                courseId={resolveId as string}
                onSuccess={() => {
                  setSelectedLesson(null);
                  setAddAssignmentModal(false);
                }}
                onCancel={() => {
                  setSelectedLesson(null);
                  setAddAssignmentModal(false);
                }}
              />
            </div>
          </StepperContent>

          <StepperContent
            step={2}
            title='Course Assessment'
            description='Create assessment rubrics to evaluate student performance'
            showNavigation
            nextButtonText='Continue to Quizzes'
            previousButtonText='Back to Skills & Resources'
          >
            <div className='w-full space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'>
              <div className='flex flex-row items-center justify-between'>
                <div className='space-y-1'>
                  <h1 className='text-2xl font-semibold'>{course?.data?.name}</h1>
                </div>
              </div>
              <RubricsCreationPage />
            </div>
          </StepperContent>

          <StepperContent
            step={3}
            title='Course Quizzes'
            description='Create quizzes for each skill to test student understanding'
            showNavigation
            nextButtonText='Continue to Assignment'
            previousButtonText='Back to Assessment'
          >
            <div className='space-y-4'>
              {quizDataIsLoading ? (
                <CustomLoadingState subHeading='Fetching course quizzes' />
              ) : (
                <QuizList
                  courseTitle={course?.data?.name as string}
                  isLoading={quizDataIsLoading}
                  quizzes={filteredQuizzes}
                  courseId={resolveId}
                  onAddQuiz={() => setAddQuizModal(true)}
                />
              )}

              <QuizDialog
                isOpen={addQuizModal}
                setOpen={setAddQuizModal}
                onCancel={() => setAddQuizModal(false)}
                courseId={resolveId}
              />
            </div>
          </StepperContent>

          <StepperContent
            step={4}
            title='Course Assignments'
            description='Create assignments for each skill to reinforce learning through practice'
            showNavigation
            nextButtonText='Continue to Branding'
            previousButtonText='Back to Quizzes'
          >
            <div className='space-y-4'>
              <AssignmentList
                courseTitle={course?.data?.name as string}
                onAddAssignment={() => setAddAssignmentModal(true)}
                courseId={resolveId as string}
                assignments={filteredAssignments}
                loading={assignmentIsLoading}
              />

              <AssignmentDialog
                isOpen={addAssignmentModal}
                setOpen={setAddAssignmentModal}
                courseId={resolveId as string}
                onSuccess={() => {
                  setSelectedLesson(null);
                  setAddAssignmentModal(false);
                }}
                onCancel={() => {
                  setSelectedLesson(null);
                  setAddAssignmentModal(false);
                }}
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
            step={5}
            title='Branding'
            description='Add visual elements to make your course more appealing'
            showNavigation
            nextButtonText='Continue to Course Licensing'
            previousButtonText='Back to Asessment'
          >
            <div className='w-full space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'>
              <div className='flex flex-row items-center justify-between'>
                <div className='space-y-1'>
                  <h1 className='text-2xl font-semibold'>{course?.data?.name}</h1>
                </div>
              </div>
              <CourseBrandingForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={courseInitialValues as any}
                successResponse={data => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </div>
          </StepperContent>

          <StepperContent
            step={6}
            title='Course Licensing Structure'
            description='Configure course access, pricing, and enrollment settings'
            showNavigation
            nextButtonText='Continue to Review'
            previousButtonText='Back to Branding'
          >
            <div className='w-full space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'>
              <div className='flex flex-row items-center justify-between'>
                <div className='space-y-1'>
                  <h1 className='text-2xl font-semibold'>{course?.data?.name}</h1>
                </div>
              </div>
              <CourseLicensingForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={courseInitialValues as any}
                successResponse={(data: any) => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </div>
          </StepperContent>

          <StepperContent
            step={7}
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
              <div className='w-full space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'>
                {/* Pricing Section */}
                <div className='flex flex-row items-center justify-between'>
                  <div className='space-y-1'>
                    <h1 className='text-2xl font-semibold'>{course?.data?.name}</h1>
                  </div>
                </div>

                <Card className='p-6'>
                  <CardDescription className='mb-3 text-xl font-semibold text-gray-800'>
                    💰 Pricing
                  </CardDescription>
                  <div className='space-y-2 text-gray-700'>
                    <p>
                      <span className='font-medium'>Free Course:</span>{' '}
                      {course?.data?.is_free ? 'Yes' : 'No'}
                    </p>
                  </div>
                </Card>

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

                  <h3 className='mb-3 text-xl font-semibold text-gray-800'>
                    📘 Course Information
                  </h3>
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
                  <h3 className='mb-3 text-xl font-semibold text-gray-800'>
                    🎯 Learning Objectives
                  </h3>
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
                        <p className='font-medium'>No skills available</p>
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
    </div>
  );
}
