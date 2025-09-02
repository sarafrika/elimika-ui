'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  BookOpenCheck,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  ClipboardCheck,
  Clock,
  FileAudio,
  FileIcon,
  FilePlus,
  FileText,
  FileVideo,
  Grip,
  LinkIcon,
  MoreVertical,
  PenLine,
  PlusCircle,
  Trash,
  VideoIcon,
  X,
  Youtube,
} from 'lucide-react';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Control, FieldErrors, SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { addCourseAssessment } from '@/services/client';
import {
  addCourseLessonMutation,
  addLessonContentMutation,
  deleteCourseAssessmentMutation,
  getAllContentTypesOptions,
  getCourseByUuidOptions,
  getCourseLessonsQueryKey,
  getLessonContentQueryKey,
  searchAssessmentsQueryKey,
  updateCourseAssessmentMutation,
  updateCourseLessonMutation,
  updateLessonContentMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useUserProfile } from '../../../../context/profile-context';
import { useRubricsWithCriteriaAndScoring } from '../rubric-management/rubric-chaining';

export const CONTENT_TYPES = {
  AUDIO: 'Audio',
  VIDEO: 'Video',
  TEXT: 'Text',
  LINK: 'Link',
  PDF: 'PDF',
  YOUTUBE: 'YouTube',
  IMAGE: 'Image',
} as const;

const contentItemSchema = z.object({
  contentType: z.enum(['AUDIO', 'VIDEO', 'TEXT', 'LINK', 'PDF', 'YOUTUBE'], {
    required_error: 'Content type is required',
  }),
  contentTypeUuid: z.string(),
  contentCategory: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.any().optional(),
  durationMinutes: z.coerce
    .number()
    .min(0, 'Duration minutes must be positive')
    .max(59, 'Minutes must be less than 60'),
  durationHours: z.coerce.number().min(0, 'Duration hours must be positive'),
  //
  display_order: z.preprocess(
    val => {
      if (val === '' || val === null || val === undefined) return undefined;
      return Number(val);
    },
    z.number({
      required_error: 'This field is required',
      invalid_type_error: 'Must be a valid number',
    })
  ),
});

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Please enter a valid URL'),
});

const lessonFormSchema = z.object({
  number: z.preprocess(
    val => {
      if (val === '' || val === null || val === undefined) return undefined;
      return Number(val);
    },
    z.number({
      required_error: 'This field is required',
      invalid_type_error: 'Must be a valid number',
    })
  ),
  title: z.string().min(1, 'Lesson title is required'),
  // content: z.array(contentItemSchema),
  resources: z.array(resourceSchema),
  description: z
    .string()
    .min(1, 'Lesson description is required')
    .max(1000, 'Description cannot exceed 1000 characters'),
  objectives: z.string().max(500, 'Objectives cannot exceed 500 characters').optional(),
  uuid: z.any(),
  duration_hours: z.any(),
  duration_minutes: z.any(),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

type ContentType = keyof typeof CONTENT_TYPES;

const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case 'VIDEO':
      return <VideoIcon className='h-4 w-4' />;
    case 'TEXT':
      return <FileText className='h-4 w-4' />;
    case 'LINK':
      return <LinkIcon className='h-4 w-4' />;
    case 'PDF':
      return <FileIcon className='h-4 w-4' />;
    case 'YOUTUBE':
      return <VideoIcon className='h-4 w-4' />;
  }
};

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

interface ContentItemFormProps {
  control: Control<LessonFormValues>;
  index: number;
  onRemove: () => void;
  isOnly: boolean;
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className='space-y-2'>
      <div>
        <h3 className='leading-none font-semibold tracking-tight'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      <div className='space-y-4'>{children}</div>
    </div>
  );
}

const ACCEPTED_FILE_TYPES = {
  [CONTENT_TYPES.AUDIO]: '.mp3,.wav,audio/*',
  [CONTENT_TYPES.VIDEO]: '.mp4,.webm,video/*',
  [CONTENT_TYPES.PDF]: '.pdf',
};

const ContentTypeIcons = {
  AUDIO: FileAudio,
  VIDEO: FileVideo,
  TEXT: FileText,
  IMAGE: FileText,
  LINK: LinkIcon,
  PDF: FileIcon,
  YOUTUBE: Youtube,
};

function getContentPlaceholder(contentType: string) {
  switch (contentType) {
    case 'TEXT':
      return 'Enter text content';
    case 'LINK':
      return 'Enter external resource URL';
    case 'YOUTUBE':
      return 'Enter YouTube video URL';
    default:
      return 'Upload file or enter URL';
  }
}

type LessonListProps = {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  courseCategory: any;
  // lessons
  lessons: any;
  lessonItems: any;
  isLoading: boolean;
  onAddLesson: () => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (newLessons: any[]) => void;
  onAddQuiz: (lesson: any) => void
  // lesson contents
  // lessonContentsMap: Map<string, LessonContent[]>
  lessonContentsMap: Map<string, any[]>;
  onAddLessonContent: (lesson: any) => void;
  onEditLessonContent: (item: any) => void;
  onDeleteLessonContent: (courseId: any, lessonId: any, contentId: any) => void;
};

