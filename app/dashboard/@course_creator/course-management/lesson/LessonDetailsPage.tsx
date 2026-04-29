'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
  createPracticeActivityMutation,
  deleteLessonContentMutation,
  deletePracticeActivityMutation,
  deleteQuizMutation,
  getAllContentTypesOptions,
  getCourseLessonOptions,
  getLessonContentOptions,
  getLessonContentQueryKey,
  getPracticeActivitiesOptions,
  getPracticeActivitiesQueryKey,
  searchAssignmentsOptions,
  searchQuizzesOptions,
  updatePracticeActivityMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ClipboardList,
  Clock,
  EyeOff,
  ListOrdered,
  MoreVertical,
  PenLine,
  PlusCircle,
  Trash,
  Users,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { TLesson, TLessonContentItem } from '../../_components/instructor-type';
import {
  type ContentFormValues,
  type ContentType,
  getContentTypeIcon,
  LessonContentDialog,
} from '../../_components/lesson-management-form';
import { CustomLoadingState } from '../../_components/loading-state';
import {
  QuestionDialog,
  QuizDialog,
  type QuizFormValues,
} from '../../_components/quiz-management-form';
import QuizQuestions from './quizQuestions';
import {
  ActivityTypeEnum,
  GroupingEnum,
  type ContentType as ApiContentType,
  type LessonPracticeActivity,
  type PageMetadata,
  type Quiz,
  SchemaEnum4,
} from '@/services/client/types.gen';

type LessonRecord = TLesson & { duration_display?: string };
type LessonContentRecord = TLessonContentItem & { uuid?: string; lesson_uuid: string };
type QuizRecord = Quiz & { uuid?: string; lesson_uuid: string; time_limit_display?: string };
type AssignmentRecord = {
  uuid?: string;
  lesson_uuid?: string;
  title?: string;
  description?: string;
  time_limit_display?: string;
  passing_score?: number;
};

const PRACTICE_ACTIVITY_PAGE_SIZE = 10;

type PracticeActivityFormValues = {
  title: string;
  instructions: string;
  activity_type: LessonPracticeActivity['activity_type'];
  grouping: LessonPracticeActivity['grouping'];
  estimated_minutes: string;
  materials: string;
  expected_output: string;
  display_order: string;
  status: LessonPracticeActivity['status'];
  active: boolean;
};

type PracticeActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: LessonPracticeActivity | null;
  isSubmitting: boolean;
  onSubmit: (payload: LessonPracticeActivity) => Promise<void>;
};

const defaultPracticeActivityFormValues = (): PracticeActivityFormValues => ({
  title: '',
  instructions: '',
  activity_type: ActivityTypeEnum.EXERCISE,
  grouping: GroupingEnum.INDIVIDUAL,
  estimated_minutes: '',
  materials: '',
  expected_output: '',
  display_order: '',
  status: SchemaEnum4.DRAFT,
  active: false,
});

const getPracticeActivityFormValues = (
  activity?: LessonPracticeActivity | null
): PracticeActivityFormValues => {
  if (!activity) return defaultPracticeActivityFormValues();

  return {
    title: activity.title ?? '',
    instructions: activity.instructions ?? '',
    activity_type: activity.activity_type ?? ActivityTypeEnum.EXERCISE,
    grouping: activity.grouping ?? GroupingEnum.INDIVIDUAL,
    estimated_minutes: activity.estimated_minutes?.toString() ?? '',
    materials: activity.materials?.join('\n') ?? '',
    expected_output: activity.expected_output ?? '',
    display_order: activity.display_order?.toString() ?? '',
    status: activity.status ?? SchemaEnum4.DRAFT,
    active: activity.active ?? false,
  };
};

const getDisplayLabel = (value?: string) =>
  value
    ? value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase())
    : 'Not set';

const getMaterialsList = (value: string) =>
  value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }

  return fallback;
};

const buildPracticeActivityPayload = (
  values: PracticeActivityFormValues
): LessonPracticeActivity => ({
  title: values.title.trim(),
  instructions: values.instructions.trim(),
  activity_type: values.activity_type,
  grouping: values.grouping,
  estimated_minutes: values.estimated_minutes ? Number(values.estimated_minutes) : undefined,
  materials: getMaterialsList(values.materials),
  expected_output: values.expected_output.trim() || undefined,
  display_order: values.display_order ? Number(values.display_order) : undefined,
  status: values.status,
  active: values.status === SchemaEnum4.PUBLISHED ? values.active : false,
});

