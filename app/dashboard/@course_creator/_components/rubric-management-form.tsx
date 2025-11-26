'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import {
  addRubricCriterionMutation,
  createAssessmentRubricMutation,
  createRubricScoringLevelMutation,
  getRubricCriteriaQueryKey,
  getRubricMatrixQueryKey,
  getRubricScoringQueryKey,
  getScoringLevelsByRubricQueryKey,
  searchAssessmentRubricsQueryKey,
  updateAssessmentRubricMutation,
  updateMatrixCellMutation,
  updateRubricCriterionMutation,
  updateScoringLevelMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { StatusEnum } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Textarea } from '../../../../components/ui/textarea';

// RUBRICS
export enum RubricType {
  Assignment = 'Assignment',
  Exam = 'Exam',
  ClassAttendance = 'Class Attendance',
  Auditions = 'Auditions',
  Competition = 'Competition',
  Performance = 'Performance',
  Project = 'Project',
  Quiz = 'Quiz',
  Reading = 'Reading',
}

export enum Visibility {
  Public = 'Public',
  Private = 'Private',
}

export const rubricDetailsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(RubricType),
  visibility: z.nativeEnum(Visibility),
  total_weight: z.coerce.number().optional(),
  max_score: z.coerce.number().optional(),
  min_passing_score: z.coerce.number().optional(),
});

export type RubricDetailsFormValues = z.infer<typeof rubricDetailsSchema>;

