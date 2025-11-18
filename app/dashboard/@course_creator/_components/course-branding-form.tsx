'use client';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { tanstackClient } from '@/services/api/tanstack-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import type React from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  getCourseByUuidQueryKey,
  updateCourseMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import { FormSection } from './course-creation-form';
import {
  courseCreationSchema,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
} from './course-creation-types';

type CourseCreationFormValues = z.infer<typeof courseCreationSchema> & { [key: string]: any };

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  successResponse?: (data: any) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

type UploadKey = 'thumbnail' | 'banner' | 'intro_video';

type UploadOptions = {
  key: UploadKey;
  setPreview: (val: string) => void;
  mutation: ReturnType<typeof tanstackClient.useMutation>['mutate'];
  onChange: (val: string) => void;
};

export const CourseBrandingForm = forwardRef<CourseFormRef, CourseFormProps>(
  ({ showSubmitButton, initialValues, editingCourseId, successResponse }, _ref) => {
    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        name: '',
        description: '',
        is_free: false,
        objectives: '',
        categories: [],
        class_limit: 30,
        prerequisites: '',
        age_lower_limit: 5,
        age_upper_limit: 70,
        thumbnail_url: '',
        banner_url: '',
        intro_video_url: '',
        duration_hours: 0,
        duration_minutes: 1,
        minimum_training_fee: 0,
        creator_share_percentage: 50,
        instructor_share_percentage: 50,
        revenue_share_notes: '',
        training_requirements: [],
        ...initialValues,
      },
      mode: 'onChange',
    });

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;
    const _authorName = courseCreatorProfile?.full_name ?? instructor?.full_name ?? '';
    const _authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';

    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const courseBannerMutation = tanstackClient.useMutation(
      'post',
      '/api/v1/courses/{uuid}/banner'
    );
    const courseThumbnailMutation = tanstackClient.useMutation(
      'post',
      '/api/v1/courses/{uuid}/thumbnail'
    );
    const courseIntroVideoMutation = tanstackClient.useMutation(
      'post',
      '/api/v1/courses/{uuid}/intro-video'
    );

    const handleFileUpload = async (
      e: React.ChangeEvent<HTMLInputElement>,
      { key, setPreview, mutation, onChange }: UploadOptions
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

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

      const formData = new FormData();
      formData.append(key, file);

      mutation(
        { body: formData, params: { path: { uuid: editingCourseId as string } } },
        {
          onSuccess: (data: any) => {
            const urlKey = `${key}_url` as const;
            const uploadedUrl = data?.data?.[urlKey];

            if (!uploadedUrl) {
              toast.error('Upload succeeded, but no URL returned.');
              return;
            }

            onChange(uploadedUrl);
            toast.success(data?.message);

            queryClient.invalidateQueries({
              queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId as string } }),
            });
          },
          onError: (error: any) => {
            const status = error?.response?.status;
            if (status === 413) {
              toast.error('File too large.');
            } else {
              toast.error('Upload failed.');
            }
          },
        }
      );
    };

    const _updateCourse = useMutation(updateCourseMutation());

    const onSubmit = (_data: CourseCreationFormValues) => {
      if (!editingCourseId) return;
    };

    useEffect(() => {
      const thumbnail = initialValues?.thumbnail_url || form.getValues('thumbnail');
      const banner = initialValues?.banner_url || form.getValues('banner');
      const video = initialValues?.intro_video_url || form.getValues('intro_video');

      if (thumbnail && !thumbnailPreview) {
        setThumbnailPreview(thumbnail);
      }

      if (banner && !bannerPreview) {
        setBannerPreview(banner);
      }

      if (video && !videoPreview) {
        setVideoPreview(video);
      }
    }, [form, thumbnailPreview, bannerPreview, videoPreview, initialValues]);

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
                      {/* Stylish Upload Area */}
                      <div>
                        <label
                          htmlFor='introVideoUpload'
                          className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-400/60 px-4 py-10 text-center text-blue-500 transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-blue-300/30 dark:hover:border-blue-100 dark:hover:bg-blue-900/10'
                        >
                          {/* Icon */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-12 w-12 text-blue-400 dark:text-blue-200'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M15.75 10.5V6.75A2.25 2.25 0 0013.5 4.5h-6A2.25 2.25 0 005.25 6.75v10.5A2.25 2.25 0 007.5 19.5h6a2.25 2.25 0 002.25-2.25v-3.75m0-2.25l5.25-3v9l-5.25-3z'
                            />
                          </svg>

                          <p className='text-sm font-medium'>
                            <span className='text-blue-600 dark:text-blue-200'>
                              Click to upload
                            </span>{' '}
                            or drag a video file here
                          </p>

                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            MP4 up to {MAX_VIDEO_SIZE_MB}MB
                          </p>
                        </label>

                        {/* Hidden File Input */}
                        <Input
                          id='introVideoUpload'
                          type='file'
                          accept='video/*'
                          className='hidden'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'intro_video',
                              setPreview: setVideoPreview,
                              mutation: courseIntroVideoMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
                      </div>

                      {/* OR text input for video URL */}
                      <Input
                        type='text'
                        placeholder='Or paste video link (e.g. Vimeo, YouTube)'
                        value={field.value}
                        onChange={field.onChange}
                      />

                      {/* Video Preview */}
                      {videoPreview && (
                        <video controls className='w-full max-w-md rounded shadow'>
                          <source src={videoPreview} type='video/mp4' />
                          Your browser does not support the video tag.
                        </video>
                      )}
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
                      {/* Stylish Banner Upload */}
                      <div>
                        <label
                          htmlFor='bannerUpload'
                          className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-400/60 px-4 py-10 text-center text-blue-500 transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-blue-300/30 dark:hover:border-blue-100 dark:hover:bg-blue-900/10'
                        >
                          {/* Icon */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-12 w-12 text-blue-400 dark:text-blue-200'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M3.75 4.5h16.5m-16.5 0A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5m-16.5 0v2.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V4.5'
                            />
                          </svg>

                          <p className='text-sm font-medium'>
                            <span className='text-blue-600 dark:text-blue-200'>
                              Click to upload
                            </span>{' '}
                            or drag a banner image here
                          </p>

                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            PNG or JPG, recommended ratio 4:1
                          </p>
                        </label>

                        {/* Hidden File Input */}
                        <Input
                          id='bannerUpload'
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'banner',
                              setPreview: setBannerPreview,
                              mutation: courseBannerMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
                      </div>

                      {bannerPreview && (
                        <div className='h-24 w-full max-w-3xl overflow-hidden rounded border'>
                          <Image
                            src={bannerPreview}
                            alt='Banner Preview'
                            width={1200}
                            height={300}
                            className='h-full w-full object-contain'
                          />
                        </div>
                      )}
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
                      {/* Stylish Thumbnail Upload */}
                      <div>
                        <label
                          htmlFor='thumbnailUpload'
                          className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-400/60 px-4 py-10 text-center text-blue-500 transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-blue-300/30 dark:hover:border-blue-100 dark:hover:bg-blue-900/10'
                        >
                          {/* Icon */}
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-12 w-12 text-blue-400 dark:text-blue-200'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M3 5.25C3 4.007 4.007 3 5.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25zM7.5 12l2.25 2.25L13.5 10.5l4.5 6H6l1.5-4.5z'
                            />
                          </svg>

                          <p className='text-sm font-medium'>
                            <span className='text-blue-600 dark:text-blue-200'>
                              Click to upload
                            </span>{' '}
                            or drag an image here
                          </p>

                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            PNG or JPG up to 15MB
                          </p>
                        </label>

                        {/* Hidden File Input */}
                        <Input
                          id='thumbnailUpload'
                          type='file'
                          accept='image/*'
                          className='hidden'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'thumbnail',
                              setPreview: setThumbnailPreview,
                              mutation: courseThumbnailMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
                      </div>

                      {thumbnailPreview && (
                        <div className='h-32 w-48 overflow-hidden rounded border'>
                          <Image
                            src={thumbnailPreview}
                            width={192}
                            height={128}
                            alt='Thumbnail Preview'
                            className='h-full w-full object-cover'
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>
        </form>
      </Form>
    );
  }
);

CourseBrandingForm.displayName = 'CourseBrandingForm';

export default CourseBrandingForm;
