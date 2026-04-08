'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Disc } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { getQuestionOptions } from '../../../../services/client';
import {
  addQuestionOptionMutation,
  addQuizQuestionMutation,
  createAssignmentMutation,
  createQuizMutation,
  deleteAssignmentMutation,
  deleteQuestionOptionMutation,
  deleteQuizMutation,
  deleteQuizQuestionMutation,
  getQuestionOptionsQueryKey,
  getQuizQuestionsOptions,
  getQuizQuestionsQueryKey,
  searchAssignmentsQueryKey,
  searchQuizzesQueryKey,
  updateAssignmentMutation,
  updateQuestionOptionMutation,
  updateQuizMutation,
  updateQuizQuestionMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  Lesson,
  Quiz,
  QuizQuestion,
  QuizQuestionOption,
} from '../../../../services/client/types.gen';
import { AssignmentCreationForm } from './assignment-creation-form';
import { QuizCreationForm } from './quiz-creation-form';

const sampleQuestions = [
  'What is the capital of France?',
  'Which of the following are programming languages?',
  'Explain the concept of closures in JavaScript.',
  'What does HTTP stand for?',
  'Match the country to its capital.',
];

const sampleOptions = [
  'Paris',
  'London',
  'Berlin',
  'Madrid',
  'JavaScript',
  'Python',
  'HTML',
  'CSS',
];

const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

// const tabs = ['Quiz', 'Assignment', 'Project', 'Discussions'];
const tabs = ['Quiz', 'Assignment'];

type AssessmentCreationFormProps = {
  course?: { data?: { uuid?: string } };
  lessons?: { content?: Lesson[] };
  lessonContentsMap: unknown;
};

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'MATCHING' | 'SHORT_ANSWER';

export type Option = {
  uuid?: string;
  text: string;
  isCorrect: boolean;
};

export type MatchingPair = {
  left: string;
  right: string;
};

export type Question = {
  uuid?: string;
  text: string;
  type: QuestionType;
  options?: Option[];
  answer?: string;
  pairs?: MatchingPair[];
  points?: number;
};

type ExtendedQuestion = Question & { maxLength?: number };
type MutationVariables<T> = T extends {
  mutationFn?: (variables: infer TVariables) => Promise<unknown>;
}
  ? TVariables
  : never;
type MessageWithData<T> = {
  message?: string;
  data?: T;
  uuid?: string;
  question_uuid?: string;
  option_uuid?: string;
};
type AssignmentPayload = Record<string, unknown> & { lesson_uuid?: string };
type QuizPayload = Record<string, unknown> & { lesson_uuid?: string };
type QuestionOptionApi = {
  uuid?: string;
  option_text?: string;
  is_correct?: boolean;
  left_text?: string;
  right_text?: string;
};
type QuestionApi = {
  uuid?: string;
  question_text: string;
  question_type: string;
  points?: number;
};

const QUESTION_TYPES_WITH_OPTIONS: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
];

const isQuestionTypeWithOptions = (type: QuestionType) =>
  QUESTION_TYPES_WITH_OPTIONS.includes(type);

const isQuestionType = (value: string): value is QuestionType =>
  ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'MATCHING', 'SHORT_ANSWER'].includes(value);

const getQuestionByIndex = (questions: Question[] | undefined, index: number) => questions?.[index];
const getOptionByIndex = (options: Option[] | undefined, index: number) => options?.[index];

type AddQuizQuestionVariables = MutationVariables<ReturnType<typeof addQuizQuestionMutation>>;
type UpdateQuizQuestionVariables = MutationVariables<ReturnType<typeof updateQuizQuestionMutation>>;
type AddQuestionOptionVariables = MutationVariables<ReturnType<typeof addQuestionOptionMutation>>;
type UpdateQuestionOptionVariables = MutationVariables<
  ReturnType<typeof updateQuestionOptionMutation>
>;
type CreateAssignmentVariables = MutationVariables<ReturnType<typeof createAssignmentMutation>>;
type UpdateAssignmentVariables = MutationVariables<ReturnType<typeof updateAssignmentMutation>>;
type CreateQuizVariables = MutationVariables<ReturnType<typeof createQuizMutation>>;