function RubricDetailsForm({
  onSuccess,
  defaultValues,
  rubricId,
  onCancel,
  className,
}: {
  rubricId?: string;
  defaultValues?: RubricDetailsFormValues;
  onSuccess: () => void;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<RubricDetailsFormValues>({
    resolver: zodResolver(rubricDetailsSchema),
    defaultValues,
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const createRubric = useMutation(createAssessmentRubricMutation());
  const updateRubric = useMutation(updateAssessmentRubricMutation());

  const handleSubmit = async (values: RubricDetailsFormValues) => {
    const payload = {
      ...values,
      rubric_type: values.type,
      course_creator_uuid: user?.courseCreator?.uuid as string,
      is_public: values.visibility === 'Public',
      status: StatusEnum.DRAFT,
      rubric_category: `${values.type} Assessment`,
      total_weight: values.total_weight,
      max_score: values.max_score,
      min_passing_score: values.min_passing_score,
      created_by: user?.email,
      // additional rubric info
    };

    if (rubricId) {
      updateRubric.mutate(
        { path: { uuid: rubricId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { course_creator_uuid_eq: user?.courseCreator?.uuid as string },
                },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createRubric.mutate(
        { body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { course_creator_uuid_eq: user?.courseCreator?.uuid as string },
                },
              }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rubric Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter rubric title' {...field} />
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
                <Textarea placeholder='Optional rubric description' rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='type'
            render={({ field }) => (
              <FormItem className='w-full flex-1'>
                <FormLabel>Rubric Type</FormLabel>
                <Select {...field} onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select rubric type' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RubricType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem className='w-full flex-shrink-0 sm:w-[150px]'>
                <FormLabel>Rubric Visibility</FormLabel>
                <Select {...field} onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select visibility' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Visibility).map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='total_weight'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Total Weight (%)</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='e.g 100' {...field} className='w-full' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='max_score'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Max Score</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='e.g 100' {...field} className='w-full' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='min_passing_score'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Passing Score</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='e.g 50' {...field} className='w-full' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createRubric.isPending || updateRubric.isPending}
          >
            {(createRubric.isPending || updateRubric.isPending) && <Spinner />}
            {defaultValues ? 'Update Rubric' : 'Create Rubric'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const rubricCriteriaSchema = z.object({
  uuid: z.string().optional(),
  component_name: z.string().min(1),
  description: z.string().optional(),
  display_order: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  criteria_number: z.string().optional(),
  is_primary_criteria: z.boolean().default(false),
});

export type RubricCriteriaFormValues = z.infer<typeof rubricCriteriaSchema>;

function RubricCriteriaForm({
  rubricId,
  defaultValues,
  criterionId,
  onSuccess,
  onCancel,
  className,
}: {
  rubricId: string;
  defaultValues?: RubricCriteriaFormValues;
  onSuccess: () => void;
  onCancel: () => void;
  criterionId: string;
  className: any;
}) {
  const form = useForm<RubricCriteriaFormValues>({
    resolver: zodResolver(rubricCriteriaSchema),
    defaultValues,
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const createRubricCriteria = useMutation(addRubricCriterionMutation());
  const updateRubricCriteria = useMutation(updateRubricCriterionMutation());

  const handleSubmit = (values: RubricCriteriaFormValues) => {
    const payload = {
      rubric_uuid: rubricId,
      component_name: values.component_name,
      description: values.description,
      criteria_category: '',
      display_order: values.display_order,
      weight: values.weight,
      criteria_number: `Criteria ${values.display_order}`,
      is_primary_criteria: values.is_primary_criteria,
      // additional criterion info
    };

    if (rubricId && criterionId) {
      updateRubricCriteria.mutate(
        { path: { rubricUuid: rubricId, criteriaUuid: criterionId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { instructor_uuid_eq: user?.instructor?.uuid as string },
                },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricCriteriaQueryKey({
                path: { rubricUuid: rubricId },
                query: { pageable: {} },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createRubricCriteria.mutate(
        { path: { rubricUuid: rubricId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { instructor_uuid_eq: user?.instructor?.uuid as string },
                },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricCriteriaQueryKey({
                path: { rubricUuid: rubricId },
                query: { pageable: {} },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='component_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment Component Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter component name' {...field} />
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
              <FormLabel>Assessment Component Description</FormLabel>
              <FormControl>
                <Input placeholder='Enter description' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Criteria Category might be added here */}

        <FormField
          control={form.control}
          name='is_primary_criteria'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>Primary Criteria</FormLabel>
                <FormDescription>
                  Indicate if this component is a primary criteria for this rubric assessment.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='weight'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='e.g 25' {...field} className='w-full' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='display_order'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='e.g 1' {...field} className='w-full' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createRubricCriteria.isPending || updateRubricCriteria.isPending}
          >
            {(createRubricCriteria.isPending || updateRubricCriteria.isPending) && <Spinner />}
            {defaultValues ? 'Update Criteria' : 'Create Criteria'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const scoringLevelSchema = z.object({
  rubric_uuid: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  points: z.coerce.number().optional(),
  level_order: z.coerce.number().optional(),
  color_code: z.string().optional(),
  is_passing: z.boolean().default(false),
  display_name: z.string().optional(),
  performance_indicator: z.string().optional(),
});

export type ScoringLevelFormValues = z.infer<typeof scoringLevelSchema>;

function ScoringLevelForm({
  rubricId,
  scoringLevelId,
  defaultValues,
  onSuccess,
  onCancel,
  className,
}: {
  rubricId: string;
  scoringLevelId?: string;
  defaultValues?: ScoringLevelFormValues;
  onSuccess: () => void;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<ScoringLevelFormValues>({
    resolver: zodResolver(scoringLevelSchema),
    defaultValues,
  });

  const qc = useQueryClient();
  const instructor = useInstructor();

  const createRubricScoringLevel = useMutation(createRubricScoringLevelMutation());
  const updateRubricScoringLevel = useMutation(updateScoringLevelMutation());

  const handleSubmit = async (values: ScoringLevelFormValues) => {
    const payload = {
      rubric_uuid: rubricId,
      name: values.name,
      description: values.description || '',
      points: values.points,
      level_order: values.level_order,
      color_code: values.color_code,
      is_passing: values.is_passing,
      dispay_name: `${values.name} (${values.points} pts)`,
      performance_indicator: values.performance_indicator,
      // additional scoring info
    };

    if (scoringLevelId) {
      updateRubricScoringLevel.mutate(
        {
          path: { rubricUuid: rubricId, levelUuid: scoringLevelId },
          body: payload as any,
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                },
              }),
            });

            qc.invalidateQueries({
              queryKey: getScoringLevelsByRubricQueryKey({
                query: { pageable: {} },
                path: { rubricUuid: rubricId },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createRubricScoringLevel.mutate(
        { path: { rubricUuid: rubricId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                },
              }),
            });

            qc.invalidateQueries({
              queryKey: getScoringLevelsByRubricQueryKey({
                query: { pageable: {} },
                path: { rubricUuid: rubricId },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        <FormField
          control={form.control}
          name='is_passing'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id='is_passing_level'
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel htmlFor='is_passing_level' className='font-medium'>
                  Passing Level
                </FormLabel>
                <FormDescription>
                  Select this option if this score level should be considered a passing grade.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='level_order'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type='number' placeholder='e.g 1' {...field} className='w-full' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='color_code'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel className='mb-1 block text-sm font-medium text-foreground'>
                Color Code
              </FormLabel>
              <div className='flex items-center gap-4'>
                <FormControl>
                  <Input
                    type='color'
                    {...field}
                    className='h-12 w-12 cursor-pointer rounded-md border border-border p-0'
                    onChange={e => {
                      field.onChange(e);
                    }}
                  />
                </FormControl>

                {/* Hex Value Display */}
                <span className='font-mono text-sm text-muted-foreground'>
                  {field.value?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scoring Level Name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. present, distinction' className='text-sm' {...field} />
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
                <Input
                  placeholder='e.g. Highly confident and fluent techniques given consistently throughout'
                  className='text-sm'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='points'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scoring Level Point</FormLabel>
              <FormControl>
                <Input type='number' placeholder='e.g. 5' className='text-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='performance_indicator'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Performance Indicator</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Exceptional Performance' className='text-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={createRubricScoringLevel.isPending || updateRubricScoringLevel.isPending}
          >
            {(createRubricScoringLevel.isPending || updateRubricScoringLevel.isPending) && (
              <Spinner />
            )}
            {defaultValues ? 'Update Scoring Level' : 'Create Scoring Level'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const rubricScoringSchema = z.object({
  criteria_uuid: z.string().optional(),
  description: z.string().optional(),
  is_completed: z.boolean() ?? false,
  points: z.coerce.number().optional(),
  scoring_level_uuid: z.string().optional(),
  weighted_points: z.coerce.number().optional(),
});

export type RubricScoringFormValues = z.infer<typeof rubricScoringSchema>;

function RubricScoringForm({
  rubricId,
  criterionId,
  scoringId,
  defaultValues,
  onSuccess,
  onCancel,
  className,
}: {
  rubricId: string;
  criterionId: string;
  scoringId: string;
  defaultValues?: RubricScoringFormValues;
  onSuccess: () => void;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<RubricScoringFormValues>({
    resolver: zodResolver(rubricScoringSchema),
    defaultValues,
  });
  // const { setValue, register } = form;

  const qc = useQueryClient();
  const instructor = useInstructor();

  const updateMatrixCells = useMutation(updateMatrixCellMutation());

  const handleSubmit = async (values: RubricScoringFormValues) => {
    const payload = {
      criteria_uuid: values.criteria_uuid,
      description: values.description || '',
      is_completed: values.is_completed,
      scoring_level_uuid: values.scoring_level_uuid,
      points: values.points,
      weighted_points: values.weighted_points,
      // additional scoring info
    };

    if (rubricId && criterionId && scoringId) {
      updateMatrixCells.mutate(
        {
          path: { rubricUuid: rubricId },
          body: payload as any,
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricCriteriaQueryKey({
                path: { rubricUuid: rubricId },
                query: { pageable: {} },
              }),
            });

            qc.invalidateQueries({
              queryKey: getRubricScoringQueryKey({
                path: { rubricUuid: rubricId, criteriaUuid: criterionId },
                query: { pageable: {} },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricId } }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        {/* Grading Level Dropdown */}
        {/* <FormField
          control={form.control}
          name='grading_level_uuid'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Select Grading Level</FormLabel>
              <Select
                onValueChange={value => {
                  const selected = gradingLevels?.data?.content?.find(
                    level => level.uuid === value
                  );

                  if (selected) {
                    setValue('grading_level_uuid', selected.uuid as string);
                    setValue('name', selected.name);
                    setValue('points', selected.points);
                  } else {
                    setValue('grading_level_uuid', '');
                    setValue('name', '');
                    setValue('points', 0);
                  }
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Choose grading level' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gradingLevels?.data?.content?.map(level => (
                    <SelectItem key={level.uuid} value={level.uuid as string}>
                      {level.points} - {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <FormField
          control={form.control}
          name='is_completed'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id='is_completed'
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel htmlFor='is_completed' className='font-medium'>
                  Is Complete?
                </FormLabel>
                <FormDescription>
                  Select this option if this score level should be considered as completed.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Auto-filled Grading Name */}
        {/* <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grading Name</FormLabel>
              <FormControl>
                <Input placeholder='e.g. present, distinction' className='text-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* Optional Description */}
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder='e.g. Highly confident and fluent techniques given consistently throughout'
                  className='text-sm'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-filled Grading Point */}
        <FormField
          control={form.control}
          name='points'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grading Point</FormLabel>
              <FormControl>
                <Input type='number' placeholder='e.g. 5' className='text-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <FormField
          control={form.control}
          name='performance_expectation'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Performance Expectation</FormLabel>
              <FormControl>
                <Input placeholder='e.g. Exceptional Performance' className='text-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* <FormField
          control={form.control}
          name='feedback_category'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Category</FormLabel>
              <FormControl>
                <Input
                  placeholder='Write a feedback for the scoring level'
                  className='text-sm'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <div className='flex justify-end gap-2 pt-6'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type='submit'
            className='flex min-w-[120px] items-center justify-center gap-2'
            disabled={updateMatrixCells.isPending}
          >
            {updateMatrixCells.isPending && <Spinner />}
            {defaultValues && 'Update Scoring'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function RubricDialog({
  open,
  setOpen,
  editingRubric,
  editingRubricId,
  onSubmitSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  editingRubric?: any;
  editingRubricId?: string;
  onSubmitSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {editingRubricId ? 'Edit Rubric' : 'Add New Rubric'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingRubric
              ? "Update the existing rubric's title, description, and grading criteria."
              : 'Create a new rubric by providing its title, description, and grading criteria.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)] sm:h-[calc(90vh-24rem)]'>
          <RubricDetailsForm
            onCancel={() => setOpen(false)}
            defaultValues={editingRubric}
            className='px-6 pb-6'
            rubricId={editingRubricId ?? ''}
            onSuccess={onSubmitSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CriteriaDialog({
  open,
  setOpen,
  rubricId,
  criterionId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  rubricId: string;
  criterionId?: string;
  defaultValues?: any;
  onSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-4xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {criterionId ? 'Edit Criterion' : 'Add New Criterion'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {criterionId
              ? 'Modify an existing assessment criterion for this rubric.'
              : 'Add a new criterion to this rubric, including the grading components.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-16rem)] sm:h-[calc(90vh-24rem)]'>
          <RubricCriteriaForm
            rubricId={rubricId}
            criterionId={criterionId ?? ''}
            className='px-6 pb-6'
            defaultValues={defaultValues}
            onCancel={() => setOpen(false)}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ScoringLevelDialog({
  open,
  setOpen,
  rubricId,
  scoringLevelId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  rubricId: string;
  scoringLevelId?: string;
  defaultValues?: any;
  onSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {scoringLevelId ? 'Edit Scoring Level' : 'Add New Scoring Level'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {scoringLevelId
              ? 'Update the scoring level and expectations for this scoring entry.'
              : 'Define a new scoring entry for this criterion.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <ScoringLevelForm
            rubricId={rubricId}
            className='px-6 pb-6'
            defaultValues={defaultValues}
            scoringLevelId={scoringLevelId}
            onCancel={() => setOpen(false)}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ScoringDialog({
  open,
  setOpen,
  rubricId,
  criterionId,
  scoringId,
  defaultValues,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  rubricId: string;
  criterionId: string;
  scoringId?: string;
  defaultValues?: any;
  onSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>{scoringId && 'Update Scoring'}</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {scoringId && 'Update the grading level and expectations for this scoring entry'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <RubricScoringForm
            rubricId={rubricId}
            criterionId={criterionId}
            scoringId={scoringId || ''}
            className='px-6 pb-6'
            defaultValues={defaultValues}
            onCancel={() => setOpen(false)}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
