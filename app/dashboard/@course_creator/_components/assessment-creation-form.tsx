'use client'

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Disc } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../../../components/ui/button'
import {
    addQuestionOptionMutation,
    addQuizQuestionMutation,
    createQuizMutation,
    deleteQuestionOptionMutation,
    deleteQuizMutation,
    deleteQuizQuestionMutation,
    getQuizQuestionsOptions,
    getQuizQuestionsQueryKey,
    searchQuizzesQueryKey,
    updateQuestionOptionMutation,
    updateQuizMutation,
    updateQuizQuestionMutation
} from '../../../../services/client/@tanstack/react-query.gen'
import { QuizCreationForm } from './quiz-creation-form'

const tabs = [
    'Quiz',
    'Assignment',
    'Project',
    'Discussions',
    'Attendance',
]

type AssessmentCreationFormProps = {
    course: any
    lessons: any
    lessonContentsMap: any
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'MATCHING' | "SHORT_ANSWER"

export type Option = {
    uuid?: string
    text: string
    isCorrect: boolean
}

export type MatchingPair = {
    left: string
    right: string
}

export type Question = {
    uuid?: string
    text: string
    type: QuestionType
    options?: Option[]
    answer?: string
    pairs?: MatchingPair[]
    points?: number
}

export type QuizState = Record<number, Question[]>

const AssessmentCreationForm = ({
    course,
    lessonContentsMap,
    lessons,
}: AssessmentCreationFormProps) => {
    const qc = useQueryClient()
    const [activeTab, setActiveTab] = useState('Quiz')

    const [selectedLesson, setSelectedLesson] = useState<any | null>(null)
    const [selectedLessonId, setSelectedLessonId] = useState<any>(
        lessons?.content[0]?.id
    )

    const [activeQuizUuid, setActiveQuizUuid] = useState<string | null>(null)

    const handleQuizCreatedOrSelected = (quizUuid: string | null) => {
        console.log('Active quiz UUID:', quizUuid)
        setActiveQuizUuid(quizUuid)
    }

    // Mutations
    const createQuiz = useMutation(createQuizMutation());
    const updateQuiz = useMutation(updateQuizMutation());
    const deleteQuiz = useMutation(deleteQuizMutation());

    const addQuizQuestion = useMutation(addQuizQuestionMutation());
    const updateQuizQuestion = useMutation(updateQuizQuestionMutation());
    const deleteQuizQuestion = useMutation(deleteQuizQuestionMutation());

    const addQuestionOption = useMutation(addQuestionOptionMutation());
    const updateQuestionOption = useMutation(updateQuestionOptionMutation());
    const deleteQuestionOption = useMutation(deleteQuestionOptionMutation());

    const buildQuestionPayload = (
        q: Question,
        index: number,
        quizUuid: string,
        userEmail?: string
    ) => ({
        quiz_uuid: quizUuid,
        question_text: q.text,
        question_type: q.type,
        display_order: index + 1,
        points: q.points,
        question_number: `Question ${index + 1}`,
        question_category: `${q.type} Question`,
        updated_by: userEmail,
    })

    const buildOptionPayload = (
        opt: Option,
        index: number,
        questionUuid: string,
        userEmail?: string
    ) => ({
        question_uuid: questionUuid,
        option_text: opt.text,
        is_correct: opt.isCorrect,
        is_incorrect: `${!opt.isCorrect}`,
        display_order: index + 1,
        position_display: `Option ${index + 1}`,
        correctness_status: opt.isCorrect ? 'Correct Answer' : 'Wrong Answer',
        updated_by: userEmail,
    })

    const [quizData, setQuizData] = useState<QuizState>({})

    // Fetch quiz questions
    const { data: quizquestions } = useQuery({
        ...getQuizQuestionsOptions({ path: { quizUuid: activeQuizUuid as string } }),
        enabled: !!activeQuizUuid
    })

    // Fetch options for each question
    const questionOptionsQueries = useQueries({
        queries:
            quizquestions?.data?.map((q: any) => ({
                queryKey: ['questionOptions', activeQuizUuid, q.uuid],
                queryFn: async () => {
                    const result = await fetch(`/api/quizzes/${activeQuizUuid}/questions/${q.uuid}/options?pageable={}`);
                    return result.json();
                },
                enabled: !!activeQuizUuid && !!q.uuid,
            })) ?? [],
    });

    // Track if data has been loaded to prevent infinite loops
    const [loadedQuizUuid, setLoadedQuizUuid] = useState<string | null>(null);

    // Populate quizData when backend data loads
    useEffect(() => {
        // Only update if we have a new quiz or the quiz changed
        if (activeQuizUuid && activeQuizUuid !== loadedQuizUuid && quizquestions?.data) {
            const allOptionsLoaded = questionOptionsQueries.every(q => !q.isLoading);

            if (!allOptionsLoaded) return; // Wait for all options to load

            const questionsWithOptions: Question[] = quizquestions.data.map((q: any, index: number) => {
                const optionsData = questionOptionsQueries[index]?.data?.data?.content ?? [];

                const options: Option[] =
                    q.requires_options && optionsData.length
                        ? optionsData.map((opt: any) => ({
                            uuid: opt.uuid,
                            text: opt.option_text,
                            isCorrect: opt.is_correct,
                        }))
                        : [];

                return {
                    uuid: q.uuid,
                    text: q.question_text,
                    type: q.question_type.toUpperCase() as QuestionType,
                    points: q.points,
                    options:
                        q.question_type === 'multiple_choice' || q.question_type === 'true_false'
                            ? options
                            : undefined,
                    pairs:
                        q.question_type === 'matching'
                            ? options.map((pair: any) => ({
                                left: pair.left_text,
                                right: pair.right_text,
                            }))
                            : undefined,
                    answer:
                        q.question_type === 'essay' || q.question_type === 'short_answer'
                            ? ''
                            : undefined,
                };
            });

            setQuizData(prev => ({
                ...prev,
                [selectedLessonId]: questionsWithOptions
            }));
            setLoadedQuizUuid(activeQuizUuid);
        } else if (!activeQuizUuid && loadedQuizUuid) {
            // Quiz was deselected, clear questions
            setQuizData(prev => ({
                ...prev,
                [selectedLessonId]: []
            }));
            setLoadedQuizUuid(null);
        }
    }, [activeQuizUuid, quizquestions?.data, questionOptionsQueries, selectedLessonId, loadedQuizUuid]);

    const questions: Question[] = quizData[selectedLessonId] ?? [];

    // CRUD Handlers
    const handleUpdateQuiz = async (quizUuid: string, payload: any) => {
        try {
            await updateQuiz.mutateAsync({
                path: { uuid: quizUuid },
                body: payload,
            });

            qc.invalidateQueries({
                queryKey: searchQuizzesQueryKey({
                    query: { pageable: {}, searchParams: { lesson_uuid_eq: selectedLessonId as string } },
                }),
            });

            toast.success('Quiz updated successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update quiz.');
        }
    };

    const handleDeleteQuiz = async (quizUuid: string) => {
        if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteQuiz.mutateAsync({
                path: { uuid: quizUuid as string },
            });

            qc.invalidateQueries({
                queryKey: searchQuizzesQueryKey({
                    query: { pageable: {}, searchParams: { lesson_uuid_eq: selectedLessonId as string } },
                }),
            });

            setActiveQuizUuid(null);
            setQuizData(prev => ({ ...prev, [selectedLessonId]: [] }));

            toast.success('Quiz deleted successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete quiz.');
        }
    };

    const handleSaveQuizQuestions = async () => {
        if (!selectedLessonId || !activeQuizUuid) {
            toast.error("Please select a lesson and create/select a quiz first");
            return;
        }

        const questions = quizData[selectedLessonId] ?? [];

        if (!questions.length) {
            toast.error("No questions to save");
            return;
        }

        try {
            for (let qIndex = 0; qIndex < questions.length; qIndex++) {
                const q = questions[qIndex];
                try {
                    // 1️⃣ Create or update question
                    let questionUuid = q.uuid;
                    if (!questionUuid) {
                        const res: any = await addQuizQuestion.mutateAsync({
                            path: { quizUuid: activeQuizUuid },
                            body: buildQuestionPayload(q, qIndex, activeQuizUuid, "test@example.com"),
                        });
                        questionUuid = res?.data?.question_uuid || res?.question_uuid;
                        q.uuid = questionUuid;
                    } else {
                        await updateQuizQuestion.mutateAsync({
                            path: { quizUuid: activeQuizUuid, questionUuid },
                            body: buildQuestionPayload(q, qIndex, activeQuizUuid, "test@example.com"),
                        });
                    }

                    // 2️⃣ Create or update options
                    if ((q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && q.options?.length) {
                        for (let oIndex = 0; oIndex < q.options.length; oIndex++) {
                            const opt = q.options[oIndex];
                            if (!opt.text?.trim()) continue;

                            if (opt.uuid) {
                                await updateQuestionOption.mutateAsync({
                                    path: { quizUuid: activeQuizUuid, questionUuid, optionUuid: opt.uuid },
                                    body: buildOptionPayload(opt, oIndex, questionUuid, "test@example.com"),
                                });
                            } else {
                                const newOpt: any = await addQuestionOption.mutateAsync({
                                    path: { quizUuid: activeQuizUuid, questionUuid },
                                    body: buildOptionPayload(opt, oIndex, questionUuid, "test@example.com"),
                                });
                                opt.uuid = newOpt?.data?.uuid || newOpt?.uuid;
                            }
                        }
                    }
                } catch (qErr) {
                    console.error("Failed to save question", qIndex, qErr);
                    toast.error(`Failed to save question ${qIndex + 1}`);
                }
            }

            qc.invalidateQueries({
                queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid } }),
            });

            toast.success("All questions and options saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save quiz questions");
        }
    };



    const addQuestion = (type: QuestionType) => {
        if (!selectedLessonId) return;

        const newQuestion: Question = (() => {
            switch (type) {
                case 'MULTIPLE_CHOICE':
                    return {
                        text: '',
                        type: 'MULTIPLE_CHOICE',
                        points: 1,
                        options: Array(4).fill(null).map(() => ({ text: '', isCorrect: false })),
                    }
                case 'TRUE_FALSE':
                    return {
                        text: '',
                        type: 'TRUE_FALSE',
                        points: 1,
                        options: [
                            { text: 'True', isCorrect: false },
                            { text: 'False', isCorrect: false },
                        ],
                    }
                case 'ESSAY':
                case 'SHORT_ANSWER':
                    return { text: '', type, points: 5 }
                case 'MATCHING':
                    return {
                        text: '',
                        type: 'MATCHING',
                        points: 5,
                        pairs: [
                            { left: '', right: '' },
                            { left: '', right: '' },
                        ],
                    }
            }
        })()

        setQuizData(prev => {
            const currentQuestions = prev[selectedLessonId] ?? []
            return { ...prev, [selectedLessonId]: [...currentQuestions, newQuestion] }
        })
    }

    const updateQuestionText = (qIndex: number, value: string) => {
        setQuizData((prev) => {
            const updated = [...(prev[selectedLessonId] ?? [])]
            updated[qIndex] = { ...updated[qIndex], text: value }
            return { ...prev, [selectedLessonId]: updated }
        })
    }

    const updateQuestionPoints = (qIndex: number, points: number) => {
        setQuizData(prev => {
            const updated = [...(prev[selectedLessonId] ?? [])]
            updated[qIndex] = { ...updated[qIndex], points }
            return { ...prev, [selectedLessonId]: updated }
        })
    }

    const handleDeleteQuestion = async (qIndex: number) => {
        const question = questions[qIndex];

        if (question.uuid) {
            if (!confirm('Delete this question from the quiz?')) return;

            try {
                await deleteQuizQuestion.mutateAsync({
                    path: {
                        quizUuid: activeQuizUuid!,
                        questionUuid: question.uuid
                    },
                });

                qc.invalidateQueries({
                    queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid! } }),
                });

                toast.success('Question deleted!');
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete question');
            }
        }
    };

    const updateOptionText = (qIndex: number, oIndex: number, value: string) => {
        setQuizData((prev) => {
            const updated = [...(prev[selectedLessonId] ?? [])]
            const options = [...(updated[qIndex].options ?? [])]
            options[oIndex] = { ...options[oIndex], text: value }
            updated[qIndex] = { ...updated[qIndex], options }
            return { ...prev, [selectedLessonId]: updated }
        })
    }

    const handleDeleteOption = async (qIndex: number, oIndex: number) => {
        const question = questions[qIndex];
        const option = question.options?.[oIndex];

        if ((question.options?.length ?? 0) <= 2) {
            toast.error('Cannot delete: minimum 2 options required');
            return;
        }

        if (option?.uuid && question.uuid) {
            try {
                await deleteQuestionOption.mutateAsync({
                    path: {
                        quizUuid: activeQuizUuid!,
                        questionUuid: question.uuid,
                        optionUuid: option.uuid
                    },
                });

                qc.invalidateQueries({
                    queryKey: ['questionOptions', activeQuizUuid, question.uuid],
                });

                toast.success('Option deleted!');
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete option');
            }
        } else {
            setQuizData((prev) => {
                const updated = [...(prev[selectedLessonId] ?? [])];
                const options = updated[qIndex].options ?? [];
                options.splice(oIndex, 1);
                updated[qIndex] = { ...updated[qIndex], options };
                return { ...prev, [selectedLessonId]: updated };
            });
        }
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        setQuizData((prev) => {
            const updated = [...(prev[selectedLessonId] ?? [])]
            const options = updated[qIndex].options?.map((opt, idx) => ({
                ...opt,
                isCorrect: idx === oIndex,
            }))
            updated[qIndex] = { ...updated[qIndex], options }
            return { ...prev, [selectedLessonId]: updated }
        })
    }

    return (
        <div className="w-full">
            <div className="flex border-b mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 -mb-px border-b-2 transition-colors ${activeTab === tab
                            ? 'border-primary text-primary font-semibold'
                            : 'text-muted-foreground hover:text-muted-foreground/90'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'Quiz' && (
                    <div>
                        <QuizCreationForm
                            lessons={lessons}
                            quizId={activeQuizUuid}
                            onSelectQuiz={handleQuizCreatedOrSelected}
                            questions={questions}
                            selectedLessonId={selectedLessonId}
                            selectedLesson={selectedLesson}
                            setSelectedLessonId={setSelectedLessonId}
                            setSelectedLesson={setSelectedLesson}
                            addQuestion={addQuestion}
                            updateQuestionText={updateQuestionText}
                            updateQuestionPoint={updateQuestionPoints}
                            updateOptionText={updateOptionText}
                            setCorrectOption={setCorrectOption}
                            deleteQuestion={handleDeleteQuestion}
                            deleteOption={handleDeleteOption}
                            createQuizForLesson={async (lessonId, payload) => {
                                const res: any = await createQuiz.mutateAsync({
                                    body: {
                                        ...payload,
                                        lesson_uuid: lessonId,
                                    },
                                })
                                return res?.data?.quiz_uuid || res?.quiz_uuid
                            }}
                            updateQuizForLesson={handleUpdateQuiz}
                            deleteQuizForLesson={handleDeleteQuiz}
                            addQuizQuestion={async (payload) => {
                                const res: any = await addQuizQuestion.mutateAsync({
                                    path: { quizUuid: payload.quiz_uuid },
                                    body: payload,
                                })
                                return res
                            }}
                            addQuestionOption={async (payload) => {
                                const res: any = await addQuestionOption.mutateAsync({
                                    path: {
                                        quizUuid: payload.quiz_uuid,
                                        questionUuid: payload.question_uuid,
                                    },
                                    body: payload,
                                })
                                return res
                            }}
                        />

                        <div className='flex self-end justify-end mt-4'>
                            <Button
                                onClick={handleSaveQuizQuestions}
                                disabled={
                                    addQuizQuestion.isPending ||
                                    addQuestionOption.isPending ||
                                    updateQuizQuestion.isPending ||
                                    updateQuestionOption.isPending ||
                                    !selectedLessonId ||
                                    !activeQuizUuid ||
                                    (quizData[selectedLessonId]?.length ?? 0) === 0
                                }
                            >
                                <Disc className="mr-2 h-4 w-4" />
                                {(addQuizQuestion.isPending ||
                                    addQuestionOption.isPending ||
                                    updateQuizQuestion.isPending ||
                                    updateQuestionOption.isPending)
                                    ? 'Saving...'
                                    : 'Save Questions'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'Assignment' && <div>Assignment Content</div>}
                {activeTab === 'Project' && <div>Project Content</div>}
                {activeTab === 'Discussions' && <div>Discussions Content</div>}
                {activeTab === 'Attendance' && <div>Attendance Content</div>}
            </div>
        </div>
    )
}

export default AssessmentCreationForm