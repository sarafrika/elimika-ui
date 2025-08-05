'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
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
  Youtube
} from 'lucide-react';
import React, { ReactNode, useEffect, useState } from 'react';
import {
  Control,
  FieldErrors,
  SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { addCourseAssessment, addCourseLesson, addLessonContent, getCourseByUuid, updateCourseLesson, updateLessonContent } from '@/services/client';
import {
  addCourseLessonQueryKey,
  deleteCourseAssessmentMutation,
  getAllContentTypesOptions,
  getCourseLessonsQueryKey,
  searchAssessmentsQueryKey,
  updateCourseAssessmentMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  content: z.array(contentItemSchema),
  resources: z.array(resourceSchema),
  description: z.string().min(1, 'Lesson description is required').max(1000, "Description cannot exceed 1000 characters"),
  objectives: z.string().max(500, "Objectives cannot exceed 500 characters").optional(),
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
  [CONTENT_TYPES.VIDEO]: '.mp4,.webm,video/!*',
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

// const ContentTypeLabels = {
//   [CONTENT_TYPES.AUDIO]: "Audio",
//   [CONTENT_TYPES.VIDEO]: "Video",
//   [CONTENT_TYPES.TEXT]: "Text",
//   [CONTENT_TYPES.LINK]: "Link",
//   [CONTENT_TYPES.PDF]: "PDF",
//   [CONTENT_TYPES.YOUTUBE]: "YouTube",
// }

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

function ContentItemForm({ control, index, onRemove, isOnly }: ContentItemFormProps) {
  const contentTypeUuid = useWatch({
    control,
    name: `content.${index}.contentType`,
  });
  const { setValue } = useFormContext();

  // GET COURSE CONTENT TYPES
  const { data: contentTypeList } = useQuery(getAllContentTypesOptions({ query: {} }));

  const contentTypeData = React.useMemo(() => {
    const respdata = contentTypeList!.data! as { content: any[] }
    return respdata?.content ?? {};
  }, [contentTypeList]);

  // Lookup type key from uuid (e.g., "VIDEO")
  const selectedTypeKey = React.useMemo(() => {
    if (!contentTypeUuid) return undefined;
    const match = Object.entries(contentTypeData).find(([_, val]: [string, any]) => {
      return val?.uuid === contentTypeUuid;
    });
    return match?.[0];
  }, [contentTypeUuid, contentTypeData]);

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <h4 className='font-medium'>Content Item {index + 1}</h4>
        {!isOnly && (
          <Button type='button' variant='ghost' size='sm' onClick={onRemove}>
            <X className='h-4 w-4 text-red-500' />
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <FormField
          control={control}
          name={`content.${index}.contentTypeUuid`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select
                onValueChange={val => {
                  const parsed = JSON.parse(val);
                  setValue(`content.${index}.contentType`, parsed.name.toUpperCase());
                  setValue(`content.${index}.contentTypeUuid`, parsed.uuid);
                  setValue(`content.${index}.contentCategory`, parsed.upload_category);
                }}
                value={
                  contentTypeUuid
                    ? JSON.stringify(
                      Object.values(contentTypeData).find((v: any) => v.uuid === contentTypeUuid)
                    )
                    : ''
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select content type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(contentTypeData).map(([key, value]) => {
                    const Icon =
                      // @ts-ignore
                      ContentTypeIcons[value?.name?.toUpperCase() as keyof typeof ContentTypeIcons];

                    return (
                      // @ts-ignore
                      <SelectItem key={value.uuid} value={JSON.stringify(value)}>
                        <div className='flex items-center gap-2'>
                          {Icon && <Icon className='h-4 w-4' />}
                          {/*  @ts-ignore */}
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

        <FormField
          control={control}
          name={`content.${index}.contentTypeUuid`}
          render={({ field }) => <input type='hidden' {...field} />}
        ></FormField>

        <FormField
          control={control}
          name={`content.${index}.title`}
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
      </div>

      {contentTypeUuid === 'TEXT' ? (
        <FormField
          control={control}
          name={`content.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <SimpleEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          {['PDF', 'AUDIO', 'IMAGE', 'VIDEO'].includes(contentTypeUuid || '') && (
            <FormField
              control={control}
              name={`content.${index}.value`}
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
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name={`content.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {['VIDEO', 'AUDIO', 'PDF'].includes(selectedTypeKey || '')
                    ? 'Or External URL'
                    : 'URL'}
                </FormLabel>
                <FormControl>
                  {/* @ts-ignore */}
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

      <FormField
        control={control}
        name={`content.${index}.durationHours`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (hours)</FormLabel>
            <FormControl>
              <Input type='number' min='0' step='0.5' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`content.${index}.durationMinutes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (minutes)</FormLabel>
            <FormControl>
              <Input type='number' min='0' step='0.5' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

type LessonListProps = {
  courseTitle: string;
  courseCategory: any;
  // lessons: TLesson[]
  lessons: any;
  lessonItems: any;
  isLoading: boolean;
  onAddLesson: () => void;
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (newLessons: any[]) => void;
  onAddAssessment: (lesson: any) => void;
  onAddRubrics: (lesson: any) => void
};

function LessonList({
  courseTitle,
  courseCategory,
  lessons,
  lessonItems,
  isLoading,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onAddAssessment,
  onAddRubrics,
}: LessonListProps) {
  const getTotalDuration = (lesson: any) => {
    const hours = lesson.duration_hours || 0;
    const minutes = lesson.duration_minutes || 0;
    return hours * 60 + minutes;
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold'>{courseTitle}</h1>
          <p className='text-muted-foreground text-sm'>
            You have {lessons?.content?.length}{' '}
            {lessons?.content?.length === 1 ? 'lesson' : 'lessons'} created under this course.
          </p>
        </div>
        <Button onClick={onAddLesson} className='self-start sm:self-end lg:self-center'>
          <PlusCircle className='mr-2 h-4 w-4' />
          Add Lesson
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : lessons?.content?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <BookOpen className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No lessons found for this course.</h3>
          <p className='text-muted-foreground mt-2'>You can create a new lesson to get started.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {lessons?.content.map((lesson: any, index: any) => (
            <div
              key={lesson?.uuid || index}
              className='group hover:bg-accent/50 relative flex items-start gap-4 rounded-lg border p-4 transition-all'
            >
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

                      <DropdownMenuItem onClick={() => onAddAssessment(lesson)}>
                        <ClipboardCheck className='mr-1 h-4 w-4' />
                        Add Assessment
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onAddRubrics(lesson)}>
                        <FilePlus className='mr-1 h-4 w-4' />
                        Add Rubrics
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-red-600'
                        onClick={() => {
                          if (lesson.uuid) {
                            onDeleteLesson(lesson?.uuid as string);
                          }
                        }}
                      >
                        <Trash className='mr-1 h-4 w-4' />
                        Delete Lesson
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {/* {lesson.content.map((item: any, i: number) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1.5">
                    {getContentTypeIcon(item.contentType as ContentType)}
                    <span>{item.title}</span>
                  </Badge>
                ))} */}

                  {courseCategory?.map((i: any) => (
                    <Badge key={i} variant='secondary' className='flex items-center gap-1.5'>
                      {getContentTypeIcon(i?.contentType as ContentType)}
                      <span>{i}</span>
                    </Badge>
                  ))}
                </div>

                <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='h-4 w-4' />
                    <span>{getTotalDuration(lesson)} minutes</span>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <BookOpen className='h-4 w-4' />
                    <span>
                      {lessonItems?.length || '0'} {lessonItems?.length === 1 ? 'item' : 'items'}
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
              </div>
            </div>
          ))}
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
  editSuccessRespones?: (data: any) => void;
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
      content: [
        {
          contentType: 'TEXT',
          title: '',
          contentTypeUuid: '',
          contentCategory: '',
          durationMinutes: 0,
          durationHours: 0,
          value: undefined,
        },
      ],
      resources: [],
    },
  });

  const handleSubmitError = (errors: FieldErrors<LessonFormValues>) => {
    const firstFieldWithError = Object.keys(errors)[0];
    // @ts-ignore
    const firstError = errors[firstFieldWithError];

    const message =
      typeof firstError?.message === "string"
        ? firstError.message
        : "Please correct the form errors.";

    toast.error(message);
  };

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control: form.control,
    name: 'content',
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

  // QUERY
  const { data: courseDetail } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourseByUuid({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const course = courseDetail?.data?.data;

  // MUTATION
  const { mutate: createLessonMutation, isPending: createLessonIsPending } = useMutation({
    mutationKey: [addCourseLessonQueryKey],
    mutationFn: ({ uuid, body }: { uuid: string; body: any }) =>
      addCourseLesson({ body, path: { courseUuid: uuid } }),
    onSuccess: () => (queryClient.invalidateQueries({ queryKey: ["courses"] }))
  });

  const { mutate: createLessonContentMutation, isPending: createLessonContentIsPending } =
    useMutation({
      mutationKey: [addCourseLessonQueryKey],
      mutationFn: ({ uuid, lessonUuid, body }: { uuid: string; lessonUuid: string; body: any }) =>
        addLessonContent({ body, path: { courseUuid: uuid, lessonUuid: lessonUuid } }),
    });

  const onSubmitCreateLesson: SubmitHandler<LessonFormValues> = values => {
    const createLessonBody = {
      course_uuid: courseId as string,
      title: values?.title,
      description: values?.description as string,
      learning_objectives: values?.objectives as string,
      duration_hours: Number(values?.content[0]?.durationHours),
      duration_minutes: Number(values?.content[0]?.durationMinutes),
      duration_display: `${values?.content[0]?.durationHours}hours ${values?.content[0]?.durationMinutes}minutes`,
      status: course?.status as any,
      active: course?.active,
      is_published: course?.is_published,
      created_by: course?.instructor_uuid,
      lesson_number: values?.number,
      lesson_sequence: `Lesson ${values?.number}`,
    };

    createLessonMutation(
      { body: createLessonBody, uuid: courseId as string },
      {
        onSuccess: lessonResponse => {
          queryClient.invalidateQueries({
            queryKey: getCourseLessonsQueryKey({ path: { courseUuid: courseId as string } })
          });

          const lessonUuid = lessonResponse?.data?.data?.uuid as string;

          if (!lessonUuid) {
            toast.error('Lesson uuid missing from response.');
            return;
          }

          const createContentBody = {
            lesson_uuid: lessonUuid as string,
            content_type_uuid: values.content[0]?.contentTypeUuid ?? '',
            title: values?.title,
            description: values?.description ?? '',
            content_text: values.content[0]?.value || '',
            file_url: '',
            file_size_bytes: 157200,
            mime_type: values.content[0]?.value || '',
            display_order: values?.number,
            is_required: true,
            created_by: 'instructor@sarafrika.com',
            updated_by: 'instructor@sarafrika.com',
            file_size_display: '',
            // content_category: values.contentCategory,
            // is_downloadable: true,
            // estimated_duration: `${values.content[0]?.durationHours} hrs ${values.content[0]?.durationMinutes} minutes`,
          };

          createLessonContentMutation(
            {
              body: createContentBody,
              uuid: courseId as string,
              lessonUuid: lessonUuid,
            },
            {
              onSuccess: (data: any) => {
                toast.success('Lesson content created successfully.');
                queryClient.invalidateQueries({
                  queryKey: getCourseLessonsQueryKey({ path: { courseUuid: courseId as string } })
                });
                onCancel();
              },
            }
          );
        },
      },

    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitCreateLesson, handleSubmitError)} className={`space-y-8 ${className}`}>
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
                  <SimpleEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
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
                  <SimpleEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='space-y-4'>
          <FormSection
            title='Lesson Content'
            description='Add multiple content items to your lesson'
          >
            <div className='space-y-4'>
              {contentFields.map((field, index) => (
                <ContentItemForm
                  key={field.id}
                  control={form.control}
                  index={index}
                  onRemove={() => removeContent(index)}
                  isOnly={contentFields.length === 1}
                />
              ))}
            </div>
          </FormSection>

          <Button
            type='button'
            variant='outline'
            // onClick={() =>
            //   appendContent({
            //     contentType: "TEXT",
            //     title: "",
            //     value: "",
            //     contentCategory: "",
            //     contentUuid: "",
            //     durationHours: 0,
            //     durationMinutes: 0,
            //   })
            // }
            onClick={() => toast.message('Cannot add more contents at the moment')}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Content Item
          </Button>
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
            {createLessonIsPending || createLessonContentIsPending ? <Spinner /> : 'Create Lesson'}
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
  editSuccessRespones,
}: AppLessonCreationFormProps) {
  const normalizedInitialValues = {
    ...initialValues,
    content: initialValues?.content
      ? Array.isArray(initialValues.content)
        ? initialValues.content
        : [initialValues.content]
      : [],
  };

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      number: 0,
      title: '',
      description: '',
      resources: [],
      // content: [{ contentType: 'TEXT', title: '' }],
      ...normalizedInitialValues,
    },
  });

  const handleSubmitError = (errors: FieldErrors<LessonFormValues>) => {
    const firstFieldWithError = Object.keys(errors)[0];
    // @ts-ignore
    const firstError = errors[firstFieldWithError];

    const message =
      typeof firstError?.message === "string"
        ? firstError.message
        : "Please correct the form errors.";

    toast.error(message);
  };

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control: form.control,
    name: 'content',
  });

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: 'resources',
  });

  const queryClient = useQueryClient()

  const useGetCourseById = () => {
    return useQuery({
      queryKey: ["course-id"],
      queryFn: () => getCourseByUuid({ path: { uuid: courseId as string } }).then(res => res.data),
    });
  };
  const { data: courseData } = useGetCourseById();

  const updateLessonMutation = useMutation({
    mutationFn: ({ body, courseId, lessonId }: { body: any; courseId: string, lessonId: string }) =>
      updateCourseLesson({ body, path: { courseUuid: courseId, lessonUuid: lessonId } }),

  });

  const updateLessonContentMutation = useMutation({
    mutationFn: ({ body, courseId, lessonId, contentId }: { body: any; courseId: string, lessonId: string, contentId: string }) =>
      updateLessonContent({ body, path: { courseUuid: courseId, lessonUuid: lessonId, contentUuid: contentId } }),

  });


  const onSubmitEditLesson = (values: LessonFormValues) => {
    const updateLessonBody = {
      course_uuid: courseId as string,
      title: values?.title,
      description: values?.description ?? '',
      learning_objectives: "",
      duration_hours: Number(values?.content[0]?.durationHours),
      duration_minutes: Number(values?.content[0]?.durationMinutes),
      duration_display: `${values?.content[0]?.durationHours}hours ${values?.content[0]?.durationMinutes}minutes`,
      status: courseData?.data?.status as any,
      active: courseData?.data?.active,
      // @ts-ignore
      is_published: courseData?.data?.is_published,
      // @ts-ignore
      created_by: courseData?.data?.instructor_uuid,
      lesson_number: values?.number,
      lesson_sequence: `Lesson ${values?.number}`,
    }

    updateLessonMutation.mutate(
      {
        body: updateLessonBody,
        courseId: courseId as string,
        lessonId: lessonId as string
      },
      {
        onSuccess: (data) => {
          toast.success(data?.data?.message);
          onCancel();

          if (typeof editSuccessRespones === 'function') {
            editSuccessRespones(data?.data);
          }

          const updateLessonContentBody = {
            lesson_uuid: lessonId as string,
            content_type_uuid: values.content[0]?.contentTypeUuid as string,
            title: values?.title,
            description: values?.description ?? '',
            content_text: values.content[0]?.value || '',
            file_url: '',
            file_size_bytes: 157200,
            mime_type: values.content[0]?.value || '',
            display_order: values?.number,
            is_required: true,
            created_by: 'instructor@sarafrika.com',
            updated_by: 'instructor@sarafrika.com',
            file_size_display: '',
          }

          updateLessonContentMutation.mutate(
            {
              body: updateLessonContentBody,
              courseId: courseId as string,
              lessonId: lessonId as string,
              // @ts-ignore
              contentId: initialValues?.content[0]?.uuid as string,

            },
            {
              onSuccess: data => {
                toast.success(data?.data?.message);
                onCancel();

                if (typeof editSuccessRespones === 'function') {
                  editSuccessRespones(data?.data);
                  queryClient.invalidateQueries({
                    queryKey: getCourseLessonsQueryKey({ path: { courseUuid: courseId as string } })
                  });
                }
              },
            }
          );
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitEditLesson, handleSubmitError)} className={`space-y-8 ${className}`}>
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
                  <SimpleEditor
                    value={field.value}
                    onChange={field.onChange}
                  />

                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Objectives</FormLabel>
                <FormControl>
                  <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>

        <div className='space-y-4'>
          <FormSection
            title='Lesson Content'
            description='Add multiple content items to your lesson'
          >
            <div className='space-y-4'>
              {contentFields.map((field, index) => (
                <ContentItemForm
                  key={field.id}
                  control={form.control}
                  index={index}
                  onRemove={() => removeContent(index)}
                  isOnly={contentFields.length === 1}
                />
              ))}
            </div>
          </FormSection>

          <Button
            type='button'
            variant='outline'
            onClick={() =>
              appendContent({
                contentType: "TEXT",
                title: "",
                value: "",
                contentCategory: "",
                contentTypeUuid: "",
                durationHours: 0,
                durationMinutes: 0,
              })
            }
          // onClick={() => toast.message('Cannot add more contents at the moment')}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Content Item
          </Button>
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

interface AssessmentCreationFormProps {
  courseId: string | number;
  assessmentId?: string | number;
  onCancel: () => void;
  className?: string;
  initialValues?: any
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
  }, [initialValues]);

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
        onSuccess: (data) => {
          toast.success(data?.data?.message || 'Assessment created successfully!');
          queryClient.invalidateQueries({
            queryKey: searchAssessmentsQueryKey({ query: { searchParams: { courseUuid: courseId }, } })
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
          onSuccess: (data) => {
            toast.success(data?.message || 'Assessment updated successfully!');
            queryClient.invalidateQueries({
              queryKey: searchAssessmentsQueryKey({ query: { searchParams: { courseUuid: courseId }, } })
            });
            onCancel();
          },
          onError: (error) => {
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

          <div className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
            <FormField
              control={form.control}
              name="assessment_type"
              render={({ field }) => (
                <FormItem className="w-full sm:w-auto">
                  <FormLabel>Assessment Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. attendance, test"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight_percentage"
              render={({ field }) => (
                <FormItem className="w-full sm:w-auto">
                  <FormLabel>Weight Percentage</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 20 for 20%"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='space-y-4'>
          <FormSection
            title='Questions'
            description='Add one or more questions to this assessment'
          >
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
            {assessmentId
              ? updateAssessment.isPending
                ? <Spinner />
                : 'Update Assessment'
              : createAssessmentMutation.isPending
                ? <Spinner />
                : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}


type AssessmentListProps = {
  assessments: any;
  lessonItems: any;
  isLoading: boolean;
  courseId?: string;
  onEditAssessment: (assessment: any) => void;
};

function AssessmentList({
  assessments,
  lessonItems,
  isLoading,
  courseId
}: AssessmentListProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTotalDuration = (lesson: any) => {
    const hours = lesson.duration_hours || 0;
    const minutes = lesson.duration_minutes || 0;
    return hours * 60 + minutes;
  };

  const handleEditAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedAssessment(null);
  };

  // DELETE ASSESSMENT MUTATION
  const queryClient = useQueryClient();
  const deleteAssessment = useMutation(deleteCourseAssessmentMutation());
  const handleDelete = (assessmentUuid: string) => {
    if (!assessmentUuid) return

    deleteAssessment.mutate({
      path: { courseUuid: courseId as string, assessmentUuid }
    }, {
      onSuccess: () => {
        toast.success('Assessment deleted successfully');
        queryClient.invalidateQueries({
          queryKey: searchAssessmentsQueryKey({ query: { searchParams: { courseUuid: courseId }, } })
        });
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to delete assessment')
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            You have {assessments?.content?.length}{" "}
            {assessments?.content?.length === 1 ? "assessment" : "assessments"} created under this course.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : assessments?.content?.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <BookOpenCheck className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No assessments found for this course.</h3>
          <p className='text-muted-foreground mt-2'>You can create new assessments under lessons.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments?.content.map((assessment: any, index: any) => (
            <div
              key={assessment?.uuid || index}
              className="group hover:bg-accent/50 relative flex items-start gap-4 rounded-lg border p-4 transition-all"
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
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAssessment(assessment)}>
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Edit Assessment
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          if (assessment.uuid) {
                            handleDelete(assessment?.uuid as string);
                          }
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
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

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}>
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

    </div>
  );
}


const rubricFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  criteria: z.array(
    z.object({
      name: z.string().min(1, 'Criterion is required'),
      points: z.number().min(0, 'Points must be positive'),
    })
  ).min(1, 'At least one criterion is required'),
});

type RubricFormValues = z.infer<typeof rubricFormSchema>;

interface AddRubricFormProps {
  courseId: string;
  lessonId: string;
  onCancel: () => void;
  onSubmitSuccess?: () => void;
  className: any
}

function AddRubricForm({ courseId, lessonId, onCancel, onSubmitSuccess, className }: AddRubricFormProps) {
  const form = useForm<RubricFormValues>({
    resolver: zodResolver(rubricFormSchema),
    defaultValues: {
      title: '',
      description: '',
      criteria: [{ name: '', points: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'criteria',
  });

  const onSubmit = async (values: RubricFormValues) => {
    try {
      // TODO: implement add rubric here

      // console.log('Submitting rubric:', values);
      toast.success('Rubric created successfully');
      onSubmitSuccess?.();
      onCancel();
    } catch (error) {
      toast.error('Failed to create rubric');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-8 ${className}`}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rubric Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter rubric title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional rubric description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Criteria</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4">
              <FormField
                control={form.control}
                name={`criteria.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Criterion</FormLabel>
                    <FormControl>
                      <Input placeholder="Criterion name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`criteria.${index}.points`}
                render={({ field }) => (
                  <FormItem className="w-[100px]">
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: '', points: 0 })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Criterion
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]">
            Create Rubric
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AddLessonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | number;
  lessonId?: string | number;
  initialValues?: Partial<LessonFormValues>;
  refetch?: () => any;
  onSuccess?: (data: any) => void;
  onCancel: () => any
}

function LessonDialog({ isOpen, onOpenChange, courseId, refetch, onCancel }: AddLessonDialogProps) {
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
            refetch={refetch}
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
            editSuccessRespones={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentDialog({
  isOpen,
  onOpenChange,
  courseId,
}: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Add Assessment</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Create a new assessment by providing its title, description, questions, and any helpful resources
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

function RubricDialog({
  isOpen,
  onOpenChange,
  courseId,
  lessonId
}: AddLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>Add Rubric</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Create a new assessment by providing its title, description, questions, and any helpful resources
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <AddRubricForm
            onCancel={() => onOpenChange(false)}
            className='px-6 pb-6'
            courseId=''
            lessonId=''
            onSubmitSuccess={() => { }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { AssessmentDialog, AssessmentList, EditLessonDialog, LessonDialog, LessonList, RubricDialog };

