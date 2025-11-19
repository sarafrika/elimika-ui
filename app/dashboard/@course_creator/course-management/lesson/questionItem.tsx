import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteQuestionOptionMutation,
  deleteQuizQuestionMutation,
  getQuestionOptionsOptions,
  getQuestionOptionsQueryKey,
  getQuizQuestionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, PenLine, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  OptionDialog,
  QuestionDialog,
  type QuestionFormValues,
} from '../../_components/quiz-management-form';

type QuestionItemProps = {
  quizUuid: string;
  question: any;
  qIndex: number;
  userDomain: any;
};

const QuestionItem = ({ quizUuid, question, qIndex, userDomain }: QuestionItemProps) => {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery(
    getQuestionOptionsOptions({
      path: { quizUuid, questionUuid: question.uuid },
      query: { pageable: {} },
    })
  );
  const options = data?.data?.content || [];

  const [openEditQuestionModal, setOpenEditQuestionModal] = useState(false);
  const [editingQuestionData, setEditingQuestionData] = useState<QuestionFormValues | null>(null);
  const [openDeleteQuestionModal, setOpenDeleteQuestionModal] = useState(false);
  const [openDeleteOptionModal, setOpenDeleteOptionModal] = useState(false);

  const [openAddOptionsModal, setOpenAddOptionsModal] = useState(false);

  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingOptionId, setEditingoptionId] = useState<string | null>(null);

  const handleEditQuestion = (question: any) => {
    setEditingQuestionData(question);
    setEditingQuizId(question?.quiz_uuid);
    setEditingQuestionId(question?.uuid);
    setOpenEditQuestionModal(true);
  };

  const handleDeleteQuestion = (question: any) => {
    setEditingQuestionId(question?.uuid);
    setEditingQuizId(question?.quiz_uuid);
    setOpenDeleteQuestionModal(true);
  };

  const handleAddOptions = (question: any) => {
    setEditingQuestionId(question?.uuid);
    setEditingQuizId(question?.quiz_uuid);
    setOpenAddOptionsModal(true);
  };

  const handleDeleteOption = (option: any, quizId: string) => {
    setEditingQuizId(quizId);
    setEditingQuestionId(option?.question_uuid);
    setEditingoptionId(option?.uuid);
    setOpenDeleteOptionModal(true);
  };

  // mutate
  const deleteQuestionMutation = useMutation(deleteQuizQuestionMutation());
  const confirmDelete = () => {
    if (!editingQuestionId) return;

    deleteQuestionMutation.mutate(
      { path: { quizUuid: editingQuizId as string, questionUuid: editingQuestionId as string } },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: editingQuizId as string } }),
          });
          toast.success('Question deleted successfully');
        },
      }
    );
  };

  const deleteOptionMutation = useMutation(deleteQuestionOptionMutation());
  const confirmDeleteOption = () => {
    if (!editingOptionId) return;

    deleteOptionMutation.mutate(
      {
        path: {
          quizUuid: editingQuizId as string,
          questionUuid: editingQuestionId as string,
          optionUuid: editingOptionId as string,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getQuestionOptionsQueryKey({
              path: {
                quizUuid: editingQuizId as string,
                questionUuid: editingQuestionId as string,
              },
              query: { pageable: {} },
            }),
          });
          toast.success('Option deleted successfully');
          setOpenDeleteOptionModal(false);
        },
      }
    );
  };

  return (
    <div className='p-2'>
      <div className='group relative flex flex-row items-start gap-3'>
        {/* Index on the left */}
        <div className='mt-1 w-8 flex-shrink-0 text-center font-semibold'>
          {qIndex + 1}.
        </div>

        {/* Question text & points */}
        {!isLoading && (
          <div className='flex w-full flex-col gap-1'>
            <p className='font-medium'>{question.question_text}</p>
            <p className='text-sm font-bold'>
              Points: {question.points_display}
            </p>

            {/* Only show options & actions if creator */}
            {userDomain === 'course_creator' && (
              <div className='absolute top-0 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleEditQuestion(question)}>
                      <PenLine className='mr-1 h-4 w-4' />
                      Edit Question
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleAddOptions(question)}>
                      <PlusCircle className='mr-1 h-4 w-4' />
                      Add Options
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-red-600'
                      onClick={() => handleDeleteQuestion(question)}
                    >
                      <Trash className='mr-1 h-4 w-4' />
                      Delete Question
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options Table */}
      {options.length > 0 && (
        <div className='border-muted bg-card mt-3 ml-10 max-w-5xl overflow-x-auto rounded-md border p-3 shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10 text-center'>#</TableHead>
                <TableHead>Option Text</TableHead>
                <TableHead className='w-32 text-center'>Is Correct</TableHead>
                <TableHead className='w-24 text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option: any, index: number) => (
                <TableRow
                  key={option.uuid}
                  className={`group transition-colors ${option.is_correct ? ' hover:bg-green-100 hover:text-black' : 'hover:bg-muted'
                    }`}
                >
                  <TableCell className='text-center'>{index + 1}</TableCell>
                  <TableCell>{option.option_text}</TableCell>
                  <TableCell className='text-center'>
                    {option.is_correct ? (
                      <span className='rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700'>
                        ✓ Correct
                      </span>
                    ) : (
                      <span className='rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600'>
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    {userDomain === 'course_creator' && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-700'
                        onClick={() => handleDeleteOption(option, question?.quiz_uuid)}
                      >
                        <Trash className='h-4 w-4' />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Add Option Button */}
          {userDomain === 'course_creator' && (
            <div className='mt-3 flex justify-start'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleAddOptions(question)}
                className='flex items-center gap-1'
              >
                <PlusCircle className='h-4 w-4' />
                Add New Option
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No options fallback */}
      {userDomain === 'course_creator' && options.length === 0 && question.requires_options && (
        <div className='text-muted-foreground mt-3 ml-10 flex flex-row items-center gap-2 text-sm italic'>
          No options added yet.
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleAddOptions(question)}
            className='flex items-center gap-1'
          >
            <PlusCircle className='h-4 w-4' />
            Add New Option
          </Button>
        </div>
      )}

      {/* ... dialogs */}
      <QuestionDialog
        isOpen={openEditQuestionModal}
        setOpen={setOpenEditQuestionModal}
        quizId={editingQuizId as string}
        questionId={editingQuestionId as string}
        initialValues={editingQuestionData as any}
        onCancel={() => {
          setOpenEditQuestionModal(false);
        }}
      />

      <OptionDialog
        isOpen={openAddOptionsModal}
        setOpen={setOpenAddOptionsModal}
        quizId={editingQuizId as string}
        questionId={editingQuestionId as string}
        optionId={editingOptionId ?? ''}
        // initialValues={editingQuestionData as any}
        onCancel={() => {
          setOpenAddOptionsModal(false);
        }}
      />

      <DeleteModal
        open={openDeleteQuestionModal}
        setOpen={setOpenDeleteQuestionModal}
        title='Delete Question'
        description='Are you sure you want to delete this question? This action cannot be undone.'
        onConfirm={confirmDelete}
        isLoading={deleteQuestionMutation.isPending}
        confirmText='Delete Question'
      />

      <DeleteModal
        open={openDeleteOptionModal}
        setOpen={setOpenDeleteOptionModal}
        title='Delete Option'
        description='Are you sure you want to delete this option? This action cannot be undone.'
        onConfirm={confirmDeleteOption}
        isLoading={deleteOptionMutation.isPending}
        confirmText='Delete Option'
      />
    </div>
  );
};

export default QuestionItem;
