'use client';

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FileText, FileUp, Headphones, ImageIcon, PlusCircle, Trash2, Video, X } from 'lucide-react';
import { SimpleEditor } from '../../../../components/tiptap-templates/simple/simple-editor';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { cn } from '../../../../lib/utils';
import {
  addCourseLessonMutation,
  addLessonContentMutation,
  deleteCourseLessonMutation,
  deleteLessonContentMutation,
  getAllContentTypesOptions,
  getCourseLessonQueryKey,
  getCourseLessonsQueryKey,
  getLessonContentOptions,
  getLessonContentQueryKey,
  updateCourseLessonMutation,
  updateLessonContentMutation,
  uploadLessonMediaMutation,
} from '../../../../services/client/@tanstack/react-query.gen';

type LessonCreationFormProps = {
  course: any;
  lessons: any;
  lessonContentsMap: any;
};

type Lesson = {
  id: string;
  isDraft?: boolean;
  title: string;
  description?: string;
};

type ContentType = 'TEXT' | 'VIDEO' | 'AUDIO' | 'PDF' | 'IMAGE';

const lessonFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(350),
  lesson_number: z.any(),
});
type LessonFormValues = z.infer<typeof lessonFormSchema>;

const lessonContentSchema = z.object({
  content_type: z.enum(['AUDIO', 'VIDEO', 'TEXT', 'PDF', 'IMAGE'], {
    required_error: 'Content type is required',
  }),
  content_type_uuid: z.string().min(1, 'Content type UUID is required'),
  content_text: z.string().optional(),
  content_category: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.any().optional(),
  value: z.any().optional(),
  file_url: z.any().optional(),
  display_order: z.coerce.number().min(0, 'Order number must be positive'),
  uuid: z.any().optional(),
});
type LessonContentValues = z.infer<typeof lessonContentSchema>;

