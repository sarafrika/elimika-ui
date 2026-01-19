import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';

import { useUserProfile } from '../../../../context/profile-context';
import { StatusEnum } from '../../../../services/client';
import {
  createAssessmentRubricMutation,
  searchAssessmentRubricsQueryKey,
  updateAssessmentRubricMutation,
} from '../../../../services/client/@tanstack/react-query.gen';

import {
  RubricDetailsFormValues,
  rubricDetailsSchema,
  RubricType,
  Visibility,
} from '../_components/rubric-management-form';

type Rubric = {
  uuid: string;
  title: string;
  description?: string;
  rubric_type: RubricType;
  is_public: boolean;
  total_weight?: number;
  max_score?: number;
  min_passing_score?: number;
};

export default function InlineNewRubric() {
  const [isVisible, setIsVisible] = useState(false);
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);

  const qc = useQueryClient();
  const user = useUserProfile();

  const form = useForm<RubricDetailsFormValues>({
    resolver: zodResolver(rubricDetailsSchema),
    defaultValues: {
      title: '',
      description: '',
      type: RubricType.Assignment,
      visibility: Visibility.Private,
      total_weight: 100,
      max_score: 100,
      min_passing_score: 50,
    },
  });

  const createRubric = useMutation(createAssessmentRubricMutation());
  const updateRubric = useMutation(updateAssessmentRubricMutation());

  const handleSubmit = async (values: RubricDetailsFormValues) => {
    const basePayload = {
      ...values,
      rubric_type: values.type,
      is_public: values.visibility === Visibility.Public,
      rubric_category: `${values.type} Assessment`,
      course_creator_uuid: user?.courseCreator?.uuid as string,
      status: StatusEnum.DRAFT,
    };

    if (editingRubricId) {
      // UPDATE
      updateRubric.mutate(
        {
          path: { uuid: editingRubricId },
          body: {
            ...basePayload,
            updated_by: user?.email,
          },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: {
                    course_creator_uuid: user?.courseCreator?.uuid as string,
                  },
                },
              }),
            });

            toast.success(data?.message);
            resetForm();
          },
        }
      );
    } else {
      createRubric.mutate(
        {
          body: {
            ...basePayload,
            created_by: user?.email,
          },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: {
                    course_creator_uuid: user?.courseCreator?.uuid as string,
                  },
                },
              }),
            });

            toast.success(data?.message);
            resetForm();
          },
        }
      );
    }
  };

  const handleEditRubric = (rubric: Rubric) => {
    setIsVisible(true);
    setEditingRubricId(rubric.uuid);

    form.reset({
      title: rubric.title,
      description: rubric.description ?? '',
      type: rubric.rubric_type,
      visibility: rubric.is_public ? Visibility.Public : Visibility.Private,
      total_weight: rubric.total_weight,
      max_score: rubric.max_score,
      min_passing_score: rubric.min_passing_score,
    });
  };

  const resetForm = () => {
    form.reset();
    setEditingRubricId(null);
    setIsVisible(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-end'>
        <Button type='button' onClick={() => setIsVisible(true)}>
          <PlusCircle className='mr-2 h-4 w-4' />
          New Rubric
        </Button>
      </div>

      {isVisible && (
        <Form {...form}>
          <div className='rounded-lg border p-6'>
            <div className='border-b px-6 py-4'>
              <h2 className='text-xl font-semibold'>Add New Rubric</h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                Create a new rubric by providing its title, description, and grading criteria.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-6 p-4'>
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex w-full flex-col gap-3 sm:flex-row'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Rubric Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(RubricType).map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='visibility'
                  render={({ field }) => (
                    <FormItem className='w-[160px]'>
                      <FormLabel>Visibility</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Visibility).map(v => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex flex-col gap-3 sm:flex-row'>
                <FormField
                  control={form.control}
                  name='total_weight'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Total Weight (%)</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='max_score'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='min_passing_score'
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Passing Score</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' onClick={resetForm}>
                  Cancel
                </Button>

                <Button type='submit' disabled={createRubric.isPending || updateRubric.isPending}>
                  {editingRubricId
                    ? updateRubric.isPending
                      ? 'Updating...'
                      : 'Update Rubric'
                    : createRubric.isPending
                      ? 'Creating...'
                      : 'Create Rubric'}
                </Button>
              </div>
            </form>
          </div>
        </Form>
      )}
    </div>
  );
}
