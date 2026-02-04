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
  getAllContentTypesOptions,
  getCourseByUuidOptions,
  getCourseLessonsOptions,
  getLessonContentOptions,
  getLessonContentQueryKey,
  publishCourseMutation,
  publishCourseQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  BadgeDollarSign,
  BookOpen,
  CheckCheck,
  CheckCircle,
  ClipboardList,
  File,
  GraduationCap,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AssessmentCreationForm from '../../../_components/assessment-creation-form';
import CourseBrandingForm from '../../../_components/course-branding-form';
import { CourseComplianceForm } from '../../../_components/course-compliance-form';
import { CourseCreationForm, type CourseFormRef } from '../../../_components/course-creation-form';
import CourseLearningRulesForm from '../../../_components/course-learningrule-form';
import { CoursePricingForm } from '../../../_components/course-pricing-form';
import CriteriaCreationForm from '../../../_components/criteria-creation-form';
import type { ICourse } from '../../../_components/instructor-type';
import { ContentCreationForm } from '../../../_components/lesson-content-creation-form';
import { LessonCreationForm } from '../../../_components/lesson-creation-form';
import {
  CourseCreatorEmptyState,
  CourseCreatorLoadingState,
} from '../../../_components/loading-state';

export default function CourseBuilderPage() {
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

  const sectionContainerClasses =
    'w-full space-y-8 rounded-[32px] border border-border bg-card p-6 shadow-xl transition lg:p-10 dark:border-border/80 dark:bg-gradient-to-br dark:from-primary/10 dark:via-background/60 dark:to-background';

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
    <div className='relative w-full'>
      <div className='relative mx-auto flex w-full flex-col gap-10 px-4 pb-12 lg:pb-16'>
        {/* <header className='border-border bg-card/90 rounded-[36px] border p-8 shadow-xl backdrop-blur'>
          <span className='border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.4em] uppercase'>
            Course creator studio
          </span>
          <h1 className='text-foreground mt-4 text-3xl font-semibold sm:text-4xl'>
            Design learning experiences that match your vision
          </h1>
          <p className='text-muted-foreground mt-3 max-w-2xl text-sm sm:text-base'>
            Outline your course blueprint, orchestrate lessons, and refine assessments with
            guardrails that echo the Elimika brand.
          </p>
        </header> */}

        <header className='border-border bg-card rounded-xl border px-5 py-4'>
          <span className='text-muted-foreground text-[10px] font-medium tracking-widest uppercase'>
            Course creator studio
          </span>

          <h1 className='text-foreground mt-2 text-xl font-semibold'>
            Design learning experiences that match your vision
          </h1>

          <p className='text-muted-foreground mt-1 max-w-xl text-sm'>
            Outline your course blueprint, orchestrate lessons, and refine assessments with
            guardrails that echo the Elimika brand.
          </p>
        </header>

        <StepperRoot>
          <StepperList>
            <StepperTrigger step={0} title='Course Set Up' icon={BookOpen} />
            <StepperTrigger step={1} title='Course Lessons' icon={GraduationCap} />
            <StepperTrigger step={2} title='Lesson Contents' icon={File} />
            <StepperTrigger step={3} title='Assessment' icon={SlidersHorizontal} />

            <StepperTrigger step={4} title='Assessment Criteria' icon={CheckCheck} />

            <StepperTrigger step={5} title='Rules' icon={ClipboardList} />
            <StepperTrigger step={6} title='Branding' icon={Palette} />
            <StepperTrigger step={7} title='Pricing' icon={BadgeDollarSign} />
            <StepperTrigger step={8} title='Compliance' icon={BadgeCheck} />

            {/* <StepperTrigger step={7} title='Review' icon={Eye} /> */}
            {/* <StepperTrigger step={8} title='Quizzes' icon={FileQuestion} />
            <StepperTrigger step={9} title='Assignment' icon={ClipboardList} /> */}
          </StepperList>

          <div className='w-full'>
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
              title='Course Lessonss'
              description='Add skills and learning materials for your course'
              showNavigation
              nextButtonText='Continue to Lesson Contents'
              previousButtonText='Back to Course Set Up'
            >
              <div className='space-y-4 p-0'>
                <LessonCreationForm
                  course={course}
                  lessons={courseLessons?.data}
                  lessonContentsMap={lessonContentMap}
                />
              </div>
            </StepperContent>

            <StepperContent
              step={2}
              title='Course Lessons Content'
              description='Add skills and learning materials for your course'
              showNavigation
              nextButtonText='Continue to Assessment'
              previousButtonText='Back to Lessons'
            >
              <div className='space-y-4 p-0'>
                <ContentCreationForm
                  course={course}
                  lessons={courseLessons?.data}
                  lessonContentsMap={lessonContentMap}
                />
              </div>
            </StepperContent>

            <StepperContent
              step={3}
              title='Course Assessment'
              description='Create assessment rubrics to evaluate student performance'
              showNavigation
              nextButtonText='Continue to Assessment Criteria'
              previousButtonText='Back to Lesson Content'
            >
              <AssessmentCreationForm
                course={course}
                lessons={courseLessons?.data}
                lessonContentsMap={lessonContentMap}
              />
            </StepperContent>

            <StepperContent
              step={4}
              title='Assessment Criteria'
              description='Create assessment rubrics to evaluate student performance'
              showNavigation
              nextButtonText='Continue to Rules'
              previousButtonText='Back to Assessment'
            >
              <CriteriaCreationForm
                course={course}
              />
            </StepperContent>

            <StepperContent
              step={5}
              title='Course Learning Rules'
              description='Define the rules learners must follow to progress and complete the course.'
              showNavigation
              nextButtonText='Continue to Branding'
              previousButtonText='Back to Assessment Criteria'
            >
              <CourseLearningRulesForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={course?.data as any}
                successResponse={data => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </StepperContent>

            <StepperContent
              step={6}
              title='Branding'
              description='Add visual elements to make your course more appealing'
              showNavigation
              nextButtonText='Continue to Pricing'
              previousButtonText='Back to Rules'
            >
              <CourseBrandingForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={course?.data as any}
                successResponse={data => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </StepperContent>

            <StepperContent
              step={7}
              title='Pricing'
              description='Set the price, discounts, and access options for your course.'
              showNavigation
              nextButtonText='Continue to Compliance'
              previousButtonText='Back to Branding'
            >
              <CoursePricingForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={course?.data as any}
                successResponse={data => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </StepperContent>

            <StepperContent
              step={8}
              title='Course Compliance & Q?A'
              description='Confirm that all required compliance and quality checks have been completed.'
              // showNavigation
              // nextButtonText='Continue to Review'
              previousButtonText='Back to Pricing'
            >
              <CourseComplianceForm
                ref={formRef}
                showSubmitButton={true}
                courseId={createdCourseId as string}
                editingCourseId={resolveId as string}
                initialValues={course?.data as any}
                successResponse={(data: any) => {
                  setCreatedCourseId(data?.uuid);
                }}
              />
            </StepperContent>



            <StepperContent
              step={9}
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
                <div className={sectionContainerClasses}>
                  {/* Pricing Section */}
                  <div className='flex flex-row items-center justify-between'>
                    <div className='space-y-1'>
                      <h1 className='text-2xl font-semibold'>{course?.data?.name}</h1>
                    </div>
                  </div>

                  <div className='p-6'>
                    <div className='text-foreground mb-3 text-xl font-semibold'>💰 Pricing</div>
                    <div className='text-muted-foreground space-y-2'>
                      <p>
                        <span className='font-medium'>Free Course:</span>{' '}
                        {/* {course?.data?.is_free ? 'Yes' : 'No'} */}
                      </p>
                    </div>
                  </div>

                  {/* Course Information */}
                  <section>
                    <div>
                      <Image
                        src={(course?.data?.banner_url as string) || '/illustration.png'}
                        alt='upload-banner'
                        width={128}
                        height={128}
                        className='bg-muted mb-8 max-h-[250px] w-full text-sm'
                      />
                    </div>

                    <h3 className='text-foregrounds mb-3 text-xl font-semibold'>
                      Course Information
                    </h3>
                    <div className='space-y-3'>
                      <p>
                        <span className='font-medium'>
                          <strong>Name</strong>:
                        </span>
                        {course?.data?.name}
                      </p>
                      <div className='html-text-preview text-muted-foreground'>
                        <div className='mb-1 font-bold'>Description:</div>
                        <RichTextRenderer htmlString={course?.data?.description as string} />
                      </div>
                    </div>
                  </section>

                  {/* Learning Objectives */}
                  <section>
                    <h3 className='mb-3 text-xl font-semibold'>🎯 Learning Objectives</h3>
                    <div className='html-text-preview text-muted-foreground'>
                      <HTMLTextPreview htmlContent={course?.data?.objectives as string} />
                    </div>
                  </section>

                  <p>
                    <span className='font-bold'>Difficulty:</span>{' '}
                    <DifficultyLabel difficultyUuid={course?.data?.difficulty_uuid as string} />
                  </p>

                  {/* Categories */}
                  <section className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
                    <h3 className='text-xl font-semibold'>🏷️ Categories</h3>
                    <div className='flex flex-wrap gap-2'>
                      {course?.data?.category_names?.map((category: string, idx: number) => (
                        <span
                          key={idx}
                          className='bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium'
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* course content */}
                  <div className='mt-4'>
                    <h3 className='mb-3 text-xl font-semibold'>Course Content</h3>
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
                                <CheckCircle className='text-success mt-1 h-4 w-4' />
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
                  <p className='text-muted-foreground mb-4'>
                    Please complete the course details first
                  </p>
                </div>
              )}
            </StepperContent>

            {/* <StepperContent
              step={8}
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
            </StepperContent> */}

            {/* <StepperContent
              step={9}
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
            </StepperContent> */}
          </div>
        </StepperRoot>
      </div>
    </div>
  );
}
