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
  deleteAssignmentMutation,
  getAllAssessmentRubricsOptions,
  getAllAssignmentsQueryKey,
  getCourseLessonsOptions,
  updateAssignmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  BookOpenCheck,
  Calendar,
  ClipboardCheck,
  Grip,
  MoreVertical,
  PlusCircle,
  Trash,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import DeleteModal from '../../../../components/custom-modals/delete-modal';
import RichTextRenderer from '../../../../components/editors/richTextRenders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { CustomLoadingState } from './loading-state';

const SUBMISSION_TYPES = ['PDF', 'AUDIO', 'TEXT'];

export const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  lesson_uuid: z.string().min(1, 'Please select a lesson to add an assignment.'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  max_points: z.coerce.number().optional(),
  rubric_uuid: z.string().optional(),
  status: z.string().optional(),
  active: z.boolean().default(false),
  due_date: z.date().optional(),
  assignment_category: z.string().optional(),
  submission_types: z.any().optional(),
});

export type AsignmentFormValues = z.infer<typeof assignmentSchema>;

function AssignmentForm({
  onSuccess,
  initialValues,
  assignmentId,
  courseId,
  onCancel,
  className,
}: {
  assignmentId?: string;
  courseId: string;
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

  const { data: lessons, isLoading: lessonIsLoading } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });

  const { data: rubrics } = useQuery(getAllAssessmentRubricsOptions({ query: { pageable: {} } }));

  const createAssignment = useMutation(createAssignmentMutation());
  const updateAssignment = useMutation(updateAssignmentMutation());

  const handleSubmit = async (values: AsignmentFormValues) => {
    const payload = {
      ...values,
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
          name='lesson_uuid'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Associated Lesson</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a lesson' />
                </SelectTrigger>
                <SelectContent>
                  {lessons?.data?.content?.map(lesson => (
                    <SelectItem key={lesson.uuid} value={lesson?.uuid as string}>
                      {lesson.title}
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
                    onChange={e => field.onChange(new Date(e.target.value))}
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
  courseId: string;
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
  courseId,
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
            courseId={courseId as string}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type AssignmentListProps = {
  courseTitle: string;
  courseId?: string;
  onAddAssignment: () => void;
  loading: boolean;
  assignments: any;
};

function AssignmentList({
  courseTitle,
  courseId,
  onAddAssignment,
  assignments,
  loading,
}: AssignmentListProps) {
  const qc = useQueryClient();
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [editingAssignmetId, setEditingAssignmentId] = useState();
  const [editingAssignmentData, setEditingAssignmentData] = useState();

  const handleEditAssignment = (assignment: any) => {
    setOpenAssignmentModal(true);
    setEditingAssignmentId(assignment?.uuid);
    setEditingAssignmentData(assignment);
  };

  const handleDeleteAssignment = (assignmentId: any) => {
    setEditingAssignmentId(assignmentId);
    setOpenDeleteModal(true);
  };

  const deleteMutation = useMutation(deleteAssignmentMutation());
  const confirmDelete = () => {
    if (!editingAssignmetId) return;
    deleteMutation.mutate(
      { path: { uuid: editingAssignmetId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getAllAssignmentsQueryKey({
              query: { pageable: {} },
            }),
          });
          setOpenDeleteModal(false);
          toast.success('Assignmet deleted successfully');
        },
      }
    );
  };

  if (loading) {
    return <CustomLoadingState subHeading='Fetching course assignments...' />;
  }

  return (
    <div className='space-y-8 rounded-[32px] border border-blue-200/40 bg-card p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:bg-gradient-to-br dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'>
      <div className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold'>{courseTitle}</h1>
          <p className='text-muted-foreground text-sm'>
            You have {assignments?.length}{' '}
            {assignments?.length === 1 ? 'assignment' : 'assignments'} created under this course.
          </p>
        </div>
        <Button onClick={onAddAssignment} className='self-start sm:self-end lg:self-center'>
          <PlusCircle className='h-4 w-4' />
          Add Assignment
        </Button>
      </div>

      {loading ? (
        <CustomLoadingState subHeading='Fetching course assignments' />
      ) : assignments?.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-12 text-center'>
          <BookOpenCheck className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No assignments found for this course.</h3>
          <p className='text-muted-foreground mt-2'>
            You can create new assignments for this course.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {assignments?.map((assignment: any, index: any) => (
            <div
              key={assignment?.uuid || index}
              className='group relative flex w-full items-start gap-4 rounded-[20px] border border-blue-200/40 bg-white/80 p-4 shadow-xl shadow-blue-200/30 backdrop-blur transition-all lg:p-8 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'
            >
              <Grip className='text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100' />

              <div className='w-full flex-1 space-y-3'>
                <div className='flex w-full items-start justify-between'>
                  <div className='flex w-full flex-col items-start'>
                    <div className='flex w-full flex-row items-center justify-between'>
                      <h3 className='text-lg font-medium'>{assignment?.title}</h3>
                      <span className='mr-2 inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'>
                        {assignment?.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>{' '}
                    <div className='text-muted-foreground text-sm'>
                      <RichTextRenderer htmlString={assignment?.description} maxChars={400} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='opacity-0 transition-opacity group-hover:opacity-100'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                        <ClipboardCheck className='mr-2 h-4 w-4' />
                        Edit Assignment
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-red-600'
                        onClick={() => {
                          if (assignment.uuid) {
                            handleDeleteAssignment(assignment?.uuid as string);
                          }
                        }}
                      >
                        <Trash className='mr-2 h-4 w-4' />
                        Delete Assignment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className='text-muted-foreground grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center gap-1.5'>
                    <Calendar className='h-4 w-4' />
                    <span className='font-semibold'>Date Due: {'  '}</span>
                    <span>
                      {assignment?.due_date &&
                        new Date(assignment.due_date).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                    </span>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <Calendar className='h-4 w-4' />
                    <span className='font-semibold'>Maximum points: {'  '}</span>
                    <span>{assignment?.max_points}</span>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <BookOpen className='h-4 w-4' />
                    <span className='font-semibold'>Submission types: {'  '}</span>
                    <span className='flex flex-wrap gap-2'>
                      {assignment?.submission_types?.map((type: any, index: any) => (
                        <span
                          key={index}
                          className='inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800'
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={openAssignmentModal}
        onOpenChange={open => {
          if (!open) {
            setOpenAssignmentModal(false);
          }
        }}
      >
        <DialogContent className='flex max-w-6xl flex-col p-0'>
          <DialogHeader className='border-b px-6 py-4'>
            <DialogTitle className='text-xl'>Edit Quiz</DialogTitle>
            <DialogDescription className='text-muted-foreground text-sm'>
              Edit quiz
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='h-[calc(90vh-16rem)]'>
            {editingAssignmentData && (
              <AssignmentDialog
                isOpen={openAssignmentModal}
                setOpen={setOpenAssignmentModal}
                editingAssignmetId={editingAssignmetId}
                initialValues={editingAssignmentData}
                courseId={courseId as string}
                onCancel={() => {
                  setOpenAssignmentModal(false);
                }}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        title='Delete Assignment'
        description='Are you sure you want to delete this assignment? This action cannot be undone.'
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        confirmText='Delete Assignment'
      />
    </div>
  );
}

export { AssignmentDialog, AssignmentList };
