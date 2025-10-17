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
import { useUserProfile } from '@/context/profile-context';
import { QuestionTypeEnum } from '@/services/client';
import {
  addQuestionOptionMutation,
  addQuizQuestionMutation,
  createQuizMutation,
  getAllAssessmentRubricsOptions,
  getQuestionOptionsQueryKey,
  getQuizQuestionsQueryKey,
  searchQuizzesQueryKey,
  updateQuestionOptionMutation,
  updateQuizMutation,
  updateQuizQuestionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

export const quizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  time_limit_minutes: z.coerce.number().optional(),
  attempts_allowed: z.coerce.number().optional(),
  passing_score: z.coerce.number().optional(),
  status: z.string().optional(),
  active: z.boolean().default(false),
  rubric_uuid: z.string().optional(),
});

export type QuizFormValues = z.infer<typeof quizSchema>;

function QuizForm({
  onSuccess,
  initialValues,
  quizId,
  lessonId,
  onCancel,
  className,
}: {
  quizId?: string;
  lessonId: string;
  initialValues?: QuizFormValues;
  onSuccess: any;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      ...initialValues,
    },
  });

  const qc = useQueryClient();
  const user = useUserProfile();

  const { data: rubrics } = useQuery(getAllAssessmentRubricsOptions({ query: { pageable: {} } }));

  const createQuiz = useMutation(createQuizMutation());
  const updateQuiz = useMutation(updateQuizMutation());

  const handleSubmit = async (values: QuizFormValues) => {
    const payload = {
      ...values,
      lesson_uuid: lessonId as string,
      status: values.status || 'DRAFT',
      updated_by: user?.email,
      // additional rubric info
    };

    if (quizId) {
      updateQuiz.mutate(
        { path: { uuid: quizId }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: searchQuizzesQueryKey({
                query: { pageable: {}, searchParams: { lessonUuid: lessonId } },
              }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      createQuiz.mutate(
        { body: payload as any },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: searchQuizzesQueryKey({
                query: { pageable: {}, searchParams: { lessonUuid: lessonId } },
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
              <FormLabel>Quiz Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter quiz title' {...field} />
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
                <Input placeholder='Optional quiz description' {...field} />
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
                <Input placeholder='Optional quiz instructions' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='time_limit_minutes'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Time Limit (mins)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g. 60'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='passing_score'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Passing Score</FormLabel>
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
            name='attempts_allowed'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Attempts Allowed</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g. 3'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
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
            disabled={createQuiz.isPending || updateQuiz.isPending}
          >
            {(createQuiz.isPending || updateQuiz.isPending) && <Spinner />}
            {initialValues ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const questionSchema = z.object({
  quiz_uuid: z.string().optional(),
  question_text: z.string().min(1, 'Question is required'),
  question_type: z.string().optional(),
  points: z.coerce.number().optional(),
  display_order: z.coerce.number().optional(),
  question_number: z.string().optional(),
  requires_option: z.boolean().default(false),
});

export type QuestionFormValues = z.infer<typeof questionSchema>;

function QuestionForm({
  onSuccess,
  initialValues,
  quizId,
  questionId,
  onCancel,
  className,
}: {
  quizId?: string;
  questionId?: string;
  initialValues?: QuestionFormValues;
  onSuccess: any;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const qc = useQueryClient();
  const user = useUserProfile();

  const addQuizQuestion = useMutation(addQuizQuestionMutation());
  const updateQuizQuestion = useMutation(updateQuizQuestionMutation());

  const handleSubmit = async (values: QuestionFormValues) => {
    const payload = {
      ...values,
      quiz_uuid: quizId as string,
      updated_by: user?.email,
      points_display: `${values.points}.0 Points`,
      question_number: `Question ${values.display_order}`,
      question_category: `${values.question_type} Question`,
      // additional question info
    };

    if (questionId) {
      updateQuizQuestion.mutate(
        {
          body: payload as any,
          path: { quizUuid: quizId as string, questionUuid: questionId as string },
        },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getQuizQuestionsQueryKey({
                path: { quizUuid: quizId as string },
              }),
            });
            toast.success(data?.message);
            onCancel();
            onSuccess();
          },
        }
      );
    } else {
      addQuizQuestion.mutate(
        { body: payload as any, path: { quizUuid: quizId as string } },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getQuizQuestionsQueryKey({
                path: { quizUuid: quizId as string },
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
          name='question_text'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Input placeholder='Enter question text' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='question_type'
          render={({ field }) => (
            <FormItem className='w-full flex-1'>
              <FormLabel>Question Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select question type' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QuestionTypeEnum).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
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
          name='requires_option'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>Requires Options</FormLabel>
                <FormDescription>Indicate if this question has options.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='points'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g. 2'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
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
                  <Input
                    type='number'
                    placeholder='e.g. 1, 2, 3'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
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
            className='flex min-w-[160px] items-center justify-center gap-2'
            disabled={addQuizQuestion.isPending || updateQuizQuestion.isPending}
          >
            {(addQuizQuestion.isPending || updateQuizQuestion.isPending) && <Spinner />}
            {questionId ? 'Update Quiz Question' : 'Add Quiz Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const optionSchema = z.object({
  question_uuid: z.string().optional(),
  option_text: z.string().min(1, 'Option text is required'),
  is_correct: z.boolean().default(false),
  display_order: z.coerce.number().optional(),
  option_category: z.string().optional(),
});

export type OptionFormValues = z.infer<typeof optionSchema>;

function OptionForm({
  onSuccess,
  initialValues,
  quizId,
  questionId,
  optionId,
  onCancel,
  className,
}: {
  quizId?: string;
  questionId?: string;
  optionId?: string;
  initialValues?: OptionFormValues;
  onSuccess: any;
  onCancel: () => void;
  className: any;
}) {
  const form = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const qc = useQueryClient();
  const user = useUserProfile();

  const addQuestionOption = useMutation(addQuestionOptionMutation());
  const updateQuestionOption = useMutation(updateQuestionOptionMutation());

  const handleSubmit = async (values: OptionFormValues) => {
    const payload = {
      ...values,
      question_uuid: questionId as string,
      updated_by: user?.email,
      is_incorrect: `${!values.is_correct}`,
      position_display: `Option ${values.display_order}`,
      correctness_status: `${values.is_correct} ? "Correct Answer" : "Wrong Answer"`,
      option_summary: ``,
      // additional question info
    };

    if (optionId) {
      updateQuestionOption.mutate(
        {
          body: payload as any,
          path: {
            quizUuid: quizId as string,
            questionUuid: questionId as string,
            optionUuid: optionId as string,
          },
        },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getQuestionOptionsQueryKey({
                path: { quizUuid: quizId as string, questionUuid: questionId as string },
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
      addQuestionOption.mutate(
        {
          body: payload as any,
          path: { quizUuid: quizId as string, questionUuid: questionId as string },
        },
        {
          onSuccess: (data: any) => {
            qc.invalidateQueries({
              queryKey: getQuestionOptionsQueryKey({
                path: { quizUuid: quizId as string, questionUuid: questionId as string },
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
          name='option_text'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Option Text</FormLabel>
              <FormControl>
                <Input placeholder='Enter option text' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='is_correct'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>Is Correct</FormLabel>
                <FormDescription>Indicate if this option is the correct answer.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className='flex flex-col items-start gap-6 sm:flex-row'>
          <FormField
            control={form.control}
            name='display_order'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g. 1, 2, 3'
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
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
            className='flex min-w-[160px] items-center justify-center gap-2'
            disabled={addQuestionOption.isPending || updateQuestionOption.isPending}
          >
            {(addQuestionOption.isPending || updateQuestionOption.isPending) && <Spinner />}
            {optionId ? 'Update Question Option' : 'Add Question Option'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface AddQuizDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  lessonId?: string;
  editingQuiz?: string;
  initialValues?: Partial<QuizFormValues>;
  onSuccess?: any;
  onCancel: () => any;
}

function QuizDialog({
  isOpen,
  setOpen,
  editingQuiz,
  initialValues,
  lessonId,
  onSuccess,
  onCancel,
}: AddQuizDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>{editingQuiz ? 'Edit Quiz' : 'Add Quiz'}</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {editingQuiz ? 'Edit your Quiz' : 'Create a new quiz'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <QuizForm
            onCancel={onCancel}
            initialValues={initialValues as any}
            className='px-6 pb-6'
            quizId={editingQuiz}
            lessonId={lessonId as string}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface QuestionDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  quizId?: string;
  questionId?: string;
  initialValues?: Partial<QuizFormValues>;
  onSuccess?: any;
  onCancel: () => any;
}

function QuestionDialog({
  isOpen,
  setOpen,
  quizId,
  questionId,
  initialValues,
  onSuccess,
}: QuestionDialogProps) {
  const isEditMode = Boolean(questionId);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>
            {isEditMode ? 'Edit Question' : 'Add Question'}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {isEditMode ? 'Edit the selected question.' : 'Add a new question to the quiz.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <QuestionForm
            onSuccess={onSuccess}
            onCancel={() => setOpen(false)}
            className='px-6 pb-6'
            quizId={quizId}
            questionId={questionId}
            initialValues={initialValues as any}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface OptionsDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  quizId?: string;
  questionId?: string;
  optionId?: string;
  initialValues?: Partial<QuizFormValues>;
  onSuccess?: any;
  onCancel: () => any;
}

function OptionDialog({
  isOpen,
  setOpen,
  quizId,
  questionId,
  optionId,
  initialValues,
  onSuccess,
}: OptionsDialogProps) {
  const isEditMode = Boolean(optionId);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 py-4'>
          <DialogTitle className='text-xl'>{isEditMode ? 'Edit Option' : 'Add Option'}</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            {isEditMode ? 'Edit the selected option.' : 'Add a new option to the question.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-12rem)]'>
          <OptionForm
            onSuccess={onSuccess}
            onCancel={() => setOpen(false)}
            className='px-6 pb-6'
            quizId={quizId}
            questionId={questionId}
            initialValues={initialValues as any}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { OptionDialog, QuestionDialog, QuizDialog };