function PracticeActivityDialog({
  open,
  onOpenChange,
  activity,
  isSubmitting,
  onSubmit,
}: PracticeActivityDialogProps) {
  const [values, setValues] = useState<PracticeActivityFormValues>(
    getPracticeActivityFormValues(activity)
  );

  useEffect(() => {
    if (open) {
      setValues(getPracticeActivityFormValues(activity));
    }
  }, [activity, open]);

  const setValue = <TKey extends keyof PracticeActivityFormValues>(
    key: TKey,
    value: PracticeActivityFormValues[TKey]
  ) => {
    setValues(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.title.trim()) {
      toast.error('Practice activity title is required');
      return;
    }

    if (!values.instructions.trim()) {
      toast.error('Practice activity instructions are required');
      return;
    }

    if (values.estimated_minutes && Number(values.estimated_minutes) < 1) {
      toast.error('Estimated minutes must be at least 1');
      return;
    }

    if (values.display_order && Number(values.display_order) < 1) {
      toast.error('Display order must be at least 1');
      return;
    }

    await onSubmit(buildPracticeActivityPayload(values));
  };

  const isPublished = values.status === SchemaEnum4.PUBLISHED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {activity?.uuid ? 'Edit Practice Activity' : 'Add Practice Activity'}
          </DialogTitle>
          <DialogDescription>
            Capture a reusable class-practice activity for this skill.
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-5' onSubmit={handleSubmit}>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-title'>Title</Label>
              <Input
                id='practice-title'
                value={values.title}
                onChange={event => setValue('title', event.target.value)}
                placeholder='Group discussion on customer discovery'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-type'>Activity Type</Label>
              <Select
                value={values.activity_type}
                onValueChange={value =>
                  setValue('activity_type', value as LessonPracticeActivity['activity_type'])
                }
              >
                <SelectTrigger id='practice-type' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ActivityTypeEnum).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-grouping'>Grouping</Label>
              <Select
                value={values.grouping}
                onValueChange={value =>
                  setValue('grouping', value as LessonPracticeActivity['grouping'])
                }
              >
                <SelectTrigger id='practice-grouping' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(GroupingEnum).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-estimated-minutes'>Estimated Minutes</Label>
              <Input
                id='practice-estimated-minutes'
                min={1}
                type='number'
                value={values.estimated_minutes}
                onChange={event => setValue('estimated_minutes', event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-display-order'>Display Order</Label>
              <Input
                id='practice-display-order'
                min={1}
                type='number'
                value={values.display_order}
                onChange={event => setValue('display_order', event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='practice-status'>Status</Label>
              <Select
                value={values.status}
                onValueChange={value =>
                  setValue('status', value as LessonPracticeActivity['status'])
                }
              >
                <SelectTrigger id='practice-status' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SchemaEnum4).map(option => (
                    <SelectItem key={option} value={option}>
                      {getDisplayLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center justify-between gap-4 rounded-md border px-3 py-2'>
              <Label htmlFor='practice-active' className='text-sm font-medium'>
                Visible
              </Label>
              <Switch
                id='practice-active'
                checked={isPublished && values.active}
                disabled={!isPublished}
                onCheckedChange={checked => setValue('active', checked)}
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-instructions'>Instructions</Label>
              <Textarea
                id='practice-instructions'
                rows={4}
                value={values.instructions}
                onChange={event => setValue('instructions', event.target.value)}
                placeholder='Explain how the facilitator should run the activity.'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-materials'>Materials</Label>
              <Textarea
                id='practice-materials'
                rows={3}
                value={values.materials}
                onChange={event => setValue('materials', event.target.value)}
                placeholder='Add one material, link, or handout per line.'
              />
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='practice-output'>Expected Output</Label>
              <Textarea
                id='practice-output'
                rows={3}
                value={values.expected_output}
                onChange={event => setValue('expected_output', event.target.value)}
                placeholder='Describe what learners should produce or discuss.'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const LessonDetailsPage = () => {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('id');
  const courseId = searchParams.get('courseId');
  const { replaceBreadcrumbs } = useBreadcrumb();
  const qc = useQueryClient();

  // get lesson details
  const { data, isLoading } = useQuery(
    getCourseLessonOptions({
      path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
    })
  );
  const lesson = data as unknown as LessonRecord | undefined;

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'course-management',
        title: 'Course Management',
        url: `/dashboard/course-management/create-new-course?id=${courseId}`,
      },
      {
        id: 'lesson-management',
        title: `Lesson - ${lesson?.title}`,
        url: `/dashboard/course-management/lesson?courseId=${courseId}&id=${lessonId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseId, lessonId, lesson?.title]);

  // lesson content
  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const contentTypeData = useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);

  const { data: lessonContent, isLoading: contentIsLoading } = useQuery(
    getLessonContentOptions({
      path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
    })
  );
  const contentItems = (lessonContent?.data ?? []) as unknown as LessonContentRecord[];

  const [openContentModal, setOpenContentModal] = useState(false);
  const [openDeleteContentModal, setOpenDeleteContentModal] = useState(false);

  const [editingContent, setEditingContent] = useState<TLessonContentItem | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);

  const openAddLessonContent = () => {
    setOpenContentModal(true);
  };

  const handleEditContent = (item: LessonContentRecord) => {
    setOpenContentModal(true);
    setEditingContent(item);
    setEditingContentId(item.uuid ?? null);
  };

  const handleDeleteContent = (_courseId: string | null, _lessonId: string, contentId?: string) => {
    setEditingContentId(contentId ?? null);
    setOpenDeleteContentModal(true);
  };

  const deleteLessonContent = useMutation(deleteLessonContentMutation());
  const confirmDeleteLessonContent = async () => {
    if (!courseId) return;

    try {
      await deleteLessonContent.mutateAsync(
        {
          path: {
            courseUuid: courseId as string,
            lessonUuid: lessonId as string,
            contentUuid: editingContentId as string,
          },
        },
        {
          onSuccess: () => {
            qc.invalidateQueries({
              queryKey: getLessonContentQueryKey({
                path: { courseUuid: courseId, lessonUuid: lessonId as string },
              }),
            });
            toast.success('Lesson content deleted successfully');
            setOpenDeleteContentModal(false);
          },
        }
      );
    } catch (_err) {}
  };

  // Practice activity management
  const [practicePage, setPracticePage] = useState(0);
  const [openPracticeActivityModal, setOpenPracticeActivityModal] = useState(false);
  const [openDeletePracticeActivityModal, setOpenDeletePracticeActivityModal] = useState(false);
  const [editingPracticeActivity, setEditingPracticeActivity] =
    useState<LessonPracticeActivity | null>(null);
  const [editingPracticeActivityId, setEditingPracticeActivityId] = useState<string | null>(null);

  const practiceActivityListRequest = {
    path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
    query: { pageable: { page: practicePage, size: PRACTICE_ACTIVITY_PAGE_SIZE } },
  };
  const practiceActivitiesQueryKey = getPracticeActivitiesQueryKey(practiceActivityListRequest);
  const practiceActivitiesOptions = getPracticeActivitiesOptions(practiceActivityListRequest);
  const { data: practiceActivitiesData, isFetching: practiceActivitiesIsFetching } = useQuery({
    ...practiceActivitiesOptions,
    enabled: Boolean(courseId && lessonId),
  });
  const practiceActivities = (practiceActivitiesData?.data?.content ??
    []) as LessonPracticeActivity[];
  const practiceMetadata = practiceActivitiesData?.data?.metadata as PageMetadata | undefined;

  const closePracticeActivityModal = () => {
    setEditingPracticeActivity(null);
    setEditingPracticeActivityId(null);
    setOpenPracticeActivityModal(false);
  };

  const handleAddPracticeActivity = () => {
    setEditingPracticeActivity(null);
    setEditingPracticeActivityId(null);
    setOpenPracticeActivityModal(true);
  };

  const handleEditPracticeActivity = (activity: LessonPracticeActivity) => {
    setEditingPracticeActivity(activity);
    setEditingPracticeActivityId(activity.uuid ?? null);
    setOpenPracticeActivityModal(true);
  };

  const handleDeletePracticeActivity = (activity: LessonPracticeActivity) => {
    setEditingPracticeActivity(activity);
    setEditingPracticeActivityId(activity.uuid ?? null);
    setOpenDeletePracticeActivityModal(true);
  };

  const createPracticeActivity = useMutation(createPracticeActivityMutation());
  const updatePracticeActivity = useMutation(updatePracticeActivityMutation());
  const deletePracticeActivity = useMutation(deletePracticeActivityMutation());

  const handleSavePracticeActivity = async (payload: LessonPracticeActivity) => {
    if (!courseId || !lessonId) return;

    try {
      if (editingPracticeActivityId) {
        await updatePracticeActivity.mutateAsync({
          body: payload,
          path: {
            courseUuid: courseId,
            lessonUuid: lessonId,
            activityUuid: editingPracticeActivityId,
          },
        });
        toast.success('Practice activity updated successfully');
      } else {
        await createPracticeActivity.mutateAsync({
          body: payload,
          path: { courseUuid: courseId, lessonUuid: lessonId },
        });
        setPracticePage(0);
        toast.success('Practice activity created successfully');
      }

      await qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
      closePracticeActivityModal();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save practice activity'));
    }
  };

  const confirmDeletePracticeActivity = async () => {
    if (!courseId || !lessonId || !editingPracticeActivityId) return;

    try {
      await deletePracticeActivity.mutateAsync({
        path: {
          courseUuid: courseId,
          lessonUuid: lessonId,
          activityUuid: editingPracticeActivityId,
        },
      });
      await qc.invalidateQueries({ queryKey: practiceActivitiesQueryKey });
      toast.success('Practice activity deleted successfully');
      setOpenDeletePracticeActivityModal(false);
      setEditingPracticeActivity(null);
      setEditingPracticeActivityId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete practice activity'));
    }
  };

  // Quiz management
  const {
    data: quizzesData,
    refetch: refetchQuizzes,
    isFetching: quizIsFetching,
  } = useQuery(
    searchQuizzesOptions({ query: { searchParams: { lesson_uuid: '' }, pageable: {} } })
  );

  const [expandedQuizIndexes, setExpandedQuizIndexes] = useState<number[]>([]);
  const toggleQuizQuestions = (index: number) => {
    setExpandedQuizIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Assignment management
  const {
    data: assignmentData,
    refetch: refetchAssignments,
    isFetching: assignmentIsFetching,
  } = useQuery(
    searchAssignmentsOptions({ query: { searchParams: { lesson_uuid: '' }, pageable: {} } })
  );

  const [editingQuizData, setEditingQuizData] = useState<QuizFormValues | null>(null);

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [_editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [openEditQuizModal, setOpenEditQuizModal] = useState(false);
  const [openDeleteQuizModal, setOpenDeleteQuizModal] = useState(false);

  const [openQuestionModal, setOpenQuestionModal] = useState(false);

  const handleAddQuiz = () => {
    setEditingQuizData(null);
    setEditingQuizId(null);
    setEditingLessonId(lessonId as string);
    setOpenEditQuizModal(true);
  };

  const handleEditQuiz = (quiz: QuizRecord) => {
    setEditingQuizData({
      lesson_uuid: quiz.lesson_uuid,
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      time_limit_minutes: quiz.time_limit_minutes,
      attempts_allowed: quiz.attempts_allowed,
      passing_score: quiz.passing_score,
      status: quiz.status,
      active: quiz.active ?? false,
      rubric_uuid: quiz.rubric_uuid,
    });
    setEditingLessonId(quiz.lesson_uuid);
    setEditingQuizId(quiz.uuid ?? null);
    setOpenEditQuizModal(true);
  };

  const handleAddQuestions = (quiz: QuizRecord) => {
    setEditingQuizId(quiz.uuid ?? null);
    setOpenQuestionModal(true);
  };

  const handleDeleteQuiz = (quiz: QuizRecord) => {
    setEditingQuizId(quiz.uuid ?? null);
    setOpenDeleteQuizModal(true);
  };

  const deleteQuiz = useMutation(deleteQuizMutation());
  const confirmDelete = () => {
    deleteQuiz.mutate(
      { path: { uuid: editingQuizId as string } },
      {
        onSuccess: () => {
          refetchQuizzes();
          toast.success('Quiz deleted successfully');
          setOpenDeleteQuizModal(false);
        },
      }
    );
  };

  const loading = isLoading || contentIsLoading;

  if (loading) {
    return <CustomLoadingState subHeading='Loading skills and resources' />;
  }

  const pageShellClasses =
    'max-w-6xl space-y-8 rounded-[32px] border border-border bg-card p-6 shadow-xl transition lg:p-10 dark:border-border/80 dark:bg-gradient-to-br dark:from-primary/10 dark:via-background/60 dark:to-background';
  const contentGroupClasses =
    'group text-muted-foreground flex cursor-default items-center justify-between gap-4 rounded-[20px] border border-border bg-card/80 p-4 shadow-xl backdrop-blur lg:p-8 dark:border-border/70 dark:bg-card/70';
  const quizCardClasses =
    'flex w-full flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-lg dark:border-border/70 dark:bg-card/70';
  const practicePageNumber = practiceMetadata?.pageNumber ?? practicePage;
  const practiceTotalPages = practiceMetadata?.totalPages ?? 1;
  const practiceTotalElements = Number(
    practiceMetadata?.totalElements ?? practiceActivities.length
  );
  const hasPracticePrevious = practiceMetadata?.hasPrevious ?? practicePage > 0;
  const hasPracticeNext = practiceMetadata?.hasNext ?? practicePageNumber + 1 < practiceTotalPages;

  return (
    <div className={pageShellClasses}>
      <div className='mb-6 flex items-end justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold'>{lesson?.title}</h1>
          <div className='text-muted-foreground mt-1 text-[15px]'>
            <RichTextRenderer htmlString={lesson?.description ?? ''} />
          </div>
          <div className='text-muted-foreground flex flex-row gap-6 text-sm font-normal'>
            <p className='flex items-center gap-2'>
              <Clock size={14} /> Duration: {lesson?.duration_display}
            </p>
            <p className='flex items-center gap-2'>
              <ListOrdered size={14} />
              {lesson?.lesson_sequence}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-row items-center justify-between gap-4'>
            <p className='text-lg font-semibold'>Skill Content</p>
            <Button
              onClick={openAddLessonContent}
              variant='secondary'
              size='sm'
              className='flex w-fit items-center gap-1'
            >
              <PlusCircle className='h-4 w-4' />
              Add Content
            </Button>
          </div>
          <p className='text-muted-foreground text-sm'>
            Browse and manage the instructional materials, text, files, and other resources included
            in this skill.
          </p>
        </CardHeader>

        <div className='mx-3 space-y-6'>
          {contentItems.length > 0 ? (
            contentItems.map(item => {
              const type = contentTypeData.find(
                (ct: ApiContentType) => ct.uuid === item.content_type_uuid
              );
              const content_type_key = type?.name?.toUpperCase();

              return (
                <div key={item.uuid} className={contentGroupClasses}>
                  <div className='flex flex-col gap-1'>
                    <div className='flex items-center gap-2'>
                      {getContentTypeIcon(content_type_key as ContentType)}
                      <span className='text-foreground text-base font-medium'>{item.title}</span>
                    </div>

                    <div className='text-muted-foreground line-clamp-2 text-sm'>
                      <RichTextRenderer htmlString={item?.description} />
                    </div>

                    {item.content_text && (
                      <div className='text-muted-foreground mt-2 text-sm'>
                        <RichTextRenderer htmlString={item.content_text} maxChars={500} />
                      </div>
                    )}

                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:text-primary/80 text-xs underline'
                      >
                        View File
                      </a>
                    )}
                  </div>

                  {/* Dropdown for content actions */}
                  <div className='self-start'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
                          aria-label='More actions'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEditContent(item)}>
                          <PenLine className='mr-1 h-4 w-4' />
                          Edit Content
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => handleDeleteContent(courseId, item.lesson_uuid, item.uuid)}
                        >
                          <Trash className='mr-1 h-4 w-4' />
                          Delete Content
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='flex items-center gap-4 px-2 py-2'>
              <p className='text-muted-foreground text-sm'>No content items yet.</p>

              <Button
                onClick={openAddLessonContent}
                variant='secondary'
                size='sm'
                className='flex items-center gap-1'
              >
                <PlusCircle className='h-4 w-4' />
                Add Content
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader className='mt-4'>
          <div className='flex flex-row items-center justify-between gap-4'>
            <p className='text-lg font-semibold'>Class Practice Activities</p>
            <Button
              onClick={handleAddPracticeActivity}
              variant='secondary'
              size='sm'
              className='flex w-fit items-center gap-1'
            >
              <PlusCircle className='h-4 w-4' />
              Add Activity
            </Button>
          </div>
          <p className='text-muted-foreground text-sm'>
            Manage reusable class practice activities tied to this skill.
          </p>
        </CardHeader>

        {practiceActivitiesIsFetching ? (
          <CardContent>
            <p className='text-muted-foreground text-sm'>Loading practice activities...</p>
          </CardContent>
        ) : (
          <CardContent>
            {practiceActivities.length > 0 ? (
              <div className='space-y-4'>
                {practiceActivities.map(activity => (
                  <div
                    key={activity.uuid}
                    className='group flex w-full flex-col gap-4 rounded-2xl border border-border bg-card/80 p-4 shadow-lg dark:border-border/70 dark:bg-card/70'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex min-w-0 flex-1 gap-3'>
                        <div className='bg-primary/10 text-primary mt-1 rounded-full p-2'>
                          <ClipboardList className='h-5 w-5' />
                        </div>

                        <div className='min-w-0 space-y-3'>
                          <div className='space-y-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <h3 className='text-foreground text-base font-semibold'>
                                {activity.title}
                              </h3>
                              <Badge variant={activity.active ? 'success' : 'outline'}>
                                {activity.active ? 'Visible' : 'Hidden'}
                              </Badge>
                              <Badge variant='secondary'>
                                {getDisplayLabel(activity.status)}
                              </Badge>
                            </div>
                            <p className='text-muted-foreground line-clamp-3 text-sm'>
                              {activity.instructions}
                            </p>
                          </div>

                          <div className='text-muted-foreground flex flex-wrap gap-3 text-sm'>
                            <span className='flex items-center gap-1'>
                              <ClipboardList className='h-4 w-4' />
                              {getDisplayLabel(activity.activity_type)}
                            </span>
                            <span className='flex items-center gap-1'>
                              <Users className='h-4 w-4' />
                              {getDisplayLabel(activity.grouping)}
                            </span>
                            <span className='flex items-center gap-1'>
                              <Clock className='h-4 w-4' />
                              {activity.estimated_duration ?? 'Duration not set'}
                            </span>
                            <span className='flex items-center gap-1'>
                              <ListOrdered className='h-4 w-4' />
                              Order {activity.display_order ?? '-'}
                            </span>
                          </div>

                          {activity.materials && activity.materials.length > 0 && (
                            <div className='flex flex-wrap gap-2'>
                              {activity.materials.map(material => (
                                <Badge key={material} variant='outline'>
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {activity.expected_output && (
                            <p className='text-muted-foreground text-sm'>
                              <span className='text-foreground font-medium'>Output:</span>{' '}
                              {activity.expected_output}
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='opacity-0 transition-opacity group-hover:opacity-100'
                            aria-label='Practice activity actions'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEditPracticeActivity(activity)}>
                            <PenLine className='mr-1 h-4 w-4' />
                            Edit Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => handleDeletePracticeActivity(activity)}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            Delete Activity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                <EyeOff className='text-muted-foreground mb-2 h-8 w-8' />
                <p className='font-medium'>No practice activities yet</p>
                <p className='mt-1 text-sm'>Add activities learners can complete during class.</p>
              </div>
            )}

            {(practiceTotalPages > 1 || practiceTotalElements > PRACTICE_ACTIVITY_PAGE_SIZE) && (
              <div className='mt-6 flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between'>
                <p className='text-muted-foreground'>
                  Page {practicePageNumber + 1} of {practiceTotalPages} - {practiceTotalElements}{' '}
                  activities
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!hasPracticePrevious}
                    onClick={() => setPracticePage(page => Math.max(page - 1, 0))}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={!hasPracticeNext}
                    onClick={() => setPracticePage(page => page + 1)}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className='mt-4'>
          <div className='flex flex-row items-center justify-between gap-4'>
            <p className='text-lg font-semibold'>Skill Quizzes</p>
            <Button
              onClick={handleAddQuiz}
              variant='secondary'
              size='sm'
              className='flex w-fit items-center gap-1'
            >
              <PlusCircle className='h-4 w-4' />
              Add Quiz
            </Button>
          </div>
          <p className='text-muted-foreground text-sm'>
            Manage and review quizzes assigned to this skill. Use quizzes to assess learners&apos;
            understanding and reinforce key concepts.
          </p>
        </CardHeader>

        {quizIsFetching ? (
          <>Loading...</>
        ) : (
          <CardContent>
            <div className='mt-1 flex w-full flex-col gap-2 space-y-2'>
              {(quizzesData?.data?.content as QuizRecord[] | undefined)
                ?.filter(quiz => quiz.lesson_uuid === lessonId)
                ?.map((quiz, i: number) => (
                  <div key={i} className='group flex w-full cursor-default flex-col gap-4'>
                    <div className={quizCardClasses}>
                      {/* Header */}
                      <div className='flex items-start gap-3'>
                        <div className='flex-shrink-0'>
                          <div className='bg-success/10 text-success rounded-full p-1'>
                            <CheckCircle className='h-5 w-5' />
                          </div>
                        </div>
                        <div className='flex w-full flex-col gap-2'>
                          {/* Quiz Title */}
                          <h3 className='text-foreground text-lg font-semibold'>{quiz.title}</h3>

                          {/* Quiz Description */}
                          <div className='text-muted-foreground text-sm'>
                            <RichTextRenderer
                              htmlString={quiz.description || 'No skill provided'}
                            />
                          </div>

                          {/* Info Bar: Time Limit + Passing Score */}
                          <div className='text-muted-foreground mt-1 flex flex-col text-sm md:flex-row md:gap-4'>
                            <span className='flex items-center gap-1'>
                              <span>📅</span> {quiz.time_limit_display}
                            </span>
                            <span className='flex items-center gap-1'>
                              <span>🏆</span> Passing Score: {quiz.passing_score}
                            </span>
                          </div>

                          {/* Toggle Button */}
                          <div className='mt-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => toggleQuizQuestions(i)}
                            >
                              {expandedQuizIndexes.includes(i)
                                ? 'Hide Questions'
                                : 'Show Questions'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Conditionally Render Questions */}
                      {expandedQuizIndexes.includes(i) && (
                        <div className='mt-3'>
                          {quiz.uuid ? <QuizQuestions quizUuid={quiz.uuid} /> : null}
                        </div>
                      )}

                      {/* Add New Question Button at the bottom */}
                      <div className='mt-4 flex justify-start'>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => handleAddQuestions(quiz)}
                          className='flex items-center gap-1'
                        >
                          <PlusCircle className='h-4 w-4' />
                          Add New Question
                        </Button>
                      </div>
                    </div>

                    {/* Edit and Delete buttons (hidden by default) */}
                    <div className='absolute right-2 items-start opacity-0 transition-opacity group-hover:opacity-100'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='opacity-0 transition-opacity group-hover:opacity-100'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEditQuiz(quiz)}>
                            <PenLine className='mr-1 h-4 w-4' />
                            Edit Quiz
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleAddQuestions(quiz)}>
                            <PlusCircle className='mr-1 h-4 w-4' />
                            Add Questions
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => handleDeleteQuiz(quiz)}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            Delete Quiz
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

              {quizzesData?.data?.content?.length === 0 && (
                <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                  <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
                  <p className='font-medium'>No Quiz created yet</p>
                  <p className='mt-1 text-sm'>
                    Start by creating quizes for your skill under this course.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className='mt-4'>
          <div className='flex flex-row items-center justify-between gap-4'>
            <p className='text-lg font-semibold'>Skill Assignments</p>
            <Button
              onClick={() => {}}
              variant='secondary'
              size='sm'
              className='flex w-fit items-center gap-1'
            >
              <PlusCircle className='h-4 w-4' />
              Add Assignment
            </Button>
          </div>
          <p className='text-muted-foreground text-sm'>
            Manage and review assignments assigned to this skill. Use assignmetns to assess
            learners&apos; understanding and reinforce key concepts.
          </p>
        </CardHeader>

        {assignmentIsFetching ? (
          <>Loading...</>
        ) : (
          <CardContent>
            <div className='mt-1 flex w-full flex-col gap-2 space-y-2'>
              {(assignmentData?.data?.content as AssignmentRecord[] | undefined)
                ?.filter(a => a.lesson_uuid === lessonId)
                ?.map((a, i: number) => (
                  <div key={i} className='group flex w-full cursor-default flex-col gap-4'>
                    <div className={quizCardClasses}>
                      {/* Header */}
                      <div className='flex items-start gap-3'>
                        <div className='flex-shrink-0'>
                          <div className='bg-success/10 text-success rounded-full p-1'>
                            <CheckCircle className='h-5 w-5' />
                          </div>
                        </div>
                        <div className='flex w-full flex-col gap-2'>
                          {/* Quiz Title */}
                          <h3 className='text-foreground text-lg font-semibold'>{a.title}</h3>

                          {/* Quiz Description */}
                          <div className='text-muted-foreground text-sm'>
                            <RichTextRenderer htmlString={a.description || 'No skill provided'} />
                          </div>

                          {/* Info Bar: Time Limit + Passing Score */}
                          <div className='text-muted-foreground mt-1 flex flex-col text-sm md:flex-row md:gap-4'>
                            <span className='flex items-center gap-1'>
                              <span>📅</span> {a.time_limit_display}
                            </span>
                            <span className='flex items-center gap-1'>
                              <span>🏆</span> Passing Score: {a.passing_score ?? 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit and Delete buttons (hidden by default) */}
                    <div className='absolute right-2 items-start opacity-0 transition-opacity group-hover:opacity-100'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='opacity-0 transition-opacity group-hover:opacity-100'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem disabled>
                            <PenLine className='mr-1 h-4 w-4' />
                            Edit Assignment
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => {
                              if (a.uuid) {
                                setEditingQuizId(a.uuid);
                                setOpenDeleteQuizModal(true);
                              }
                            }}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            Delete Assignment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

              {quizzesData?.data?.content?.length === 0 && (
                <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                  <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
                  <p className='font-medium'>No Quiz created yet</p>
                  <p className='mt-1 text-sm'>
                    Start by creating quizes for your skill under this course.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content dialogs */}
      <LessonContentDialog
        courseId={courseId as string}
        lessonId={lessonId as string}
        contentId={(editingContentId as string) || ''}
        isOpen={openContentModal}
        onOpenChange={setOpenContentModal}
        onCancel={() => {
          setEditingContent(null);
          setEditingContentId(null);
          setOpenContentModal(false);
        }}
        initialValues={(editingContent as Partial<ContentFormValues> | null) ?? undefined}
      />

      <DeleteModal
        open={openDeleteContentModal}
        setOpen={setOpenDeleteContentModal}
        title='Delete Skill Content'
        description='Are you sure you want to delete this skill content? This action cannot be undone.'
        onConfirm={confirmDeleteLessonContent}
        isLoading={deleteLessonContent.isPending}
        confirmText='Delete Content'
      />

      <PracticeActivityDialog
        open={openPracticeActivityModal}
        onOpenChange={open => {
          if (open) {
            setOpenPracticeActivityModal(true);
          } else {
            closePracticeActivityModal();
          }
        }}
        activity={editingPracticeActivity}
        isSubmitting={createPracticeActivity.isPending || updatePracticeActivity.isPending}
        onSubmit={handleSavePracticeActivity}
      />

      <DeleteModal
        open={openDeletePracticeActivityModal}
        setOpen={setOpenDeletePracticeActivityModal}
        title='Delete Practice Activity'
        description={`Are you sure you want to delete ${
          editingPracticeActivity?.title ?? 'this practice activity'
        }? This action cannot be undone.`}
        onConfirm={confirmDeletePracticeActivity}
        isLoading={deletePracticeActivity.isPending}
        confirmText='Delete Activity'
      />

      {/* Quiz dialogs */}
      <QuizDialog
        isOpen={openEditQuizModal}
        setOpen={setOpenEditQuizModal}
        courseId={courseId as string}
        editingQuiz={editingQuizId as string}
        initialValues={editingQuizData ?? undefined}
        onCancel={() => {
          setEditingQuizData(null);
          setEditingLessonId(null);
          setEditingQuizId(null);
          setOpenEditQuizModal(false);
        }}
        onSuccess={() => {
          setEditingQuizData(null);
          setEditingLessonId(null);
          setEditingQuizId(null);
          refetchQuizzes();
        }}
      />

      <QuestionDialog
        isOpen={openQuestionModal}
        setOpen={setOpenQuestionModal}
        quizId={editingQuizId as string}
        onCancel={() => {
          setOpenQuestionModal(false);
        }}
      />

      <DeleteModal
        open={openDeleteQuizModal}
        setOpen={setOpenDeleteQuizModal}
        title='Delete Quiz'
        description='Are you sure you want to delete this quiz? This action cannot be undone.'
        onConfirm={confirmDelete}
        isLoading={deleteQuiz.isPending}
        confirmText='Delete Quiz'
      />
    </div>
  );
};

export default LessonDetailsPage;
