'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import {
  addLessonContentMutation,
  deleteLessonContentMutation,
  getAllContentTypesOptions,
  getLessonContentQueryKey,
  updateLessonContentMutation,
  uploadLessonMediaMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { LessonContent } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileAudio,
  FileIcon,
  FileText,
  FileVideo,
  Headphones,
  ImageIcon,
  LinkIcon,
  Save,
  VideoIcon,
  Youtube,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type FieldErrors,
  useForm,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { cn } from '../../../../lib/utils';

export const CONTENT_TYPES = {
  AUDIO: 'Audio',
  VIDEO: 'Video',
  TEXT: 'Text',
  LINK: 'Link',
  PDF: 'PDF',
  YOUTUBE: 'YouTube',
  IMAGE: 'Image',
} as const;

type SubmitCallback<T = void> = (data: T) => void;
type RefetchCallback = () => void | Promise<void>;
const getErrorMessage = (value: unknown) => {
  if (typeof value !== 'object' || value === null) return undefined;
  if ('message' in value && typeof value.message === 'string') return value.message;
  if ('error' in value && typeof value.error === 'string') return value.error;
  return undefined;
};
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
    .max(350, 'Description cannot exceed 500 characters'),
  objectives: z.string().max(400, 'Objectives cannot exceed 500 characters').optional(),
  uuid: z.string().optional(),
  duration_hours: z.coerce.number().min(0).optional(),
  duration_minutes: z.coerce.number().min(0).max(59).optional(),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;
export type ContentType = keyof typeof CONTENT_TYPES;

export const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case 'AUDIO':
      return <Headphones className='h-4 w-4' />;
    case 'VIDEO':
      return <VideoIcon className='h-4 w-4' />;
    case 'TEXT':
      return <FileText className='h-4 w-4' />;
    case 'IMAGE':
      return <ImageIcon className='h-4 w-4' />;
    case 'LINK':
      return <LinkIcon className='h-4 w-4' />;
    case 'PDF':
      return <FileIcon className='h-4 w-4' />;
    case 'YOUTUBE':
      return <VideoIcon className='h-4 w-4' />;
  }
};
// Keyed by the uppercase key the type picker resolves, not by the display labels in
// CONTENT_TYPES — keying on the labels made every lookup miss and the file picker fall
// through to the permissive default.
const ACCEPTED_FILE_TYPES = {
  AUDIO: '.mp3,.wav,audio/*',
  VIDEO: '.mp4,.webm,video/*',
  PDF: '.pdf',
  IMAGE: 'image/*',
};

const ContentTypeIcons = {
  AUDIO: FileAudio,
  VIDEO: FileVideo,
  TEXT: FileText,
  IMAGE: ImageIcon,
  LINK: LinkIcon,
  PDF: FileIcon,
  YOUTUBE: Youtube,
};

// Only LINK and YOUTUBE still take a typed URL. Media types are upload-only, so
// they no longer have a URL box to place a placeholder in.
function getContentPlaceholder(contentType: string) {
  return contentType === 'YOUTUBE' ? 'Enter YouTube video URL' : 'Enter external resource URL';
}

type MediaKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'OTHER';

const mediaKindFromMimeType = (mimeType: string): MediaKind => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.includes('pdf')) return 'PDF';
  return 'OTHER';
};

// One renderer for both the file staged locally and the file already saved on the
// record, so an editor always sees the media itself rather than a raw URL.
function MediaPreview({ kind, src, label }: { kind: MediaKind; src: string; label: string }) {
  if (!src) return null;

  return (
    <div className='border-border overflow-hidden rounded-md border'>
      {kind === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className='h-56 w-full object-cover' />
      ) : kind === 'VIDEO' ? (
        <video controls className='bg-muted h-56 w-full object-contain'>
          <source src={src} />
        </video>
      ) : kind === 'AUDIO' ? (
        <div className='bg-background p-4'>
          <audio controls className='w-full'>
            <source src={src} />
          </audio>
        </div>
      ) : kind === 'PDF' ? (
        <iframe title={label} src={src} className='h-56 w-full' />
      ) : (
        <div className='bg-background flex h-56 flex-col items-center justify-center gap-2 p-4 text-center'>
          <FileText className='text-muted-foreground h-8 w-8' />
          <p className='text-sm font-medium'>Preview unavailable</p>
          <p className='text-muted-foreground text-xs'>{label}</p>
        </div>
      )}
    </div>
  );
}

