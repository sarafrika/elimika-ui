'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { passMarkSchema, toPassMark } from '@/lib/pass-mark';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseByUuidOptions,
  getCourseByUuidQueryKey,
  searchCoursesQueryKey,
  updateCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';

const schema = z.object({ pass_mark: passMarkSchema });
type Values = z.infer<typeof schema>;

export function CoursePassMarkForm({ courseUuid }: { courseUuid: string }) {
  if (!courseUuid) return null;
  return <SavedCoursePassMark courseUuid={courseUuid} />;
}

function SavedCoursePassMark({ courseUuid }: { courseUuid: string }) {
  const client = useQueryClient();
  const query = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const response = query.data;
  const course = response?.error || response?.success === false ? undefined : response?.data;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { pass_mark: '' } });
  const { isDirty } = form.formState;
  useEffect(() => {
    if (course && !isDirty) form.reset({ pass_mark: course.pass_mark ?? '' });
  }, [course, form, isDirty]);
  const update = useMutation(updateCourseMutation());

  async function save(values: Values) {
    if (!course) return;
    try {
      const result = await update.mutateAsync({
        path: { uuid: courseUuid },
        body: { ...course, pass_mark: toPassMark(values.pass_mark) },
        bodySerializer: body => {
          const { active, is_published, is_draft, ...content } = body;
          return JSON.stringify(content);
        },
      });
      if (result.error || result.success === false)
        throw new Error(getErrorMessage(result, 'Unable to save pass mark'));
      form.reset(values);
      if (result.data)
        client.setQueryData(getCourseByUuidQueryKey({ path: { uuid: courseUuid } }), result);
      await client.invalidateQueries({
        queryKey: getCourseByUuidQueryKey({ path: { uuid: courseUuid } }),
      });
      const searchKey = searchCoursesQueryKey({ query: { searchParams: {}, pageable: {} } });
      void client.invalidateQueries({ queryKey: [{ _id: searchKey[0]._id }] });
      toast.success('Course pass mark saved');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Unable to save pass mark'));
    }
  }

  if (query.isLoading) return <Skeleton className='h-28 w-full' />;
  if (query.isError || !course)
    return (
      <EmptyState
        variant='compact'
        title='Unable to load course pass mark'
        action={
          <Button type='button' variant='outline' onClick={() => query.refetch()}>
            Try again
          </Button>
        }
      />
    );

  return (
    <Form {...form}>
      <div className='bg-card flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-start'>
        <FormField
          control={form.control}
          name='pass_mark'
          render={({ field }) => (
            <FormItem className='flex-1'>
              <FormLabel>Course pass mark (%) (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='number'
                  min={0}
                  max={100}
                  step='any'
                  placeholder='e.g. 50'
                  value={field.value ?? ''}
                  disabled={update.isPending}
                  onChange={event =>
                    field.onChange(event.target.value === '' ? '' : Number(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                Final grade needed to pass the course. Leave blank to clear the pass mark.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='button'
          className='sm:mt-6'
          disabled={update.isPending || !isDirty}
          onClick={() => void form.handleSubmit(save)()}
        >
          {update.isPending && <Spinner className='size-4' />}
          {update.isPending ? 'Saving…' : 'Save pass mark'}
        </Button>
      </div>
    </Form>
  );
}
