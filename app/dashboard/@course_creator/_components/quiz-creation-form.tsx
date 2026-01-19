'use client'

import { useQuery } from '@tanstack/react-query'
import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../../../components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import { getAllAssessmentRubricsOptions, searchQuizzesOptions } from '../../../../services/client/@tanstack/react-query.gen'
import { Question, QuestionType } from './assessment-creation-form'

export type QuizCreationFormProps = {
    lessons: any
    quizId: any
    questions: Question[]
    selectedLessonId: string
    selectedLesson: any
    setSelectedLessonId: (id: string) => void
    setSelectedLesson: (lesson: any) => void

    onSelectQuiz?: (quizUuid: string | null) => void

    addQuestion: (type: QuestionType) => void
    updateQuestionText: (qIndex: number, value: string) => void
    updateOptionText: (qIndex: number, oIndex: number, value: string) => void
    updateQuestionPoint: (qIndex: number, points: number) => void
    setCorrectOption: (qIndex: number, oIndex: number) => void
    deleteQuestion: (qIndex: number) => void
    deleteOption: (qIndex: number, oIndex: number) => void

    // API callbacks
    createQuizForLesson: (lessonId: string, payload: any) => Promise<string>
    updateQuizForLesson: (quizUuid: string, payload: any) => Promise<void>
    deleteQuizForLesson: (quizUuid: string) => Promise<void>
    addQuizQuestion: (payload: any) => Promise<any>
    addQuestionOption: (payload: any) => Promise<any>
}