interface LessonContentFormProps {
  isOpen: boolean; // parent Sheet/Dialog's open state — drives reset-on-close behavior
  onCancel: () => void;
  onSuccess?: () => void;
  className?: string;
  courseId?: string | number;
  lessonId?: string | number;
  contentId?: string | number;
  initialValues?: LessonContentInitialValues;
}

const lessonContentSchema = z.object({
  content_type: z.enum(['AUDIO', 'VIDEO', 'TEXT', 'LINK', 'PDF', 'YOUTUBE', 'IMAGE'], {
    required_error: 'Content type is required',
  }),
  content_type_uuid: z.string().min(1, 'Content type UUID is required'),
  content_text: z.string().optional(),
  content_category: z.string().min(1, 'Content category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  display_order: z.coerce.number().min(0, 'Order number must be positive'),
  uuid: z.string().optional(),
  file_url: z.string().max(499, 'Value must be less than 500 characters').optional(),
});

export type ContentFormValues = z.infer<typeof lessonContentSchema>;

type LessonContentInitialValues = Omit<Partial<ContentFormValues>, 'file_url'> & {
  file_url?: string | null;
};

// Blank slate the form returns to whenever the sheet closes, or opens fresh (not editing).
const getFreshDefaults = (): ContentFormValues => ({
  content_type: 'TEXT',
  content_type_uuid: '',
  content_category: '',
  title: '',
  description: '',
  content_text: '',
  file_url: '',
  display_order: 0,
  uuid: undefined,
});

// Media reaches a lesson only by upload — a URL box is offered for LINK and YOUTUBE
// alone. One submit button commits everything: it uploads any staged file, then saves
// the record with the URL that upload issued.
function LessonContentForm({
  isOpen,
  onCancel,
  onSuccess,
  className,
  courseId,
  contentId,
  lessonId,
  initialValues,
}: LessonContentFormProps) {

  const mappedInitialValues = React.useMemo(() => {
    if (!initialValues) return undefined;

    const isTextContent =
      initialValues.content_type?.toUpperCase() === 'TEXT' ||
      (!initialValues.content_type && initialValues.content_text != null);
    return {
      ...getFreshDefaults(),
      content_type: initialValues.content_type ?? 'TEXT',
      content_type_uuid: initialValues.content_type_uuid ?? '',
      content_category: initialValues.content_category ?? '',
      title: initialValues.title ?? '',
      description: initialValues.description ?? '',
      content_text: isTextContent ? initialValues.content_text ?? '' : '',
      file_url: isTextContent ? '' : initialValues.file_url ?? '',
      display_order: initialValues.display_order ?? 0,
      uuid: initialValues.uuid,
    };
  }, [
    initialValues?.content_category,
    initialValues?.content_text,
    initialValues?.content_type,
    initialValues?.content_type_uuid,
    initialValues?.description,
    initialValues?.display_order,
    initialValues?.file_url,
    initialValues?.title,
    initialValues?.uuid,
  ]);

  const isEditMode = !!initialValues?.uuid;

  const draftKey = React.useMemo(
    () => `lesson-content-draft:${courseId}:${lessonId}:${contentId ?? 'new'}`,
    [courseId, lessonId, contentId]
  );

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(lessonContentSchema),
    defaultValues: mappedInitialValues ?? getFreshDefaults(),
  });

  const { setValue } = form;
  const watchedValues = useWatch({ control: form.control });
  const watchedContentType = useWatch({ control: form.control, name: 'content_type' });
  const watchedFileUrl = useWatch({ control: form.control, name: 'file_url' });

  const [draftSaved, setDraftSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  // Opening hydrates from the edited record or blanks the form; closing wipes it so the
  // next open never shows stale input. The `=== false` test is deliberate: an undefined
  // isOpen counts as open, so a parent that never wired the prop still gets edit values.
  React.useEffect(() => {
    if (isOpen === false) {
      form.reset(getFreshDefaults());
      setMediaFile(null);
      if (mediaPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      setMediaPreviewUrl(null);
      if (!isEditMode) {
        localStorage.removeItem(draftKey);
      }
      return;
    }

    form.reset(mappedInitialValues ?? getFreshDefaults());
    setMediaFile(null);
    if (mediaPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mappedInitialValues, form, draftKey, isEditMode]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(watchedValues ?? {}));
    }, 600); // debounce

    return () => clearTimeout(timeout);
  }, [watchedValues, draftKey, isOpen]);

  useEffect(
    () => () => {
      if (mediaPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    },
    [mediaPreviewUrl]
  );

  const contentTypeUuid = useWatch({ control: form.control, name: 'content_type_uuid' });

  // GET COURSE CONTENT TYPES
  const { data: contentTypeList } = useQuery(
    getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
  );

  const contentTypeData = React.useMemo(() => {
    const content = contentTypeList?.data?.content;
    return Array.isArray(content) ? content : [];
  }, [contentTypeList]);

  // Resolve the active content-type record, falling back to a match by name so the right
  // option is highlighted the instant the sheet opens for "Add Video" — before the
  // uuid-sync effect below has resolved content_type_uuid.
  const selectedTypeObj = React.useMemo(() => {
    if (contentTypeUuid) {
      const selectedByUuid = contentTypeData.find(item => item.uuid === contentTypeUuid);
      if (selectedByUuid) return selectedByUuid;
    }

    const normalizedType = watchedContentType?.toUpperCase();
    if (!normalizedType) return undefined;

    return contentTypeData.find(item => item.name?.toUpperCase() === normalizedType);
  }, [contentTypeUuid, contentTypeData, watchedContentType]);

  const selectedTypeKey =
    selectedTypeObj?.name?.toUpperCase() || watchedContentType?.toUpperCase() || undefined;

  const isMediaUploadType = ['IMAGE', 'VIDEO', 'AUDIO', 'PDF'].includes(selectedTypeKey || '');
  // LINK and YOUTUBE are the only types where the URL *is* the content, so they are
  // the only ones that still offer a URL box.
  const isUrlEntryType = selectedTypeKey === 'LINK' || selectedTypeKey === 'YOUTUBE';
  const savedFileUrl = typeof watchedFileUrl === 'string' ? watchedFileUrl.trim() : '';
  const savedMediaUrl =
    isMediaUploadType && savedFileUrl
      ? toAuthenticatedMediaUrl(savedFileUrl) || savedFileUrl
      : '';

  const clearStagedFile = () => {
    if (mediaPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
  };

  useEffect(() => {
    if (!selectedTypeKey || !contentTypeData.length) return;

    const matchedType = contentTypeData.find(item => item.name?.toUpperCase() === selectedTypeKey);
    if (!matchedType) return;

    if (contentTypeUuid !== matchedType.uuid) {
      setValue('content_type_uuid', matchedType.uuid ?? '');
    }

    if (form.getValues('content_type') !== matchedType.name?.toUpperCase()) {
      setValue('content_type', matchedType.name?.toUpperCase() as ContentFormValues['content_type']);
    }

    if (
      matchedType.upload_category &&
      form.getValues('content_category') !== matchedType.upload_category
    ) {
      setValue('content_category', matchedType.upload_category);
    }
  }, [contentTypeData, contentTypeUuid, form, selectedTypeKey, setValue]);

  useEffect(() => {
    if (selectedTypeKey === 'TEXT' && !form.getValues('title')) {
      setValue('title', '');
    }
  }, [form, selectedTypeKey, setValue]);

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
  const uploadLessonMedia = useMutation(uploadLessonMediaMutation());
  const deleteLessonContent = useMutation(deleteLessonContentMutation());

  const invalidateLessonContent = () => {
    qc.invalidateQueries({
      queryKey: getLessonContentQueryKey({
        path: {
          courseUuid: courseId as string,
          lessonUuid: lessonId as string,
        },
      }),
    });
  };

  // One commit path for every content type: a staged file is uploaded first and the
  // record is then saved with the URL the upload issued. With no file staged this is
  // a plain create/update.
  const onSubmit = async (data: ContentFormValues) => {
    const isTextContent = data.content_type === 'TEXT';
    const typedUrl = typeof data.file_url === 'string' ? data.file_url.trim() : '';

    if (isUrlEntryType && !typedUrl) {
      toast.error('Enter a URL for this content.');
      return;
    }

    if (isMediaUploadType && !mediaFile && !typedUrl) {
      toast.error('Choose a file to upload.');
      return;
    }

    const existingUuid = isEditMode ? data.uuid ?? initialValues?.uuid : undefined;

    try {
      let fileUrl = typedUrl;
      let uploadedUuid: string | undefined;

      if (isMediaUploadType && mediaFile) {
        const uploaded = await uploadLessonMedia.mutateAsync({
          body: { file: mediaFile },
          path: {
            courseUuid: courseId as string,
            lessonUuid: lessonId as string,
          },
          query: {
            content_type_uuid: data.content_type_uuid,
            title: data.title,
            description: data.description,
            is_required: true,
          },
        });

        const uploadedContent = uploaded?.data;
        if (!uploadedContent?.file_url) {
          toast.error('The upload did not return a file location.');
          return;
        }

        fileUrl = uploadedContent.file_url;
        uploadedUuid = uploadedContent.uuid;
      }

      const contentBody: LessonContent = {
        lesson_uuid: lessonId as string,
        content_type_uuid: data.content_type_uuid,
        title: data.title,
        description: data.description,
        content_text: isTextContent ? data.content_text ?? '' : null,
        file_url: isTextContent ? null : fileUrl,
        display_order: data.display_order,
        is_required: true,
        content_category: data.content_category,
      };

      // The upload endpoint can only ever create a record, so when replacing the file
      // on an existing one we keep the edited record and drop the row the upload made.
      const targetUuid = existingUuid ?? uploadedUuid;

      const saved = targetUuid
        ? await updateLessonContent.mutateAsync({
          body: { ...contentBody, uuid: targetUuid },
          path: {
            courseUuid: courseId as string,
            lessonUuid: lessonId as string,
            contentUuid: targetUuid,
          },
        })
        : await createLessonContent.mutateAsync({
          body: contentBody,
          path: { courseUuid: courseId as string, lessonUuid: lessonId as string },
        });

      if (uploadedUuid && uploadedUuid !== targetUuid) {
        await deleteLessonContent
          .mutateAsync({
            path: {
              courseUuid: courseId as string,
              lessonUuid: lessonId as string,
              contentUuid: uploadedUuid,
            },
          })
          .catch(() => undefined);
      }

      clearStagedFile();
      invalidateLessonContent();
      toast.success(saved?.message || (existingUuid ? 'Content updated' : 'Content created'));
      localStorage.removeItem(draftKey);
      onSuccess?.();
      onCancel();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to save content');
    }
  };

  const isPending =
    createLessonContent.isPending ||
    updateLessonContent.isPending ||
    uploadLessonMedia.isPending ||
    deleteLessonContent.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, handleSubmitError)}
        className={`space-y-6 ${className ?? ''}`}
      >
        <div className='flex items-center justify-end gap-2'>
          <Button
            type='button'
            variant='ghost'
            className='ml-auto flex items-center gap-2'
            onClick={() => {
              localStorage.setItem(draftKey, JSON.stringify(form.getValues()));
              setDraftSaved(true);
              toast.success('Draft saved');

              setTimeout(() => setDraftSaved(false), 2000);
            }}
          >
            <Save className='h-4 w-4' />
            {draftSaved ? 'Draft Saved' : 'Save Draft'}
          </Button>
        </div>

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
                      setValue('content_text', '');
                      setValue('file_url', '');
                      if (mediaPreviewUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaPreviewUrl);
                      }
                      setMediaPreviewUrl(null);
                      setMediaFile(null);
                    }}
                    // Driven by selectedTypeObj (not raw contentTypeUuid) so the right
                    // option is highlighted immediately on open, even before the
                    // uuid-sync effect below has had a chance to run.
                    value={selectedTypeObj ? JSON.stringify(selectedTypeObj) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select content type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contentTypeData.map(value => {
                        const Icon = ContentTypeIcons[
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

          {selectedTypeKey === 'TEXT' ? (
            <div className='flex flex-col gap-6'>
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
                name='content_text'
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
            </div>
          ) : (
            <>
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
                      <SimpleEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* URL entry survives only where the URL is the content itself. */}
              {isUrlEntryType && (
                <FormField
                  name='file_url'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>

                      <FormControl>
                        <Input
                          type='text'
                          placeholder={getContentPlaceholder(selectedTypeKey ?? '')}
                          {...field}
                        />
                      </FormControl>

                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              )}

              {/* Upload dropzone — the only way media reaches a lesson, whether the
                  record is new or already carries a file. */}
              {isMediaUploadType ? (
                <div
                  className={cn(
                    'space-y-4 rounded-lg border-2 border-dashed p-6 transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                  )}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);

                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (mediaPreviewUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaPreviewUrl);
                      }
                      setMediaFile(file);
                      setMediaPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                >
                  <h4 className='text-sm font-medium'>
                    {selectedTypeKey === 'IMAGE' ? 'Attach Image' : 'Attach File'}
                  </h4>

                  <Input
                    ref={fileInputRef}
                    type='file'
                    accept={
                      ACCEPTED_FILE_TYPES[selectedTypeKey as keyof typeof ACCEPTED_FILE_TYPES] ??
                      'image/*,application/pdf,video/*,audio/*'
                    }
                    className='hidden'
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (mediaPreviewUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaPreviewUrl);
                      }
                      setMediaFile(file);
                      setMediaPreviewUrl(file ? URL.createObjectURL(file) : null);
                      // Clear the input so re-picking the same file after Remove still fires.
                      e.target.value = '';
                    }}
                  />

                  {mediaFile ? (
                    <div className='bg-muted/40 space-y-4 rounded-md border px-4 py-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-primary min-w-0 flex-1 truncate text-[13px]'>
                          {mediaFile.name}
                        </p>
                        <div className='flex shrink-0 items-center gap-2'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={clearStagedFile}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <MediaPreview
                        kind={mediaKindFromMimeType(mediaFile.type)}
                        src={mediaPreviewUrl ?? ''}
                        label={mediaFile.name}
                      />

                      {savedMediaUrl ? (
                        <p className='text-muted-foreground text-xs'>
                          Saving replaces the file currently attached to this content.
                        </p>
                      ) : null}
                    </div>
                  ) : savedMediaUrl ? (
                    <div className='bg-muted/40 space-y-4 rounded-md border px-4 py-3'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='text-muted-foreground min-w-0 flex-1 truncate text-[13px]'>
                          Attached file
                        </p>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Replace
                        </Button>
                      </div>

                      <MediaPreview
                        kind={(selectedTypeKey ?? 'OTHER') as MediaKind}
                        src={savedMediaUrl}
                        label='Attached file'
                      />

                      <p className='text-muted-foreground text-xs'>
                        An attached file can be replaced, but detaching one is not supported yet.
                      </p>
                    </div>
                  ) : (
                    <div
                      role='button'
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                      className='bg-muted/40 hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border px-6 py-8 text-center'
                    >
                      <p className='text-sm font-medium'>
                        Drag & drop a file here, or click to browse
                      </p>
                      <p className='text-muted-foreground text-[13px]'>
                        {selectedTypeKey === 'IMAGE'
                          ? 'Upload an image file'
                          : 'Upload a media file'}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Form Buttons */}
        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          {/* The only commit control: it uploads a staged file first where there is one. */}
          <Button type='submit' className='min-w-fit px-3' disabled={isPending}>
            {uploadLessonMedia.isPending ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                Uploading...
              </>
            ) : isPending ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Content'
            ) : (
              'Create Content'
            )}
          </Button>
        </div>
      </form>
    </Form>
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
  refetch?: RefetchCallback;
  onSuccess?: SubmitCallback<unknown>;
  onCancel: () => void;
}

interface LessonContentDialogProps
  extends Omit<AddLessonDialogProps, 'initialValues' | 'refetch' | 'onSuccess'> {
  initialValues?: LessonContentInitialValues;
}

function LessonContentDialog({
  isOpen,
  onOpenChange,
  courseId,
  lessonId,
  contentId,
  onCancel,
  initialValues,
}: LessonContentDialogProps) {
  const isEditMode = initialValues?.uuid ?? '';

  return (
    <Sheet
      open={isOpen}
      onOpenChange={open => {
        onOpenChange(open);
        if (!open) onCancel();
      }}
    >
      <SheetContent
        side='right'
        className='flex h-full w-full max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl'      >
        <SheetHeader className='border-b px-6 py-4 text-left'>
          <SheetTitle className='text-xl'>
            {isEditMode ? 'Edit Lesson Content' : 'Create New Lesson Content'}
          </SheetTitle>
          <SheetDescription className='text-muted-foreground text-sm'>
            {isEditMode
              ? 'Update the details of your lesson content below.'
              : 'Fill in the contents of your lesson below.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='min-h-0 flex-1'>
          <LessonContentForm
            isOpen={isOpen}
            onCancel={onCancel}
            className='px-6 pb-6'
            courseId={courseId}
            lessonId={lessonId}
            contentId={contentId}
            initialValues={initialValues}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export {
  LessonContentDialog
};
