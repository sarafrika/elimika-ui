'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, FileText, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { DeleteConfirmationDialog } from '../../../../components/ui/delete-confirmation-dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { useCourseCreator } from '../../../../context/course-creator-context';
import {
  searchAssessmentRubricsOptions,
  searchQuizzesOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import type { AssessmentRubric, Quiz } from '../../../../services/client/types.gen';
import { Question, QuestionType } from './assessment-creation-form';

type LessonItem = {
  uuid: string;
  title?: string;
  lesson_number?: number;
};
type LessonList = { content?: LessonItem[] } | undefined;
type RubricItem = Pick<AssessmentRubric, 'uuid' | 'title' | 'description'>;
type QuizSummary = Pick<
  Quiz,
  | 'uuid'
  | 'title'
  | 'instructions'
  | 'time_limit_minutes'
  | 'attempts_allowed'
  | 'passing_score'
  | 'active'
  | 'status'
  | 'rubric_uuid'
>;
type QuizStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type QuizPayload = {
  title: string;
  instructions: string;
  time_limit_minutes: number;
  attempts_allowed: number;
  passing_score: number;
  active: boolean;
  status: QuizStatus;
  rubric_uuid: string;
  lesson_uuid?: string;
};

const normalizeQuizStatus = (status?: string | null): QuizStatus => {
  switch (status?.toUpperCase()) {
    case 'IN_REVIEW':
      return 'IN_REVIEW';
    case 'PUBLISHED':
      return 'PUBLISHED';
    case 'ARCHIVED':
      return 'ARCHIVED';
    default:
      return 'DRAFT';
  }
};

export type QuizCreationFormProps = {
  lessons?: LessonList;
  quizId?: string | null;
  questions: Question[];
  selectedLessonId: string;
  selectedLesson?: LessonItem | null;
  setSelectedLessonId: (id: string) => void;
  setSelectedLesson: (lesson: LessonItem | null) => void;

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
  createQuizForLesson: (lessonId: string, payload: QuizPayload) => Promise<string>;
  updateQuizForLesson: (quizUuid: string, payload: QuizPayload) => Promise<void>;
  deleteQuizForLesson: (quizUuid: string) => Promise<void>;
  addQuizQuestion: (payload: unknown) => Promise<unknown>;
  addQuestionOption: (payload: unknown) => Promise<unknown>;

  openBulkUploadSheet: () => void;
  onDraftChange?: (payload: QuizPayload) => void;

  isPending: boolean;
};

// ── Question Row ──────────────────────────────────────────────────────────────

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
            <div className='space-y-1'>
              <label className='text-sm font-medium'>Model Answer</label>
              <textarea
                value={question.options?.[0]?.text || ''}
                onChange={e => updateOptionText(qIndex, 0, e.target.value)}
                placeholder='Enter the expected answer...'
                rows={4}
                className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2'
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              Students will submit a long-form response. This answer will be used as the reference.
            </p>
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <div className='space-y-2'>
            <div className='space-y-1'>
              <label className='text-sm font-medium'>Correct Answer</label>
              <input
                type='text'
                value={question.options?.[0]?.text || ''}
                onChange={e => updateOptionText(qIndex, 0, e.target.value)}
                placeholder='Enter the correct short answer...'
                className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2'
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              Students must match this exact answer (or apply keyword matching logic).
            </p>
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

// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { label: 'MCQ', value: 'MULTIPLE_CHOICE' },
  { label: 'True / False', value: 'TRUE_FALSE' },
  { label: 'Essay', value: 'ESSAY' },
  { label: 'Short Answer', value: 'SHORT_ANSWER' },
  // { label: 'Matching', value: 'MATCHING' },
] as const satisfies Array<{ label: string; value: QuestionType }>;

const EMPTY_QUIZ = {
  title: '',
  instructions: '',
  time_limit_minutes: 0,
  attempts_allowed: 1,
  passing_score: 0,
  active: false,
  status: 'DRAFT' as QuizStatus,
  rubric_uuid: '',
};