export const QuizCreationForm = ({
    lessons,
    quizId,
    questions,
    selectedLessonId,
    selectedLesson,
    setSelectedLessonId,
    setSelectedLesson,

    onSelectQuiz,

    addQuestion,
    updateQuestionText,
    updateQuestionPoint,
    updateOptionText,
    setCorrectOption,
    deleteQuestion,
    deleteOption,
    createQuizForLesson,
    updateQuizForLesson,
    deleteQuizForLesson,
    addQuizQuestion,
    addQuestionOption,
}: QuizCreationFormProps) => {
    const { data: rubrics, isLoading: rubricsIsLoading } = useQuery(
        getAllAssessmentRubricsOptions({ query: { pageable: {} } })
    );

    const { data: quizzes } = useQuery({
        ...searchQuizzesOptions({
            query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
        }),
        enabled: !!selectedLessonId
    })

    const quizUuid = quizId;

    const [quizData, setQuizData] = useState({
        title: '',
        instructions: '',
        time_limit_minutes: 0,
        attempts_allowed: 1,
        passing_score: 0,
        active: false,
        status: 'PUBLISHED',
        rubric_uuid: '',
        lesson_uuid: ""
    })

    const handleQuizInputChange = (field: string, value: any) => {
        setQuizData((prev) => ({ ...prev, [field]: value }))
    }

    const handleQuizSelect = (selectedUuid: string | null) => {
        if (onSelectQuiz) onSelectQuiz(selectedUuid)

        const selectedQuiz = quizzes?.data?.content?.find((q: any) => q.uuid === selectedUuid)

        if (selectedQuiz) {
            setQuizData({
                title: selectedQuiz.title || '',
                instructions: selectedQuiz.instructions || '',
                time_limit_minutes: selectedQuiz.time_limit_minutes || 0,
                attempts_allowed: selectedQuiz.attempts_allowed || 1,
                passing_score: selectedQuiz.passing_score || 0,
                active: selectedQuiz.active || false,
                status: selectedQuiz.status || 'PUBLISHED',
                rubric_uuid: selectedQuiz.rubric_uuid || '',
                lesson_uuid: selectedLessonId as string
            })
        } else {
            setQuizData({
                title: '',
                instructions: '',
                time_limit_minutes: 0,
                attempts_allowed: 1,
                passing_score: 0,
                active: false,
                status: 'PUBLISHED',
                rubric_uuid: '',
                lesson_uuid: ''
            })
        }
    }

    const handleSaveQuiz = async () => {
        if (!selectedLessonId || !quizData.title.trim()) {
            toast.error('Please select a lesson and enter a quiz title')
            return
        }

        console.log(quizUuid, "ediitng quiz id or selected quiz id")

        try {
            if (quizUuid) {
                await updateQuizForLesson(quizUuid, quizData)
                toast.success('Quiz updated successfully!')
            } else {
                const createdQuizUuid = await createQuizForLesson(selectedLessonId, quizData)
                onSelectQuiz?.(createdQuizUuid)
                toast.success('Quiz created successfully! You can now add questions.')
            }
        } catch (err) {
            console.error(err)
            toast.error(`Failed to ${quizId ? 'update' : 'create'} quiz.`)
        }
    }

    const handleDeleteQuiz = async () => {
        if (!quizUuid) return;

        if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteQuizForLesson(quizUuid);
            onSelectQuiz?.(null);
            setQuizData({
                title: '',
                instructions: '',
                time_limit_minutes: 0,
                attempts_allowed: 1,
                passing_score: 0,
                active: false,
                status: 'PUBLISHED',
                rubric_uuid: '',
                lesson_uuid: ''
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete quiz.');
        }
    };

    return (
        <div className="grid grid-cols-4 gap-4">
            {/* Lessons */}
            <div className="border rounded p-3">
                <h3 className="font-semibold mb-2">Lessons</h3>
                <ul className="space-y-2">
                    {lessons?.content.map((lesson: any) => (
                        <li
                            key={lesson.uuid}
                            onClick={() => {
                                setSelectedLessonId(lesson.uuid)
                                setSelectedLesson(lesson)
                            }}
                            className={`cursor-pointer p-2 rounded ${selectedLessonId === lesson.uuid
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted-foreground/50'
                                }`}
                        >
                            {lesson.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Quiz creation form */}
            {!selectedLessonId ? (
                <div className='min-h-[50vh] flex items-center justify-center col-span-3'>
                    Select a lesson
                </div>
            ) : (
                <div className="col-span-3 border rounded p-4 space-y-4">
                    <h3 className="text-[16px] font-semibold uppercase">
                        QUIZ: {selectedLesson?.title || 'Select a lesson'}
                    </h3>

                    <div className="flex flex-col gap-1 mb-10">
                        <label className="text-sm font-medium">Select Existing Quiz</label>
                        <select
                            className="border p-2 rounded w-full"
                            value={quizUuid || ''}
                            onChange={(e) => handleQuizSelect(e.target.value || null)}
                        >
                            <option value="">-- Create New Quiz --</option>
                            {quizzes?.data?.content?.map((quiz: any) => (
                                <option key={quiz.uuid} value={quiz.uuid}>
                                    {quiz.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className='flex self-end justify-end' >
                            {quizUuid && (
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteQuiz}
                                >
                                    Delete Quiz
                                </Button>
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Quiz Title"
                            className="border p-2 rounded w-full"
                            value={quizData.title}
                            onChange={(e) => handleQuizInputChange('title', e.target.value)}
                        />

                        <textarea
                            placeholder="Instructions (optional)"
                            className="border p-2 rounded w-full"
                            value={quizData.instructions}
                            onChange={(e) => handleQuizInputChange('instructions', e.target.value)}
                        />

                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col">
                                <label className="text-sm font-medium mb-1">Time Limit (minutes)</label>
                                <input
                                    type="number"
                                    className="border p-2 rounded w-full"
                                    value={quizData.time_limit_minutes}
                                    onChange={(e) => handleQuizInputChange('time_limit_minutes', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="text-sm font-medium mb-1">Attempts Allowed</label>
                                <input
                                    type="number"
                                    className="border p-2 rounded w-full"
                                    value={quizData.attempts_allowed}
                                    onChange={(e) => handleQuizInputChange('attempts_allowed', Number(e.target.value))}
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="text-sm font-medium mb-1">Passing Score</label>
                                <input
                                    type="number"
                                    className="border p-2 rounded w-full"
                                    value={quizData.passing_score}
                                    onChange={(e) => handleQuizInputChange('passing_score', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1">Assign Rubric</label>
                            <select
                                className="border p-2 rounded w-full"
                                value={quizData.rubric_uuid || ''}
                                onChange={(e) => handleQuizInputChange('rubric_uuid', e.target.value)}
                            >
                                <option value="">Select rubric</option>
                                {rubrics?.data?.content?.map((rubric: any) => (
                                    <option key={rubric.uuid} value={rubric.uuid}>
                                        {rubric.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                checked={quizData.active}
                                onChange={(e) => handleQuizInputChange('active', e.target.checked)}
                            />
                            Active
                        </label>

                        <div className="flex justify-end items-end mt-2">
                            <Button onClick={handleSaveQuiz}>
                                {quizUuid ? 'Update Quiz' : 'Save Quiz'}
                            </Button>
                        </div>
                    </div>

                    {/* Only show questions UI if quizUuid exists */}
                    {quizUuid && (
                        <div className='mt-10' >
                            <div className="flex justify-between mb-2">
                                <h4 className="font-semibold">Questions</h4>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button>+ Add Question</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => addQuestion('MULTIPLE_CHOICE')}>
                                            + MCQ
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addQuestion('TRUE_FALSE')}>
                                            + True / False
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addQuestion('ESSAY')}>
                                            + Essay
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addQuestion('SHORT_ANSWER')}>
                                            + Short Answer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => addQuestion('MATCHING')}>
                                            + Matching
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <table className="w-full border">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 w-1/4">Question</th>
                                        <th className="border p-2">Answer/Options</th>
                                        <th className="border p-2 w-24">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q: any, qIndex) => (
                                        <tr key={qIndex} className="group">
                                            <td className="border p-2">
                                                <div className="relative group">
                                                    <textarea
                                                        value={q.text}
                                                        rows={6}
                                                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                                        placeholder="Enter question text here"
                                                        className="w-full border rounded p-2 pr-10 resize-none"
                                                    />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteQuestion(qIndex)}
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete question</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                            <td className="border p-2">
                                                {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') &&
                                                    q.options?.map((opt: any, oIndex: any) => (
                                                        <div key={oIndex} className="group flex gap-2 items-center mb-2">
                                                            <input
                                                                type="radio"
                                                                checked={opt.isCorrect}
                                                                onChange={() => setCorrectOption(qIndex, oIndex)}
                                                            />
                                                            <input
                                                                value={opt.text}
                                                                onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                                                                className="flex-1 border rounded p-1"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteOption(qIndex, oIndex)}
                                                                className="opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                {q.type === 'ESSAY' && (
                                                    <textarea
                                                        className="w-full border rounded p-2"
                                                        placeholder="Expected answer"
                                                    />
                                                )}

                                                {q.type === 'SHORT_ANSWER' && (
                                                    <input
                                                        className="w-full border rounded p-2"
                                                        placeholder="Expected answer"
                                                    />
                                                )}

                                                {q.type === 'MATCHING' &&
                                                    q.pairs?.map((pair: any, pIndex: any) => (
                                                        <div key={pIndex} className="grid grid-cols-2 gap-2 mb-2">
                                                            <input
                                                                className="border p-1 rounded"
                                                                value={pair.left}
                                                                placeholder="Left side"
                                                            />
                                                            <input
                                                                className="border p-1 rounded"
                                                                value={pair.right}
                                                                placeholder="Right side"
                                                            />
                                                        </div>
                                                    ))}
                                            </td>

                                            <td className="border p-2 text-sm">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={q.points ?? 1}
                                                    onChange={(e) => updateQuestionPoint(qIndex, Number(e.target.value))}
                                                    className="w-16 border rounded p-1 text-sm"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}