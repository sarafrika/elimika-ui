import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteQuestionOptionMutation, deleteQuizQuestionMutation, getQuestionOptionsOptions, getQuestionOptionsQueryKey, getQuizQuestionsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, PenLine, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { OptionDialog, QuestionDialog, QuestionFormValues } from '../../_components/quiz-management-form';


type QuestionItemProps = {
    quizUuid: string;
    question: any;
    qIndex: number;
};

const QuestionItem = ({ quizUuid, question, qIndex }: QuestionItemProps) => {
    const qc = useQueryClient()

    const { data, isLoading, isError } = useQuery(
        getQuestionOptionsOptions({
            path: { quizUuid, questionUuid: question.uuid },
            query: { pageable: {} },
        })
    );
    const options = data?.data?.content || [];

    const [openEditQuestionModal, setOpenEditQuestionModal] = useState(false)
    const [editingQuestionData, setEditingQuestionData] = useState<QuestionFormValues | null>(null);
    const [openDeleteQuestionModal, setOpenDeleteQuestionModal] = useState(false)
    const [openDeleteOptionModal, setOpenDeleteOptionModal] = useState(false)

    const [openAddOptionsModal, setOpenAddOptionsModal] = useState(false)

    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [editingOptionId, setEditingoptionId] = useState<string | null>(null);

    const handleEditQuestion = (question: any) => {
        setEditingQuestionData(question)
        setEditingQuizId(question?.quiz_uuid)
        setEditingQuestionId(question?.uuid)
        setOpenEditQuestionModal(true)
    }

    const handleDeleteQuestion = (question: any) => {
        setEditingQuestionId(question?.uuid)
        setEditingQuizId(question?.quiz_uuid)
        setOpenDeleteQuestionModal(true)
    }

    const handleAddOptions = (question: any) => {
        setEditingQuestionId(question?.uuid)
        setEditingQuizId(question?.quiz_uuid)
        setOpenAddOptionsModal(true)
    }

    const handleDeleteOption = (option: any, quizId: string) => {
        setEditingQuizId(quizId)
        setEditingQuestionId(option?.question_uuid)
        setEditingoptionId(option?.uuid)
        setOpenDeleteOptionModal(true)
    }

    // mutate
    const deleteQuestionMutation = useMutation(deleteQuizQuestionMutation())
    const confirmDelete = () => {
        if (!editingQuestionId) return

        deleteQuestionMutation.mutate({ path: { quizUuid: editingQuizId as string, questionUuid: editingQuestionId as string } }, {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: editingQuizId as string } }) })
                toast.success('Question deleted successfully')
            }
        })
    }

    const deleteOptionMutation = useMutation(deleteQuestionOptionMutation())
    const confirmDeleteOption = () => {
        if (!editingOptionId) return

        deleteOptionMutation.mutate({ path: { quizUuid: editingQuizId as string, questionUuid: editingQuestionId as string, optionUuid: editingOptionId as string } }, {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getQuestionOptionsQueryKey({ path: { quizUuid: editingQuizId as string, questionUuid: editingQuestionId as string }, query: { pageable: {} } }) })
                toast.success('Option deleted successfully')
                setOpenDeleteOptionModal(false)
            }
        })
    }

    return (
        <div className='p-2'>
            {/* Wrap only the question row in a group */}
            <div className='group flex flex-row gap-4 items-center relative'>
                <p className='font-medium'>
                    {question.display_order}. {question.question_text}
                </p>
                <p className='text-sm font-bold'>
                    ({question.points_display})
                </p>

                {/* Only show on hover of the question row */}
                <div className='absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
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
            </div>

            {/* Options, loading, or error display below — not inside the group */}
            {isLoading ? (
                <p className='text-sm text-muted-foreground'>Loading options...</p>
            ) : isError ? (
                <p className='text-sm text-red-500'>Failed to load options.</p>
            ) : (
                <ul className='list-inside px-4 mr-6 text-sm text-muted-foreground space-y-1'>
                    {options?.map((option: any, i: number) => (
                        <li
                            key={i}
                            className='group flex items-center justify-between pr-2 hover:bg-muted rounded-sm transition-colors'
                        >
                            <span className='mr-2'>{option.option_text}</span>

                            <button
                                onClick={() => handleDeleteOption(option, question?.quiz_uuid)}
                                className='opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity'
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>

            )}

            {/* ... dialogs */}
            <QuestionDialog
                isOpen={openEditQuestionModal}
                setOpen={setOpenEditQuestionModal}
                quizId={editingQuizId as string}
                questionId={editingQuestionId as string}
                initialValues={editingQuestionData as any}
                onCancel={() => {
                    setOpenEditQuestionModal(false)
                }}
            />

            <OptionDialog
                isOpen={openAddOptionsModal}
                setOpen={setOpenAddOptionsModal}
                quizId={editingQuizId as string}
                questionId={editingQuestionId as string}
                optionId={editingOptionId ?? ""}
                // initialValues={editingQuestionData as any}
                onCancel={() => {
                    setOpenAddOptionsModal(false)
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
