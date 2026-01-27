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

const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const tabs = ['Quiz', 'Assignment', 'Project', 'Discussions', 'Attendance'];

type AssessmentCreationFormProps = {
  course: any;
  lessons: any;
  lessonContentsMap: any;
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

export type QuizState = Record<number, Question[]>;

const AssessmentCreationForm = ({
  course,
  lessonContentsMap,
  lessons,
}: AssessmentCreationFormProps) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Quiz');

  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<any>(lessons?.content[0]?.id);

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
    (q: Question, index: number, quizUuid: string, userEmail?: string) => ({
      quiz_uuid: quizUuid,
      question_text: q.text,
      question_type: q.type,
      display_order: index + 1,
      points: q.points,
      question_number: `Question ${index + 1}`,
      question_category: `${q.type} Question`,
      updated_by: userEmail,
    }),
    []
  );

  const buildOptionPayload = useCallback(
    (opt: Option, index: number, questionUuid: string, userEmail?: string) => ({
      question_uuid: questionUuid,
      option_text: opt.text,
      is_correct: opt.isCorrect,
      is_incorrect: `${!opt.isCorrect}`,
      display_order: index + 1,
      position_display: `Option ${index + 1}`,
      correctness_status: opt.isCorrect ? 'Correct Answer' : 'Wrong Answer',
      updated_by: userEmail,
    }),
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
      quizquestions?.data?.map((q: any) => ({
        queryKey: ['questionOptions', activeQuizUuid, q.uuid],
        queryFn: () =>
          getQuestionOptions({
            path: {
              quizUuid: activeQuizUuid!,
              questionUuid: q.uuid,
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
    async (quizUuid: string, payload: any) => {
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

  // Populate quizData when backend data loads
  // Load questions and options into quizData
  useEffect(() => {
    if (!activeQuizUuid || !quizquestions?.data) return;

    // Prevent re-running if we already loaded this quiz
    if (loadedQuizUuid === activeQuizUuid) return;

    const allOptionsLoaded = questionOptionsQueries.every(q => !q.isLoading);
    if (!allOptionsLoaded) return;

    const questionsWithOptions: Question[] = quizquestions.data.map((q: any, index: number) => {
      const optionsData = questionOptionsQueries[index]?.data?.data?.data?.content ?? [];

      const options: Option[] = optionsData.map((opt: any) => ({
        uuid: opt.uuid,
        text: opt.option_text,
        isCorrect: opt.is_correct,
      }));

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
        answer: q.question_type === 'essay' || q.question_type === 'short_answer' ? '' : undefined,
      };
    });

    setQuizData(prev => ({
      ...prev,
      [selectedLessonId]: questionsWithOptions,
    }));
    setLoadedQuizUuid(activeQuizUuid);
  }, [
    activeQuizUuid,
    loadedQuizUuid,
    quizquestions?.data,
    questionOptionsQueries,
    selectedLessonId,
  ]);

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

    try {
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];
        let questionUuid = question?.uuid;

        try {
          // --- 1️ Create or update question ---
          if (!questionUuid) {
            const res: any = await addQuizQuestion.mutateAsync({
              path: { quizUuid: activeQuizUuid },
              body: buildQuestionPayload(question, qIndex, activeQuizUuid, 'test@example.com'),
            });
            questionUuid = res?.data?.question_uuid || res?.question_uuid;
            question.uuid = questionUuid;
          } else {
            await updateQuizQuestion.mutateAsync({
              path: { quizUuid: activeQuizUuid, questionUuid },
              body: buildQuestionPayload(question, qIndex, activeQuizUuid, 'test@example.com'),
            });
          }

          // --- 2️ Create or update options ---
          if (
            (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') &&
            question.options?.length
          ) {
            for (let oIndex = 0; oIndex < question.options.length; oIndex++) {
              const option = question.options[oIndex];
              if (!option.text?.trim()) continue; // skip empty options

              if (!option.uuid) {
                const newOpt: any = await addQuestionOption.mutateAsync({
                  path: { quizUuid: activeQuizUuid, questionUuid },
                  body: buildOptionPayload(option, oIndex, questionUuid, 'test@example.com'),
                });
                option.uuid = newOpt?.data?.uuid || newOpt?.uuid;
              } else {
                await updateQuestionOption.mutateAsync({
                  path: { quizUuid: activeQuizUuid, questionUuid, optionUuid: option.uuid },
                  body: buildOptionPayload(option, oIndex, questionUuid, 'test@example.com'),
                });
              }

              // Query key for each options
              // qc.invalidateQueries({
              //     queryKey: getQuestionOptionsQueryKey({ path: { quizUuid: activeQuizUuid, questionUuid: questionUuid as string }, query: { pageable: {} } }),
              // });
            }
          }

          qc.invalidateQueries({
            queryKey: getQuestionOptionsQueryKey({
              path: { quizUuid: activeQuizUuid, questionUuid: questionUuid as string },
              query: { pageable: {} },
            }),
          });
        } catch (qErr) {
          toast.error(`Failed to save question ${qIndex + 1}`);
        }
      }

      qc.invalidateQueries({
        queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid } }),
      });

      toast.success('All questions and options saved successfully!');
    } catch (err) {
      toast.error('Failed to save quiz questions');
    }
  }, [
    selectedLessonId,
    activeQuizUuid,
    quizData,
    addQuizQuestion,
    updateQuizQuestion,
    addQuestionOption,
    updateQuestionOption,
    buildQuestionPayload,
    buildOptionPayload,
    qc,
  ]);

  const addQuestion = useCallback(
    (type: QuestionType) => {
      if (!selectedLessonId) return;

      const base = {
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
          case 'SHORT_ANSWER':
            return base;

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

  const updateQuestionText = useCallback(
    (qIndex: number, value: string) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        updated[qIndex] = { ...updated[qIndex], text: value };

        return {
          ...prev,
          [selectedLessonId]: updated,
        };
      });
    },
    [selectedLessonId]
  );

  const updateQuestionPoints = useCallback(
    (qIndex: number, points: number) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        updated[qIndex] = { ...updated[qIndex], points };

        return {
          ...prev,
          [selectedLessonId]: updated,
        };
      });
    },
    [selectedLessonId]
  );

  const handleDeleteQuestion = useCallback(
    async (qIndex: number) => {
      const question = questions[qIndex];

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

  const updateOptionText = useCallback(
    (qIndex: number, oIndex: number, value: string) => {
      setQuizData(prev => {
        const questions = prev[selectedLessonId];
        if (!questions) return prev;

        const updated = [...questions];
        const options = [...(updated[qIndex].options ?? [])];
        options[oIndex] = { ...options[oIndex], text: value };
        updated[qIndex] = { ...updated[qIndex], options };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  const handleDeleteOption = useCallback(
    async (qIndex: number, oIndex: number) => {
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
          const options = updated[qIndex].options ?? [];
          options.splice(oIndex, 1);
          updated[qIndex] = { ...updated[qIndex], options };

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
        const options = updated[qIndex].options?.map((opt, idx) => ({
          ...opt,
          isCorrect: idx === oIndex,
        }));
        updated[qIndex] = { ...updated[qIndex], options };

        return { ...prev, [selectedLessonId]: updated };
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
        const options = [...(updated[qIndex].options || [])];
        options[oIndex] = {
          ...options[oIndex],
          isCorrect: !options[oIndex].isCorrect,
        };
        updated[qIndex] = { ...updated[qIndex], options };

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
        const options = [...(updated[qIndex].options || [])];
        options.push({ text: '', isCorrect: false });
        updated[qIndex] = { ...updated[qIndex], options };

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
        const pairs = [...(updated[qIndex].pairs || [])];
        pairs[pIndex] = { ...pairs[pIndex], [side]: value };
        updated[qIndex] = { ...updated[qIndex], pairs };

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
        const pairs = updated[qIndex].pairs || [];
        if (pairs.length <= 2) {
          toast.error('Cannot delete: minimum 2 pairs required');
          return prev;
        }
        pairs.splice(pIndex, 1);
        updated[qIndex] = { ...updated[qIndex], pairs };

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
        const pairs = [...(updated[qIndex].pairs || [])];
        pairs.push({ left: '', right: '' });
        updated[qIndex] = { ...updated[qIndex], pairs };

        return { ...prev, [selectedLessonId]: updated };
      });
    },
    [selectedLessonId]
  );

  // Assignment CRUD operations
  const createAssignmentForLesson = useCallback(
    async (lessonId: string, payload: any) => {
      return new Promise<string>((resolve, reject) => {
        createAssignmentMut.mutate(
          {
            body: {
              ...payload,
              lesson_uuid: lessonId,
            } as any,
          },
          {
            onSuccess: (data: any) => {
              qc.invalidateQueries({
                queryKey: searchAssignmentsQueryKey({
                  query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
                }),
              });
              resolve(data?.data?.uuid || data?.uuid);
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
    async (assignmentUuid: string, payload: any) => {
      return new Promise<void>((resolve, reject) => {
        updateAssignmentMut.mutate(
          {
            path: { uuid: assignmentUuid },
            body: payload as any,
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
            className={`-mb-px border-b-2 px-4 py-2 transition-colors ${activeTab === tab
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
              createQuizForLesson={async (lessonId, payload) => {
                // const res: any = await createQuiz.mutateAsync({
                //     body: {
                //         ...payload,
                //         lesson_uuid: lessonId,
                //     },
                // });
                // qc.invalidateQueries({
                //     queryKey: searchQuizzesQueryKey({
                //         query: { pageable: {}, searchParams: { lesson_uuid_eq: selectedLessonId as string } },
                //     }),
                // });
                // return res?.data?.quiz_uuid || res?.quiz_uuid;
              }}
              updateQuizForLesson={handleUpdateQuiz}
              deleteQuizForLesson={handleDeleteQuiz}
              addQuizQuestion={async payload => {
                // const res: any = await addQuizQuestion.mutateAsync({
                //     path: { quizUuid: payload.quiz_uuid },
                //     body: payload,
                // });
                // qc.invalidateQueries({
                //     queryKey: getQuizQuestionsQueryKey({ path: { quizUuid: activeQuizUuid! } }),
                // });
                // return res;
              }}
              addQuestionOption={async payload => {
                // const res: any = await addQuestionOption.mutateAsync({
                //     path: {
                //         quizUuid: payload.quiz_uuid,
                //         questionUuid: payload.question_uuid,
                //     },
                //     body: payload,
                // });
                // qc.invalidateQueries({
                //     queryKey: ['questionOptions', payload.quiz_uuid, payload.question_uuid],
                // });
                // return res;
              }}
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
              lessons={lessons}
              assignmentId={assignmentId}
              questions={questions}
              selectedLessonId={selectedLessonId}
              selectedLesson={selectedLesson}
              setSelectedLessonId={setSelectedLessonId}
              setSelectedLesson={setSelectedLesson}
              onSelectAssignment={handleSelectAssignment}
              addQuestion={addQuestion}
              updateQuestionText={updateQuestionText}
              updateQuestionPoint={() => { }}
              updateOptionText={updateOptionText}
              setCorrectOption={setCorrectOption}
              deleteQuestion={() => { }}
              deleteOption={() => { }}
              createAssignmentForLesson={createAssignmentForLesson}
              updateAssignmentForLesson={updateAssignmentForLesson}
              deleteAssignmentForLesson={deleteAssignmentForLesson}
              addAssignmentQuestion={() => { }}
              addQuestionOption={() => { }}
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

        {activeTab === 'Attendance' && (
          <div className='text-muted-foreground flex min-h-[300px] flex-col items-center justify-center gap-6 px-3 py-2 text-center text-sm'>
            <p>No attendance recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentCreationForm;