export const QuizCreationForm = (props: QuizCreationFormProps) => {
  const {
    quizId,
    questions,
    selectedLessonId,
    selectedLesson,
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
    openBulkUploadSheet,
    onDraftChange,
  } = props;
  const creator = useCourseCreator();

  // ── Rubrics ───────────────────────────────────────────────────────────────
  const { data: searchRubs, isLoading: isLoadingRubrics } = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        pageable: {},
        searchParams: { course_creator_uuid_eq: creator?.profile?.uuid as string },
      },
    }),
    enabled: !!creator?.profile?.uuid,
  });
  const rubrics: RubricItem[] = searchRubs?.data?.content ?? [];

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [localQuizData, setLocalQuizData] = useState({ ...EMPTY_QUIZ });
  const [showDeleteQuizDialog, setShowDeleteQuizDialog] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [quizAction, setQuizAction] = useState<'save' | 'publish' | 'unpublish' | null>(null);

  const selectedRubric = rubrics.find(r => r.uuid === localQuizData.rubric_uuid);

  const { data: quizzes } = useQuery({
    ...searchQuizzesOptions({
      query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
    }),
    enabled: !!selectedLessonId,
  });

  const quizUuid = quizId;

  const selectedQuizData = useMemo(
    () => ({ ...localQuizData, lesson_uuid: selectedLessonId as string }),
    [selectedLessonId, localQuizData]
  );

  useEffect(() => {
    onDraftChange?.(selectedQuizData);
  }, [onDraftChange, selectedQuizData]);

  const handleQuizInputChange = useCallback(
    <K extends keyof typeof EMPTY_QUIZ>(field: K, value: (typeof EMPTY_QUIZ)[K]) => {
      setLocalQuizData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  useEffect(() => {
    if (!quizUuid || quizUuid === '') {
      setLocalQuizData({ ...EMPTY_QUIZ });
    } else {
      const selected = quizzes?.data?.content?.find(q => q.uuid === quizUuid);
      if (selected) {
        const normalizedStatus = normalizeQuizStatus(selected.status);
        setLocalQuizData({
          title: selected.title || '',
          instructions: selected.instructions || '',
          time_limit_minutes: selected.time_limit_minutes || 0,
          attempts_allowed: selected.attempts_allowed || 1,
          passing_score: selected.passing_score || 0,
          active: normalizedStatus === 'PUBLISHED' ? Boolean(selected.active) : false,
          status: normalizedStatus,
          rubric_uuid: selected.rubric_uuid || '',
        });
      }
    }
  }, [quizUuid, quizzes?.data?.content]);

  const handleQuizSelect = useCallback(
    (selectedUuid: string | null) => {
      if (onSelectQuiz) onSelectQuiz(selectedUuid);
    },
    [onSelectQuiz]
  );

  const commitQuiz = useCallback(
    async (payload: QuizPayload) => {
      if (!selectedLessonId || !payload.title.trim()) {
        toast.error('Please select a lesson and enter a quiz title');
        return null;
      }

      if (quizUuid && quizUuid !== '') {
        await updateQuizForLesson(quizUuid, payload);
        return quizUuid;
      }

      return createQuizForLesson(selectedLessonId, payload);
    },
    [createQuizForLesson, quizUuid, selectedLessonId, updateQuizForLesson]
  );

  const handleSaveQuiz = useCallback(async () => {
    try {
      setQuizAction('save');
      const savedQuizUuid = await commitQuiz(selectedQuizData);
      if (!savedQuizUuid) return;

      handleQuizSelect(savedQuizUuid);

      toast.success(quizUuid ? 'Quiz updated successfully!' : 'Quiz created successfully!');
    } catch (err) {
      toast.error(`Failed to ${quizUuid ? 'update' : 'create'} quiz.`);
    } finally {
      setQuizAction(null);
    }
  }, [commitQuiz, handleQuizSelect, quizUuid, selectedQuizData]);

  const handlePublishQuiz = useCallback(async () => {
    const payload = {
      ...selectedQuizData,
      status: 'PUBLISHED' as QuizStatus,
      active: true,
    };

    try {
      setQuizAction('publish');
      const savedQuizUuid = await commitQuiz(payload);
      if (!savedQuizUuid) return;

      handleQuizSelect(savedQuizUuid);

      setLocalQuizData(prev => ({
        ...prev,
        status: 'PUBLISHED',
        active: true,
      }));

      toast.success(quizUuid ? 'Quiz published successfully!' : 'Quiz created and published successfully!');
    } catch (err) {
      toast.error(`Failed to ${quizUuid ? 'publish' : 'create and publish'} quiz.`);
    } finally {
      setQuizAction(null);
    }
  }, [commitQuiz, handleQuizSelect, quizUuid, selectedQuizData]);

  const handleUnpublishQuiz = useCallback(async () => {
    if (!quizUuid) return;

    const payload = {
      ...selectedQuizData,
      status: 'DRAFT' as QuizStatus,
      active: false,
    };

    try {
      setQuizAction('unpublish');
      const savedQuizUuid = await commitQuiz(payload);
      if (!savedQuizUuid) return;
      setLocalQuizData(prev => ({
        ...prev,
        status: 'DRAFT',
        active: false,
      }));
      toast.success('Quiz unpublished successfully!');
    } catch (err) {
      toast.error('Failed to unpublish quiz.');
    } finally {
      setQuizAction(null);
    }
  }, [commitQuiz, quizUuid, selectedQuizData]);

  const isPublished = selectedQuizData.status === 'PUBLISHED';
  const isSavingQuiz = quizAction === 'save' && isPending;
  const isPublishingQuiz = quizAction === 'publish' && isPending;
  const isUnpublishingQuiz = quizAction === 'unpublish' && isPending;

  const handleDeleteQuiz = useCallback(() => {
    if (!quizUuid) return;
    setShowDeleteQuizDialog(true);
  }, [quizUuid]);

  const confirmDeleteQuiz = useCallback(async () => {
    if (!quizUuid) return;

    try {
      setIsDeletingQuiz(true);
      await deleteQuizForLesson(quizUuid);
      onSelectQuiz?.(null);
    } catch (err) {
      toast.error('Failed to delete quiz.');
    } finally {
      setIsDeletingQuiz(false);
    }
  }, [quizUuid, deleteQuizForLesson, onSelectQuiz]);

  return (
    <div className='bg-card space-y-6 rounded-xl border p-6 shadow-sm'>
      <div className='flex items-center justify-between gap-4 border-b pb-4'>
        <div className='space-y-1'>
          <h3 className='text-foreground text-lg font-bold uppercase'>
            {selectedLesson?.title || 'Selected lesson'}
          </h3>
          <p className='text-muted-foreground text-xs'>
            {quizUuid && quizUuid !== '' ? 'Editing an existing quiz' : 'Create a new quiz for this lesson'}
          </p>
        </div>
        <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium'>
          {quizUuid && quizUuid !== '' ? 'Editing' : 'New'}
        </span>
      </div>

      <div className='flex flex-col gap-6'>
        {selectedQuizData.title && !isPublished && (
          <div className='border-destructive/20 bg-destructive/5 text-destructive rounded-md border p-3 text-sm'>
            This quiz is in draft mode and is not visible to instructors until it is published.
          </div>
        )}

        {/* Title */}
        <div className='flex flex-col gap-2'>
          <Label>Quiz Title</Label>
          <Input
            placeholder='Enter quiz title'
            value={selectedQuizData.title}
            onChange={e => handleQuizInputChange('title', e.target.value)}
          />
        </div>

        {/* Instructions */}
        <div className='flex flex-col gap-2'>
          <Label>Instructions (optional)</Label>
          <Textarea
            placeholder='Enter quiz instructions'
            rows={3}
            value={selectedQuizData.instructions}
            onChange={e => handleQuizInputChange('instructions', e.target.value)}
          />
        </div>

        {/* Numeric settings */}
        <div className='grid grid-cols-3 gap-4'>
          <div className='flex flex-col gap-2'>
            <Label>Time Limit (minutes)</Label>
            <Input
              type='number'
              value={selectedQuizData.time_limit_minutes}
              onChange={e => handleQuizInputChange('time_limit_minutes', Number(e.target.value))}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Attempts Allowed</Label>
            <Input
              type='number'
              value={selectedQuizData.attempts_allowed}
              onChange={e => handleQuizInputChange('attempts_allowed', Number(e.target.value))}
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

        {/* ── Rubric ──────────────────────────────────────────────────── */}
        <div className='flex flex-col gap-1.5'>
          <Label className='text-sm font-medium'>Rubric (optional)</Label>
          <p className='text-muted-foreground text-xs'>
            Associate a grading rubric with this quiz
          </p>

          {isLoadingRubrics ? (
            <div className='flex items-center gap-2 py-2'>
              <Spinner className='h-4 w-4' />
              <span className='text-muted-foreground text-xs'>Loading rubrics...</span>
            </div>
          ) : (
            <>
              <Select
                value={localQuizData.rubric_uuid || '__none__'}
                onValueChange={v =>
                  handleQuizInputChange(
                    'rubric_uuid',
                    v === '__none__' ? '' : v
                  )
                }
              >
                <SelectTrigger className='w-full min-w-0 text-start min-h-12 rounded-sm overflow-hidden'>
                  <SelectValue
                    placeholder='Select a rubric (optional)'
                    className='truncate'
                  />
                </SelectTrigger>

                <SelectContent
                  position='popper'
                  className='w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]'
                >
                  <SelectItem value='__none__'>
                    <span className='text-muted-foreground'>None</span>
                  </SelectItem>

                  {rubrics
                    .filter(
                      (r): r is RubricItem & { uuid: string } => Boolean(r.uuid)
                    )
                    .map(r => (
                      <SelectItem
                        key={r.uuid}
                        value={r.uuid}
                        className='max-w-full'
                      >
                        <div className='min-w-0 max-w-full'>
                          <span className='block truncate font-medium'>
                            {r.title}
                          </span>

                          {r.description && (
                            <span className='text-muted-foreground block truncate text-xs'>
                              {r.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedRubric ? (
                <div className='bg-muted/50 mt-1 flex items-start justify-between gap-2 rounded-lg border px-3 py-2'>
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-xs font-semibold'>
                      {selectedRubric.title}
                    </p>
                    {selectedRubric.description && (
                      <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
                        {selectedRubric.description}
                      </p>
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={() => handleQuizInputChange('rubric_uuid', '')}
                    className='text-muted-foreground hover:text-foreground hover:bg-muted mt-0.5 shrink-0 rounded p-0.5 transition-colors'
                    title='Clear rubric'
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className='bg-warning/20 border-warning/40 flex flex-col gap-3 rounded-lg border p-4'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='text-warning-foreground mt-0.5 h-4 w-4 shrink-0' />
                    <div className='text-sm'>
                      <p className='text-warning-foreground font-medium'>No rubric selected</p>
                      <p className='text-warning-foreground/80 text-xs'>
                        If none of the available rubrics fit, you can create a new one.
                      </p>
                    </div>
                  </div>
                  <Link href='/dashboard/course-creator/rubrics' target='_blank'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='border-warning text-warning-foreground hover:bg-warning/100 w-fit self-center'
                    >
                      Create New Rubric
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Active toggle */}
        <div className='items-center gap-3 hidden'>
          <Label htmlFor='active' className='cursor-pointer'>
            Active
          </Label>
          <Switch
            id='active'
            checked={isPublished ? selectedQuizData.active : false}
            disabled={!isPublished}
            onCheckedChange={checked =>
              handleQuizInputChange('active', checked)
            }
          />
        </div>

        {!isPublished && (
          <p className='text-muted-foreground text-xs'>
            Publish the quiz before enabling the active state for students.
          </p>
        )}

        {/* Save / delete */}
        <div className='flex flex-row items-end justify-end gap-6 pt-2'>
          {quizUuid && quizUuid !== '' && (
            <Button size='sm' variant='destructive' onClick={handleDeleteQuiz}>
              <Trash2 />
            </Button>
          )}
          {quizUuid && quizUuid !== '' ? (
            isPublished ? (
              <Button
                size='sm'
                variant='outline'
                onClick={handleUnpublishQuiz}
                disabled={isPending}
              >
                {isUnpublishingQuiz ? <Spinner className='mr-2 h-4 w-4' /> : null}
                Unpublish Quiz
              </Button>
            ) : (
              <Button size='sm' onClick={handlePublishQuiz} disabled={isPending}>
                {isPublishingQuiz ? <Spinner className='mr-2 h-4 w-4' /> : null}
                Publish Quiz
              </Button>
            )
          ) : (
            <Button size='sm' onClick={handlePublishQuiz} disabled={isPending}>
              {isPublishingQuiz ? <Spinner className='mr-2 h-4 w-4' /> : null}
              Create & Publish
            </Button>
          )}
          <Button size='sm' onClick={handleSaveQuiz} disabled={isPending}>
            {isSavingQuiz ? <Spinner className='mr-2 h-4 w-4' /> : null}
            {isPending ? 'Saving...' : <>{quizUuid && quizUuid !== '' ? 'Update Quiz' : 'Save Quiz'}</>}
          </Button>
        </div>
      </div>

      {/* Questions section */}
      <div className='mt-8 border-t pt-6'>
        <div className='mb-6'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <h4 className='text-foreground text-lg font-semibold'>Questions</h4>
            {!quizUuid && (
              <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium'>
                Will be created on save
              </span>
            )}
          </div>

          <div className='flex w-full flex-row flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap gap-2'>
              {QUESTION_TYPES.map(type => (
                <Button key={type.value} size='sm' variant='outline' onClick={() => addQuestion(type.value)}>
                  + {type.label}
                </Button>
              ))}
            </div>

            <Button variant='outline' onClick={openBulkUploadSheet}>
              <FileText className='mr-2 h-4 w-4' />
              Paste Bulk Questions
            </Button>
          </div>
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
                    <td colSpan={3} className='text-muted-foreground py-12 text-center text-sm'>
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

      <DeleteConfirmationDialog
        open={showDeleteQuizDialog}
        onOpenChange={setShowDeleteQuizDialog}
        onConfirm={confirmDeleteQuiz}
        title='Delete quiz?'
        description='This quiz and its questions will be permanently deleted. This action cannot be undone.'
        confirmLabel='Delete quiz'
        isDeleting={isDeletingQuiz}
      />
    </div>
  );
};