function LessonList({
  courseId,
  courseTitle,
  lessonId,
  courseCategory,
  // lessons
  lessons,
  lessonItems,
  isLoading,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onAddQuiz,
  // lesson contents
  lessonContentsMap,
  onAddLessonContent,
  onEditLessonContent,
  onDeleteLessonContent,
}: LessonListProps) {
  const getTotalDuration = (lesson: any) => {
    const hours = lesson.duration_hours || 0;
    const minutes = lesson.duration_minutes || 0;
    return hours * 60 + minutes;
  };

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const toggleLesson = (id: string) => {
    setExpandedLessonId(prev => (prev === id ? null : id));
  };

  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const contentTypeData = useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);


  const enrichedLessonContentsMap = useMemo(() => {
    const map = new Map();

    lessons?.content.forEach((lesson: any) => {
      const contents = lessonContentsMap.get(lesson.uuid) || [];

      const enriched = contents.map(content => {
        const type = contentTypeData.find(item => item.uuid === content.content_type_uuid);
        return {
          ...content,
          content_type_key: type?.name?.toUpperCase() || undefined,
        };
      });

      map.set(lesson.uuid, enriched);
    });

    return map;
  }, [lessons, lessonContentsMap, contentTypeData]);


  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
        <div className='space-y-1 self-start'>
          <h1 className='text-2xl font-semibold'>{courseTitle}</h1>
          <p className='text-muted-foreground text-sm'>
            You have {lessons?.content?.length}{' '}
            {lessons?.content?.length === 1 ? 'lesson' : 'lessons'} created under this course.
          </p>
        </div>
        <Button onClick={onAddLesson} className='self-start sm:self-end lg:self-center'>
          <PlusCircle className='mr-0.5 h-4 w-4' />
          Add Lesson
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : lessons?.content?.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
          <BookOpen className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No lessons found for this course.</h3>
          <p className='text-muted-foreground mt-2'>You can create a new lesson to get started.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {lessons?.content.map((lesson: any, index: any) => {
            const isExpanded = expandedLessonId === lesson.uuid;

            const enrichedContents = enrichedLessonContentsMap.get(lesson.uuid) || [];


            return (
              <div
                key={lesson?.uuid || index}
                className='group relative flex flex-col gap-4 rounded-lg border p-4 transition-all'
              >
                <div className='flex items-start gap-4'>
                  <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100' />

                  <div className='flex-1 space-y-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex flex-col items-start'>
                        <h3 className='text-lg font-medium'>{lesson.title}</h3>
                        <div className='text-muted-foreground text-sm'>
                          <RichTextRenderer htmlString={lesson?.description} maxChars={150} />
                        </div>
                      </div>

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
                          <DropdownMenuItem onClick={() => onEditLesson(lesson)}>
                            <PenLine className='mr-1 h-4 w-4' />
                            Edit Lesson
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onAddLessonContent(lesson)}>
                            <PlusCircle className='mr-1 h-4 w-4' />
                            Add Lesson Content
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onAddQuiz(lesson)}>
                            <CheckSquare className='mr-1 h-4 w-4' />
                            Add Quiz
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => {
                              if (lesson.uuid) onDeleteLesson(lesson?.uuid);
                            }}
                          >
                            <Trash className='mr-1 h-4 w-4' />
                            Delete Lesson
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-1.5'>
                        <Clock className='h-4 w-4' />
                        <span>{getTotalDuration(lesson)} minutes</span>
                      </div>

                      <div className='flex items-center gap-1.5'>
                        <BookOpen className='h-4 w-4' />
                        <span>
                          {enrichedContents.length || '0'} {enrichedContents.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {(lesson.resources?.length ?? 0) > 0 && (
                        <div className='flex items-center gap-1.5'>
                          <LinkIcon className='h-4 w-4' />
                          <span>
                            {lesson.resources?.length ?? 0}{' '}
                            {(lesson.resources?.length ?? 0) === 1 ? 'resource' : 'resources'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant='link'
                      size='sm'
                      onClick={() => toggleLesson(lesson.uuid)}
                      className='pl-0'
                    >
                      {isExpanded ? 'Hide Contents' : 'View Contents'}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className='mt-2 space-y-2 pl-8'>
                    {enrichedContents.length > 0 ? (
                      enrichedContents
                        .sort((a: any, b: any) => a.display_order - b.display_order)
                        .map((item: any) => (
                          <div
                            key={item.uuid}
                            className='group text-muted-foreground flex cursor-default items-center justify-between gap-4 rounded-md p-4 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'
                          >
                            <div className='flex flex-col gap-1'>
                              <div className='flex items-center gap-2'>
                                {getContentTypeIcon(item.content_type_key)}
                                <span className='font-medium text-gray-900 dark:text-gray-100'>
                                  {item.title}
                                </span>
                              </div>
                              <div className='line-clamp-2 text-xs text-gray-600 dark:text-gray-400'>
                                <RichTextRenderer htmlString={item?.description} maxChars={150} />
                              </div>
                              {item.content_text && (
                                <div className='text-xs text-gray-700 dark:text-gray-300'>
                                  <RichTextRenderer
                                    htmlString={item?.content_text}
                                    maxChars={150}
                                  />
                                </div>
                              )}
                              {item.file_url && (
                                <a
                                  href={item.file_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500'
                                >
                                  View File
                                </a>
                              )}
                            </div>

                            {/* Dropdown for content actions */}
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
                                <DropdownMenuItem onClick={() => onEditLessonContent(item)}>
                                  <PenLine className='mr-1 h-4 w-4' />
                                  Edit Content
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className='text-red-600'
                                  onClick={() =>
                                    onDeleteLessonContent(courseId, item.lesson_uuid, item.uuid)
                                  }
                                >
                                  <Trash className='mr-1 h-4 w-4' />
                                  Delete Content
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))
                    ) : (
                      <div className='flex items-center gap-4 px-2 py-2'>
                        <p className='text-muted-foreground text-sm'>No content items yet.</p>

                        <Button
                          onClick={() => onAddLessonContent(lesson)}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* {lessons?.metatdata?.totalPages >= 1 && (
        <Pagination
          totalPages={lessons?.metatdata.totalPages}
          currentPage={1}
          onPageChange={() => {}}
          // onPageChange={(newPage) => setPage(newPage - 1)}
          hasNext={lessons?.metadata.hasNext}
          hasPrevious={lessons?.metadata.hasPrevious}
          className="mt-6 justify-center"
        />
      )} */}
    </div>
  );
}

interface AppLessonCreationFormProps {
  onCancel: () => void;
  className?: string;
  courseId?: string | number;
  lessonId?: string | number;
  initialValues?: Partial<LessonFormValues>;
  refetch: any;
}

function LessonCreationForm({
  onCancel,
  className,
  courseId,
  refetch,
}: AppLessonCreationFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      number: 0,
      title: '',
      description: '',
      objectives: '',
      duration_hours: '',
      duration_minutes: '',
      resources: [],
    },
  });

  const handleSubmitError = (errors: FieldErrors<LessonFormValues>) => {
    const firstFieldWithError = Object.keys(errors)[0] as keyof LessonFormValues;
    const firstError = errors[firstFieldWithError];

    const message =
      typeof firstError?.message === 'string'
        ? firstError.message
        : 'Please correct the form errors.';

    toast.error(message);
  };

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: 'resources',
  });

  const qc = useQueryClient();

  // QUERY
  const { data: courseDetail } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const course = courseDetail?.data;

  // MUTATION
  const createLessonMutation = useMutation(addCourseLessonMutation());

  const onSubmitCreateLesson: SubmitHandler<LessonFormValues> = values => {
    const createLessonBody = {
      course_uuid: courseId as string,
      title: values?.title,
      description: values?.description as string,
      learning_objectives: values?.objectives as string,
      duration_hours: values.duration_hours,
      duration_minutes: values.duration_minutes,
      duration_display: `${values.duration_hours} ${values.duration_minutes}`,
      status: course?.status as any,
      active: course?.active,
      is_published: course?.is_published,
      created_by: course?.instructor_uuid,
      lesson_number: values?.number,
      lesson_sequence: `Lesson ${values?.number}`,
    };

    createLessonMutation.mutate(
      { body: createLessonBody, path: { courseUuid: courseId as string } },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getCourseLessonsQueryKey({
              path: { courseUuid: courseId as string },
              query: { pageable: { page: 0, size: 100 } },
            }),
          });
          toast.success(data?.message);
          onCancel();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitCreateLesson, handleSubmitError)}
        className={`space-y-8 ${className}`}
      >
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='number'
            render={({ field }) => (
              <FormItem>
                <div className='mb-2 flex flex-col gap-2'>
                  <FormLabel>Lesson Number #</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter an order number for your lesson' {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter lesson title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Description</FormLabel>
                <FormControl>
                  <SimpleEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='objectives'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Objectives</FormLabel>
                <FormControl>
                  <SimpleEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Hours */}
          <FormField
            name='duration_hours'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input type='number' min={0} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Minutes */}
          <FormField
            name='duration_minutes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type='number' min={0} max={59} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Resources</h3>
          {resourceFields.map((field, index) => (
            <div key={field.id} className='space-y-4 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Resource {index + 1}</h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => removeResource(index)}
                >
                  <X className='h-4 w-4 text-red-500' />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter resource title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type='url' placeholder='Enter resource URL' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type='button'
            variant='outline'
            // onClick={() => appendResource({ title: "", url: "" })}
            onClick={() => toast.message('Cannot add resource at the moment')}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Resource
          </Button>
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' className='w-[120px]'>
            {createLessonMutation.isPending ? <Spinner /> : 'Create Lesson'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LessonEditingForm({
  onCancel,
  className,
  courseId,
  initialValues,
  lessonId,
}: AppLessonCreationFormProps) {
  const normalizedInitialValues = { ...initialValues };

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      number: 0,
      title: '',
      description: '',
      resources: [],
      ...normalizedInitialValues,
    },
  });

  const handleSubmitError = (errors: FieldErrors<LessonFormValues>) => {
    const firstFieldWithError = Object.keys(errors)[0] as keyof LessonFormValues;
    const firstError = errors[firstFieldWithError];

    const message =
      typeof firstError?.message === 'string'
        ? firstError.message
        : 'Please correct the form errors.';

    toast.error(message);
  };

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: 'resources',
  });

  const qc = useQueryClient();

  const { data: courseData } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
  });

  const updateLessonMutation = useMutation(updateCourseLessonMutation());

  const onSubmitEditLesson = (values: LessonFormValues) => {
    const updateLessonBody = {
      course_uuid: courseId as string,
      title: values?.title,
      description: values?.description ?? '',
      learning_objectives: values.description,
      duration_hours: values.duration_hours,
      duration_minutes: values.duration_minutes,
      duration_display: `${values.duration_hours} ${values.duration_minutes}`,
      status: courseData?.data?.status,
      active: courseData?.data?.active,
      is_published: courseData?.data?.is_published,
      created_by: courseData?.data?.instructor_uuid,
      lesson_number: values?.number,
      lesson_sequence: `Lesson ${values?.number}`,
    };

    updateLessonMutation.mutate(
      {
        body: updateLessonBody as any,
        path: {
          courseUuid: courseId as string,
          lessonUuid: lessonId as string,
        },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getCourseLessonsQueryKey({
              path: { courseUuid: courseId as string },
              query: { pageable: {} },
            }),
          });

          toast.success(data?.message);
          onCancel();

          // const updateLessonContentBody = {
          //   lesson_uuid: lessonId as string,
          //   content_type_uuid: values.content[0]?.contentTypeUuid as string,
          //   title: values?.title,
          //   description: values?.description ?? '',
          //   content_text: values.content[0]?.value || '',
          //   file_url: '',
          //   file_size_bytes: 157200,
          //   mime_type: values.content[0]?.value || '',
          //   display_order: values?.number,
          //   is_required: true,
          //   created_by: 'instructor@sarafrika.com',
          //   updated_by: 'instructor@sarafrika.com',
          //   file_size_display: '',
          // }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitEditLesson, handleSubmitError)}
        className={`space-y-8 ${className}`}
      >
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='number'
            render={({ field }) => (
              <FormItem>
                <div className='mb-2 flex flex-col gap-2'>
                  <FormLabel>Lesson Number #</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter an order number for your lesson' {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter lesson title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <SimpleEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Hours */}
          <FormField
            name='duration_hours'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input type='number' min={0} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Minutes */}
          <FormField
            name='duration_minutes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type='number' min={0} max={59} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Resources</h3>
          {resourceFields.map((field, index) => (
            <div key={field.id} className='space-y-4 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Resource {index + 1}</h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => removeResource(index)}
                >
                  <X className='h-4 w-4 text-red-500' />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter resource title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type='url' placeholder='Enter resource URL' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type='button'
            variant='outline'
            // onClick={() => appendResource({ title: "", url: "" })}
            onClick={() => toast.message('Cannot add resource at the moment')}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Resource
          </Button>
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' className='w-[120px]'>
            {updateLessonMutation.isPending ? <Spinner /> : 'Edit Lesson'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface LessonContentFormProps {
  onCancel: () => void;
  className?: string;
  courseId?: string | number;
  lessonId?: string | number;
  contentId?: string | number;
  initialValues?: Partial<ContentFormValues>;
}

const lessonContentSchema = z.object({
  content_type: z.enum(['AUDIO', 'VIDEO', 'TEXT', 'LINK', 'PDF', 'YOUTUBE'], {
    required_error: 'Content type is required',
  }),
  content_type_uuid: z.string().min(1, 'Content type UUID is required'),
  content_category: z.string().min(1, 'Content category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.any().optional(),
  value: z.any().optional(),
  // duration_minutes: z.coerce
  //   .number()
  //   .min(0, 'Duration minutes must be positive')
  //   .max(59, 'Minutes must be less than 60'),
  // duration_hours: z.coerce.number().min(0, 'Duration hours must be positive'),
  // estimated_duration: z.coerce.number().min(0, 'Estimated duration must be positive'),
  display_order: z.coerce.number().min(0, 'Duration hours must be positive'),
  uuid: z.any().optional(),
});

export type ContentFormValues = z.infer<typeof lessonContentSchema>;

function LessonContentForm({
  onCancel,
  className,
  courseId,
  contentId,
  lessonId,
  initialValues,
}: LessonContentFormProps) {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(lessonContentSchema),
    defaultValues: {
      content_type: 'TEXT',
      content_type_uuid: '',
      content_category: '',
      title: '',
      description: '',
      value: '',
      // duration_minutes: 0,
      // duration_hours: 0,
      // estimated_duration: 0,
      display_order: 0,
      ...initialValues, // ✅ prefill if editing
    },
  });

  const isEditMode = !!contentId;

  const { setValue, watch } = form;
  const contentTypeUuid = watch('content_type_uuid');

  // GET COURSE CONTENT TYPES
  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const contentTypeData = React.useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);

  const selectedTypeObj = React.useMemo(() => {
    if (!contentTypeUuid) return undefined;
    return contentTypeData.find((item: any) => item.uuid === contentTypeUuid);
  }, [contentTypeUuid, contentTypeData]);

  const selectedTypeKey = selectedTypeObj?.name?.toUpperCase() || undefined;

  const handleSubmitError = (errors: FieldErrors<ContentFormValues>) => {
    const firstFieldWithError = Object.keys(errors)[0] as keyof ContentFormValues;
    const firstError = errors[firstFieldWithError];
    const message =
      typeof firstError?.message === 'string'
        ? firstError.message
        : 'Please correct the form errors.';
    toast.error(message);
  };

  const qc = useQueryClient();

  const createLessonContent = useMutation(addLessonContentMutation());
  const updateLessonContent = useMutation(updateLessonContentMutation());

  const onSubmit = async (data: ContentFormValues) => {
    const contentBody = {
      lesson_uuid: lessonId as string,
      content_type_uuid: data?.content_type_uuid,
      title: data?.title,
      description: data?.description,
      content_text: data?.value,
      file_url: '',
      // file_size_bytes: 157200,
      // mime_type: '',
      display_order: data?.display_order,
      is_required: true,
      created_by: 'instructor@sarafrika.com',
      updated_by: 'instructor@sarafrika.com',
      // file_size_display: '',
      content_category: data.content_category,
      // is_downloadable: true,
      // estimated_duration: `${values.content[0]?.durationHours} hrs ${values.content[0]?.durationMinutes} minutes`,
    };

    try {
      if (isEditMode) {
        updateLessonContent.mutate(
          {
            body: contentBody as any,
            path: {
              courseUuid: courseId as string,
              lessonUuid: lessonId as string,
              contentUuid: contentId as string,
            },
          },
          {
            onSuccess: data => {
              qc.invalidateQueries({
                queryKey: getLessonContentQueryKey({
                  path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
                }),
              });
              toast.success(data?.message);
              onCancel();
            },
          }
        );
      } else {
        createLessonContent.mutate(
          {
            body: contentBody as any,
            path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
          },
          {
            onSuccess: data => {
              qc.invalidateQueries({
                queryKey: getLessonContentQueryKey({
                  path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
                }),
              });
              toast.success(data?.message);
              onCancel();
            },
          }
        );
      }
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    }
  };

  const isPending = createLessonContent.isPending || updateLessonContent.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleSubmitError)}
        className={`space-y-8 ${className ?? ''}`}
      >
        <div className='flex flex-col gap-3 space-y-4'>
          <FormField
            control={form.control}
            name='display_order'
            render={({ field }) => (
              <FormItem>
                <div className='mb-2 flex flex-col gap-2'>
                  <FormLabel>Display Order #</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter an display number for your content' {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter content title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    placeholder='Enter a brief description'
                    rows={4}
                    className='border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='w-full'>
            <FormField
              name='content_type_uuid'
              render={({ field }) => (
                <FormItem className='col-span-2'>
                  <FormLabel>Content Type</FormLabel>
                  <Select
                    onValueChange={val => {
                      try {
                        const parsed = JSON.parse(val);
                        setValue('content_type', parsed.name.toUpperCase());
                        setValue('content_type_uuid', parsed.uuid);
                        setValue('content_category', parsed.upload_category);
                      } catch {
                        setValue('content_type', 'TEXT');
                        setValue('content_type_uuid', '');
                        setValue('content_category', '');
                      }
                    }}
                    value={contentTypeUuid ? JSON.stringify(selectedTypeObj) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select content type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contentTypeData.map((value: any) => {
                        const Icon =
                          ContentTypeIcons[
                          value.name.toUpperCase() as keyof typeof ContentTypeIcons
                          ];
                        return (
                          <SelectItem key={value.uuid} value={JSON.stringify(value)}>
                            <div className='flex items-center gap-2'>
                              {Icon && <Icon className='h-4 w-4' />}
                              <span>{value.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Content or File Upload + URL */}
          {selectedTypeKey === 'TEXT' ? (
            <FormField
              name='value'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <SimpleEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <>
              {['PDF', 'AUDIO', 'IMAGE', 'VIDEO'].includes(selectedTypeKey || '') && (
                <FormField
                  name='value'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Upload</FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          accept={
                            ACCEPTED_FILE_TYPES[selectedTypeKey as keyof typeof ACCEPTED_FILE_TYPES]
                          }
                          onChange={e => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormDescription>Upload a file or provide a URL below</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                name='value'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {['VIDEO', 'AUDIO', 'PDF'].includes(selectedTypeKey || '')
                        ? 'Or External URL'
                        : 'URL'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='url'
                        placeholder={getContentPlaceholder(selectedTypeKey ?? '')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Duration Hours */}
          {/* <FormField
            name="duration_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          {/* Duration Minutes */}
          {/* <FormField
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={59} step={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>

        {/* Form Buttons */}
        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' className='min-w-fit px-3' disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Lesson Content'
            ) : (
              'Create Lesson Content'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AssessmentCreationFormProps {
  courseId: string | number;
  assessmentId?: string | number;
  onCancel: () => void;
  className?: string;
  initialValues?: any;
}

const assessmentFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assessment_type: z.string().optional(),
  weight_percentage: z.any().optional(),
  questions: z.array(
    z.object({
      prompt: z.string().min(1),
      options: z
        .array(
          z.object({
            text: z.string().min(1),
            isCorrect: z.boolean().optional(),
          })
        )
        .optional(),
    })
  ),
  resources: z.array(
    z.object({
      title: z.string().optional(),
      url: z.string().url().optional(),
    })
  ),
});

function AssessmentCreationForm({
  courseId,
  onCancel,
  className,
  assessmentId,
  initialValues,
}: AssessmentCreationFormProps) {
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: initialValues ?? {
      title: '',
      description: '',
      assessment_type: '',
      weight_percentage: '',
      questions: [{ prompt: '' }],
      // questions: [{ prompt: "", options: [{ text: "", isCorrect: false }] }],
      resources: [],
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: 'resources',
  });

  const queryClient = useQueryClient();

  // CREATE ASSESSMENT MUTATION
  const createAssessmentMutation = useMutation({
    mutationKey: ['create-assessment'],
    mutationFn: ({ uuid, body }: { uuid: string; body: any }) =>
      addCourseAssessment({ body, path: { courseUuid: uuid } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const onSubmit = async (values: AssessmentFormValues) => {
    createAssessmentMutation.mutate(
      {
        uuid: courseId as string,
        body: {
          course_uuid: courseId,
          assessment_type: values.assessment_type,
          title: values.title,
          description: values.description,
          weight_percentage: values.weight_percentage,
          rubric_uuid: '',
          is_required: true,
          created_by: 'instructor@sarafrika.com',
          updated_by: 'instructor@sarafrika.com',
          assessment_category: 'Participation Component',
          weight_display: `${values.weight_percentage}% of final grade`,
          is_major_assessment: false,
          contribution_level: 'Standard Contribution',
        },
      },
      {
        onSuccess: data => {
          toast.success(data?.data?.message || 'Assessment created successfully!');
          queryClient.invalidateQueries({
            queryKey: searchAssessmentsQueryKey({
              query: {
                searchParams: { courseUuid: courseId },
                pageable: { page: 0, size: 100 },
              },
            }),
          });
          onCancel();
        },
      }
    );
  };

  // UPDATE ASSESSMENT MUTATION
  const updateAssessment = useMutation(updateCourseAssessmentMutation());
  const handleSubmitUpdate = async () => {
    const values = form.getValues();
    try {
      await updateAssessment.mutateAsync(
        {
          path: {
            courseUuid: courseId as string,
            assessmentUuid: assessmentId as string,
          },
          body: {
            course_uuid: courseId as string,
            assessment_type: values.assessment_type as string,
            title: values.title,
            description: values.description,
            weight_percentage: values.weight_percentage,
            rubric_uuid: '',
            is_required: true,
            created_by: 'instructor@sarafrika.com',
            updated_by: 'instructor@sarafrika.com',
            assessment_category: 'Participation Component',
            weight_display: `${values.weight_percentage}% of final grade`,
            is_major_assessment: false,
            contribution_level: 'Standard Contribution',
          },
        },
        {
          onSuccess: data => {
            toast.success(data?.message || 'Assessment updated successfully!');
            queryClient.invalidateQueries({
              queryKey: searchAssessmentsQueryKey({
                query: {
                  searchParams: { courseUuid: courseId },
                  pageable: { page: 0, size: 100 },
                },
              }),
            });
            onCancel();
          },
          onError: error => {
            toast.error(error?.message || 'Failed to update assessment.');
          },
        }
      );
    } catch (err) { }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(assessmentId ? handleSubmitUpdate : onSubmit)}
        className={`space-y-8 ${className}`}
      >
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter assessment title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Optional: brief description of the assessment (e.g., Midterm exam covering units 1–5)'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-4'>
            <FormField
              control={form.control}
              name='assessment_type'
              render={({ field }) => (
                <FormItem className='w-full sm:w-auto'>
                  <FormLabel>Assessment Type</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. attendance, test' {...field} className='w-full' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='weight_percentage'
              render={({ field }) => (
                <FormItem className='w-full sm:w-auto'>
                  <FormLabel>Weight Percentage</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. 20 for 20%' {...field} className='w-full' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <FormSection title='Questions' description='Add one or more questions to this assessment'>
            {questionFields.map((field, index) => (
              <div key={field.id} className='flex items-center gap-2'>
                <FormField
                  control={form.control}
                  name={`questions.${index}.prompt`}
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Question {index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter question prompt' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => removeQuestion(index)}
                  disabled={questionFields.length === 1}
                >
                  <X className='h-4 w-4 text-red-600' />
                </Button>
              </div>
            ))}

            <Button type='button' variant='outline' onClick={() => appendQuestion({ prompt: '' })}>
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Question
            </Button>
          </FormSection>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-medium'>Resources</h3>

          {resourceFields.map((field, index) => (
            <div key={field.id} className='space-y-4 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Resource {index + 1}</h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => removeResource(index)}
                >
                  <X className='h-4 w-4 text-red-500' />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter resource title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type='url' placeholder='https://...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type='button'
            variant='outline'
            onClick={() => toast.message('Cannot add resource at the moment')}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Resource
          </Button>
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' className='min-w-[154px]'>
            {assessmentId ? (
              updateAssessment.isPending ? (
                <Spinner />
              ) : (
                'Update Assessment'
              )
            ) : createAssessmentMutation.isPending ? (
              <Spinner />
            ) : (
              'Create Assessment'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

type AssessmentListProps = {
  courseTitle: string;
  assessments: any;
  lessonItems: any;
  isLoading: boolean;
  courseId?: string;
  onAddAssessment: () => void;
};

const rubricSelectSchema = z.object({
  rubric_uuid: z.string().min(1, 'Rubric is required'),
});

interface RubricSelectFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  className?: string;
}

function RubricSelectForm({
  onCancel,
  onSuccess,
  className,
}: RubricSelectFormProps) {
  const form = useForm({
    resolver: zodResolver(rubricSelectSchema),
    defaultValues: {
      rubric_uuid: '',
    },
  });

  const user = useUserProfile();
  const qc = useQueryClient()

  const {
    rubricsWithDetails,
    isLoading: rubricDataIsLoading,
    isFetched: rubricsDataIsFetched,
  } = useRubricsWithCriteriaAndScoring(user?.instructor?.uuid);

  const memoizedRubricsWithDetails = useMemo(() => {
    return rubricsWithDetails || [];
  }, [rubricsWithDetails]);

  const selectedRubricUuid = form.watch('rubric_uuid');
  const [expandedRubricUuid, setExpandedRubricUuid] = useState<string | null>(null);

  const onSubmit = (values: any) => {
    // console.log(values, 'submitting values');
    if (onSuccess) onSuccess();
  };

  const toggleExpand = (uuid: string) => {
    setExpandedRubricUuid(prev => (prev === uuid ? null : uuid));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={clsx('space-y-8', className)}>
        <FormField
          control={form.control}
          name="rubric_uuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select a Rubric</FormLabel>
              {rubricDataIsLoading && <p>Loading rubrics...</p>}
              {rubricsDataIsFetched && memoizedRubricsWithDetails.length === 0 && (
                <p>No rubrics found.</p>
              )}

              <div className="grid gap-4">
                {memoizedRubricsWithDetails.map(({ rubric, criteria }) => {
                  const isSelected = field.value === rubric.uuid;
                  const isExpanded = expandedRubricUuid === rubric.uuid;

                  return (
                    <div
                      key={rubric.uuid}
                      className={clsx(
                        'border rounded-lg p-4 transition cursor-pointer',
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div
                        className="flex justify-between items-start"
                        onClick={() => field.onChange(rubric.uuid)}
                      >
                        <div>
                          <div className="text-lg font-semibold">{rubric.title}</div>
                          <div className="text-sm text-muted-foreground">{rubric.description}</div>
                        </div>
                        {isSelected && (
                          <span className="text-sm font-medium text-blue-600">Selected</span>
                        )}
                      </div>

                      <div className="flex flfex-row items-center gap-6 mt-2 text-sm text-gray-600">
                        <p><strong>Type:</strong> {rubric.rubric_type}</p>
                        <p><strong>Total Weight:</strong> {rubric.total_weight}{rubric.weight_unit === 'percentage' ? '%' : ''}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(rubric.uuid)}
                        className="mt-3 flex items-center gap-1 text-blue-600 text-sm"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {isExpanded ? 'Hide Assessment Criteria' : 'Show Assessment Criteria & Scoring'}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 text-sm">
                          {criteria.length === 0 && <p>No criteria available.</p>}

                          {criteria.map((criterion) => (
                            <div key={criterion.uuid} className="border border-gray-200 rounded-md p-3 bg-white">
                              <div className="flex flex-row gap-2 items-center font-medium text-gray-800">
                                <CircleCheckBig size={14} color='green' /> {criterion.component_name}
                              </div>
                              <div className="text-sm text-muted-foreground mb-1">{criterion.description}</div>


                              {/* Scoring levels */}
                              {criterion.scoring?.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  <div className="text-xs font-medium text-gray-700">Scoring Levels:</div>
                                  {criterion.scoring.map((score: any) => (
                                    <div
                                      key={score.uuid}
                                      className="border-l-4 border-blue-200 pl-3 py-1 bg-gray-50 rounded"
                                    >
                                      <div className="text-sm font-semibold text-gray-800">
                                        {score.performance_expectation}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{score.description}</div>
                                      <div className="text-xs text-gray-600">
                                        <p><strong>Score Range:</strong> {score.score_range}</p>
                                        <p><strong>Feedback Category:</strong> {score.feedback_category}</p>
                                        <p><strong>Passing:</strong> {score.is_passing_level ? 'Yes' : 'No'}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1">No scoring levels defined.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[180px]" disabled={!selectedRubricUuid}>
            Assign Rubric
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AssessmentList({
  courseTitle,
  assessments,
  lessonItems,
  isLoading,
  courseId,
  onAddAssessment,
}: AssessmentListProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  const getTotalDuration = (lesson: any) => {
    const hours = lesson.duration_hours || 0;
    const minutes = lesson.duration_minutes || 0;
    return hours * 60 + minutes;
  };

  const handleEditAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const handleAddRubrics = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsRubricModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedAssessment(null);
  };

  // DELETE ASSESSMENT MUTATION
  const queryClient = useQueryClient();
  const deleteAssessment = useMutation(deleteCourseAssessmentMutation());
  const handleDelete = (assessmentUuid: string) => {
    if (!assessmentUuid) return;

    deleteAssessment.mutate(
      {
        path: { courseUuid: courseId as string, assessmentUuid },
      },
      {
        onSuccess: () => {
          toast.success('Assessment deleted successfully');
          queryClient.invalidateQueries({
            queryKey: searchAssessmentsQueryKey({
              query: {
                searchParams: { courseUuid: courseId },
                pageable: { page: 0, size: 100 },
              },
            }),
          });
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to delete assessment');
        },
      }
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold'>{courseTitle}</h1>
          <p className='text-muted-foreground text-sm'>
            You have {assessments?.content?.length}{' '}
            {assessments?.content?.length === 1 ? 'assessment' : 'assessments'} created under this
            course.
          </p>
        </div>
        <Button onClick={onAddAssessment} className='self-start sm:self-end lg:self-center'>
          <PlusCircle className='h-4 w-4' />
          Add Assessment
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : assessments?.content?.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
          <BookOpenCheck className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No assessments found for this course.</h3>
          <p className='text-muted-foreground mt-2'>
            You can create new assessments under lessons.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {assessments?.content.map((assessment: any, index: any) => (
            <div
              key={assessment?.uuid || index}
              className='group hover:bg-accent/50 relative flex items-start gap-4 rounded-lg border p-4 transition-all'
            >
              <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100' />

              <div className='flex-1 space-y-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex flex-col items-start'>
                    <h3 className='text-lg font-medium'>{assessment.title}</h3>
                    <div className='text-muted-foreground text-sm'>
                      <RichTextRenderer htmlString={assessment?.description} maxChars={400} />
                    </div>
                  </div>
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
                      <DropdownMenuItem onClick={() => handleEditAssessment(assessment)}>
                        <ClipboardCheck className='mr-2 h-4 w-4' />
                        Edit Assessment
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleAddRubrics(assessment)}>
                        <FilePlus className='mr-2 h-4 w-4' />
                        Add Rubrics
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-red-600'
                        onClick={() => {
                          if (assessment.uuid) {
                            handleDelete(assessment?.uuid as string);
                          }
                        }}
                      >
                        <Trash className='mr-2 h-4 w-4' />
                        Delete Assessment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='h-4 w-4' />
                    <span>{getTotalDuration(assessment)} minutes</span>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <BookOpen className='h-4 w-4' />
                    <span>
                      {lessonItems?.length || '0'} {lessonItems?.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={open => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <DialogContent className='flex max-w-6xl flex-col p-0'>
          <DialogHeader className='border-b px-6 py-4'>
            <DialogTitle className='text-xl'>Edit Assessment</DialogTitle>
            <DialogDescription className='text-muted-foreground text-sm'>
              Edit assessment message here
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='h-[calc(90vh-16rem)]'>
            {selectedAssessment && (
              <AssessmentCreationForm
                courseId={selectedAssessment.course_uuid}
                assessmentId={selectedAssessment.uuid}
                initialValues={selectedAssessment}
                className='px-6 pb-6'
                onCancel={handleCancel}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <RubricSelectDialog
        isOpen={isRubricModalOpen}
        onOpenChange={() => setIsRubricModalOpen(!isRubricModalOpen)}
        courseId={selectedAssessment?.course_uuid}
        lessonId={selectedAssessment?.uuid}
        onCancel={() => { }}
      />
    </div>
  );
}

// ADD LESSON
interface AddLessonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | number;
  lessonId?: string | number;
  contentId?: string | number;
  initialValues?: Partial<LessonFormValues>;
  refetch?: () => any;
  onSuccess?: (data: any) => void;
  onCancel: () => any;
}

function LessonDialog({
  isOpen,
  onOpenChange,
  courseId,
  lessonId,
  refetch,
  onCancel,
}: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Create New Lesson</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Fill in the lesson details below. You&apos;ll be able to add a quiz after you&apos;ve
            created the lesson.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <LessonCreationForm
            onCancel={onCancel}
            className='px-6 pb-6'
            courseId={courseId}
            lessonId={lessonId}
            refetch={refetch}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function LessonContentDialog({
  isOpen,
  onOpenChange,
  courseId,
  lessonId,
  contentId,
  onCancel,
  initialValues,
}: AddLessonDialogProps) {
  const isEditMode = !!contentId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {isEditMode ? 'Edit Lesson Content' : 'Create New Lesson Content'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {isEditMode
              ? 'Update the details of your lesson content below.'
              : 'Fill in the contents of your lesson below.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-4rem)] sm:h-[calc(90vh-8rem)]'>
          <LessonContentForm
            onCancel={onCancel}
            className='px-6 pb-6'
            courseId={courseId}
            lessonId={lessonId}
            contentId={contentId}
            initialValues={initialValues}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditLessonDialog({
  isOpen,
  onOpenChange,
  courseId,
  initialValues,
  lessonId,
  refetch,
  onSuccess,
}: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Edit Lesson</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Fill in the lesson details below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <LessonEditingForm
            className='px-6 pb-6'
            courseId={courseId}
            lessonId={lessonId}
            initialValues={initialValues}
            onCancel={() => onOpenChange(false)}
            refetch={refetch}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentDialog({ isOpen, onOpenChange, courseId }: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Add Assessment</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Create a new assessment by providing its title, description, questions, and any helpful
            resources
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <AssessmentCreationForm
            onCancel={() => onOpenChange(false)}
            className='px-6 pb-6'
            courseId={courseId}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function RubricSelectDialog({ isOpen, onOpenChange }: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex min-w-[500px] flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Add/Assign Rubric</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Select a rubric for grading this assessment.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <RubricSelectForm
            onCancel={() => onOpenChange(false)}
            className='px-6 pb-6'
            onSuccess={() => { }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export {
  AssessmentDialog,
  AssessmentList,
  EditLessonDialog,
  LessonContentDialog,
  LessonDialog,
  LessonList
};

