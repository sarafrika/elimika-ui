'use client';

import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';
import {
  getAllAssessmentRubricsOptions,
  searchQuizzesOptions,
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
  deleteQuestion: (qIndex: number) => void;
  deleteOption: (qIndex: number, oIndex: number) => void;

  // API callbacks
  createQuizForLesson: (lessonId: string, payload: any) => Promise<string>;
  updateQuizForLesson: (quizUuid: string, payload: any) => Promise<void>;
  deleteQuizForLesson: (quizUuid: string) => Promise<void>;
  addQuizQuestion: (payload: any) => Promise<any>;
  addQuestionOption: (payload: any) => Promise<any>;

  isPending: boolean
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
  deleteQuestion,
  deleteOption,
  createQuizForLesson,
  updateQuizForLesson,
  deleteQuizForLesson,
  addQuizQuestion,
  addQuestionOption,

  isPending
}: QuizCreationFormProps) => {
  const { data: rubrics, isLoading: rubricsIsLoading } = useQuery(
    getAllAssessmentRubricsOptions({ query: { pageable: {} } })
  );

  const { data: quizzes } = useQuery({
    ...searchQuizzesOptions({
      query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
    }),
    enabled: !!selectedLessonId,
  });

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
    lesson_uuid: '',
  });

  const handleQuizInputChange = (field: string, value: any) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuizSelect = (selectedUuid: string | null) => {
    if (onSelectQuiz) onSelectQuiz(selectedUuid);

    const selectedQuiz = quizzes?.data?.content?.find((q: any) => q.uuid === selectedUuid);

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
        lesson_uuid: selectedLessonId as string,
      });
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
        lesson_uuid: '',
      });
    }
  };

  const handleSaveQuiz = async () => {
    if (!selectedLessonId || !quizData.title.trim()) {
      toast.error('Please select a lesson and enter a quiz title');
      return;
    }

    try {
      if (quizUuid) {
        await updateQuizForLesson(quizUuid, quizData);
        toast.success('Quiz updated successfully!');
      } else {
        const createdQuizUuid = await createQuizForLesson(selectedLessonId, quizData);
        onSelectQuiz?.(createdQuizUuid);
        toast.success('Quiz created successfully! You can now add questions.');
      }
    } catch (err) {
      toast.error(`Failed to ${quizId ? 'update' : 'create'} quiz.`);
    }
  };

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
        lesson_uuid: '',
      });
    } catch (err) {
      toast.error('Failed to delete quiz.');
    }
  };

  return (
    <div className='grid grid-cols-4 gap-6'>
      {/* Lessons */}
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <h3 className='mb-4 text-lg font-semibold text-foreground'>Lessons</h3>
        <ul className="space-y-2 gap-2 flex flex-col">
          {lessons?.content?.length ? (
            lessons.content
              .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
              .map((lesson: any) => (
                <li
                  key={lesson.uuid}
                  onClick={() => {
                    setSelectedLessonId(lesson.uuid);
                    setSelectedLesson(lesson);
                    handleQuizSelect(null)
                  }}
                  className={cn(
                    'flex flex-row items-start gap-2 cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 font-medium text-sm',
                    selectedLessonId === lesson.uuid
                      ? 'bg-primary/10 border-2 border-primary text-primary shadow-sm'
                      : 'hover:bg-muted border-2 border-transparent text-foreground'
                  )}
                >
                  <p>{lesson.lesson_number}.</p>
                  <p>{lesson.title}</p>
                </li>
              ))
          ) : (
            <li className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
              Looks like you haven’t added any lessons to this course yet.</li>
          )}
        </ul>

      </div>

      {/* Quiz creation form */}
      {!selectedLessonId ? (
        <div className='col-span-3 flex min-h-[50vh] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted'>
          <div className='text-center'>
            <p className='text-lg font-medium text-foreground'>Select a lesson</p>
            <p className='text-sm text-muted-foreground mt-1'>Choose a lesson from the left to create or manage quizzes</p>
          </div>
        </div>
      ) : (
        <div className='col-span-3 space-y-6 rounded-xl border bg-card p-6 shadow-sm'>
          <div className="border-b pb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-foreground uppercase truncate max-w-[70%]">
              QUIZ: {selectedLesson?.title || 'Select a lesson'}
            </h3>

            <Button
              size="sm"
              className="shrink-0"
              onClick={() => handleQuizSelect('')}
            >
              <PlusCircle size={16} className="mr-1" />
              Create Quiz
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col space-y-3">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex flex-col">
                  <h4 className="text-base font-semibold text-foreground">
                    Existing Quizzes
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Select a quiz to edit or create a new one.
                  </p>
                </div>
              </div>

              {/* Quiz List */}
              <ul className="flex flex-col space-y-2">
                {quizzes?.data?.content?.length ? (
                  quizzes.data.content.map((quiz: any, idx) => (
                    <li
                      key={quiz.uuid}
                      onClick={() => handleQuizSelect(quiz.uuid)}
                      className={cn(
                        'group flex items-center justify-between cursor-pointer rounded-md px-4 py-2.5 text-sm font-medium border transition-all',
                        quizUuid === quiz.uuid
                          ? 'bg-primary/20 border-primary text-primary shadow-sm' // selected state
                          : 'bg-primary/5 hover:bg-muted border-transparent text-foreground' // unselected state
                      )}
                    >
                      <span className="truncate">{idx + 1} - {quiz.title}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No quizzes available for this lesson yet.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {quizUuid === null && (
            <div className="flex flex-col items-center justify-center text-center gap-1 py-6 rounded-lg border border-dashed">
              <p className="text-sm font-medium text-foreground">
                No quiz selected yet
              </p>
              <p className="text-xs text-muted-foreground">
                Select an existing quiz or create a new one to continue.
              </p>
            </div>
          )}


          {quizUuid !== null &&
            <div className="flex flex-col gap-6">
              <Separator />
              <div className="flex items-center justify-between -my-4">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {quizUuid === ''
                    ? 'Create New Quiz'
                    : 'Edit Quiz'}
                </h2>

                <span className="text-xs font-medium rounded-full px-2.5 py-1 bg-muted text-muted-foreground">
                  {quizUuid === ''
                    ? 'New'
                    : 'Editing'}
                </span>
              </div>
              <Separator />

              {/* Quiz Title */}
              <div className="flex flex-col gap-2">
                <Label>Quiz Title</Label>
                <Input
                  placeholder="Enter quiz title"
                  value={quizData.title}
                  onChange={e => handleQuizInputChange("title", e.target.value)}
                />
              </div>

              {/* Instructions */}
              <div className="flex flex-col gap-2">
                <Label>Instructions (optional)</Label>
                <Textarea
                  placeholder="Enter quiz instructions"
                  rows={3}
                  value={quizData.instructions}
                  onChange={e => handleQuizInputChange("instructions", e.target.value)}
                />
              </div>

              {/* Numbers Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={quizData.time_limit_minutes}
                    onChange={e =>
                      handleQuizInputChange("time_limit_minutes", Number(e.target.value))
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Attempts Allowed</Label>
                  <Input
                    type="number"
                    value={quizData.attempts_allowed}
                    onChange={e =>
                      handleQuizInputChange("attempts_allowed", Number(e.target.value))
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={quizData.passing_score}
                    onChange={e =>
                      handleQuizInputChange("passing_score", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Hide Assign Rubric */}
              <div className="flex-col gap-2 hidden">
                <Label>Assign Rubric</Label>
                <Select
                  value={quizData.rubric_uuid || ""}
                  onValueChange={value =>
                    handleQuizInputChange("rubric_uuid", value || null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rubric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Select rubric</SelectItem>
                    {rubrics?.data?.content?.map((rubric: any) => (
                      <SelectItem key={rubric.uuid} value={rubric.uuid}>
                        {rubric.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Checkbox */}
              <Label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={quizData.active}
                  onCheckedChange={checked =>
                    handleQuizInputChange("active", Boolean(checked))
                  }
                />
                <span>Active</span>
              </Label>

              {/* Buttons */}
              <div className="flex flex-row gap-6 items-end justify-end pt-2">
                {quizUuid && (
                  <Button size={"sm"} variant="destructive" onClick={handleDeleteQuiz}>
                    <Trash2 />
                  </Button>
                )}
                <Button size={"sm"} onClick={handleSaveQuiz}>
                  {isPending ? "Saving..." : <>
                    {quizUuid ? "Update Quiz" : "Save Quiz"}
                  </>}
                </Button>
              </div>
            </div>}


          {/* Only show questions UI if quizUuid exists */}
          {quizUuid && (
            <div className='mt-8 pt-6 border-t'>
              <div className='mb-6 flex justify-between items-center'>
                <h4 className='text-lg font-semibold text-foreground'>Questions</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size={"sm"}>
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

              <div className='overflow-hidden rounded-lg border'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-muted border-b'>
                      <th className='w-1/4 px-4 py-3 text-left text-sm font-semibold text-foreground'>Question</th>
                      <th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>Answer/Options (indicate correct options)</th>
                      <th className='w-24 px-4 py-3 text-left text-sm font-semibold text-foreground'>Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {questions.length > 0 ? (
                      questions.map((q: any, qIndex) => (
                        <tr key={qIndex} className="group hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-4 flex self-start">
                            <div className="group relative">
                              <textarea
                                value={q.text}
                                rows={6}
                                onChange={e => updateQuestionText(qIndex, e.target.value)}
                                placeholder="Enter question text here"
                                className="w-full text-sm resize-none rounded-lg border border-input bg-background px-3 py-2 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteQuestion(qIndex)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete question</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {/* ...existing options inputs logic here */}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min={0}
                              value={q.points ?? 1}
                              onChange={e => updateQuestionPoint(qIndex, Number(e.target.value))}
                              className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-sm text-muted-foreground py-12 border border-dashed rounded-lg">
                          No questions added yet. Click “Add Question” to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
