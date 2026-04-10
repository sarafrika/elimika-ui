'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { createCategory, updateCourse } from '@/services/client';
import {
  addCourseTrainingRequirementMutation,
  createCourseMutation,
  deleteCourseTrainingRequirementMutation,
  getAllCategoriesOptions,
  getAllCategoriesQueryKey,
  getCourseByUuidQueryKey,
  getCourseTrainingRequirementsOptions,
  searchCoursesQueryKey,
  updateCourseTrainingRequirementMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, CourseTrainingRequirement } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Plus, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type Dispatch,
  forwardRef,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type CourseCreationFormValues,
  courseCreationSchema,
  emptyRequirement,
} from './course-creation-types';
import {
  createEmptyDraftsByProvider,
  type DraftsByProvider,
  type Provider,
  TrainingRequirementsSection,
} from './training-requirement-section';

type MutationPayload = Record<string, unknown>;
type CategoryItem = { uuid?: string; name?: string };
type DifficultyLevelItem = { uuid?: string; name?: string };
type CategoryMutationResponse = { error?: Record<string, unknown>; message?: string };

const getFormErrorMessage = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find(item => typeof item === 'string');
  return undefined;
};

export type FormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <section className='border-border rounded-3xl border p-6 shadow-lg transition'>
    <div className='flex flex-col gap-6 lg:flex-col lg:items-start lg:gap-4'>
      <div className='flex flex-col'>
        <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      <div className='w-full lg:flex-1'>{children}</div>
    </div>
  </section>
);

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  requirementDrafts?: DraftsByProvider;
  setRequirementDrafts?: Dispatch<SetStateAction<DraftsByProvider>>;
  activeRequirementProvider?: Provider | null;
  setActiveRequirementProvider?: Dispatch<SetStateAction<Provider | null>>;
  successResponse?: (data: Course) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

// ── Saving overlay ────────────────────────────────────────────────────────────
type SaveStage = 'course' | 'requirements' | 'redirecting' | null;

