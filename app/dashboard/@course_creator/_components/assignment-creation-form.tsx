'use client';

import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import { Textarea } from '../../../../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/utils';
import {
  getAllAssessmentRubricsOptions,
  searchAssignmentsOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import { Question, QuestionType } from './assessment-creation-form';

export type AssignmentCreationFormProps = {
  lessons: any;
  assignmentId: any;
  questions: Question[];
  selectedLessonId: string;
  selectedLesson: any;
  setSelectedLessonId: (id: string) => void;
  setSelectedLesson: (lesson: any) => void;

  onSelectAssignment?: (assignmentUuid: string | null) => void;

  addQuestion: (type: QuestionType) => void;
  updateQuestionText: (qIndex: number, value: string) => void;
  updateOptionText: (qIndex: number, oIndex: number, value: string) => void;
  updateQuestionPoint: (qIndex: number, points: number) => void;
  setCorrectOption: (qIndex: number, oIndex: number) => void;
  deleteQuestion: (qIndex: number) => void;
  deleteOption: (qIndex: number, oIndex: number) => void;

  // API callbacks
  createAssignmentForLesson: (lessonId: string, payload: any) => Promise<string>;
  updateAssignmentForLesson: (assignmentUuid: string, payload: any) => Promise<void>;
  deleteAssignmentForLesson: (assignmentUuid: string) => Promise<void>;
  addAssignmentQuestion: (payload: any) => Promise<any>;
  addQuestionOption: (payload: any) => Promise<any>;

  isPending: boolean;
};

const SUBMISSION_TYPES = ['PDF', 'AUDIO', 'TEXT'];

export const AssignmentCreationForm = ({
  lessons,
  assignmentId,
  questions,
  selectedLessonId,
  selectedLesson,
  setSelectedLessonId,
  setSelectedLesson,

  onSelectAssignment,

  addQuestion,
  updateQuestionText,
  updateQuestionPoint,
  updateOptionText,
  setCorrectOption,
  deleteQuestion,
  deleteOption,
  createAssignmentForLesson,
  updateAssignmentForLesson,
  deleteAssignmentForLesson,
  addAssignmentQuestion,
  addQuestionOption,

  isPending,
}: AssignmentCreationFormProps) => {
  const { data: rubrics, isLoading: rubricsIsLoading } = useQuery(
    getAllAssessmentRubricsOptions({ query: { pageable: {} } })
  );

  const { data: assignments } = useQuery({
    ...searchAssignmentsOptions({
      query: { searchParams: { lesson_uuid_eq: selectedLessonId }, pageable: {} },
    }),
    enabled: !!selectedLessonId,
  });

  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState<string | null>(
    assignmentId ?? null
  );
  const assignmentUuid = selectedAssignmentUuid;

  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    max_points: 0,
    rubric_uuid: '',
    status: 'DRAFT',
    active: false,
    due_date: '',
    assignment_category: '',
    submission_types: [''],
    lesson_uuid: '',
  });

  const handleAssignmentInputChange = (field: string, value: any) => {
    setAssignmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssignmentSelect = (selectedUuid: string | null) => {
    if (onSelectAssignment) onSelectAssignment(selectedUuid);

    const selectedAssignment = assignments?.data?.content?.find(
      (a: any) => a.uuid === selectedUuid
    );

    if (selectedAssignment) {
      setAssignmentData({
        title: selectedAssignment.title || '',
        description: selectedAssignment.description || '',
        instructions: selectedAssignment.instructions || '',
        max_points: selectedAssignment.max_points || 0,
        rubric_uuid: selectedAssignment.rubric_uuid || '',
        status: selectedAssignment.status || 'DRAFT',
        active: selectedAssignment.active || false,
        due_date: selectedAssignment.due_date || '',
        assignment_category: selectedAssignment.assignment_category || '',
        submission_types: selectedAssignment.submission_types || [],
        lesson_uuid: selectedLessonId as string,
      });
    } else {
      setAssignmentData({
        title: '',
        description: '',
        instructions: '',
        max_points: 0,
        rubric_uuid: '',
        status: 'DRAFT',
        active: false,
        due_date: '',
        assignment_category: '',
        submission_types: [''],
        lesson_uuid: '',
      });
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedLessonId || !assignmentData.title.trim()) {
      toast.error('Please select a lesson and enter an assignment title');
      return;
    }

    try {
      if (assignmentUuid) {
        await updateAssignmentForLesson(assignmentUuid, assignmentData);
        toast.success('Assignment updated successfully!');
      } else {
        const createdAssignmentUuid = await createAssignmentForLesson(
          selectedLessonId,
          assignmentData
        );
        onSelectAssignment?.(createdAssignmentUuid);
        toast.success('Assignment created successfully!.');
      }
    } catch (err) {
      toast.error(`Failed to ${assignmentId ? 'update' : 'create'} assignment.`);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentUuid) return;

    if (
      !confirm('Are you sure you want to delete this assignment? This action cannot be undone.')
    ) {
      return;
    }

    try {
      await deleteAssignmentForLesson(assignmentUuid);
      onSelectAssignment?.(null);
      setAssignmentData({
        title: '',
        description: '',
        instructions: '',
        max_points: 0,
        rubric_uuid: '',
        status: 'DRAFT',
        active: false,
        due_date: '',
        assignment_category: '',
        submission_types: [],
        lesson_uuid: '',
      });
      toast.success('Assignment deleted successfully');
    } catch (err) {
      toast.error('Failed to delete assignment.');
    }
  };

  const toggleSubmissionType = (type: string) => {
    setAssignmentData(prev => {
      const exists = prev.submission_types.includes(type);

      return {
        ...prev,
        submission_types: exists
          ? prev.submission_types.filter(t => t !== type)
          : [...prev.submission_types, type],
      };
    });
  };

  return (
    <div className='grid grid-cols-4 gap-6'>
      {/* Lessons */}
      <div className='bg-card rounded-xl border p-4 shadow-sm'>
        <h3 className='text-foreground mb-4 text-lg font-semibold'>Lessons</h3>

        {lessons?.content?.length ? (
          <ul className='flex flex-col gap-2 space-y-2'>
            {lessons.content
              .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
              .map((lesson: any) => (
                <li
                  key={lesson.uuid}
                  onClick={() => {
                    setSelectedLessonId(lesson.uuid);
                    setSelectedLesson(lesson);
                    handleAssignmentSelect(null);
                    setSelectedAssignmentUuid(null);

                    // Reset assignment form data when changing lessons
                    setAssignmentData({
                      title: '',
                      description: '',
                      instructions: '',
                      max_points: 0,
                      rubric_uuid: '',
                      status: 'DRAFT',
                      active: false,
                      due_date: '',
                      assignment_category: '',
                      submission_types: [],
                      lesson_uuid: '',
                    });
                  }}
                  className={cn(
                    'flex cursor-pointer flex-row items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    selectedLessonId === lesson.uuid
                      ? 'bg-primary/10 border-primary text-primary border-2 shadow-sm'
                      : 'hover:bg-muted text-foreground border-2 border-transparent'
                  )}
                >
                  <p>{lesson.lesson_number}.</p>
                  <p className='truncate'>{lesson.title}</p>
                </li>
              ))}
          </ul>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-sm'>
            <p>No lessons available yet</p>
            <p className='mt-1'>Add lessons to start creating assignments</p>
          </div>
        )}
      </div>

      {/* Assignment creation form */}
      {!selectedLessonId ? (
        <div className='border-border bg-muted col-span-3 flex min-h-[50vh] items-center justify-center rounded-xl border-2 border-dashed'>
          <div className='text-center'>
            <p className='text-foreground text-lg font-medium'>Select a lesson</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Choose a lesson from the left to create or manage assignments
            </p>
          </div>
        </div>
      ) : (
        <div className='bg-card col-span-3 space-y-6 rounded-xl border p-6 shadow-sm'>
          <div className='flex items-center justify-between gap-4 border-b pb-4'>
            <h3 className='text-foreground max-w-[70%] truncate text-lg font-bold uppercase'>
              ASSIGNMENT: {selectedLesson?.title || 'Select a lesson'}
            </h3>

            <Button
              size='sm'
              onClick={() => {
                handleAssignmentSelect('');
                setSelectedAssignmentUuid('');
              }}
            >
              <PlusCircle size={16} /> Create Assignment
            </Button>
          </div>

          <div className='flex flex-col gap-2'>
            {/* Header */}
            <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-col'>
                <h4 className='text-foreground text-base font-semibold'>Existing Assignments</h4>
                <p className='text-muted-foreground text-xs'>
                  Select an assignment to edit or create a new one.
                </p>
              </div>
            </div>

            {/* Assignments list */}
            {assignments?.data?.content?.length ? (
              <ul className='flex flex-col gap-2'>
                {assignments.data.content
                  .filter((a: any) => a.assignment_category)
                  .map((assignment: any, idx) => (
                    <li
                      key={assignment.uuid}
                      onClick={() => {
                        setSelectedAssignmentUuid(assignment.uuid);
                        handleAssignmentSelect(assignment.uuid);
                      }}
                      className={cn(
                        'cursor-pointer truncate rounded-md border px-4 py-2 text-sm font-medium transition-all',
                        selectedAssignmentUuid === assignment.uuid
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-primary/5 hover:bg-muted border-transparent'
                      )}
                      title={assignment.title}
                    >
                      {idx + 1} - {assignment.title}
                    </li>
                  ))}
              </ul>
            ) : (
              <div className='text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm'>
                No assignments created yet
              </div>
            )}
          </div>

          {assignmentUuid === null && (
            <div className='flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center'>
              <p className='text-foreground text-sm font-medium'>No assignment selected yet</p>
              <p className='text-muted-foreground text-xs'>
                Select an existing assignment or create a new one to continue.
              </p>
            </div>
          )}

          {assignmentUuid !== null && (
            <div className='flex flex-col gap-6'>
              <Separator />
              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Assignment Title</Label>
                <Input
                  type='text'
                  placeholder='Enter assignment title'
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                  value={assignmentData.title}
                  onChange={e => handleAssignmentInputChange('title', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>
                  Description (optional)
                </Label>
                <Textarea
                  placeholder='Enter assignment description'
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                  rows={3}
                  value={assignmentData.description}
                  onChange={e => handleAssignmentInputChange('description', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>
                  Instructions (optional)
                </Label>
                <Textarea
                  placeholder='Enter assignment instructions'
                  className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                  rows={3}
                  value={assignmentData.instructions}
                  onChange={e => handleAssignmentInputChange('instructions', e.target.value)}
                />
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className='flex flex-col gap-2'>
                  <Label className='text-foreground text-sm font-medium'>Max Points</Label>
                  <Input
                    type='number'
                    className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                    value={assignmentData.max_points}
                    onChange={e =>
                      handleAssignmentInputChange('max_points', Number(e.target.value))
                    }
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <Label className='text-foreground text-sm font-medium'>Due Date (optional)</Label>
                  <Input
                    type='date'
                    disabled={true}
                    className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                    value={assignmentData.due_date}
                    onChange={e => handleAssignmentInputChange('due_date', e.target.value)}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <Label className='text-foreground text-sm font-medium'>Category (optional)</Label>
                  <Input
                    type='text'
                    className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-4 py-2.5 transition-all outline-none focus:ring-2'
                    placeholder='e.g., Homework, Project'
                    value={assignmentData.assignment_category}
                    onChange={e =>
                      handleAssignmentInputChange('assignment_category', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Assign Rubric</Label>

                <Select
                  value={assignmentData.rubric_uuid || undefined}
                  onValueChange={value => handleAssignmentInputChange('rubric_uuid', value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select rubric' />
                  </SelectTrigger>

                  <SelectContent>
                    {rubrics?.data?.content?.length ? (
                      rubrics.data.content.map((rubric: any) => (
                        <SelectItem key={rubric.uuid} value={rubric.uuid}>
                          {rubric.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className='text-muted-foreground px-3 py-2 text-center text-sm'>
                        No rubrics available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Submission Types</Label>

                <div className='border-border flex flex-wrap gap-2 rounded-lg border p-2'>
                  {SUBMISSION_TYPES.map(type => {
                    const selected = assignmentData.submission_types.includes(type);

                    return (
                      <button
                        key={type}
                        type='button'
                        onClick={() => toggleSubmissionType(type)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                {assignmentData.submission_types.length === 0 && (
                  <p className='text-muted-foreground text-xs'>
                    Select one or more submission types
                  </p>
                )}
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Status</Label>

                <Select
                  value={assignmentData.status}
                  onValueChange={value => handleAssignmentInputChange('status', value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value='DRAFT'>Draft</SelectItem>
                    <SelectItem value='PUBLISHED'>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-3'>
                <Switch
                  checked={assignmentData.active}
                  onCheckedChange={checked => handleAssignmentInputChange('active', checked)}
                />
                <Label className='text-foreground text-sm font-medium'>Active</Label>
              </div>

              <div className='flex items-end justify-end gap-4 pt-2'>
                <div className='flex justify-end self-end'>
                  {assignmentUuid && (
                    <Button size={'sm'} variant='destructive' onClick={handleDeleteAssignment}>
                      {isPending ? <Spinner /> : <Trash2 />}
                    </Button>
                  )}
                </div>
                <Button size={'sm'} onClick={handleSaveAssignment}>
                  {isPending ? (
                    'Saving...'
                  ) : (
                    <>{assignmentUuid ? 'Update Assignment' : 'Save Assignment'}</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Only show questions UI if assignmentUuid exists */}
          {assignmentUuid && (
            <div className='mt-8 hidden border-t pt-6'>
              <div className='mb-6 flex items-center justify-between'>
                <h4 className='text-foreground text-lg font-semibold'>Questions</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>+ Add Question</Button>
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
                      <th className='text-foreground w-1/4 px-4 py-3 text-left text-sm font-semibold'>
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
                    {questions.map((q: any, qIndex) => (
                      <tr key={qIndex} className='group hover:bg-muted/50 transition-colors'>
                        <td className='px-4 py-4'>
                          <div className='group relative'>
                            <textarea
                              value={q.text}
                              rows={6}
                              onChange={e => updateQuestionText(qIndex, e.target.value)}
                              placeholder='Enter question text here'
                              className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 pr-10 transition-all outline-none focus:ring-2'
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => deleteQuestion(qIndex)}
                                  className='absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'
                                >
                                  <Trash2 className='text-destructive h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete question</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                        <td className='px-4 py-4'>
                          {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') &&
                            q.options?.map((opt: any, oIndex: any) => (
                              <div key={oIndex} className='group mb-3 flex items-center gap-3'>
                                <input
                                  type='radio'
                                  checked={opt.isCorrect}
                                  onChange={() => setCorrectOption(qIndex, oIndex)}
                                  className='h-4 w-4'
                                />
                                <input
                                  value={opt.text}
                                  onChange={e => updateOptionText(qIndex, oIndex, e.target.value)}
                                  className='border-input bg-background focus:border-primary focus:ring-primary/20 flex-1 rounded-lg border px-3 py-2 transition-all outline-none focus:ring-2'
                                  placeholder='Enter option text'
                                />
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => deleteOption(qIndex, oIndex)}
                                  className='opacity-0 transition-opacity group-hover:opacity-100'
                                >
                                  <X className='text-destructive h-4 w-4' />
                                </Button>
                              </div>
                            ))}

                          {q.type === 'ESSAY' && (
                            <textarea
                              className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 transition-all outline-none focus:ring-2'
                              placeholder='Expected answer or grading criteria'
                              rows={4}
                            />
                          )}

                          {q.type === 'SHORT_ANSWER' && (
                            <input
                              className='border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-lg border px-3 py-2 transition-all outline-none focus:ring-2'
                              placeholder='Expected answer'
                            />
                          )}

                          {q.type === 'MATCHING' &&
                            q.pairs?.map((pair: any, pIndex: any) => (
                              <div key={pIndex} className='mb-3 grid grid-cols-2 gap-3'>
                                <input
                                  className='border-input bg-background focus:border-primary focus:ring-primary/20 rounded-lg border px-3 py-2 transition-all outline-none focus:ring-2'
                                  value={pair.left}
                                  placeholder='Left side'
                                />
                                <input
                                  className='border-input bg-background focus:border-primary focus:ring-primary/20 rounded-lg border px-3 py-2 transition-all outline-none focus:ring-2'
                                  value={pair.right}
                                  placeholder='Right side'
                                />
                              </div>
                            ))}
                        </td>

                        <td className='px-4 py-4'>
                          <input
                            type='number'
                            min={0}
                            value={q.points ?? 1}
                            onChange={e => updateQuestionPoint(qIndex, Number(e.target.value))}
                            className='border-input bg-background focus:border-primary focus:ring-primary/20 w-16 rounded-lg border px-2 py-1.5 text-sm transition-all outline-none focus:ring-2'
                          />
                        </td>
                      </tr>
                    ))}
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
