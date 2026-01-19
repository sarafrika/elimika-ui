import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import { useUserProfile } from '@/context/profile-context';
import {
  addRubricCriterionMutation,
  getRubricCriteriaQueryKey,
  getRubricMatrixQueryKey,
  searchAssessmentRubricsQueryKey,
  updateRubricCriterionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  RubricCriteriaFormValues,
  rubricCriteriaSchema,
} from '../_components/rubric-management-form';

type RubricCriterion = RubricCriteriaFormValues & {
  uuid: string;
};

interface Props {
  rubricId: string;
  onClose: () => void;
}

export default function InlineNewRubricCriteria({ rubricId, onClose }: Props) {
  const [editingCriteria, setEditingCriteria] = useState<RubricCriterion | null>(null);

  const qc = useQueryClient();
  const user = useUserProfile();

  const form = useForm<RubricCriteriaFormValues>({
    resolver: zodResolver(rubricCriteriaSchema),
    defaultValues: {
      component_name: '',
      description: '',
      weight: undefined,
      display_order: undefined,
      is_primary_criteria: false,
    },
  });

  const createCriteria = useMutation(addRubricCriterionMutation());
  const updateCriteria = useMutation(updateRubricCriterionMutation());

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
    };

    if (editingCriteria?.uuid) {
      updateCriteria.mutate(
        {
          path: {
            rubricUuid: rubricId,
            criteriaUuid: editingCriteria.uuid,
          },
          body: payload as any,
        },
        {
          onSuccess: data => {
            invalidateQueries();
            toast.success(data?.message);
            resetForm();
          },
        }
      );
    } else {
      createCriteria.mutate(
        {
          path: { rubricUuid: rubricId },
          body: payload as any,
        },
        {
          onSuccess: data => {
            invalidateQueries();
            toast.success(data?.message);
            resetForm();
          },
        }
      );
    }
  };

  const handleEditCriteria = (criterion: RubricCriterion) => {
    setEditingCriteria(criterion);
    form.reset(criterion);
  };

  const resetForm = () => {
    form.reset();
    setEditingCriteria(null);
    onClose();
  };

  const invalidateQueries = () => {
    qc.invalidateQueries({
      queryKey: searchAssessmentRubricsQueryKey({
        query: {
          pageable: {},
          searchParams: {
            instructor_uuid_eq: user?.instructor?.uuid as string,
          },
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
      queryKey: getRubricMatrixQueryKey({
        path: { rubricUuid: rubricId },
      }),
    });
  };

  return (
    <div className='mx-2 flex flex-col gap-6 rounded-sm border'>
      <div className='border-b px-6 py-4'>
        <h2 className='text-xl font-semibold'>Add New Criterion</h2>

        <p className='text-muted-foreground mt-1 text-sm'>
          Add a new criterion to this rubric, including the grading components.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-6 p-4 pb-6'>
          <FormField
            control={form.control}
            name='component_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component Name</FormLabel>
                <FormControl>
                  <Input placeholder='e.g Participation' {...field} />
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
                  <Input placeholder='Optional description' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex flex-col gap-3 sm:flex-row'>
            <FormField
              control={form.control}
              name='weight'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel>Weight (%)</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='display_order'
              render={({ field }) => (
                <FormItem className='flex-1'>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='is_primary_criteria'
            render={({ field }) => (
              <FormItem className='flex items-start space-x-3'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className='space-y-1 leading-none'>
                  <FormLabel>Primary Criteria</FormLabel>
                  <FormDescription>Marks this as a primary assessment component.</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={resetForm}>
              Cancel
            </Button>

            <Button type='submit' disabled={createCriteria.isPending || updateCriteria.isPending}>
              {editingCriteria
                ? updateCriteria.isPending
                  ? 'Updating...'
                  : 'Update Criteria'
                : createCriteria.isPending
                  ? 'Creating...'
                  : 'Create Criteria'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