function SavingOverlay({ stage }: { stage: SaveStage }) {
  if (!stage) return null;

  const steps: { key: SaveStage; label: string }[] = [
    { key: 'course', label: 'Creating your course…' },
    { key: 'requirements', label: 'Saving training requirements…' },
    { key: 'redirecting', label: 'Almost there! Opening your course…' },
  ];

  const currentIndex = steps.findIndex(s => s.key === stage);

  return (
    <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
      <div className='bg-card border-border flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border p-8 shadow-2xl'>
        <div className='relative flex h-16 w-16 items-center justify-center'>
          <div className='border-primary absolute inset-0 animate-spin rounded-full border-2 border-t-transparent' />
          <Loader2 className='text-primary h-7 w-7 animate-spin' />
        </div>

        <div className='w-full space-y-3'>
          {steps.map((step, i) => {
            const isDone = i < currentIndex;
            const isActive = i === currentIndex;
            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 transition-opacity duration-300 ${isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-25'
                  }`}
              >
                {isDone ? (
                  <CheckCircle2 className='h-4 w-4 shrink-0 text-green-500' />
                ) : isActive ? (
                  <Loader2 className='text-primary h-4 w-4 shrink-0 animate-spin' />
                ) : (
                  <div className='border-muted-foreground h-4 w-4 shrink-0 rounded-full border-2' />
                )}
                <span
                  className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Requirement form ──────────────────────────────────────────────────────────
// Tracks whether we're adding a new req or editing an existing one.
type RequirementFormMode = 'add' | 'edit';

// ─────────────────────────────────────────────────────────────────────────────

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CourseCreationForm(
    {
      showSubmitButton,
      initialValues,
      editingCourseId,
      courseId,
      requirementDrafts,
      setRequirementDrafts,
      activeRequirementProvider,
      setActiveRequirementProvider,
      successResponse,
    },
    ref
  ) {
    const qc = useQueryClient();
    const router = useRouter();
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const [saveStage, setSaveStage] = useState<SaveStage>(null);

    // Controls whether the inline requirement form is visible
    const [showRequirementForm, setShowRequirementForm] = useState(false);
    // null = adding new; string uuid = editing that requirement
    const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
    const requirementMode: RequirementFormMode = editingRequirementId ? 'edit' : 'add';

    const [existingRequirements, setExistingRequirements] = useState<CourseTrainingRequirement[]>(
      []
    );
    const controlledRequirementDrafts = requirementDrafts ?? createEmptyDraftsByProvider();
    const controlledSetRequirementDrafts =
      setRequirementDrafts ?? (() => undefined);
    const controlledActiveRequirementProvider = activeRequirementProvider ?? null;
    const controlledSetActiveRequirementProvider =
      setActiveRequirementProvider ?? (() => undefined);

    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        name: '',
        description: '',
        is_free: false,
        objectives: '',
        categories: [],
        class_limit: 1,
        prerequisites: '',
        age_lower_limit: 1,
        age_upper_limit: 1,
        thumbnail_url: '',
        banner_url: '',
        intro_video_url: '',
        duration_hours: 0,
        duration_minutes: 1,
        minimum_training_fee: 0,
        creator_share_percentage: 50,
        instructor_share_percentage: 50,
        revenue_share_notes: '',
        language: '',
        learning_rules: {
          completion_rules_enabled: false,
          drip_schedule_enabled: false,
          prerequisites_required: false,
        },
        training_requirement: emptyRequirement,
        ...initialValues,
      },
      mode: 'onChange',
    });

    useEffect(() => {
      if (initialValues && Object.keys(initialValues).length > 0) {
        form.reset({
          ...form.getValues(),
          ...initialValues,
        });
      }
    }, [initialValues, form]);

    const appendCategory = (uuid: string) => {
      form.setValue('categories', [...form.getValues('categories'), uuid], {
        shouldDirty: true,
        shouldValidate: true,
      });
    };

    const removeCategory = (index: number) => {
      form.setValue(
        'categories',
        form.getValues('categories').filter((_, categoryIndex) => categoryIndex !== index),
        { shouldDirty: true, shouldValidate: true }
      );
    };

    const { data: trainingRequirements } = useQuery({
      ...getCourseTrainingRequirementsOptions({
        path: { courseUuid: courseId || editingCourseId || '' },
        query: { pageable: {} },
      }),
      enabled: !!courseId || !!editingCourseId,
    });

    useEffect(() => {
      if (trainingRequirements?.data?.content) {
        setExistingRequirements(trainingRequirements.data.content);
      }
    }, [trainingRequirements]);

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;

    const authorName = courseCreatorProfile?.full_name ?? instructor?.full_name ?? '';
    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';
    const { setActiveStep } = useStepper();
    const { difficultyLevels, isLoading: difficultyIsLoading } = useDifficultyLevels();

    const [categoryInput, setCategoryInput] = useState('');

    const { mutate: createCategoryMutation, isPending: createCategoryPending } = useMutation({
      mutationFn: ({ body }: { body: { name: string } }) => createCategory({ body }),
      onSuccess: (data: CategoryMutationResponse) => {
        if (data?.error) {
          const duplicateMessage = getFormErrorMessage(data.error.error);
          if (duplicateMessage?.toLowerCase().includes('duplicate key')) {
            toast.error('Category already exists');
          } else {
            toast.error('Failed to add category');
          }
          dialogCloseRef.current?.click();
          setCategoryInput('');
          return;
        }
        toast.success(data?.message || 'Category added successfully');
        dialogCloseRef.current?.click();
        queryClient.invalidateQueries({
          queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } }),
        });
        setCategoryInput('');
      },
    });

    const { mutate: createCourse, isPending: createCourseIsPending } =
      useMutation(createCourseMutation());

    const { mutate: updateCourseMutation, isPending: updateCourseIsPending } = useMutation({
      mutationFn: ({ body, uuid }: { body: MutationPayload; uuid: string }) =>
        updateCourse({ body: body as never, path: { uuid } }),
    });

    const addTrainingReqMut = useMutation(addCourseTrainingRequirementMutation());
    const updateTrainingReqMut = useMutation(updateCourseTrainingRequirementMutation());

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const deleteTrainingReqMut = useMutation(deleteCourseTrainingRequirementMutation());

    const { data: categories } = useQuery(
      getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const creatorShare = form.watch('creator_share_percentage');
    const instructorShare = form.watch('instructor_share_percentage');

    useEffect(() => {
      if (typeof instructorShare === 'number' && instructorShare >= 0 && instructorShare <= 100) {
        const calculated = 100 - instructorShare;
        if (form.getValues('creator_share_percentage') !== calculated) {
          form.setValue('creator_share_percentage', calculated, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }, [instructorShare, form]);

    useEffect(() => {
      if (typeof creatorShare === 'number' && creatorShare >= 0 && creatorShare <= 100) {
        const calculated = 100 - creatorShare;
        if (form.getValues('instructor_share_percentage') !== calculated) {
          form.setValue('instructor_share_percentage', calculated, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }, [creatorShare, form]);

    const onSubmit = (data: CourseCreationFormValues) => {
      const resolvedCourseCreatorUuid = authorUuid;

      if (!resolvedCourseCreatorUuid) {
        toast.error('Course creator profile is missing.');
        return;
      }

      const totalShare =
        Number(data?.creator_share_percentage || 0) +
        Number(data?.instructor_share_percentage || 0);

      if (Math.abs(totalShare - 100) > 0.01) {
        toast.error('Creator and instructor shares must add up to 100%.');
        return;
      }

      // ── EDIT ──────────────────────────────────────────────────────────────
      if (editingCourseId) {
        const editBody = {
          total_duration_display: '',
          created_by: authorName,
          updated_by: authorName,
          course_creator_uuid: resolvedCourseCreatorUuid,
          name: data?.name,
          description: data?.description,
          objectives: data?.objectives,
          thumbnail_url: data?.thumbnail_url,
          banner_url: data?.banner_url,
          intro_video_url: data?.intro_video_url,
          category_uuids: data?.categories,
          difficulty_uuid: data?.difficulty,
          prerequisites: data?.prerequisites,
          duration_hours: data?.duration_hours,
          duration_minutes: data?.duration_minutes,
          class_limit: data?.class_limit,
          minimum_training_fee: data?.minimum_training_fee,
          creator_share_percentage: data?.creator_share_percentage,
          instructor_share_percentage: data?.instructor_share_percentage,
          revenue_share_notes: data?.revenue_share_notes,
          status: 'draft',
          active: false,
          is_free: data?.is_free,
          is_published: false,
          is_draft: true,
          age_lower_limit: data?.age_lower_limit,
          age_upper_limit: data?.age_upper_limit,
        };

        setSaveStage('course');
        updateCourseMutation(
          { body: editBody as MutationPayload, uuid: editingCourseId },
          {
            onSuccess(data) {
              const respObj = data?.data;
              const errorObj = data?.error;

              setSaveStage('redirecting');
              setTimeout(() => setSaveStage(null), 500);

              if (respObj) {
                toast.success(data?.data?.message);
                queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: courseId as string } }),
                });
                return;
              }

              if (errorObj && typeof errorObj === 'object') {
                Object.values(errorObj).forEach(errorMsg => {
                  if (typeof errorMsg === 'string') toast.error(errorMsg);
                });
                return;
                // @ts-expect-error
              } else if (data?.message) {
                // @ts-expect-error
                toast.error(data.message);
              } else {
                toast.error('An unknown error occurred.');
              }
            },
          }
        );
        return;
      }

      // ── CREATE ─────────────────────────────────────────────────────────────
      setSaveStage('course');

      createCourse(
        {
          body: {
            total_duration_display: '',
            updated_by: authorName,
            created_by: authorName,
            course_creator_uuid: resolvedCourseCreatorUuid,
            name: data?.name,
            description: data?.description,
            objectives: data?.objectives,
            category_uuids: data?.categories,
            difficulty_uuid: data?.difficulty,
            prerequisites: data?.prerequisites,
            duration_hours: 0,
            duration_minutes: 0,
            class_limit: data?.class_limit,
            minimum_training_fee: data?.minimum_training_fee,
            creator_share_percentage: data?.creator_share_percentage,
            instructor_share_percentage: data?.instructor_share_percentage,
            revenue_share_notes: data?.revenue_share_notes,
            thumbnail_url: '',
            banner_url: '',
            intro_video_url: '',
            status: 'draft',
            active: false,
            is_free: data?.is_free,
            is_published: false,
            is_draft: true,
            age_lower_limit: data?.age_lower_limit,
            age_upper_limit: data?.age_upper_limit,
          } as never,
        },
        {
          onError(error) {
            setSaveStage(null);
            toast.error(error?.message);
          },
          onSuccess: courseResponse => {
            const newCourseUuid = courseResponse?.data?.uuid as string;

            queryClient.invalidateQueries({
              queryKey: getCourseByUuidQueryKey({ path: { uuid: newCourseUuid } }),
            });
            queryClient.invalidateQueries({
              queryKey: searchCoursesQueryKey({
                query: {
                  searchParams: { course_creator_uuid_eq: resolvedCourseCreatorUuid },
                  pageable: {},
                },
              }),
            });

            if (typeof successResponse === 'function') {
              successResponse(courseResponse);
            }

            console.log(newCourseUuid, "id here")

            setSaveStage('redirecting');
            setTimeout(() => {
              router.replace(`/dashboard/course-management/create-new-course?id=${newCourseUuid}`);
            }, 600);
          },
        }
      );
    };

    const onError = (errors: Record<string, unknown>) => {
      if (Object.keys(errors).length > 0) {
        toast.error('Please fill in all required fields.');
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }));

    const isFree = form.watch('is_free');

    useEffect(() => {
      if (isFree) {
        form.setValue('price', 0);
        form.setValue('sale_price', 0);
      }
    }, [isFree, form]);

    const isSaving = !!saveStage;
    const isRequirementSaving = addTrainingReqMut.isPending || updateTrainingReqMut.isPending;

    return (
      <>
        <SavingOverlay stage={saveStage} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className='bg-card max-w-4xl space-y-6 rounded-[32px] transition'
          >
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
                      <SimpleEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        {(categories?.data?.content as CategoryItem[] | undefined)
                          ?.filter(
                            (cat: CategoryItem) =>
                              !form.watch('categories').includes(cat.uuid ?? '')
                          )
                          .map((cat: CategoryItem) => (
                            <SelectItem key={cat.uuid} value={cat.uuid as string}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </div>
                    </SelectContent>
                  </Select>

                  <div className='hidden'>
                    <Dialog>
                      <DialogTrigger className='hidden sm:flex' asChild>
                        <Button variant='outline' className='hidden sm:flex'>
                          Add new
                        </Button>
                      </DialogTrigger>
                      <DialogTrigger className='flex sm:hidden' asChild>
                        <Button variant='outline' className='flex sm:hidden'>
                          <Plus />
                        </Button>
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
                          <DialogClose asChild>
                            <button ref={dialogCloseRef} style={{ display: 'none' }} />
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </FormItem>

              <div className='flex flex-wrap gap-2'>
                {form.watch('categories').map((uuid: string, index: number) => {
                  const cat = (categories?.data?.content as CategoryItem[] | undefined)?.find(
                    (c: CategoryItem) => c.uuid === uuid
                  );
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

            {/* Learning Objectives */}
            <FormSection
              title='Learning Outcomes'
              description='List what students will learn from your course'
            >
              <FormField
                control={form.control}
                name='objectives'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SimpleEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
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
            </FormSection>

            {/* Course Duration */}
            <FormSection
              title='Course Duration'
              description='Set the time duration for your course'
            >
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormField
                  control={form.control}
                  name='duration_hours'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Hours</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='duration_minutes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration Minutes</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <Spinner />
                        </SelectContent>
                      ) : (
                        <SelectContent>
                          {Array.isArray(difficultyLevels) &&
                            difficultyLevels.map((level: DifficultyLevelItem) => (
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
                      <SimpleEditor value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title='Training Requirements'
              description='Add required resources or facilities for this course, grouped by who provides them.'
            >
              <TrainingRequirementsSection
                existingRequirements={existingRequirements}
                setExistingRequirements={setExistingRequirements}
                editingCourseId={editingCourseId}
                courseId={courseId}
                draftsByProvider={controlledRequirementDrafts}
                setDraftsByProvider={controlledSetRequirementDrafts}
                activeProvider={controlledActiveRequirementProvider}
                setActiveProvider={controlledSetActiveRequirementProvider}
                addTrainingReqMut={addTrainingReqMut}
                updateTrainingReqMut={updateTrainingReqMut}
                deleteTrainingReqMut={deleteTrainingReqMut}
                deletingId={deletingId}
                setDeletingId={setDeletingId}
                qc={qc}
              />
            </FormSection>

            {showSubmitButton && (
              <div className='xxs:flex-col flex flex-col justify-center gap-4 pt-6 sm:flex-row sm:justify-end'>
                <Button
                  type='submit'
                  className='min-w-32'
                  disabled={createCourseIsPending || updateCourseIsPending || isSaving}
                >
                  {isSaving ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Saving…
                    </span>
                  ) : (
                    'Save Course'
                  )}
                </Button>

                <Button
                  disabled={!editingCourseId}
                  onClick={() => setActiveStep(1)}
                  className='min-w-32'
                >
                  Continue →
                </Button>
              </div>
            )}
          </form>
        </Form>
      </>
    );
  }
);

export default CourseCreationForm;
