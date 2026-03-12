'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
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
  getCourseTrainingRequirementsOptions,
  getCourseTrainingRequirementsQueryKey,
  searchCoursesQueryKey,
  updateCourseTrainingRequirementMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Pencil, Plus, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  type CourseCreationFormValues,
  courseCreationSchema,
  emptyRequirement,
  providedByOptions,
  requirementTypes,
} from './course-creation-types';

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
  successResponse?: (data: any) => void;
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
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
    { showSubmitButton, initialValues, editingCourseId, courseId, successResponse },
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

    const [existingRequirements, setExistingRequirements] = useState<any[]>([]);

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

    const { append: appendCategory, remove: removeCategory } = useFieldArray({
      control: form.control,
      name: 'categories',
    });

    const { data: trainingRequirements } = useQuery({
      ...getCourseTrainingRequirementsOptions({
        path: { courseUuid: courseId || editingCourseId },
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
      mutationFn: ({ body }: { body: any }) => createCategory({ body }),
      onSuccess: (data: any) => {
        if (data?.error) {
          if (data.error.error?.toLowerCase().includes('duplicate key')) {
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
      mutationFn: ({ body, uuid }: { body: any; uuid: string }) =>
        updateCourse({ body, path: { uuid } }),
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

    // ── Helpers for the inline requirement form ───────────────────────────────

    /** Open the form to add a brand-new requirement */
    const openAddRequirementForm = () => {
      form.setValue('training_requirement', emptyRequirement);
      setEditingRequirementId(null);
      setShowRequirementForm(true);
    };

    /** Open the form pre-filled with an existing requirement's data */
    const openEditRequirementForm = (req: any) => {
      form.setValue('training_requirement', {
        name: req.name ?? '',
        description: req.description ?? '',
        requirement_type: req.requirement_type ?? requirementTypes[0],
        quantity: req.quantity ?? 0,
        unit: req.unit ?? '',
        provided_by: req.provided_by ?? providedByOptions[0],
        is_mandatory: req.is_mandatory ?? false,
      });
      setEditingRequirementId(req.uuid);
      setShowRequirementForm(true);
    };

    /** Close and reset the requirement form without saving */
    const closeRequirementForm = () => {
      setShowRequirementForm(false);
      setEditingRequirementId(null);
      form.setValue('training_requirement', emptyRequirement);
      // Clear any validation errors on the requirement sub-fields
      form.clearErrors('training_requirement');
    };

    /** Save (add or update) the requirement that's currently in the form */
    const saveRequirement = () => {
      const req = form.getValues('training_requirement');

      if (!req.name?.trim()) {
        form.setError('training_requirement.name', { message: 'Requirement name is required.' });
        return;
      }

      const targetCourseUuid = editingCourseId ?? courseId;

      if (!targetCourseUuid) {
        toast.error('Save the course first before managing requirements.');
        return;
      }

      if (requirementMode === 'edit' && editingRequirementId) {
        // ── UPDATE existing requirement ──
        updateTrainingReqMut.mutate(
          {
            body: { ...req, course_uuid: targetCourseUuid } as any,
            path: {
              courseUuid: targetCourseUuid,
              requirementUuid: editingRequirementId,
            },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: getCourseTrainingRequirementsQueryKey({
                  path: { courseUuid: targetCourseUuid },
                  query: { pageable: {} },
                }),
              });
              // Optimistically update local list
              setExistingRequirements((prev: any[]) =>
                prev.map(r =>
                  r.uuid === editingRequirementId ? { ...r, ...req } : r
                )
              );
              toast.success('Requirement updated.');
              closeRequirementForm();
            },
            onError: () => toast.error('Failed to update requirement.'),
          }
        );
      } else {
        // ── ADD new requirement ──
        addTrainingReqMut.mutate(
          {
            body: { ...req, course_uuid: targetCourseUuid } as any,
            path: { courseUuid: targetCourseUuid },
          },
          {
            onSuccess: (res: any) => {
              qc.invalidateQueries({
                queryKey: getCourseTrainingRequirementsQueryKey({
                  path: { courseUuid: targetCourseUuid },
                  query: { pageable: {} },
                }),
              });
              // Optimistically append
              if (res?.data) {
                setExistingRequirements((prev: any[]) => [...prev, res.data]);
              }
              toast.success('Requirement added.');
              closeRequirementForm();
            },
            onError: () => toast.error('Failed to add requirement.'),
          }
        );
      }
    };

    // ─────────────────────────────────────────────────────────────────────────

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
          { body: editBody as any, uuid: editingCourseId },
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
          },
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
              // @ts-expect-error
              successResponse(courseResponse?.data);
            }

            setSaveStage('redirecting');
            setTimeout(() => {
              router.replace(
                `/dashboard/course-management/create-new-course?id=${newCourseUuid}`
              );
            }, 600);
          },
        }
      );
    };

    const onError = (errors: any) => {
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
    const isRequirementSaving =
      addTrainingReqMut.isPending || updateTrainingReqMut.isPending;

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
                  // @ts-expect-error
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

            {/* ── Training Requirements ────────────────────────────────────────── */}
            <FormSection
              title='Training Requirements'
              description='Add required resources or facilities for this course.'
            >
              {/* List of saved requirements */}
              {existingRequirements.length > 0 && (
                <div className='mb-4 space-y-4'>
                  {existingRequirements.map((req: any) => (
                    <Card key={req.uuid} className='border-border bg-muted border py-0 shadow-sm'>
                      <CardHeader className='flex items-start justify-between gap-4 p-4'>
                        <div className='flex-1'>
                          <CardTitle className='text-base'>{req.name}</CardTitle>
                          {req.description && (
                            <CardDescription className='text-muted-foreground text-sm'>
                              {req.description}
                            </CardDescription>
                          )}
                          <div className='text-muted-foreground mt-1 text-sm'>
                            {req.quantity ? `${req.quantity} ${req.unit}` : ''} -{' '}
                            {req.requirement_type}
                          </div>
                          <div className='text-muted-foreground mt-1 text-sm'>
                            Provided by: {req.provided_by}
                          </div>
                        </div>

                        <div className='flex shrink-0 gap-2'>
                          {/* Edit button */}
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            className='min-w-[80px]'
                            disabled={
                              deletingId === req.uuid ||
                              (showRequirementForm && editingRequirementId === req.uuid)
                            }
                            onClick={() => openEditRequirementForm(req)}
                          >
                            <Pencil className='mr-1 h-3 w-3' />
                            Edit
                          </Button>

                          {/* Delete button */}
                          <Button
                            type='button'
                            variant='destructive'
                            size='sm'
                            className='min-w-[90px]'
                            disabled={deletingId === req.uuid}
                            onClick={() => {
                              setDeletingId(req.uuid);
                              deleteTrainingReqMut.mutate(
                                {
                                  path: {
                                    courseUuid: editingCourseId,
                                    requirementUuid: req.uuid,
                                  },
                                },
                                {
                                  onSuccess: () => {
                                    qc.invalidateQueries({
                                      queryKey: getCourseTrainingRequirementsQueryKey({
                                        path: { courseUuid: editingCourseId as string },
                                        query: { pageable: {} },
                                      }),
                                    });
                                    setExistingRequirements((prev: any[]) =>
                                      prev.filter(r => r.uuid !== req.uuid)
                                    );
                                    setDeletingId(null);
                                    // Close form if we just deleted what was being edited
                                    if (editingRequirementId === req.uuid) {
                                      closeRequirementForm();
                                    }
                                  },
                                  onError: () => setDeletingId(null),
                                }
                              );
                            }}
                          >
                            {deletingId === req.uuid ? <Spinner /> : 'Remove'}
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}

              {/* "Add new" trigger — only shown when form is hidden */}
              {!showRequirementForm && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={openAddRequirementForm}
                >
                  <Plus className='mr-1 h-4 w-4' />
                  Add Requirement
                </Button>
              )}

              {/* Inline requirement form (add OR edit) */}
              {showRequirementForm && (
                <div className='mt-4 space-y-6 rounded-lg border p-6'>
                  <p className='text-foreground text-sm font-medium'>
                    {requirementMode === 'edit' ? 'Edit Requirement' : 'New Requirement'}
                  </p>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='training_requirement.name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirement Name</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., 3D printers' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='training_requirement.requirement_type'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            value={field.value || requirementTypes[0]}
                            onValueChange={v =>
                              form.setValue('training_requirement.requirement_type', v)
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select type' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requirementTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='training_requirement.quantity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='0'
                              {...field}
                              onChange={e =>
                                field.onChange(e.target.value ? Number(e.target.value) : 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='training_requirement.unit'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., sets, seats' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='training_requirement.provided_by'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provided By</FormLabel>
                          <Select
                            value={field.value || providedByOptions[0]}
                            onValueChange={v =>
                              form.setValue('training_requirement.provided_by', v)
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select owner' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providedByOptions.map(option => {
                                const label = option
                                  .split('_')
                                  .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
                                  .join(' ');
                                return (
                                  <SelectItem key={option} value={option}>
                                    {label}
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
                      control={form.control}
                      name='training_requirement.is_mandatory'
                      render={({ field }) => (
                        <FormItem className='flex items-start space-x-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={checked => field.onChange(!!checked)}
                            />
                          </FormControl>
                          <div>
                            <FormLabel>Mandatory requirement</FormLabel>
                            <FormDescription>Required before scheduling.</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='training_requirement.description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex justify-end gap-3'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={closeRequirementForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='button'
                      disabled={isRequirementSaving}
                      onClick={saveRequirement}
                    >
                      {isRequirementSaving ? (
                        <span className='flex items-center gap-2'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Saving…
                        </span>
                      ) : requirementMode === 'edit' ? (
                        'Update Requirement'
                      ) : (
                        'Save Requirement'
                      )}
                    </Button>
                  </div>
                </div>
              )}
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