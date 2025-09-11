'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useUserProfile } from '@/context/profile-context';
import {
  createAssignmentMutation,
  getAllAssessmentRubricsOptions,
  getAllAssignmentsQueryKey,
  updateAssignmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const SUBMISSION_TYPES = ['PDF', 'AUDIO', 'TEXT'];

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  max_points: z.coerce.number().optional(),
  rubric_uuid: z.string().optional(),
  lesson_uuid: z.string().optional(),
  status: z.string().optional(),
  active: z.boolean().default(false),
  due_date: z.string().datetime().optional(),
  assignment_category: z.string().optional(),
  submission_types: z.any().optional(),
});

export type AsignmentFormValues = z.infer<typeof assignmentSchema>;

function AssignmentForm({
  onSuccess,
  initialValues,
  assignmentId,
  lessonId,
  onCancel,
  className,
}: {
  assignmentId?: string;
  lessonId: string;
  initialValues?: AsignmentFormValues;
  onSuccess: any;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<AsignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      submission_types: [],
      ...initialValues,
    },
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const { data: rubrics } = useQuery(getAllAssessmentRubricsOptions({ query: { pageable: {} } }));

  const createAssignment = useMutation(createAssignmentMutation());
  const updateAssignment = useMutation(updateAssignmentMutation());

  const handleSubmit = async (values: AsignmentFormValues) => {
    const payload = {
      ...values,
      lesson_uuid: (lessonId as string) || values?.lesson_uuid,
      status: values.status || 'DRAFT',
      points_display: `${values.max_points} points`,
      updated_by: user?.email,
      assignment_scope: '',
      submission_sumary: '',
      // additional rubric info
    };

    if (assignmentId) {
      updateAssignment.mutate(
        { path: { uuid: assignmentId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllAssignmentsQueryKey({
                query: { pageable: {} },
              }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createAssignment.mutate(
        { body: payload as any },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getAllAssignmentsQueryKey({
                query: { pageable: {} },
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
              <FormLabel>Assignment Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter assignment title' {...field} />
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
                <SimpleEditor value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='instructions'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <SimpleEditor value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='due_date'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <input
                    type='datetime-local'
                    className='w-full rounded-md border border-gray-300 px-3 py-[7px] text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={e => field.onChange(new Date(e.target.value).toISOString())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='max_points'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Max Points</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g. 80'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='submission_types'
            render={() => (
              <FormItem className='w-full'>
                <FormLabel>Submission Types</FormLabel>
                <div className='mb-1 flex items-center gap-2'>
                  <Select
                    onValueChange={type => {
                      const current = form.watch('submission_types') || [];
                      if (type && !current.includes(type)) {
                        form.setValue('submission_types', [...current, type]);
                      }
                    }}
                  >
                    <FormControl className='w-full'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select submission type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBMISSION_TYPES.filter(
                        (type: string) => !(form.watch('submission_types') || []).includes(type)
                      ).map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Display selected submission types as badges */}
                <div className='flex flex-wrap gap-2'>
                  {(form.watch('submission_types') || []).map((type: string, index: number) => (
                    <Badge key={type} variant='secondary' className='flex items-center gap-1'>
                      {type}
                      <button
                        type='button'
                        className='ml-2'
                        onClick={() => {
                          const current = form.watch('submission_types') || [];
                          form.setValue(
                            'submission_types',
                            current?.filter((_: any, i: any) => i !== index)
                          );
                        }}
                        aria-label={`Remove submission type ${type}`}
                      >
                        <XIcon className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='rubric_uuid'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Assign Rubric</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select rubric' />
                </SelectTrigger>
                <SelectContent>
                  {rubrics?.data?.content?.map(rubric => (
                    <SelectItem key={rubric.uuid} value={rubric.uuid as string}>
                      {rubric.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            disabled={createAssignment.isPending || updateAssignment.isPending}
          >
            {(createAssignment.isPending || updateAssignment.isPending) && <Spinner />}
            {initialValues ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AssignmentDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  lessonId?: string;
  editingAssignmetId?: string;
  initialValues?: Partial<AsignmentFormValues>;
  onSuccess?: any;
  onCancel: () => any;
}

function AssignmentDialog({
  isOpen,
  setOpen,
  editingAssignmetId,
  initialValues,
  lessonId,
  onSuccess,
  onCancel,
}: AssignmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {editingAssignmetId ? 'Edit Assignment' : 'Add Assignment'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingAssignmetId ? 'Edit Assignment' : 'Create a new assignment'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <AssignmentForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            assignmentId={editingAssignmetId}
            lessonId={lessonId as string}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { AssignmentDialog };
