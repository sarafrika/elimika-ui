'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Plus, PlusCircle, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';
import {
  searchQuizzesOptions
} from '../../../../services/client/@tanstack/react-query.gen';
import { Question, QuestionType } from './assessment-creation-form';

export type QuizCreationFormProps = {
  lessons: any;
  quizId: any;
  questions: Question[];
  selectedLessonId: string;
  selectedLesson: any;
  setSelectedLessonId: (id: string) => void;
  setSelectedLesson: (lesson: any) => void;

  onSelectQuiz?: (quizUuid: string | null) => void;

  addQuestion: (type: QuestionType) => void;
  updateQuestionText: (qIndex: number, value: string) => void;
  updateOptionText: (qIndex: number, oIndex: number, value: string) => void;
  updateQuestionPoint: (qIndex: number, points: number) => void;
  setCorrectOption: (qIndex: number, oIndex: number) => void;
  toggleCorrectOption: (qIndex: number, oIndex: number) => void;
  addOption: (qIndex: number) => void;
  updatePairText: (qIndex: number, pIndex: number, side: 'left' | 'right', value: string) => void;
  deletePair: (qIndex: number, pIndex: number) => void;
  addPair: (qIndex: number) => void;
  deleteQuestion: (qIndex: number) => void;
  deleteOption: (qIndex: number, oIndex: number) => void;

  // API callbacks
  createQuizForLesson: (lessonId: string, payload: any) => Promise<string>;
  updateQuizForLesson: (quizUuid: string, payload: any) => Promise<void>;
  deleteQuizForLesson: (quizUuid: string) => Promise<void>;
  addQuizQuestion: (payload: any) => Promise<any>;
  addQuestionOption: (payload: any) => Promise<any>;

  isPending: boolean;
};