export type QuizState = Record<string, Question[]>;

const AssessmentCreationForm = ({
  course,
  lessonContentsMap,
  lessons,
}: AssessmentCreationFormProps) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Quiz');

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons?.content?.[0]?.uuid ?? ''
  );

  const [activeQuizUuid, setActiveQuizUuid] = useState<string | null>(null);

  const handleQuizCreatedOrSelected = (quizUuid: string | null) => {
    setActiveQuizUuid(quizUuid);
  };

  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  // Mutations
  const createQuiz = useMutation(createQuizMutation());
  const updateQuiz = useMutation(updateQuizMutation());
  const deleteQuiz = useMutation(deleteQuizMutation());

  // const addQuizQuestion = useMutation(addQuizQuestionMutation());
  const updateQuizQuestion = useMutation(updateQuizQuestionMutation());
  const deleteQuizQuestion = useMutation(deleteQuizQuestionMutation());

  // const addQuestionOption = useMutation(addQuestionOptionMutation());
  const updateQuestionOption = useMutation(updateQuestionOptionMutation());
  const deleteQuestionOption = useMutation(deleteQuestionOptionMutation());

  const createAssignmentMut = useMutation(createAssignmentMutation());
  const updateAssignmentMut = useMutation(updateAssignmentMutation());
  const deleteAssignmentMut = useMutation(deleteAssignmentMutation());

  const buildQuestionPayload = useCallback(
    (q: Question, index: number, quizUuid: string, userEmail?: string) =>
      ({
        quiz_uuid: quizUuid,
        question_text: q.text,
        question_type: q.type as AddQuizQuestionVariables['body']['question_type'],
        display_order: index + 1,
        points: q.points ?? 0,
        question_number: `Question ${index + 1}`,
        question_category: `${q.type} Question`,
        updated_by: userEmail,
      }) as AddQuizQuestionVariables['body'],
    []
  );

  const buildOptionPayload = useCallback(
    (opt: Option, index: number, questionUuid: string, userEmail?: string) =>
      ({
        question_uuid: questionUuid,
        option_text: opt.text,
        is_correct: opt.isCorrect,
        is_incorrect: `${!opt.isCorrect}`,
        display_order: index + 1,
        position_display: `Option ${index + 1}`,
        correctness_status: opt.isCorrect ? 'Correct Answer' : 'Wrong Answer',
        updated_by: userEmail,
      }) as AddQuestionOptionVariables['body'],
    []
  );

  const [quizData, setQuizData] = useState<QuizState>({});

  // Fetch quiz questions
  const { data: quizquestions } = useQuery({
    ...getQuizQuestionsOptions({ path: { quizUuid: activeQuizUuid as string } }),
    enabled: !!activeQuizUuid,
  });

  // Fetch options for each question
  const questionOptionsQueries = useQueries({
    queries:
      quizquestions?.data?.map((q: QuestionApi) => ({
        queryKey: ['questionOptions', activeQuizUuid, q.uuid ?? ''],
        queryFn: () =>
          getQuestionOptions({
            path: {
              quizUuid: activeQuizUuid!,
              questionUuid: q.uuid ?? '',
            },
            query: { pageable: {} },
          }),
        enabled: !!activeQuizUuid && !!q.uuid,
      })) ?? [],
  });

  // Track if data has been loaded to prevent infinite loops
  const [loadedQuizUuid, setLoadedQuizUuid] = useState<string | null>(null);

  const questions: Question[] = useMemo(
    () => quizData[selectedLessonId] ?? [],
    [quizData, selectedLessonId]
  );

  // CRUD Handlers
  const handleUpdateQuiz = useCallback(
    async (quizUuid: string, payload: QuizPayload) => {
      try {
        await updateQuiz.mutateAsync({
          path: { uuid: quizUuid },
          body: payload as MutationVariables<ReturnType<typeof updateQuizMutation>>['body'],
        });

        qc.invalidateQueries({
          queryKey: searchQuizzesQueryKey({
            query: { pageable: {}, searchParams: { lesson_uuid_eq: selectedLessonId as string } },
          }),
        });

        toast.success('Quiz updated successfully!');
      } catch (err) {
        toast.error('Failed to update quiz.');
      }
    },
    [updateQuiz, qc, selectedLessonId]
  );

  const handleDeleteQuiz = useCallback(
    async (quizUuid: string) => {
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
        toast.error('Failed to delete quiz.');
      }
    },
    [deleteQuiz, qc, selectedLessonId]
  );

  const addQuizQuestion = useMutation(addQuizQuestionMutation());
  const addQuestionOption = useMutation(addQuestionOptionMutation());

  const [originalQuizData, setOriginalQuizData] = useState<QuizState>({});

  const [modifiedQuestions, setModifiedQuestions] = useState<Set<number>>(new Set());
  const [modifiedOptions, setModifiedOptions] = useState<Map<number, Set<number>>>(new Map());

  const deepEqual = (obj1: unknown, obj2: unknown): boolean => {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
      return false;
    }

    const object1 = obj1 as Record<string, unknown>;
    const object2 = obj2 as Record<string, unknown>;
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(object1[key], object2[key])) return false;
    }

    return true;
  };

  const hasQuestionChanged = useCallback(
    (qIndex: number): boolean => {
      const currentQuestion = quizData[selectedLessonId]?.[qIndex];
      const originalQuestion = originalQuizData[selectedLessonId]?.[qIndex];

      if (!currentQuestion || !originalQuestion) return true; // New question

      const currentProps = {
        text: currentQuestion.text,
        type: currentQuestion.type,
        points: currentQuestion.points,
      };

      const originalProps = {
        text: originalQuestion.text,
        type: originalQuestion.type,
        points: originalQuestion.points,
      };

      return !deepEqual(currentProps, originalProps);
    },
    [quizData, originalQuizData, selectedLessonId]
  );

  const hasOptionChanged = useCallback(
    (qIndex: number, oIndex: number): boolean => {
      const currentOption = quizData[selectedLessonId]?.[qIndex]?.options?.[oIndex];
      const originalOption = originalQuizData[selectedLessonId]?.[qIndex]?.options?.[oIndex];

      if (!currentOption || !originalOption) return true; // New option

      return !deepEqual(currentOption, originalOption);
    },
    [quizData, originalQuizData, selectedLessonId]
  );

  useEffect(() => {
    if (!activeQuizUuid || !quizquestions?.data) return;

    if (loadedQuizUuid === activeQuizUuid) return;

    const allOptionsLoaded = questionOptionsQueries.every(q => !q.isLoading);
    if (!allOptionsLoaded) return;

    const questionsWithOptions: Question[] = quizquestions.data.map(
      (q: QuestionApi, index: number) => {
        const optionsData =
          (questionOptionsQueries[index]?.data?.data?.data?.content as
            | QuestionOptionApi[]
            | undefined) ?? [];

        const options: Option[] = optionsData.map((opt: QuestionOptionApi) => ({
          uuid: opt.uuid,
          text: opt.option_text ?? '',
          isCorrect: opt.is_correct ?? false,
        }));

        const normalizedQuestionType = q.question_type.toUpperCase();
        const questionType: QuestionType = isQuestionType(normalizedQuestionType)
          ? normalizedQuestionType
          : 'SHORT_ANSWER';

        return {
          uuid: q.uuid,
          text: q.question_text,
          type: questionType,
          points: q.points,
          options: isQuestionTypeWithOptions(questionType) ? options : undefined,
          pairs:
            questionType === 'MATCHING'
              ? optionsData.map((pair: QuestionOptionApi) => ({
                  left: pair.left_text ?? '',
                  right: pair.right_text ?? '',
                }))
              : undefined,
          answer: questionType === 'ESSAY' || questionType === 'SHORT_ANSWER' ? '' : undefined,
        };
      }
    );

    setQuizData(prev => ({
      ...prev,
      [selectedLessonId]: questionsWithOptions,
    }));

    setOriginalQuizData(prev => ({
      ...prev,
      [selectedLessonId]: JSON.parse(JSON.stringify(questionsWithOptions)),
    }));

    setModifiedQuestions(new Set());
    setModifiedOptions(new Map());

    setLoadedQuizUuid(activeQuizUuid);
  }, [
    activeQuizUuid,
    loadedQuizUuid,
    quizquestions?.data,
    questionOptionsQueries,
    selectedLessonId,
  ]);

  const updateQuestionText = useCallback(
    (qIndex: number, value: string) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        updated[qIndex] = { ...currentQuestion, text: value };

        return {
          ...prev,
          [selectedLessonId]: updated,
        };
      });

      setModifiedQuestions(prev => new Set(prev).add(qIndex));
    },
    [selectedLessonId]
  );

  const updateQuestionPoints = useCallback(
    (qIndex: number, points: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        updated[qIndex] = { ...currentQuestion, points };

        return {
          ...prev,
          [selectedLessonId]: updated,
        };
      });

      setModifiedQuestions(prev => new Set(prev).add(qIndex));
    },
    [selectedLessonId]
  );

  const updateOptionText = useCallback(
    (qIndex: number, oIndex: number, value: string) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const options = [...(currentQuestion.options ?? [])];
        const currentOption = options[oIndex];
        if (!currentOption) return prev;
        options[oIndex] = { ...currentOption, text: value };
        updated[qIndex] = { ...currentQuestion, options };

        return { ...prev, [selectedLessonId]: updated };
      });

      setModifiedOptions(prev => {
        const newMap = new Map(prev);
        const optionSet = newMap.get(qIndex) || new Set();
        optionSet.add(oIndex);
        newMap.set(qIndex, optionSet);
        return newMap;
      });
    },
    [selectedLessonId]
  );

  const toggleCorrectOption = useCallback(
    (qIndex: number, oIndex: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const options = [...(currentQuestion.options || [])];
        const currentOption = options[oIndex];
        if (!currentOption) return prev;
        options[oIndex] = {
          ...currentOption,
          isCorrect: !currentOption.isCorrect,
        };
        updated[qIndex] = { ...currentQuestion, options };

        return { ...prev, [selectedLessonId]: updated };
      });

      setModifiedOptions(prev => {
        const newMap = new Map(prev);
        const optionSet = newMap.get(qIndex) || new Set();
        optionSet.add(oIndex);
        newMap.set(qIndex, optionSet);
        return newMap;
      });
    },
    [selectedLessonId]
  );

  const handleSaveQuizQuestions = useCallback(async () => {
    if (!selectedLessonId || !activeQuizUuid) {
      toast.error('Please select a lesson and create/select a quiz first');
      return;
    }

    const questions = quizData[selectedLessonId] ?? [];
    if (!questions.length) {
      toast.error('No questions to save');
      return;
    }

    let savedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];
        if (!question) {
          continue;
        }
        let questionUuid = question?.uuid;

        const isNewQuestion = !questionUuid || questionUuid === '';
        const questionChanged =
          isNewQuestion || hasQuestionChanged(qIndex) || modifiedQuestions.has(qIndex);

        if (!questionChanged) {
          if (
            ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'].includes(question.type) &&
            question.options?.length
          ) {
            const modifiedOptionsForQuestion = modifiedOptions.get(qIndex);
            let hasChangedOptions = false;

            for (let oIndex = 0; oIndex < question.options.length; oIndex++) {
              const option = question.options[oIndex];
              if (!option) {
                continue;
              }
              const isNewOption = !option.uuid || option.uuid === '';
              const optionChanged =
                isNewOption ||
                hasOptionChanged(qIndex, oIndex) ||
                modifiedOptionsForQuestion?.has(oIndex);

              if (optionChanged) {
                hasChangedOptions = true;
                break;
              }
            }

            if (!hasChangedOptions) {
              skippedCount++;
              continue;
            }
          } else {
            skippedCount++;
            continue;
          }
        }

        try {
          if (isNewQuestion) {
            // CREATE NEW QUESTION
            const res = (await addQuizQuestion.mutateAsync({
              path: { quizUuid: activeQuizUuid },
              body: buildQuestionPayload(question, qIndex, activeQuizUuid, 'test@example.com'),
            })) as MessageWithData<QuizQuestion>;

            questionUuid = res?.data?.uuid || res?.uuid || res?.question_uuid;

            if (!questionUuid) {
              throw new Error('Failed to get question UUID from API response');
            }
            question.uuid = questionUuid;

            setQuizData(prev => {
              const updated = [...(prev[selectedLessonId] || [])];
              const currentQuestion = updated[qIndex];
              if (!currentQuestion) return prev;
              updated[qIndex] = { ...currentQuestion, uuid: questionUuid };
              return { ...prev, [selectedLessonId]: updated };
            });
          } else if (questionChanged) {
            // UPDATE EXISTING QUESTION (only if it changed)
            await updateQuizQuestion.mutateAsync({
              path: { quizUuid: activeQuizUuid, questionUuid: questionUuid as string },
              body: buildQuestionPayload(question, qIndex, activeQuizUuid, 'test@example.com'),
            });
          }

          if (
            ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'].includes(question.type) &&
            question.options?.length
          ) {
            const modifiedOptionsForQuestion = modifiedOptions.get(qIndex);

            for (let oIndex = 0; oIndex < question.options.length; oIndex++) {
              const option = question.options[oIndex];
              if (!option) {
                continue;
              }

              if (!option.text?.trim()) {
                continue;
              }

              const isNewOption = !option.uuid || option.uuid === '';
              const optionChanged =
                isNewOption ||
                hasOptionChanged(qIndex, oIndex) ||
                modifiedOptionsForQuestion?.has(oIndex);

              if (!optionChanged) {
                continue;
              }

              try {
                if (isNewOption) {
                  // CREATE NEW OPTION
                  const newOpt = (await addQuestionOption.mutateAsync({
                    path: { quizUuid: activeQuizUuid, questionUuid: questionUuid as string },
                    body: buildOptionPayload(
                      option,
                      oIndex,
                      questionUuid as string,
                      'test@example.com'
                    ),
                  })) as MessageWithData<QuizQuestionOption>;

                  const optionUuid = newOpt?.data?.uuid || newOpt?.uuid || newOpt?.option_uuid;

                  if (optionUuid) {
                    option.uuid = optionUuid;

                    setQuizData(prev => {
                      const updated = [...(prev[selectedLessonId] || [])];
                      const currentQuestion = updated[qIndex];
                      if (!currentQuestion) return prev;
                      const opts = [...(currentQuestion.options || [])];
                      const currentOption = opts[oIndex];
                      if (!currentOption) return prev;
                      opts[oIndex] = { ...currentOption, uuid: optionUuid };
                      updated[qIndex] = { ...currentQuestion, options: opts };
                      return { ...prev, [selectedLessonId]: updated };
                    });
                  }
                } else {
                  // UPDATE EXISTING OPTION
                  await updateQuestionOption.mutateAsync({
                    path: {
                      quizUuid: activeQuizUuid,
                      questionUuid: questionUuid as string,
                      optionUuid: option.uuid as string,
                    },
                    body: buildOptionPayload(
                      option,
                      oIndex,
                      questionUuid as string,
                      'test@example.com'
                    ),
                  });
                }
              } catch (optionErr) {}
            }

            qc.invalidateQueries({
              queryKey: getQuestionOptionsQueryKey({
                path: { quizUuid: activeQuizUuid, questionUuid: questionUuid as string },
                query: { pageable: {} },
              }),
            });
          }

          savedCount++;
        } catch (qErr) {
          failedCount++;
          toast.error(`Failed to save question ${qIndex + 1}`);
        }
      }

      qc.invalidateQueries({
        queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid } }),
      });

      setOriginalQuizData(prev => ({
        ...prev,
        [selectedLessonId]: JSON.parse(JSON.stringify(quizData[selectedLessonId])),
      }));

      setModifiedQuestions(new Set());
      setModifiedOptions(new Map());

      if (failedCount === 0) {
        if (skippedCount > 0) {
          toast.success(
            `Saved ${savedCount} changed items! (${skippedCount} unchanged items skipped)`
          );
        } else {
          toast.success(`All ${savedCount} questions and options saved successfully!`);
        }
      } else if (savedCount > 0) {
        toast.warning(
          `Saved ${savedCount} questions, skipped ${skippedCount}, but ${failedCount} failed.`
        );
      } else {
        toast.error('Failed to save all questions. Please try again.');
      }
    } catch (err) {
      toast.error(
        `Failed to save quiz questions: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }, [
    selectedLessonId,
    activeQuizUuid,
    quizData,
    originalQuizData,
    modifiedQuestions,
    modifiedOptions,
    addQuizQuestion,
    updateQuizQuestion,
    addQuestionOption,
    updateQuestionOption,
    buildQuestionPayload,
    buildOptionPayload,
    hasQuestionChanged,
    hasOptionChanged,
    qc,
    setQuizData,
  ]);

  const addQuestion = useCallback(
    (type: QuestionType) => {
      if (!selectedLessonId) return;

      const base: Question = {
        uuid: '',
        text: randomItem(sampleQuestions),
        points: type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE' ? 1 : 5,
        type,
      };

      const newQuestion: Question = (() => {
        switch (type) {
          case 'MULTIPLE_CHOICE':
            return {
              ...base,
              options: Array.from({ length: 4 }, () => ({
                uuid: '',
                text: '',
                isCorrect: false,
              })),
            };

          case 'TRUE_FALSE':
            return {
              ...base,
              options: [
                { uuid: '', text: 'True', isCorrect: true },
                { uuid: '', text: 'False', isCorrect: false },
              ],
            };

          case 'ESSAY':
            return {
              ...base,
              options: [{ uuid: '', text: 'True', isCorrect: true }],
              answer: '',
            } as ExtendedQuestion;

          case 'SHORT_ANSWER':
            return {
              ...base,
              options: [{ uuid: '', text: 'True', isCorrect: true }],
              answer: '',
            } as ExtendedQuestion;

          case 'MATCHING':
            return {
              ...base,
              pairs: Array.from({ length: 2 }, () => ({
                left: randomItem(sampleOptions),
                right: randomItem(sampleOptions),
              })),
            };
        }
      })();

      setQuizData(prev => {
        const questions = prev[selectedLessonId] ?? [];

        return {
          ...prev,
          [selectedLessonId]: [...questions, newQuestion],
        };
      });
    },
    [selectedLessonId]
  );

  const handleDeleteQuestion = useCallback(
    async (qIndex: number) => {
      const question = questions[qIndex];
      if (!question) return;

      if (question?.uuid) {
        if (!confirm('Delete this question from the quiz?')) return;

        try {
          await deleteQuizQuestion.mutateAsync({
            path: {
              quizUuid: activeQuizUuid!,
              questionUuid: question?.uuid as string,
            },
          });

          qc.invalidateQueries({
            queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid as string } }),
          });

          setQuizData(prev => {
            const updated = [...(prev[selectedLessonId] ?? [])];
            updated.splice(qIndex, 1);
            return { ...prev, [selectedLessonId]: updated };
          });

          toast.success('Question deleted!');
        } catch (err) {
          toast.error('Failed to delete question');
        }
      } else {
        setQuizData(prev => {
          const updated = [...(prev[selectedLessonId] ?? [])];
          updated.splice(qIndex, 1);
          return { ...prev, [selectedLessonId]: updated };
        });
      }
    },
    [questions, activeQuizUuid, selectedLessonId, deleteQuizQuestion, qc]
  );

  const handleDeleteOption = useCallback(
    async (qIndex: number, oIndex: number) => {
      const question = questions[qIndex];
      if (!question) return;
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
              optionUuid: option.uuid,
            },
          });

          qc.invalidateQueries({
            queryKey: ['questionOptions', activeQuizUuid, question.uuid],
          });

          toast.success('Option deleted!');
        } catch (err) {
          toast.error('Failed to delete option');
        }
      } else {
        setQuizData(prev => {
          const questions = prev[selectedLessonId];
          if (!questions) return prev;

          const updated = [...questions];
          const currentQuestion = updated[qIndex];
          if (!currentQuestion) return prev;
          const options = currentQuestion.options ?? [];
          options.splice(oIndex, 1);
          updated[qIndex] = { ...currentQuestion, options };

          return { ...prev, [selectedLessonId]: updated };
        });
      }
    },
    [questions, activeQuizUuid, selectedLessonId, deleteQuestionOption, qc]
  );

  const setCorrectOption = useCallback(
    (qIndex: number, oIndex: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const options = currentQuestion.options?.map((opt, idx) => ({
          ...opt,
          isCorrect: idx === oIndex,
        }));
        updated[qIndex] = { ...currentQuestion, options };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const addOption = useCallback(
    (qIndex: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const options = [...(currentQuestion.options || [])];
        options.push({ text: '', isCorrect: false });
        updated[qIndex] = { ...currentQuestion, options };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const updatePairText = useCallback(
    (qIndex: number, pIndex: number, side: 'left' | 'right', value: string) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const pairs = [...(currentQuestion.pairs || [])];
        const currentPair = pairs[pIndex];
        if (!currentPair) return prev;
        pairs[pIndex] = { ...currentPair, [side]: value };
        updated[qIndex] = { ...currentQuestion, pairs };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const deletePair = useCallback(
    (qIndex: number, pIndex: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const pairs = currentQuestion.pairs || [];
        if (pairs.length <= 2) {
          toast.error('Cannot delete: minimum 2 pairs required');
          return prev;
        }
        pairs.splice(pIndex, 1);
        updated[qIndex] = { ...currentQuestion, pairs };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const addPair = useCallback(
    (qIndex: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const currentQuestion = updated[qIndex];
        if (!currentQuestion) return prev;
        const pairs = [...(currentQuestion.pairs || [])];
        pairs.push({ left: '', right: '' });
        updated[qIndex] = { ...currentQuestion, pairs };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const createAssignmentForLesson = useCallback(
    async (lessonId: string, payload: AssignmentPayload) => {
      return new Promise<string>((resolve, reject) => {
        createAssignmentMut.mutate(
          {
            body: {
              ...payload,
              lesson_uuid: lessonId,
            } as CreateAssignmentVariables['body'],
          },
          {
            onSuccess: (data: MessageWithData<Assignment>) => {
              qc.invalidateQueries({
                queryKey: searchAssignmentsQueryKey({
                  query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
                }),
              });
              const resolvedUuid = data?.data?.uuid || data?.uuid;
              if (resolvedUuid) {
                resolve(resolvedUuid);
                return;
              }
              reject(new Error('Assignment UUID missing from response'));
            },
            onError: error => {
              reject(error);
            },
          }
        );
      });
    },
    [createAssignmentMut, qc, selectedLessonId]
  );

  const updateAssignmentForLesson = useCallback(
    async (assignmentUuid: string, payload: AssignmentPayload) => {
      return new Promise<void>((resolve, reject) => {
        updateAssignmentMut.mutate(
          {
            path: { uuid: assignmentUuid },
            body: payload as UpdateAssignmentVariables['body'],
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: searchAssignmentsQueryKey({
                  query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
                }),
              });
              resolve();
            },
            onError: error => {
              reject(error);
            },
          }
        );
      });
    },
    [updateAssignmentMut, qc, selectedLessonId]
  );

  const deleteAssignmentForLesson = useCallback(
    async (assignmentUuid: string) => {
      return new Promise<void>((resolve, reject) => {
        deleteAssignmentMut.mutate(
          {
            path: { uuid: assignmentUuid },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({
                queryKey: searchAssignmentsQueryKey({
                  query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
                }),
              });
              setAssignmentId(null);
              resolve();
            },
            onError: error => {
              reject(error);
            },
          }
        );
      });
    },
    [deleteAssignmentMut, qc, selectedLessonId]
  );

  const handleSelectAssignment = useCallback((uuid: string | null) => {
    setAssignmentId(uuid);
  }, []);

  return (
    <div className='mb-10 w-full'>
      <div className='border-border mb-4 flex border-b'>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
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
              toggleCorrectOption={toggleCorrectOption}
              addOption={addOption}
              updatePairText={updatePairText}
              deletePair={deletePair}
              addPair={addPair}
              deleteQuestion={handleDeleteQuestion}
              deleteOption={handleDeleteOption}
              // createQuizForLesson={async (lessonId, payload) => {
              //   // const res = await createQuiz.mutateAsync({
              //   //     body: {
              //   //         ...payload,
              //   //         lesson_uuid: lessonId,
              //   //     },
              //   // });
              //   // qc.invalidateQueries({
              //   //     queryKey: searchQuizzesQueryKey({
              //   //         query: { pageable: {}, searchParams: { lesson_uuid_eq: selectedLessonId as string } },
              //   //     }),
              //   // });
              //   // return res?.data?.quiz_uuid || res?.quiz_uuid;
              // }}
              createQuizForLesson={async (lessonId, payload) => {
                return new Promise<string>((resolve, reject) => {
                  createQuiz.mutate(
                    {
                      body: {
                        ...payload,
                        lesson_uuid: lessonId,
                      } as CreateQuizVariables['body'],
                    },
                    {
                      onSuccess: (data: MessageWithData<Quiz>) => {
                        const quizUuid = data?.data?.uuid || data?.uuid;
                        qc.invalidateQueries({
                          queryKey: searchQuizzesQueryKey({
                            query: {
                              pageable: {},
                              searchParams: { lesson_uuid_eq: selectedLessonId as string },
                            },
                          }),
                        });
                        if (quizUuid) {
                          resolve(quizUuid);
                          return;
                        }
                        reject(new Error('Quiz UUID missing from response'));
                      },
                      onError: error => {
                        reject(error);
                      },
                    }
                  );
                });
              }}
              updateQuizForLesson={handleUpdateQuiz}
              deleteQuizForLesson={handleDeleteQuiz}
              addQuizQuestion={async payload => {}}
              addQuestionOption={async payload => {}}
              isPending={createQuiz.isPending || updateQuiz.isPending}
            />

            <div className='mt-4 flex justify-end self-end'>
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
                <Disc className='mr-2 h-4 w-4' />
                {addQuizQuestion.isPending ||
                addQuestionOption.isPending ||
                updateQuizQuestion.isPending ||
                updateQuestionOption.isPending
                  ? 'Saving...'
                  : 'Save Questions'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'Assignment' && (
          <div>
            <AssignmentCreationForm
              courseId={course?.data?.uuid as string}
              lessons={lessons}
              assignmentId={assignmentId}
              selectedLessonId={selectedLessonId}
              selectedLesson={selectedLesson}
              setSelectedLessonId={setSelectedLessonId}
              setSelectedLesson={setSelectedLesson}
              onSelectAssignment={handleSelectAssignment}
              createAssignmentForLesson={createAssignmentForLesson}
              updateAssignmentForLesson={updateAssignmentForLesson}
              deleteAssignmentForLesson={deleteAssignmentForLesson}
              isPending={
                createAssignmentMut.isPending ||
                updateAssignmentMut.isPending ||
                deleteAssignmentMut.isPending
              }
            />
          </div>
        )}

        {activeTab === 'Project' && (
          <div>
            <div className='text-muted-foreground flex min-h-[300px] flex-col items-center justify-center gap-6 px-3 py-2 text-center text-sm'>
              <p>No projects created yet</p>
            </div>
          </div>
        )}

        {activeTab === 'Discussions' && (
          <div className='text-muted-foreground flex min-h-[300px] flex-col items-center justify-center gap-6 px-3 py-2 text-center text-sm'>
            <p>No discussions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentCreationForm;
