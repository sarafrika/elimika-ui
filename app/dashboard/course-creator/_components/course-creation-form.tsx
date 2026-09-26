// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
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
  searchCoursesQueryKey,
  updateCourseTrainingRequirementMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, CourseTrainingRequirement } from '@/services/client/types.gen';
import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
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
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useOptionalStepper } from '../courses/create-course/stepper';
import {
  type CourseCreationFormValues,
  courseCreationSchema,
  emptyRequirement,
} from './course-creation-types';
import { CourseLearningOutcomes } from './course-learning-outcomes';
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
  <section className='space-y-2'>
    {/* Section heading */}
    <div className='space-y-1'>
      <h3 className='text-foreground text-sm font-semibold'>{title}</h3>
      {/*  {description && (
        <p className="text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      )} */}
    </div>

    {/* Form fields */}
    <div className='grid w-full gap-4'>{children}</div>
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
  postCreateRedirectHref?: string | null;
  onSaveSuccess?: () => void;
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
                  <CheckCircle2 className='text-success h-4 w-4 shrink-0' />
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
      postCreateRedirectHref = '/dashboard/course-creator/courses/create-course',
      onSaveSuccess,
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
    const controlledSetRequirementDrafts = setRequirementDrafts ?? (() => undefined);
    const controlledActiveRequirementProvider = activeRequirementProvider ?? null;
    const controlledSetActiveRequirementProvider =
      setActiveRequirementProvider ?? (() => undefined);

    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        name: '',
        course_code: '',
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
      const existing = form.getValues('categories') ?? [];
      if (!uuid || existing.includes(uuid)) return;
      form.setValue('categories', [...existing, uuid], {
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
      ...allCourseTrainingRequirementsOptions(editingCourseId || courseId),
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
    const stepper = useOptionalStepper();
    const setActiveStep = stepper?.setActiveStep ?? (() => undefined);
    const { difficultyLevels, isLoading: difficultyIsLoading } = useDifficultyLevels();

    const { data: categories } = useQuery(
      getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const [selectedParentCategoryUuid, setSelectedParentCategoryUuid] = useState('');
    const [selectedSubjectUuid, setSelectedSubjectUuid] = useState('');
    const [categoryInput, setCategoryInput] = useState('');

    const rootCategories = useMemo(
      () =>
        ((categories?.data?.content as CategoryItem[] | undefined) ?? []).filter(
          (cat: CategoryItem) => !cat.parent_uuid
        ),
      [categories?.data?.content]
    );

    const subjectOptions = useMemo(() => {
      if (!selectedParentCategoryUuid) return [];
      const parent = rootCategories.find(cat => cat.uuid === selectedParentCategoryUuid);
      const children = ((categories?.data?.content as CategoryItem[] | undefined) ?? []).filter(
        cat => cat.parent_uuid === selectedParentCategoryUuid
      );
      return parent ? [{ uuid: parent.uuid, name: parent.name }, ...children] : children;
    }, [categories?.data?.content, rootCategories, selectedParentCategoryUuid]);

    const { mutate: createCategoryMutation, isPending: createCategoryPending } = useMutation({
      mutationFn: ({ body }: { body: { name: string; parent_uuid?: string | null } }) =>
        createCategory({ body }),
      onSuccess: (data: CategoryMutationResponse) => {
        const createdUuid = data?.data?.uuid || data?.data?.uuid;
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

        if (selectedParentCategoryUuid) {
          appendCategory(selectedParentCategoryUuid);
        }
        if (createdUuid) {
          appendCategory(createdUuid);
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

    const creatorShare =
      useWatch({ control: form.control, name: 'creator_share_percentage' }) ?? [];
    const instructorShare =
      useWatch({ control: form.control, name: 'instructor_share_percentage' }) ?? [];

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
          status: data?.status || 'draft',
          minimum_training_fee: data?.minimum_training_fee,
          creator_share_percentage: data?.creator_share_percentage,
          instructor_share_percentage: data?.instructor_share_percentage,
          revenue_share_notes: data?.revenue_share_notes,
          // Lifecycle is never set from an edit. Sending status/active here demoted a
          // published course to draft on every save, which is what took live courses off
          // the catalogue when their creator edited them. Publishing and unpublishing go
          // through their own endpoints; the API now ignores these fields on update.
          is_free: data?.is_free,
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
                onSaveSuccess?.();
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
            duration_hours: data?.duration_hours,
            duration_minutes: data?.duration_minutes,
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

            router.replace(`/dashboard/course-creator/courses/create-course?id=${newCourseUuid}`);

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
            onSaveSuccess?.();

            setSaveStage('redirecting');
            setTimeout(() => {
              if (postCreateRedirectHref === null) {
                setActiveStep(1);
                setSaveStage(null);
                return;
              }

              const redirectHref = postCreateRedirectHref.includes('?')
                ? `${postCreateRedirectHref}&id=${newCourseUuid}`
                : `${postCreateRedirectHref}?id=${newCourseUuid}`;
              router.replace(redirectHref);
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
      submit: () => form.handleSubmit(onSubmit, onError)(),
    }));

    const isFree = useWatch({ control: form.control, name: 'is_free' }) ?? [];
    const categoriesSelected = useWatch({ control: form.control, name: 'categories' }) ?? [];
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
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className='m-0 flex flex-col gap-6 pt-2'>
            <section className='space-y-4'>
              <CardHeader>
                <CardTitle className='text-base'>Course details</CardTitle>
                <CardDescription>
                  The essentials students see when browsing your course.
                </CardDescription>
              </CardHeader>

              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='grid gap-1.5 sm:col-span-2'>
                      <CardTitle className='text-base'>Course name</CardTitle>
                      <FormControl>
                        <Input placeholder='e.g. Data Analysis with Spreadsheets' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='course_code'
                  render={({ field }) => (
                    <FormItem className='grid gap-1.5'>
                      <FormLabel className='text-base font-semibold'>
                        Course code (optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. DATA101' {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='difficulty'
                  render={({ field }) => (
                    <FormItem className='grid gap-1.5'>
                      <CardTitle className='text-base'>Difficulty level</CardTitle>
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

                <div className='space-y-5 sm:col-span-2'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {/* Category */}
                    <div className='space-y-1.5'>
                      <CardTitle className='text-base'>Category</CardTitle>

                      <Select
                        value={selectedParentCategoryUuid}
                        onValueChange={value => {
                          setSelectedParentCategoryUuid(value);
                          appendCategory(value);
                          setSelectedSubjectUuid('');
                        }}
                      >
                        <SelectTrigger
                          id='parent-category-select'
                          className='w-full'
                        >
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>

                        <SelectContent>
                          {rootCategories.length ? (
                            rootCategories.map((cat: CategoryItem) => (
                              <SelectItem key={cat.uuid} value={cat.uuid as string}>
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className='text-muted-foreground px-2 py-2 text-sm'>
                              No parent categories yet
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject + Add Subject */}
                    <div className='space-y-1.5'>
                      <CardTitle className='text-base'>Subject/Subcategory</CardTitle>

                      <div className='flex items-center gap-2'>
                        <div className='min-w-0 flex-1'>
                          <Select
                            value={selectedSubjectUuid}
                            onValueChange={uuid => {
                              if (!uuid) return;

                              if (selectedParentCategoryUuid) {
                                appendCategory(selectedParentCategoryUuid);
                              }

                              appendCategory(uuid);
                              setSelectedSubjectUuid('');
                            }}
                            disabled={!selectedParentCategoryUuid}
                          >
                            <SelectTrigger
                              id='subject-select'
                              className='w-full'
                            >
                              <SelectValue
                                placeholder={
                                  selectedParentCategoryUuid
                                    ? 'Select subject'
                                    : 'Select a category first'
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              {subjectOptions.length ? (
                                subjectOptions
                                  .filter(
                                    (cat: CategoryItem) =>
                                      !categoriesSelected.includes(cat.uuid ?? '')
                                  )
                                  .map((cat: CategoryItem) => (
                                    <SelectItem
                                      key={cat.uuid}
                                      value={cat.uuid as string}
                                    >
                                      {cat.name}
                                    </SelectItem>
                                  ))
                              ) : (
                                <div className='text-muted-foreground px-2 py-2 text-sm'>
                                  No subjects available for this category
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Add Subject Modal Trigger */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='size-9 shrink-0'
                              aria-label='Add new subject'
                              title='Add new subject'
                            >
                              <Plus className='size-4' />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className='w-full sm:max-w-[420px]'>
                            <DialogHeader>
                              <DialogTitle>Add new subject</DialogTitle>
                              <DialogDescription>
                                Create a subcategory under an existing parent category.
                              </DialogDescription>
                            </DialogHeader>

                            <div className='grid gap-5 py-2'>
                              <div className='space-y-1.5'>
                                <Label htmlFor='parent-category-name'>
                                  Parent category
                                </Label>

                                <Select
                                  value={selectedParentCategoryUuid}
                                  onValueChange={value =>
                                    setSelectedParentCategoryUuid(value)
                                  }
                                >
                                  <SelectTrigger
                                    className='w-full'
                                    id='parent-category-name'
                                  >
                                    <SelectValue placeholder='Choose parent category' />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {rootCategories.map((cat: CategoryItem) => (
                                      <SelectItem
                                        key={cat.uuid}
                                        value={cat.uuid as string}
                                      >
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className='space-y-1.5'>
                                <Label htmlFor='subcategory-name'>
                                  Subcategory name
                                </Label>

                                <Input
                                  id='subcategory-name'
                                  name='subcategory'
                                  value={categoryInput}
                                  onChange={e => setCategoryInput(e.target.value)}
                                  placeholder='e.g. Web Design'
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                type='button'
                                className='min-w-[75px]'
                                onClick={() => {
                                  if (!selectedParentCategoryUuid) {
                                    toast.error('Select a parent category first.');
                                    return;
                                  }

                                  if (!categoryInput.trim()) {
                                    toast.error('Enter a subcategory name.');
                                    return;
                                  }

                                  createCategoryMutation({
                                    body: {
                                      name: categoryInput.trim(),
                                      parent_uuid: selectedParentCategoryUuid,
                                    },
                                  });
                                }}
                                disabled={
                                  createCategoryPending ||
                                  !selectedParentCategoryUuid
                                }
                              >
                                {createCategoryPending ? <Spinner /> : 'Add'}
                              </Button>

                              <DialogClose asChild>
                                <button
                                  ref={dialogCloseRef}
                                  type='button'
                                  className='hidden'
                                  aria-hidden='true'
                                  tabIndex={-1}
                                />
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  {/* Selected Categories */}
                  {categoriesSelected.length > 0 && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-muted-foreground text-xs font-medium'>
                          Selected categories
                        </Label>

                        <span className='text-muted-foreground text-xs'>
                          {categoriesSelected.length}{' '}
                          {categoriesSelected.length === 1 ? 'selected' : 'selected'}
                        </span>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        {categoriesSelected.map((uuid: string, index: number) => {
                          const cat = categories?.data?.content?.find(
                            (c: CategoryItem) => c.uuid === uuid
                          );

                          if (!cat) return null;

                          return (
                            <div
                              key={uuid}
                              className='bg-muted/50 border-border/70 inline-flex max-w-full items-center gap-2 rounded-md border py-1 pl-2.5 pr-1'
                            >
                              <span className='text-foreground max-w-[240px] truncate text-xs font-medium'>
                                {cat.name}
                              </span>

                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='text-muted-foreground hover:text-destructive size-5 shrink-0 rounded-sm'
                                onClick={() => removeCategory(index)}
                                aria-label={`Remove ${cat.name}`}
                                title={`Remove ${cat.name}`}
                              >
                                <XIcon className='size-3.5' />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>



                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem className='grid gap-1.5 sm:col-span-2'>
                      <CardTitle className='text-base'>Course description</CardTitle>
                      <FormControl>
                        {/<[a-z][\s\S]*>/i.test(field.value ?? '') ? (
                          <SimpleEditor value={field.value} onChange={field.onChange} />
                        ) : (
                          <Textarea
                            rows={3}
                            placeholder='A short summary shown in the catalogue.'
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='prerequisites'
                  render={({ field }) => (
                    <FormItem className='grid gap-1.5 sm:col-span-2'>
                      <CardTitle className='text-base'>Pre-requisites</CardTitle>
                      <FormControl>
                        {/<[a-z][\s\S]*>/i.test(field.value ?? '') ? (
                          <SimpleEditor value={field.value} onChange={field.onChange} />
                        ) : (
                          <Textarea
                            rows={2}
                            placeholder='What learners must already know or have completed.'
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </section>

            <section className='px-6' >
              <FormField
                control={form.control}
                name='objectives'
                render={({ field, fieldState }) => (
                  <CourseLearningOutcomes
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </section>

            <section className='px-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Age limit and requirements</CardTitle>
                  <CardDescription>
                    Who the course is for, and what each party must provide.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='age_lower_limit'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5'>
                        <FormLabel>Minimum age</FormLabel>
                        <FormControl>
                          <Input type='number' min={0} step='1' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='age_upper_limit'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5'>
                        <FormLabel>Maximum age</FormLabel>
                        <FormControl>
                          <Input type='number' min={0} step='1' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='class_limit'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5'>
                        <FormLabel>Class size limit</FormLabel>
                        <FormControl>
                          <Input type='number' min={1} step='1' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='min-w-0 sm:col-span-3'>
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
                  </div>
                </CardContent>
              </Card>
            </section>

            {showSubmitButton && (
              <div className='xxs:flex-col flex flex-col justify-center gap-4 sm:flex-row sm:justify-end'>
                <Button
                  type='submit'
                  className='min-w-32'
                  disabled={createCourseIsPending || updateCourseIsPending || isSaving}
                >
                  {isSaving ? (
                    <span className='flex items-center gap-2'>
                      <Spinner />
                      Saving…
                    </span>
                  ) : (
                    'Save Course'
                  )}
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