// Question Row Component - defined outside to prevent recreation
const QuestionRow = ({
  question,
  qIndex,
  updateQuestionText,
  updateQuestionPoint,
  updateOptionText,
  toggleCorrectOption,
  setCorrectOption,
  addOption,
  deleteOption,
  updatePairText,
  deletePair,
  addPair,
  deleteQuestion,
}: {
  question: Question;
  qIndex: number;
  updateQuestionText: (qIndex: number, value: string) => void;
  updateQuestionPoint: (qIndex: number, points: number) => void;
  updateOptionText: (qIndex: number, oIndex: number, value: string) => void;
  toggleCorrectOption: (qIndex: number, oIndex: number) => void;
  setCorrectOption: (qIndex: number, oIndex: number) => void;
  addOption: (qIndex: number) => void;
  deleteOption: (qIndex: number, oIndex: number) => void;
  updatePairText: (qIndex: number, pIndex: number, side: 'left' | 'right', value: string) => void;
  deletePair: (qIndex: number, pIndex: number) => void;
  addPair: (qIndex: number) => void;
  deleteQuestion: (qIndex: number) => void;
}) => {
  const renderOptionsUI = useCallback(() => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className='space-y-2'>
            {question.options?.map((opt, oIndex) => (
              <div key={`opt-${qIndex}-${oIndex}`} className='group/option flex items-center gap-2'>
                <Checkbox
                  checked={opt.isCorrect}
                  onCheckedChange={() => toggleCorrectOption(qIndex, oIndex)}
                  className='shrink-0'
                />
                <input
                  type='text'
                  value={opt.text || ''}
                  onChange={e => updateOptionText(qIndex, oIndex, e.target.value)}
                  placeholder={`Option ${oIndex + 1}`}
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 flex-1 rounded-md border px-3 py-1.5 text-sm transition-all outline-none focus:ring-2'
                />
                {question.options && question.options.length > 2 && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => deleteOption(qIndex, oIndex)}
                    className='h-7 w-7 opacity-0 transition-opacity group-hover/option:opacity-100'
                  >
                    <Trash2 className='text-destructive h-3.5 w-3.5' />
                  </Button>
                )}
              </div>
            ))}
            <Button variant='outline' size='sm' onClick={() => addOption(qIndex)} className='mt-2'>
              <Plus className='mr-1 h-3.5 w-3.5' />
              Add Option
            </Button>
            <p className='text-muted-foreground mt-2 text-xs'>
              ✓ Check one or more correct answers
            </p>
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className='space-y-2'>
            {question.options?.map((opt, oIndex) => (
              <div
                key={`tf-${qIndex}-${oIndex}`}
                onClick={() => setCorrectOption(qIndex, oIndex)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${opt.isCorrect
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${opt.isCorrect ? 'border-primary bg-primary' : 'border-border'
                    }`}
                >
                  {opt.isCorrect && <Check className='text-primary-foreground h-3 w-3' />}
                </div>
                <span
                  className={`text-sm font-medium ${opt.isCorrect ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  {opt.text}
                </span>
              </div>
            ))}
            <p className='text-muted-foreground mt-2 text-xs'>Select the correct answer</p>
          </div>
        );

      case 'ESSAY':
        return (
          <div className='space-y-2'>
            <div className='bg-muted/30 rounded-lg border-2 border-dashed p-4'>
              <p className='text-muted-foreground text-sm'>
                Essay questions require manual grading. Students will provide a text response.
              </p>
            </div>
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <div className='space-y-2'>
            <div className='bg-muted/30 rounded-lg border-2 border-dashed p-4'>
              <p className='text-muted-foreground mb-2 text-sm'>
                Short answer questions require manual grading or keyword matching.
              </p>
            </div>
          </div>
        );

      case 'MATCHING':
        return (
          <div className='space-y-2'>
            {question.pairs?.map((pair, pIndex) => (
              <div key={`pair-${qIndex}-${pIndex}`} className='group/pair flex items-center gap-2'>
                <input
                  type='text'
                  value={pair.left || ''}
                  onChange={e => updatePairText(qIndex, pIndex, 'left', e.target.value)}
                  placeholder={`Left ${pIndex + 1}`}
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2'
                />
                <span className='text-muted-foreground'>↔</span>
                <input
                  type='text'
                  value={pair.right || ''}
                  onChange={e => updatePairText(qIndex, pIndex, 'right', e.target.value)}
                  placeholder={`Right ${pIndex + 1}`}
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-2'
                />
                {question.pairs && question.pairs.length > 2 && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => deletePair(qIndex, pIndex)}
                    className='h-7 w-7 opacity-0 transition-opacity group-hover/pair:opacity-100'
                  >
                    <Trash2 className='text-destructive h-3.5 w-3.5' />
                  </Button>
                )}
              </div>
            ))}
            <Button variant='outline' size='sm' onClick={() => addPair(qIndex)} className='mt-2'>
              <Plus className='mr-1 h-3.5 w-3.5' />
              Add Pair
            </Button>
          </div>
        );

      default:
        return null;
    }
  }, [
    question,
    qIndex,
    updateOptionText,
    toggleCorrectOption,
    setCorrectOption,
    addOption,
    deleteOption,
    updatePairText,
    deletePair,
    addPair,
  ]);

  return (
    <tr className='group hover:bg-muted/50 transition-colors'>
      <td className='px-4 py-4 align-top'>
        <div className='relative'>
          <div className='mb-2'>
            <span className='bg-primary/10 text-primary inline-block rounded px-2 py-0.5 text-xs font-medium'>
              {question.type.replace('_', ' ')}
            </span>
          </div>
          <textarea
            value={question.text || ''}
            rows={4}
            onChange={e => updateQuestionText(qIndex, e.target.value)}
            placeholder='Enter question text here'
            className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 pr-10 text-sm transition-all outline-none focus:ring-2'
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => deleteQuestion(qIndex)}
                className='absolute top-8 right-2 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <Trash2 className='text-destructive h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete question</TooltipContent>
          </Tooltip>
        </div>
      </td>
      <td className='px-4 py-4 align-top'>{renderOptionsUI()}</td>
      <td className='px-4 py-4 align-top'>
        <input
          type='number'
          min={0}
          value={question.points ?? 1}
          onChange={e => updateQuestionPoint(qIndex, Number(e.target.value))}
          className='border-input bg-background focus:border-primary focus:ring-primary/20 w-16 rounded-lg border px-2 py-1.5 text-sm transition-all outline-none focus:ring-2'
        />
      </td>
    </tr>
  );
};

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
  toggleCorrectOption,
  addOption,
  updatePairText,
  deletePair,
  addPair,
  deleteQuestion,
  deleteOption,
  createQuizForLesson,
  updateQuizForLesson,
  deleteQuizForLesson,
  isPending,
}: QuizCreationFormProps) => {
  const { data: quizzes } = useQuery({
    ...searchQuizzesOptions({
      query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
    }),
    enabled: !!selectedLessonId,
  });

  const quizUuid = quizId;


  const [localQuizData, setLocalQuizData] = useState({
    title: '',
    instructions: '',
    time_limit_minutes: 0,
    attempts_allowed: 1,
    passing_score: 0,
    active: false,
    status: 'PUBLISHED',
    rubric_uuid: '',
  });

  // Memoize initial quiz data
  const initialQuizData = useMemo(
    () => ({
      title: '',
      instructions: '',
      time_limit_minutes: 0,
      attempts_allowed: 1,
      passing_score: 0,
      active: false,
      status: 'PUBLISHED',
      rubric_uuid: '',
      lesson_uuid: '',
    }),
    []
  );


  const selectedQuizData = useMemo(() => {
    const selected = quizzes?.data?.content?.find((q: any) => q.uuid === quizUuid);

    if (selected && quizUuid) {
      return {
        title: selected.title || '',
        instructions: selected.instructions || '',
        time_limit_minutes: selected.time_limit_minutes || 0,
        attempts_allowed: selected.attempts_allowed || 1,
        passing_score: selected.passing_score || 0,
        active: selected.active || false,
        status: selected.status || 'PUBLISHED',
        rubric_uuid: selected.rubric_uuid || '',
        lesson_uuid: selectedLessonId as string,
      };
    }

    // For new quiz (quizUuid is '' or null), use local state
    return {
      ...localQuizData,
      lesson_uuid: selectedLessonId as string,
    };
  }, [quizUuid, quizzes?.data?.content, selectedLessonId, localQuizData]);


  const handleQuizInputChange = useCallback((field: string, value: any) => {
    setLocalQuizData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);


  useEffect(() => {
    if (!quizUuid || quizUuid === '') {
      setLocalQuizData({
        title: '',
        instructions: '',
        time_limit_minutes: 0,
        attempts_allowed: 1,
        passing_score: 0,
        active: false,
        status: 'PUBLISHED',
        rubric_uuid: '',
      });
    }
  }, [quizUuid]);

  const handleQuizSelect = useCallback(
    (selectedUuid: string | null) => {
      if (onSelectQuiz) onSelectQuiz(selectedUuid);
    },
    [onSelectQuiz]
  );

  const handleSaveQuiz = useCallback(async () => {
    if (!selectedLessonId || !selectedQuizData.title.trim()) {
      toast.error('Please select a lesson and enter a quiz title');
      return;
    }

    try {
      if (quizUuid && quizUuid !== '') {
        await updateQuizForLesson(quizUuid, selectedQuizData);
        toast.success('Quiz updated successfully!');
      } else {
        const createdQuizUuid = await createQuizForLesson(selectedLessonId, selectedQuizData);
        onSelectQuiz?.(createdQuizUuid);
        toast.success('Quiz created successfully! You can now add questions.');
      }
    } catch (err) {
      toast.error(`Failed to ${quizUuid ? 'update' : 'create'} quiz.`);
    }
  }, [
    selectedLessonId,
    selectedQuizData,
    quizUuid,
    updateQuizForLesson,
    createQuizForLesson,
    onSelectQuiz,
  ]);

  const handleDeleteQuiz = useCallback(async () => {
    if (!quizUuid) return;

    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteQuizForLesson(quizUuid);
      onSelectQuiz?.(null);
    } catch (err) {
      toast.error('Failed to delete quiz.');
    }
  }, [quizUuid, deleteQuizForLesson, onSelectQuiz]);

  const handleLessonSelect = useCallback(
    (lesson: any) => {
      setSelectedLessonId(lesson.uuid);
      setSelectedLesson(lesson);
      handleQuizSelect(null);
    },
    [setSelectedLessonId, setSelectedLesson, handleQuizSelect]
  );

  return (
    <div className='grid grid-cols-4 gap-6'>
      {/* Lessons */}
      <div className='bg-card rounded-xl border p-4 shadow-sm'>
        <h3 className='text-foreground mb-4 text-lg font-semibold'>Lessons</h3>
        <ul className='flex flex-col gap-2 space-y-2'>
          {lessons?.content?.length ? (
            lessons.content
              .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
              .map((lesson: any) => (
                <li
                  key={`lesson-${lesson.uuid}`}
                  onClick={() => handleLessonSelect(lesson)}
                  className={cn(
                    'flex cursor-pointer flex-row items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    selectedLessonId === lesson.uuid
                      ? 'bg-primary/10 border-primary text-primary border-2 shadow-sm'
                      : 'hover:bg-muted text-foreground border-2 border-transparent'
                  )}
                >
                  <p>{lesson.lesson_number}.</p>
                  <p>{lesson.title}</p>
                </li>
              ))
          ) : (
            <li className='text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm'>
              Looks like you haven't added any lessons to this course yet.
            </li>
          )}
        </ul>
      </div>

      {/* Quiz creation form */}
      {!selectedLessonId ? (
        <div className='border-border bg-muted col-span-3 flex min-h-[50vh] items-center justify-center rounded-xl border-2 border-dashed'>
          <div className='text-center'>
            <p className='text-foreground text-lg font-medium'>Select a lesson</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Choose a lesson from the left to create or manage quizzes
            </p>
          </div>
        </div>
      ) : (
        <div className='bg-card col-span-3 space-y-6 rounded-xl border p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4 border-b pb-4'>
            <h3 className='text-foreground max-w-[70%] truncate text-lg font-bold uppercase'>
              QUIZ: {selectedLesson?.title || 'Select a lesson'}
            </h3>

            <Button size='sm' className='shrink-0' onClick={() => handleQuizSelect('')}>
              <PlusCircle size={16} className='mr-1' />
              Create Quiz
            </Button>
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex flex-col space-y-3'>
              <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex flex-col'>
                  <h4 className='text-foreground text-base font-semibold'>Existing Quizzes</h4>
                  <p className='text-muted-foreground text-xs'>
                    Select a quiz to edit or create a new one.
                  </p>
                </div>
              </div>

              <ul className='flex flex-col space-y-2'>
                {quizzes?.data?.content?.length ? (
                  quizzes.data.content.map((quiz: any, idx) => (
                    <li
                      key={`quiz-${quiz.uuid}`}
                      onClick={() => handleQuizSelect(quiz.uuid)}
                      className={cn(
                        'group flex cursor-pointer items-center justify-between rounded-md border px-4 py-2.5 text-sm font-medium transition-all',
                        quizUuid === quiz.uuid
                          ? 'bg-primary/20 border-primary text-primary shadow-sm'
                          : 'bg-primary/5 hover:bg-muted text-foreground border-transparent'
                      )}
                    >
                      <span className='truncate'>
                        {idx + 1} - {quiz.title}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className='text-muted-foreground rounded-lg border border-dashed py-4 text-center text-sm'>
                    No quizzes available for this lesson yet.
                  </li>
                )}
              </ul>
            </div>
          </div>


          <div className='flex flex-col gap-6'>
            <Separator />
            <div className='-my-4 flex items-center justify-between'>
              <h2 className='text-foreground text-lg font-bold tracking-tight'>
                {quizUuid && quizUuid !== '' ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>

              <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium'>
                {quizUuid && quizUuid !== '' ? 'Editing' : 'New'}
              </span>
            </div>
            <Separator />

            <div className='flex flex-col gap-2'>
              <Label>Quiz Title</Label>
              <Input
                placeholder='Enter quiz title'
                value={selectedQuizData.title}
                onChange={e => handleQuizInputChange('title', e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label>Instructions (optional)</Label>
              <Textarea
                placeholder='Enter quiz instructions'
                rows={3}
                value={selectedQuizData.instructions}
                onChange={e => handleQuizInputChange('instructions', e.target.value)}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='flex flex-col gap-2'>
                <Label>Time Limit (minutes)</Label>
                <Input
                  type='number'
                  value={selectedQuizData.time_limit_minutes}
                  onChange={e =>
                    handleQuizInputChange('time_limit_minutes', Number(e.target.value))
                  }
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label>Attempts Allowed</Label>
                <Input
                  type='number'
                  value={selectedQuizData.attempts_allowed}
                  onChange={e =>
                    handleQuizInputChange('attempts_allowed', Number(e.target.value))
                  }
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label>Passing Score (%)</Label>
                <Input
                  type='number'
                  value={selectedQuizData.passing_score}
                  onChange={e => handleQuizInputChange('passing_score', Number(e.target.value))}
                />
              </div>
            </div>

            <Label className='flex cursor-pointer items-center gap-3'>
              <Checkbox
                checked={selectedQuizData.active}
                onCheckedChange={checked => handleQuizInputChange('active', Boolean(checked))}
              />
              <span>Active</span>
            </Label>

            <div className='flex flex-row items-end justify-end gap-6 pt-2'>
              {quizUuid && quizUuid !== '' && (
                <Button size='sm' variant='destructive' onClick={handleDeleteQuiz}>
                  <Trash2 />
                </Button>
              )}
              <Button size='sm' onClick={handleSaveQuiz} disabled={isPending}>
                {isPending ? 'Saving...' : <>{quizUuid && quizUuid !== '' ? 'Update Quiz' : 'Save Quiz'}</>}
              </Button>
            </div>
          </div>


          {quizUuid && quizUuid !== '' && (
            <div className='mt-8 border-t pt-6'>
              <div className='mb-6 flex items-center justify-between'>
                <h4 className='text-foreground text-lg font-semibold'>Questions</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size='sm'>
                      <PlusCircle /> Question
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
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

              <TooltipProvider>
                <div className='overflow-hidden rounded-lg border'>
                  <table className='w-full'>
                    <thead>
                      <tr className='bg-muted border-b'>
                        <th className='text-foreground w-1/3 px-4 py-3 text-left text-sm font-semibold'>
                          Question
                        </th>
                        <th className='text-foreground px-4 py-3 text-left text-sm font-semibold'>
                          Answer/Options
                        </th>
                        <th className='text-foreground w-24 px-4 py-3 text-left text-sm font-semibold'>
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {questions.length > 0 ? (
                        questions.map((q, qIndex) => (
                          <QuestionRow
                            key={`question-${qIndex}`}
                            question={q}
                            qIndex={qIndex}
                            updateQuestionText={updateQuestionText}
                            updateQuestionPoint={updateQuestionPoint}
                            updateOptionText={updateOptionText}
                            toggleCorrectOption={toggleCorrectOption}
                            setCorrectOption={setCorrectOption}
                            addOption={addOption}
                            deleteOption={deleteOption}
                            updatePairText={updatePairText}
                            deletePair={deletePair}
                            addPair={addPair}
                            deleteQuestion={deleteQuestion}
                          />
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className='text-muted-foreground py-12 text-center text-sm'
                          >
                            <div className='rounded-lg border border-dashed py-8'>
                              No questions added yet. Click "Add Question" to get started.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
    </div>
  );
};