export const LessonCreationForm: React.FC<LessonCreationFormProps> = ({
  course,
  lessonContentsMap,
  lessons,
}) => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: { title: '', description: '' },
  });

  const contentForm = useForm<LessonContentValues>({
    resolver: zodResolver(lessonContentSchema),
    defaultValues: {
      content_type: 'TEXT',
      content_type_uuid: '',
      content_text: '',
      content_category: 'GENERAL',
      title: '',
      description: '',
      value: '',
      file_url: '',
      display_order: 1,
      uuid: undefined,
    },
  });

  const watchedType = contentForm.watch('content_type');

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonContents, setLessonContents] = useState<LessonContentValues[]>([]);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [showContentForm, setShowContentForm] = useState(false);

  const [contentType, setContentType] = useState<ContentType>('TEXT');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // GET COURSE CONTENT TYPES
  const contentTypeUuid = contentForm.watch('content_type_uuid');

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

  React.useEffect(() => {
    if (!contentForm.getValues('content_type_uuid') && contentTypeData.length > 0) {
      const typeObj = contentTypeData.find(item => item.name?.toUpperCase() === 'TEXT');
      if (typeObj) {
        contentForm.setValue('content_type_uuid', typeObj.uuid);
        contentForm.setValue('content_type', 'TEXT');
        setContentType('TEXT');
      }
    }
  }, [contentTypeData, contentForm]);

  React.useEffect(() => {
    if (!activeLessonId) return;

    const existingContents = lessonContentsMap.get(activeLessonId) || [];

    setLessonContents(
      existingContents.map((content: any) => ({
        uuid: content.uuid,
        title: content.title || '',
        description: content.description || '',
        content_type: content.content_type_key || 'TEXT',
        content_type_uuid: content.content_type_uuid || '',
        content_text: content.content_text || '',
        value: content.value || '',
        file_url: content.file_url || '',
        display_order: content.display_order || 1,
        content_category: content.content_category || '',
      }))
    );
  }, [activeLessonId, lessonContentsMap]);

  React.useEffect(() => {
    if (!watchedType || !contentTypeData.length) return;

    const typeObj = contentTypeData.find(item => item.name?.toUpperCase() === watchedType);

    if (typeObj) {
      contentForm.setValue('content_type_uuid', typeObj.uuid);
    }
  }, [watchedType, contentTypeData]);

  const enrichedLessonContentsMap = useMemo(() => {
    const map = new Map();

    lessons?.content?.forEach((lesson: any) => {
      const contents = lessonContentsMap.get(lesson.uuid) || [];

      const enriched = contents.map((content: any) => {
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

  const { data } = useQuery({
    ...getLessonContentOptions({
      path: {
        courseUuid: course?.data?.uuid as string,
        lessonUuid: activeLessonId as string,
      },
    }),
    enabled: !activeLessonId,
  });

  const addLessonMutation = useMutation(addCourseLessonMutation());
  const updateLessonMutation = useMutation(updateCourseLessonMutation());
  const deleteLesson = useMutation(deleteCourseLessonMutation());

  const uploadLessonMedia = useMutation(uploadLessonMediaMutation());

  const createLessonContent = useMutation(addLessonContentMutation());
  const updateLessonContent = useMutation(updateLessonContentMutation());
  const deleteLessonContent = useMutation(deleteLessonContentMutation());

  const [creatingDraft, setCreatingDraft] = useState(false);

  const addLessonDraft = () => {
    const draftId = `draft-${crypto.randomUUID()}`;

    form.reset({ title: '', description: '' });
    setActiveLessonId(null);
    setCreatingDraft(true);
    setShowContentForm(false);
    setSelectedContentId(null);
  };

  const activeLesson = useMemo(
    () =>
      activeLessonId
        ? lessons?.content?.find((lesson: any) => lesson.uuid === activeLessonId)
        : null,
    [lessons, activeLessonId]
  );

  React.useEffect(() => {
    if (!activeLessonId && !creatingDraft && lessons?.content?.length) {
      const lastLesson = lessons.content[lessons.content.length - 1];
      setActiveLessonId(lastLesson.uuid);
    }
  }, [lessons, activeLessonId, creatingDraft]);

  React.useEffect(() => {
    if (activeLesson) {
      form.reset({
        title: activeLesson.title || '',
        description: activeLesson.description || '',
        lesson_number: activeLesson.lesson_number,
      });
    }
  }, [activeLesson, form]);

  const saveLesson = () => {
    if (!course?.data?.uuid) return;
    const values = form.getValues();

    const createLessonBody = {
      course_uuid: course?.data?.uuid as string,
      title: values?.title,
      description: values?.description as string,
      learning_objectives: '',
      status: course?.data?.status as any,
      active: course?.data?.active,
      is_published: course?.data?.is_published,
      created_by: course?.data?.course_creator_uuid,
      lesson_number: values.lesson_number,
      lesson_sequence: `Lesson`,
    };

    if (activeLessonId === null) {
      addLessonMutation.mutate(
        { body: createLessonBody, path: { courseUuid: course?.data?.uuid as string } },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getCourseLessonsQueryKey({
                path: { courseUuid: course?.data?.uuid as string },
                query: { pageable: { page: 0, size: 100 } },
              }),
            });
            toast.success(data?.message);
            setCreatingDraft(false);
            setActiveLessonId(data?.data?.uuid as string);
          },
          onError: (data: any) => {
            const error = data?.error;

            if (error?.lesson_number) {
              if (error.lesson_number.toLowerCase().includes('duplicate')) {
                toast.error('Duplicate lesson number found.');
              } else {
                toast.error(error.lesson_number);
              }
              // return;
            }

            toast.error(
              `${data?.message ?? 'An error occurred.'}. Check for duplicate lesson numbers.`
            );
          },

        }
      );
    } else {
      updateLessonMutation.mutate(
        {
          body: createLessonBody as any,
          path: {
            courseUuid: course?.data?.uuid as string,
            lessonUuid: activeLessonId as string,
          },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getCourseLessonsQueryKey({
                path: { courseUuid: course?.data?.uuid as string },
                query: { pageable: {} },
              }),
            });

            qc.invalidateQueries({
              queryKey: getCourseLessonQueryKey({
                path: {
                  courseUuid: course?.data?.uuid as string,
                  lessonUuid: activeLessonId as string,
                },
              }),
            });

            toast.success(data?.message);
          },
        }
      );
    }
  };

  const handleSaveLessonContent = (data: LessonContentValues) => {
    const courseId = course?.data?.uuid as string;
    if (!activeLessonId) return;

    const contentBody = {
      lesson_uuid: activeLessonId as string,
      content_type_uuid: data.content_type_uuid,
      title: data.title,
      description: data.description,
      content_text: data.content_text || '',
      value: data.value || '',
      file_url: data.file_url || data.value || '',
      display_order: data.display_order,
      content_category: 'CC',
      is_required: true,
    };

    if (data.uuid) {
      updateLessonContent.mutate(
        {
          body: contentBody as any,
          path: {
            courseUuid: courseId as string,
            lessonUuid: activeLessonId as string,
            contentUuid: data.uuid as string,
          },
        },
        {
          onSuccess: response => {
            qc.invalidateQueries({
              queryKey: getLessonContentQueryKey({
                path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
              }),
            });
            toast.success(response?.message || 'Content updated successfully');
            resetContentForm();
          },
        }
      );
    } else {
      createLessonContent.mutate(
        {
          body: contentBody as any,
          path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
        },
        {
          onSuccess: response => {
            qc.invalidateQueries({
              queryKey: getLessonContentQueryKey({
                path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
              }),
            });
            toast.success(response?.message || 'Content created successfully');
            resetContentForm();
          },
        }
      );
    }
  };

  const resetContentForm = () => {
    const textTypeObj = contentTypeData.find(item => item.name?.toUpperCase() === 'TEXT');

    contentForm.reset({
      content_type: 'TEXT',
      content_type_uuid: textTypeObj?.uuid || '',
      title: '',
      content_text: '',
      value: '',
      file_url: '',
      display_order: (lessonContentsMap.get(activeLessonId)?.length || 0) + 1,
      uuid: undefined,
    });
    setContentType('TEXT');
    setMediaFile(null);
    setShowContentForm(false);
    setSelectedContentId(null);
  };

  const handleEditContent = (content: any) => {
    const contentTypeKey = content.content_type_key || content.content_type;
    const typeObj = contentTypeData.find(item => item.name?.toUpperCase() === contentTypeKey);

    contentForm.reset({
      content_type: contentTypeKey as ContentType,
      content_type_uuid: typeObj?.uuid || content.content_type_uuid,
      title: content.title || '',
      content_text: content.content_text || '',
      value: content.value || content.file_url || '',
      file_url: content.file_url || content.value || '',
      display_order: content.display_order || 1,
      uuid: content.uuid,
    });

    setContentType(contentTypeKey as ContentType);
    setSelectedContentId(content.uuid);
    setShowContentForm(true);
    setMediaFile(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!course?.data?.uuid) return;

    try {
      await deleteLesson.mutateAsync(
        {
          path: { courseUuid: course?.data?.uuid as string, lessonUuid: lessonId },
        },
        {
          onSuccess: () => {
            toast.success('Lesson deleted successfully');
            qc.invalidateQueries({
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
            qc.invalidateQueries({
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


  const getContentIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return <FileText className="w-4 h-4" />;
      case 'IMAGE': return <ImageIcon className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'AUDIO': return <Headphones className="w-4 h-4" />;
      case 'PDF': return <FileUp className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className='mb-10 flex h-auto'>
      <aside className='w-1/4 border-r border-border px-2 py-4'>
        <Button className="w-full mb-4" onClick={addLessonDraft}>
          <PlusCircle className="w-4 h-4" />
          Create New Lesson
        </Button>
        <ScrollArea className='h-auto max-h-[70vh]'>
          <div className='space-y-2'>
            {lessons?.content
              ?.slice()
              ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
              ?.map((lesson: any) => (<div
                key={lesson.uuid}
                className={cn(
                  'group relative rounded-lg px-4 py-3 transition-all duration-200',
                  lesson.uuid === activeLessonId
                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                    : 'hover:bg-muted border-2 border-transparent'
                )}
              >
                <div
                  onClick={() => {
                    setActiveLessonId(lesson.uuid);
                    setShowContentForm(false);
                    setSelectedContentId(null);
                  }}
                  className='cursor-pointer flex flex-col'
                >
                  <p className={cn(
                    "shrink-0 text-xs font-semibold mb-1",
                    lesson.uuid === activeLessonId ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    LESSON {lesson.lesson_number}
                  </p>
                  <p className="font-semibold text-sm text-foreground"> {lesson.title} </p>
                </div>

                <div
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteLesson(lesson.uuid);
                  }}
                  className='text-destructive hover:text-destructive/80 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
                >
                  <Trash2 size={16} />
                </div>
              </div>
              ))}
          </div>
        </ScrollArea>
      </aside>

      <main className='w-3/4 space-y-6 overflow-y-auto pb-20'>
        <div className='px-2'>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">Lesson Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Configure the basic information for this lesson</p>
            </div>
          </CardHeader>

          <CardContent className='mt-6'>
            <Form {...form}>
              <div className='space-y-5'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-foreground mb-2">Lesson Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter the lesson title here' className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
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
                      <FormLabel className="block text-sm font-medium text-foreground mb-2">Lesson Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder='Enter a short description for this lesson'
                          className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='lesson_number'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-sm font-medium text-foreground mb-2">Lesson Number (Sequence)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Enter a number' className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end pt-4'>
                  <Button type='button' onClick={saveLesson} disabled={addLessonMutation.isPending} className="px-6">
                    {addLessonMutation.isPending ? 'Saving...' : 'Save Lesson'}
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </div>

        <div className='px-2'>
          <div className='flex flex-row items-center justify-between p-6 border-b border-border'>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">Lesson Content</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Add and manage content blocks for this lesson</p>
            </div>
            {activeLessonId && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  resetContentForm();
                  setShowContentForm(true);
                }}
              >
                <PlusCircle /> Add New Content
              </Button>
            )}
          </div>

          <CardContent className='space-y-4 pt-6'>
            {!activeLessonId ? (
              <div className='text-center py-12 px-4 bg-muted rounded-lg border-2 border-dashed border-border'>
                <p className="text-foreground font-medium">You need to save the lesson first to add content.</p>
              </div>
            ) : (
              <>
                <div className='space-y-3'>
                  {(enrichedLessonContentsMap.get(activeLessonId) || []).map(
                    (content: any, idx: number) => (
                      <div
                        key={content.uuid || idx}
                        className={cn(
                          'flex w-full cursor-pointer flex-row gap-4 items-center justify-between rounded-lg px-4 py-3 text-left transition-all duration-200',
                          selectedContentId === content.uuid
                            ? 'border-2 border-primary shadow-sm'
                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                        )}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedContentId === content.uuid
                          ? 'bg-primary/20 text-primary'
                          : 'bg-background text-muted-foreground'
                          }`}>
                          {getContentIcon(content.content_type_key)}
                        </div>

                        <div className='flex-1 flex-row items-center gap-4' onClick={() => handleEditContent(content)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {idx + 1}.
                              </span>
                              <span className="font-medium text-foreground">
                                {content.title}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5 block">
                              {content.content_type_key}
                            </span>
                          </div>
                        </div>
                        <div
                          className='px-2'
                          onClick={() => {
                            handleDeleteContent(
                              course?.data?.uuid as string,
                              activeLessonId,
                              content?.uuid
                            );
                          }}
                        >
                          <Trash2 size={16} className='text-destructive hover:text-destructive/80 transition-colors' />
                        </div>
                      </div>
                    )
                  )}

                  {(enrichedLessonContentsMap.get(activeLessonId)?.length ?? 0) === 0 &&
                    !showContentForm && (
                      <div className='text-center py-16 px-4 bg-muted rounded-lg border-2 border-dashed border-border'>
                        <p className='font-medium text-foreground'>No lesson content yet</p>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          Click <span className='font-semibold'>"Add New Content"</span> to get
                          started.
                        </p>
                      </div>
                    )}
                </div>

                {/* ---------- Add/Edit Content Form (Only shown when showContentForm is true) ---------- */}
                {showContentForm && (
                  <Card className='mt-6 border-2 border-primary/20'>
                    <CardHeader className='flex flex-row items-center justify-between border-b border-border'>
                      <CardTitle className="text-lg text-foreground">
                        {contentForm.getValues('uuid') ? 'Edit Content' : 'Add New Content'}
                      </CardTitle>
                      <Button variant='ghost' size='sm' onClick={resetContentForm} className="hover:bg-muted">
                        <X className='h-4 w-4' />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Form {...contentForm}>
                        <div className='space-y-4'>
                          {/* Content Type */}
                          <FormField
                            control={contentForm.control}
                            name='content_type'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="block text-sm font-medium text-foreground mb-2">Content Type</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value: ContentType) => {
                                    field.onChange(value);
                                    setContentType(value);

                                    const typeObj = contentTypeData.find(
                                      item => item.name?.toUpperCase() === value
                                    );

                                    if (typeObj) {
                                      contentForm.setValue('content_type_uuid', typeObj.uuid);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='TEXT'>Text</SelectItem>
                                    <SelectItem value='IMAGE'>Image</SelectItem>
                                    <SelectItem value='VIDEO'>Video</SelectItem>
                                    <SelectItem value='AUDIO'>Audio</SelectItem>
                                    <SelectItem value='PDF'>PDF</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Title */}
                          <FormField
                            control={contentForm.control}
                            name='title'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="block text-sm font-medium text-foreground mb-2">Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder='Enter content title' className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Content Input */}
                          {contentType === 'TEXT' && (
                            <FormField
                              control={contentForm.control}
                              name='content_text'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="block text-sm font-medium text-foreground mb-2">Content</FormLabel>
                                  <SimpleEditor
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {['LINK', 'YOUTUBE'].includes(contentType) && (
                            <FormField
                              control={contentForm.control}
                              name='value'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="block text-sm font-medium text-foreground mb-2">URL</FormLabel>
                                  <Input
                                    {...field}
                                    placeholder='Enter URL'
                                    onChange={e => {
                                      field.onChange(e);
                                      contentForm.setValue('file_url', e.target.value);
                                    }}
                                    className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {['VIDEO', 'AUDIO', 'PDF', 'IMAGE'].includes(contentType) && (
                            <div className='flex flex-col gap-4'>
                              <FormField
                                control={contentForm.control}
                                name='value'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="block text-sm font-medium text-foreground mb-2">URL</FormLabel>
                                    <Input
                                      {...field}
                                      placeholder='Enter URL'
                                      onChange={e => {
                                        field.onChange(e);
                                        contentForm.setValue('file_url', e.target.value);
                                      }}
                                      className="px-4 py-2.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div
                                className={cn(
                                  'space-y-4 rounded-lg border-2 border-dashed p-8 transition-all',
                                  isDragging ? 'border-primary bg-primary/5' : 'border-border bg-background'
                                )}
                                onDragOver={e => {
                                  e.preventDefault();
                                  setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={e => {
                                  e.preventDefault();
                                  setIsDragging(false);
                                  setMediaFile(e.dataTransfer.files?.[0] || null);
                                }}
                              >
                                <Input
                                  ref={fileInputRef}
                                  type='file'
                                  className='hidden'
                                  onChange={e => setMediaFile(e.target.files?.[0] || null)}
                                />

                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className='cursor-pointer rounded-md text-center'
                                >
                                  <p className="font-medium text-foreground mb-1">
                                    {mediaFile
                                      ? mediaFile.name
                                      : contentForm.getValues('file_url')
                                        ? 'File uploaded - Click to change'
                                        : 'Drag & drop or click to upload'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Support for {contentType.toLowerCase()} files
                                  </p>
                                </div>

                                <Button
                                  type='button'
                                  disabled={!mediaFile || uploadLessonMedia.isPending}
                                  onClick={() => {
                                    if (!mediaFile) return;
                                    uploadLessonMedia.mutate(
                                      {
                                        body: { file: mediaFile },
                                        path: {
                                          courseUuid: course?.data?.uuid,
                                          lessonUuid: activeLessonId,
                                        },
                                        query: {
                                          content_type_uuid:
                                            contentForm.getValues('content_type_uuid'),
                                          title: contentForm.getValues('title') || 'Untitled',
                                          is_required: false,
                                          description: 'N/A'
                                        },
                                      },
                                      {
                                        onSuccess: () => {
                                          toast.success('Media uploaded');
                                          setMediaFile(null);
                                          qc.invalidateQueries({
                                            queryKey: getLessonContentQueryKey({
                                              path: {
                                                courseUuid: course?.data?.uuid,
                                                lessonUuid: activeLessonId,
                                              },
                                            }),
                                          });
                                          resetContentForm();
                                        },
                                      }
                                    );
                                  }}
                                  className="w-full"
                                >
                                  {uploadLessonMedia.isPending ? 'Uploading...' : 'Upload Media'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Save Content Button */}
                          <div className='flex justify-end space-x-2 pt-4'>
                            <Button type='button' variant='outline' onClick={resetContentForm}>
                              Cancel
                            </Button>
                            <Button
                              type='button'
                              onClick={() => {
                                try {
                                  const data = contentForm.getValues();
                                  lessonContentSchema.parse(data);
                                  handleSaveLessonContent(data);
                                } catch (err) {
                                  if (err instanceof z.ZodError) {
                                    toast.error('Please fix validation errors');
                                  }
                                }
                              }}
                              disabled={
                                createLessonContent.isPending || updateLessonContent.isPending
                              }
                            >
                              {createLessonContent.isPending || updateLessonContent.isPending
                                ? 'Saving...'
                                : contentForm.getValues('uuid')
                                  ? 'Update Content'
                                  : 'Save Content'}
                            </Button>
                          </div>
                        </div>
                      </Form>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </div>
      </main>
    </div>
  );
};