'use client';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { forwardRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '../../../../components/ui/button';
import Spinner from '../../../../components/ui/spinner';
import { useStepper } from '../../../../components/ui/stepper';
import {
  getCourseByUuidQueryKey,
  updateCourseMutation,
  uploadCourseBannerMutation,
  uploadCourseIntroVideoMutation,
  uploadCourseThumbnailMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import DragDropUpload from '../../@student/assignment/drag-drop';
import { FormSection } from './course-creation-form';
import {
  type CourseCreationFormValues,
  courseCreationSchema,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
} from './course-creation-types';

type MutationVariables<T> = T extends {
  mutationFn?: (variables: infer TVariables) => Promise<unknown>;
}
  ? TVariables
  : never;
type MutationResponse<T> = T extends { mutationFn?: (...args: never[]) => Promise<infer TResponse> }
  ? TResponse
  : never;
type UploadResponse = unknown;
type UploadError = unknown;
type UpdateCourseVariables = MutationVariables<ReturnType<typeof updateCourseMutation>>;
type UpdateCourseResponse = MutationResponse<ReturnType<typeof updateCourseMutation>>;
type CourseUpdatePayload = Partial<CourseCreationFormValues> & {
  course_creator_uuid: string;
  status: string;
};

const isString = (value: unknown): value is string => typeof value === 'string';
const getUploadedUrl = (value: unknown, key: `${UploadKey}_url`) => {
  if (typeof value !== 'object' || value === null) return undefined;
  const urlValue = (value as Record<string, unknown>)[key];
  return isString(urlValue) ? urlValue : undefined;
};
const getFormErrorMessage = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find(isString);
  return undefined;
};
const getErrorStatus = (value: unknown) => {
  if (typeof value !== 'object' || value === null) return undefined;
  const response = (value as { response?: { status?: number } }).response;
  return response?.status;
};

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  successResponse?: (data: unknown) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

type UploadKey = 'thumbnail' | 'banner' | 'intro_video';

type UploadOptions = {
  key: UploadKey;
  setPreview: (val: string) => void;
  upload: (
    file: File,
    callbacks: {
      onSuccess?: (data: UploadResponse) => void;
      onError?: (error: UploadError) => void;
    }
  ) => void;
  onChange: (val: string) => void;
};

export const brandingSchema = courseCreationSchema.pick({
  welcome_message: true,
  theme_color: true,
  intro_video_url: true,
  banner_url: true,
  thumbnail_url: true,
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export const CourseBrandingForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, _ref) => {
    const form = useForm<BrandingFormValues>({
      resolver: zodResolver(brandingSchema),
      defaultValues: {
        welcome_message: '',
        theme_color: '',
        ...initialValues,
      },
      mode: 'onChange',
    });

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;
    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';
    const { setActiveStep } = useStepper();

    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const courseBannerMutation = useMutation(uploadCourseBannerMutation());
    const courseThumbnailMutation = useMutation(uploadCourseThumbnailMutation());
    const courseIntroVideoMutation = useMutation(uploadCourseIntroVideoMutation());

    const handleFileUpload = async (
      file: File,
      { key, setPreview, upload, onChange }: UploadOptions
    ) => {
      if (!editingCourseId) {
        toast.error('Save the course before uploading media.');
        return;
      }
      if (key === 'intro_video' && file.size > MAX_VIDEO_SIZE_BYTES) {
        toast.error(`Video too large. Max size: ${MAX_VIDEO_SIZE_MB}MB.`);
        return;
      }

      try {
        const schema = z.object({ [key]: z.instanceof(File) });
        schema.parse({ [key]: file });
      } catch {
        toast.error('Invalid file type.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      upload(file, {
        onSuccess: (data: UploadResponse) => {
          const urlKey = `${key}_url` as const;
          // @ts-ignore
          const uploadedUrl = getUploadedUrl(data?.data, urlKey);

          if (!uploadedUrl) {
            toast.error('Upload succeeded, but no URL returned.');
            return;
          }

          onChange(uploadedUrl);
          toast.success('Upload successful');

          queryClient.invalidateQueries({
            queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }),
          });
        },
        onError: (error: UploadError) => {
          const status = getErrorStatus(error);
          if (status === 413) {
            toast.error('File too large.');
          } else {
            toast.error('Upload failed.');
          }
        },
      });
    };

    const updateCourse = useMutation(updateCourseMutation());

    const onSubmit = (data: BrandingFormValues) => {
      if (!editingCourseId) return;

      if (editingCourseId) {
        const editBody: CourseUpdatePayload = {
          course_creator_uuid: authorUuid,
          status: 'draft',
          ...initialValues,
          welcome_message: data?.welcome_message,
          theme_color: data?.theme_color,
        };

        updateCourse.mutate(
          { body: editBody as UpdateCourseVariables['body'], path: { uuid: editingCourseId as string } },
          {
            onSuccess(data: UpdateCourseResponse) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                toast.success(
                  (respObj as { message?: string }).message || 'Course updated successfully'
                );

                queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }),
                });
                setActiveStep(7);
                return;
              }

              if (errorObj && typeof errorObj === 'object') {
                Object.values(errorObj).forEach(errorMsg => {
                  const message = getFormErrorMessage(errorMsg);
                  if (message) {
                    toast.error(message);
                  }
                });
                return;
              } else if (data?.message) {
                toast.error(data.message || 'Failed to update course');
                return;
              } else {
                toast.error('An unknown error occurred.');
                return;
              }
            },
          }
        );
      }
    };

    const onError = () => {
      toast.error('Please review the branding fields and try again.');
    };

    useEffect(() => {
      const thumbnail = initialValues?.thumbnail_url || form.getValues('thumbnail_url');
      const banner = initialValues?.banner_url || form.getValues('banner_url');
      const video = initialValues?.intro_video_url || form.getValues('intro_video_url');

      if (isString(thumbnail) && !thumbnailPreview) {
        setThumbnailPreview(thumbnail);
      }

      if (isString(banner) && !bannerPreview) {
        setBannerPreview(banner);
      }

      if (isString(video) && !videoPreview) {
        setVideoPreview(video);
      }
    }, [form, thumbnailPreview, bannerPreview, videoPreview, initialValues]);

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className='space-y-6'>
          {/* Welcome Message */}
          {/* <FormSection
            title='Welcome message'
            description='Write a short message to welcome learners and set expectations for this course.'
          >
            <FormField
              control={form.control}
              name='welcome_message'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className='min-h-28'
                      cols={20}
                      placeholder="Welcome! In this course, you'll learn..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection> */}

          {/* Theme Color */}
          {/* <FormSection title='Theme Color' description='Choose a theme color for your course.'>
            <FormField
              control={form.control}
              name='theme_color'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type='color' {...field} className='h-16 w-16 cursor-pointer p-1' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection> */}

          {/* Intro Video Upload */}
          <FormSection
            title='Promotional Video'
            description='Upload a short promotional video or provide a video link.'
          >
            <FormField
              control={form.control}
              name='intro_video_url'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='flex flex-col gap-4'>
                      {!videoPreview ? (
                        <DragDropUpload
                          accept="video/*"
                          multiple={false}
                          onFilesAdded={files => {
                            const file = files[0];
                            if (!file) return;

                            handleFileUpload(file, {
                              key: 'intro_video',
                              setPreview: setVideoPreview,
                              upload: (file, callbacks) =>
                                courseIntroVideoMutation.mutate(
                                  {
                                    body: { intro_video: file },
                                    path: { uuid: editingCourseId as string },
                                  },
                                  callbacks
                                ),
                              onChange: field.onChange,
                            });
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <p className="text-sm">Drag & drop or click to upload video</p>
                            <p className="text-xs text-muted-foreground">
                              MP4 up to {MAX_VIDEO_SIZE_MB}MB
                            </p>
                          </div>
                        </DragDropUpload>
                      ) : (
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>Current promotional video</span>

                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                document.getElementById('introVideoUpload')?.click()
                              }
                            >
                              Replace
                            </Button>
                          </div>

                          <video controls className='w-full max-w-md rounded shadow'>
                            <source
                              src={toAuthenticatedMediaUrl(videoPreview) || videoPreview}
                              type='video/mp4' />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}

                      <Input
                        id='introVideoUpload'
                        type='file'
                        accept='video/*'
                        className='hidden'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          handleFileUpload(file, {
                            key: 'intro_video',
                            setPreview: setVideoPreview,
                            upload: (file, callbacks) =>
                              courseIntroVideoMutation.mutate(
                                {
                                  body: { intro_video: file },
                                  path: { uuid: editingCourseId as string },
                                },
                                callbacks
                              ),
                            onChange: field.onChange,
                          });
                        }}
                      />

                      <Input
                        type='text'
                        placeholder='Or paste video link (e.g. Vimeo, YouTube)'
                        value={isString(field.value) ? field.value : ''}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Banner Upload */}
          <FormSection title='Course Banner' description='Upload a banner image for your course.'>
            <FormField
              control={form.control}
              name='banner_url'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='flex flex-col gap-4'>
                      {!bannerPreview ? (
                        <DragDropUpload
                          accept="image/*"
                          multiple={false}
                          onFilesAdded={files => {
                            const file = files[0];
                            if (!file) return;

                            handleFileUpload(file, {
                              key: 'banner',
                              setPreview: setBannerPreview,
                              upload: (file, callbacks) =>
                                courseBannerMutation.mutate(
                                  {
                                    body: { banner: file },
                                    path: { uuid: editingCourseId as string },
                                  },
                                  callbacks
                                ),
                              onChange: field.onChange,
                            });
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <p className="text-sm">Drag & drop or click to upload banner</p>
                            <p className="text-xs text-muted-foreground">
                              PNG or JPG (4:1 ratio)
                            </p>
                          </div>
                        </DragDropUpload>
                      ) : (
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>Current banner</span>

                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                document.getElementById('bannerUpload')?.click()
                              }
                            >
                              Replace
                            </Button>
                          </div>

                          <div className='h-24 w-full max-w-3xl overflow-hidden rounded border'>
                            <Image
                              src={toAuthenticatedMediaUrl(bannerPreview) || bannerPreview}
                              alt='Banner Preview'
                              width={1200}
                              height={300}
                              className='h-full w-full object-contain'
                              unoptimized={isAuthenticatedMediaUrl(
                                toAuthenticatedMediaUrl(bannerPreview)
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <Input
                        id='bannerUpload'
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          handleFileUpload(file, {
                            key: 'banner',
                            setPreview: setBannerPreview,
                            upload: (file, callbacks) =>
                              courseBannerMutation.mutate(
                                {
                                  body: { banner: file },
                                  path: { uuid: editingCourseId as string },
                                },
                                callbacks
                              ),
                            onChange: field.onChange,
                          });
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Thumbnail Upload */}
          <FormSection title='Course Thumbnail' description='Upload a course thumbnail image.'>
            <FormField
              control={form.control}
              name='thumbnail_url'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='flex flex-col gap-4'>
                      {!thumbnailPreview ? (
                        <DragDropUpload
                          accept="image/*"
                          multiple={false}
                          onFilesAdded={files => {
                            const file = files[0];
                            if (!file) return;

                            handleFileUpload(file, {
                              key: 'thumbnail',
                              setPreview: setThumbnailPreview,
                              upload: (file, callbacks) =>
                                courseThumbnailMutation.mutate(
                                  {
                                    body: { thumbnail: file },
                                    path: { uuid: editingCourseId as string },
                                  },
                                  callbacks
                                ),
                              onChange: field.onChange,
                            });
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <p className="text-sm">Drag & drop or click to upload image</p>
                            <p className="text-xs text-muted-foreground">
                              PNG or JPG up to 15MB
                            </p>
                          </div>
                        </DragDropUpload>
                      ) : (
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>Current thumbnail</span>

                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                document.getElementById('thumbnailUpload')?.click()
                              }
                            >
                              Replace
                            </Button>
                          </div>

                          <div className='h-32 w-48 overflow-hidden rounded border'>
                            <Image
                              src={
                                toAuthenticatedMediaUrl(thumbnailPreview) ||
                                thumbnailPreview
                              }
                              width={192}
                              height={128}
                              alt='Thumbnail Preview'
                              className='h-full w-full object-cover'
                              unoptimized={isAuthenticatedMediaUrl(
                                toAuthenticatedMediaUrl(thumbnailPreview)
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <Input
                        id='thumbnailUpload'
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          handleFileUpload(file, {
                            key: 'thumbnail',
                            setPreview: setThumbnailPreview,
                            upload: (file, callbacks) =>
                              courseThumbnailMutation.mutate(
                                {
                                  body: { thumbnail: file },
                                  path: { uuid: editingCourseId as string },
                                },
                                callbacks
                              ),
                            onChange: field.onChange,
                          });
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Submit Button */}
          {showSubmitButton && (
            <div className='flex flex-col justify-center gap-4 pt-6 sm:flex-row sm:justify-end'>
              <Button type='submit' className='min-w-32'>
                {updateCourse.isPending ? <Spinner /> : 'Save'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

CourseBrandingForm.displayName = 'CourseBrandingForm';

export default CourseBrandingForm;
