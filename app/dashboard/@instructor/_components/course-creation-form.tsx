'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useStepper } from '@/components/ui/stepper';
import { useInstructor } from '@/context/instructor-context';
import { tanstackClient } from '@/services/api/tanstack-client';
import {
  createCategory,
  createCourse,
  getAllCategories,
  getAllDifficultyLevels,
  updateCourse,
} from '@/services/client';
import {
  getAllCategoriesQueryKey,
  getCoursesByInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Dynamically import with SSR disabled
const WysiwygRichTextEditor = dynamic(
  () => import('../../../../components/editors/wysiwygRichTextEditor'),
  {
    ssr: false,
  }
);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 4MB
const MAX_VIDEO_SIZE_MB = 150; // Adjust according to your backend limit
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const courseCreationSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().min(10, 'Course description is required'),
  objectives: z.string().min(10, 'Course objectives is required'),
  thumbnail_url: z.any().optional(),
  banner_url: z.any().optional(),
  intro_video_url: z.any().optional(),
  is_free: z.boolean().default(false),
  price: z.coerce.number().optional(),
  sale_price: z.coerce.number().optional(),
  currency: z.string().optional(),
  prerequisites: z.string().optional(),
  categories: z.string().array(),
  difficulty: z.string().min(1, 'Please select a difficulty level'),
  class_limit: z.coerce.number().min(1, 'Class limit must be at least 1'),
  age_lower_limit: z.any().optional(),
  age_upper_limit: z.any().optional(),
});

type CourseCreationFormValues = z.infer<typeof courseCreationSchema> & { [key: string]: any };

const CURRENCIES = {
  KES: 'KES',
} as const;

type FormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const FormSection = ({ title, description, children }: FormSectionProps) => (
  <div className='block lg:flex lg:items-start lg:space-x-4'>
    <div className='w-full lg:w-1/4'>
      <h3 className='leading-none font-semibold tracking-tight'>{title}</h3>
      <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
    </div>
    <div className='w-full lg:w-3/4'>{children}</div>
  </div>
);

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  onSuccess?: (data: any) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CourseCreationForm(
    { showSubmitButton, initialValues, editingCourseId, courseId, onSuccess },
    ref
  ) {
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

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
        age_lower_limit: '',
        age_upper_limit: '',
        thumbnail_url: '',
        banner_url: '',
        intro_video_url: '',
        ...initialValues,
      },
      mode: 'onChange',
    });

    const {
      // fields: categoryFields,
      append: appendCategory,
      remove: removeCategory,
    } = useFieldArray({
      control: form.control,
      name: 'categories',
    });

    type UploadKey = 'thumbnail' | 'banner' | 'intro_video';

    type UploadOptions = {
      key: UploadKey;
      setPreview: (val: string) => void;
      mutation: any;
      onChange: (val: string) => void;
    };

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const { setActiveStep } = useStepper();

    // states
    const [categoryInput, setCategoryInput] = useState('');
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [uploadedUrls, setUploadedUrls] = useState<{
      thumbnail?: string;
      banner?: string;
      intro_video?: string;
    }>({});

    // Mutations
    const { mutate: createCategoryMutation, isPending: createCategoryPending } = useMutation({
      mutationFn: ({ body }: { body: any }) => createCategory({ body }),
      onSuccess: (data: any) => {
        toast.success(data?.message);
        dialogCloseRef.current?.click();
        queryClient.invalidateQueries({ queryKey: [getAllCategoriesQueryKey] });
        setCategoryInput('');
      },
    });

    const { mutate: createCourseMutation, isPending: createCourseIsPending } = useMutation({
      mutationFn: ({ body }: { body: any }) => createCourse({ body }),
      onSuccess: (data: any) => {
        toast.success(data?.data?.message);
        setActiveStep(1);

        if (typeof onSuccess === 'function') {
          onSuccess(data?.data);
        }
      },
    });

    const { mutate: updateCourseMutation, isPending: updateCourseIsPending } = useMutation({
      mutationFn: ({ body, uuid }: { body: any; uuid: string }) =>
        updateCourse({ body, path: { uuid: uuid } }),
      onSuccess: (data: any) => {
        toast.success(data?.data?.message);
        setActiveStep(1);
        queryClient.invalidateQueries({
          queryKey: [getCoursesByInstructorQueryKey, data?.data?.data?.uuid],
        });

        if (typeof onSuccess === 'function') {
          onSuccess(data?.data);
        }
      },
    });

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

    // Queries
    const { data: difficulty, isLoading: difficultyIsLoading } = useQuery({
      queryKey: ['getAllDifficulties'],
      queryFn: () => getAllDifficultyLevels({}).then(res => res.data),
    });
    const difficultyLevels = difficulty?.data;

    const { data: categories, refetch: refetchCategories } = useQuery({
      queryKey: ['getAllCategories'],
      queryFn: () =>
        getAllCategories({
          query: {
            page: 0,
            size: 100,
          },
        }).then(res => res.data),
    });

    // actions
    const handleFileUpload = async (
      e: React.ChangeEvent<HTMLInputElement>,
      { key, setPreview, mutation, onChange }: UploadOptions
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (key === 'intro_video' && file.size > MAX_VIDEO_SIZE_BYTES) {
        toast.error(`Video file is too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`);
        return;
      }

      try {
        const schema = z.object({ [key]: z.instanceof(File) });
        schema.parse({ [key]: file });
      } catch (err) {
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
            onChange(previewUrl);
            toast.success(data?.message);

            const urls = data?.data;

            setUploadedUrls(prev => ({
              ...prev,
              [key]: urls?.[`${key}_url`],
            }));
          },
          onError: (error: any) => {
            if (error?.response?.status === 413) {
              toast.error('Video file is too large. Please upload a smaller file.');
            } else {
              toast.error('Failed to upload file.');
            }
          },
        }
      );
    };

    const onSubmit = (data: CourseCreationFormValues) => {
      if (editingCourseId) {
        const editBody = {
          total_duration_display: '',
          created_by: instructor?.full_name,
          updated_by: instructor?.full_name,
          instructor_uuid: instructor?.uuid,
          name: data?.name,
          description: data?.description,
          objectives: data?.objectives,
          thumbnail_url: uploadedUrls?.thumbnail || data?.thumbnail_url,
          banner_url: uploadedUrls?.banner || data?.banner_url,
          intro_video_url: uploadedUrls.intro_video || data?.intro_video_url,
          category_uuids: data?.categories,
          difficulty_uuid: data?.difficulty,
          prerequisites: data?.prerequisites,
          duration_hours: 2,
          duration_minutes: 0,
          class_limit: data?.class_limit,
          price: data?.price,
          status: 'draft',
          active: false,
          is_free: data?.is_free,
          is_published: false,
          is_draft: true,
          age_lower_limit: data?.age_lower_limit,
          age_upper_limit: data?.age_upper_limit,
        };

        updateCourseMutation({ body: editBody as any, uuid: editingCourseId });
      }

      if (!editingCourseId) {
        createCourseMutation({
          body: {
            total_duration_display: '',
            updated_by: instructor?.full_name,
            created_by: instructor?.full_name,
            instructor_uuid: instructor?.uuid as string,
            name: data?.name,
            description: data?.description,
            objectives: data?.objectives,
            category_uuids: data?.categories,
            difficulty_uuid: data?.difficulty,
            prerequisites: data?.prerequisites,
            duration_hours: 2,
            duration_minutes: 0,
            class_limit: data?.class_limit,
            price: data?.price,
            thumbnail_url: thumbnailPreview as any,
            banner_url: bannerPreview as any,
            intro_video_url: '',
            status: 'draft',
            active: false,
            is_free: data?.is_free,
            is_published: false,
            is_draft: true,
            age_lower_limit: data?.age_lower_limit,
            age_upper_limit: data?.age_upper_limit,
          },
        });
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }));

    const isFree = form.watch('is_free');

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
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          {/* Course Name */}
          <FormSection
            title='Course Name'
            description='This will be the name of your course, visible to students and instructors.'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Enter course name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Course Description */}
          <FormSection
            title='Course Description'
            description='A brief description of what this course covers'
          >
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Intro Video */}
          {editingCourseId && (
            <FormSection
              title='Intro Video'
              description='Upload an introductory video for your course'
            >
              <FormField
                control={form.control}
                name='intro_video_url'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='flex flex-col gap-4'>
                        <Input
                          type='file'
                          accept='video/*'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'intro_video',
                              setPreview: setVideoPreview,
                              mutation: courseIntroVideoMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
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
          )}

          {/* Banner */}
          {editingCourseId && (
            <FormSection
              title='Course Banner'
              description='Upload a banner cover image for your course'
            >
              <FormField
                control={form.control}
                name='banner_url'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='flex flex-col gap-4'>
                        <Input
                          type='file'
                          accept='image/*'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'banner',
                              setPreview: setBannerPreview,
                              mutation: courseBannerMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
                        {bannerPreview && (
                          <div className='h-32 w-48 overflow-hidden rounded border'>
                            <Image
                              src={bannerPreview}
                              alt='Banner Preview'
                              height={32}
                              width={48}
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
          )}

          {/* Thumbnail */}
          {editingCourseId && (
            <FormSection
              title='Course Thumbnail'
              description='Upload a cover image for your course'
            >
              <FormField
                control={form.control}
                name='thumbnail_url'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='flex flex-col gap-4'>
                        <Input
                          type='file'
                          accept='image/*'
                          onChange={e =>
                            handleFileUpload(e, {
                              key: 'thumbnail',
                              setPreview: setThumbnailPreview,
                              mutation: courseThumbnailMutation.mutate,
                              onChange: field.onChange,
                            })
                          }
                        />
                        {thumbnailPreview && (
                          <div className='h-32 w-48 overflow-hidden rounded border'>
                            <Image
                              src={thumbnailPreview}
                              width={48}
                              height={32}
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
          )}

          {/* Learning Objectives */}
          <FormSection
            title='Learning Objectives'
            description='List what students will learn from your course'
          >
            <FormField
              control={form.control}
              name='objectives'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Prerequisites */}
          <FormSection
            title='Course Prerequisites'
            description='Outline the knowledge or skills students should have before starting this course.'
          >
            <FormField
              control={form.control}
              name='prerequisites'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Pricing */}
          <FormSection title='Course Pricing' description='Set the pricing details for your course'>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='is_free'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Free Course</FormLabel>
                      <FormDescription>Make this course available for free</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='price'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Price</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.01' {...field} disabled={isFree} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='sale_price'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='0.01' {...field} disabled={isFree} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='currency'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isFree}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select currency' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CURRENCIES).map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Categories */}
          <FormSection
            title='Course Categories'
            description='Add relevant categories for your course'
          >
            <FormItem>
              <div className='mb-4 flex items-center gap-2'>
                <Select
                  value=''
                  onValueChange={uuid => {
                    if (uuid && !form.watch('categories').includes(uuid)) {
                      appendCategory(uuid);
                    }
                  }}
                >
                  <FormControl className='w-full'>
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className='max-h-[250px] overflow-auto'>
                      {/* @ts-ignore */}
                      {categories?.data?.content
                        ?.filter((cat: any) => !form.watch('categories').includes(cat.uuid))
                        .map((cat: any) => (
                          <SelectItem key={cat.uuid} value={cat.uuid}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </div>
                  </SelectContent>
                </Select>
                {/* Dialog to add new category */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='outline'>Add new</Button>
                  </DialogTrigger>
                  <DialogContent className='w-full sm:max-w-[350px]'>
                    <DialogHeader>
                      <DialogTitle>Add new category</DialogTitle>
                      <DialogDescription>Add a new category here.</DialogDescription>
                    </DialogHeader>
                    <div className='flex w-full items-center gap-2 py-2'>
                      <div className='grid w-full gap-3'>
                        <Label htmlFor='category-name'>Category Name</Label>
                        <Input
                          id='category-name'
                          name='category'
                          value={categoryInput}
                          onChange={e => setCategoryInput(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <DialogFooter className='justify-end'>
                      <Button
                        type='button'
                        className='min-w-[75px]'
                        onClick={() => {
                          if (categoryInput?.trim()) {
                            createCategoryMutation({ body: { name: categoryInput.trim() } });
                          }
                        }}
                      >
                        {createCategoryPending ? <Spinner /> : 'Add'}
                      </Button>

                      {/* Hidden button that will close the dialog when clicked */}
                      <DialogClose asChild>
                        <button ref={dialogCloseRef} style={{ display: 'none' }} />
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </FormItem>

            {/* Show badges of selected categories */}
            <div className='flex flex-wrap gap-2'>
              {form.watch('categories').map((uuid: string, index: number) => {
                //@ts-ignore
                const cat = categories?.data?.content?.find((c: any) => c.uuid === uuid);
                if (!cat) return null;
                return (
                  <Badge key={uuid} variant='secondary' className='flex items-center gap-1'>
                    {cat.name}
                    <button
                      type='button'
                      className='ml-2'
                      onClick={() => removeCategory(index)}
                      aria-label={`Remove category ${cat.name}`}
                    >
                      <XIcon className='h-3 w-3' />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </FormSection>

          {/* Difficulty Level */}
          <FormSection
            title='Difficulty Level'
            description='Set the difficulty level of your course'
          >
            <FormField
              control={form.control}
              name='difficulty'
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select difficulty level' />
                      </SelectTrigger>
                    </FormControl>
                    {difficultyIsLoading ? (
                      <SelectContent>
                        <div>Loading...</div>
                      </SelectContent>
                    ) : (
                      <SelectContent>
                        {Array.isArray(difficultyLevels) &&
                          difficultyLevels.map((level: any) => (
                            <SelectItem key={level.uuid} value={level.uuid as string}>
                              {level.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    )}
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Class Limit */}
          <FormSection
            title='Class Limit'
            description='Set the maximum number of students allowed to enroll'
          >
            <FormField
              control={form.control}
              name='class_limit'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type='number'
                      min='1'
                      placeholder='Maximum number of students'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Age Limit */}
          <FormSection title='Age Limit' description='Set the age limit for your course'>
            <div className='space-y-0'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='age_lower_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Lower Limit</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='age_upper_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Upper Limit</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {showSubmitButton && (
            <div className='flex justify-end gap-4 pt-6'>
              <Button type='submit' className='min-w-32'>
                {createCourseIsPending || updateCourseIsPending ? <Spinner /> : 'Save Course'}
              </Button>
              <Button
                disabled={!editingCourseId}
                onClick={() => setActiveStep(1)}
                className='min-w-32'
              >
                {'Continue →'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

export default CourseCreationForm;
