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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
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

  const [selectedAssignmentUuid, setSelectedAssignmentUuid] = useState<string | null>(assignmentId ?? null);
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

    const selectedAssignment = assignments?.data?.content?.find((a: any) => a.uuid === selectedUuid);

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
        const createdAssignmentUuid = await createAssignmentForLesson(selectedLessonId, assignmentData);
        onSelectAssignment?.(createdAssignmentUuid);
        toast.success('Assignment created successfully!.');
      }
    } catch (err) {
      toast.error(`Failed to ${assignmentId ? 'update' : 'create'} assignment.`);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentUuid) return;

    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
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
      <div className='rounded-xl border bg-card p-4 shadow-sm'>
        <h3 className='mb-4 text-lg font-semibold text-foreground'>Lessons</h3>
        <ul className='space-y-2 gap-2 flex flex-col'>
          {lessons?.content
            ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
            .map((lesson: any) => (
              <li
                key={lesson.uuid}
                onClick={() => {
                  setSelectedLessonId(lesson.uuid);
                  setSelectedLesson(lesson);
                  // Clear the selected assignment when changing lessons
                  setSelectedAssignmentUuid(null);
                  // Reset assignment form data
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
                  onSelectAssignment?.(null);

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
            ))}
        </ul>
      </div>

      {/* Assignment creation form */}
      {!selectedLessonId ? (
        <div className='col-span-3 flex min-h-[50vh] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted'>
          <div className='text-center'>
            <p className='text-lg font-medium text-foreground'>Select a lesson</p>
            <p className='text-sm text-muted-foreground mt-1'>Choose a lesson from the left to create or manage assignments</p>
          </div>
        </div>
      ) : (
        <div className='col-span-3 space-y-6 rounded-xl border bg-card p-6 shadow-sm'>
          <div className='border-b pb-4'>
            <h3 className='text-lg font-bold text-foreground uppercase'>
              ASSIGNMENT: {selectedLesson?.title || 'Select a lesson'}
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            <div className='flex flex-row items-center justify-between' >
              <label className="text-sm font-medium text-foreground">
                Select Existing Assignment
              </label>

              {/* Create button */}
              <Button
                size="sm"
                className="self-end"
                onClick={() => handleAssignmentSelect(null)}
              >
                <PlusCircle size={16} /> Create Assignment
              </Button>
            </div>

            {/* Assignments dropdown */}
            <Select
              value={selectedAssignmentUuid ?? undefined}
              onValueChange={value => {
                setSelectedAssignmentUuid(value);
                handleAssignmentSelect(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an assignment" />
              </SelectTrigger>

              <SelectContent>
                <p>Select assignment</p>
                {assignments?.data?.content?.length ? (
                  assignments.data.content
                    .filter((a: any) => a.assignment_category)
                    .map((assignment: any) => (
                      <SelectItem key={assignment.uuid} value={assignment.uuid}>
                        {assignment.title}
                      </SelectItem>
                    ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No assignments created yet
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {assignments?.data?.content?.length === 0 ? (
            <div className="min-h-[300px] flex flex-col items-center gap-6 justify-center px-3 py-2 text-sm text-muted-foreground text-center">
              <p>
                No assignments created yet
              </p>
              <Button
                size="sm"
                variant={"secondary"}
                onClick={() => handleAssignmentSelect(null)}
              >
                <PlusCircle size={16} /> Create Assignment
              </Button>
            </div>
          ) : (
            <div className='flex flex-col gap-6'>
              <p>
                {selectedAssignmentUuid ?? "Nothing to show"}
              </p>
              <Separator />
              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Assignment Title</Label>
                <Input
                  type='text'
                  placeholder='Enter assignment title'
                  className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                  value={assignmentData.title}
                  onChange={e => handleAssignmentInputChange('title', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Description (optional)</Label>
                <Textarea
                  placeholder='Enter assignment description'
                  className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none'
                  rows={3}
                  value={assignmentData.description}
                  onChange={e => handleAssignmentInputChange('description', e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-2'>
                <Label className='text-sm font-medium text-foreground'>Instructions (optional)</Label>
                <Textarea
                  placeholder='Enter assignment instructions'
                  className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none'
                  rows={3}
                  value={assignmentData.instructions}
                  onChange={e => handleAssignmentInputChange('instructions', e.target.value)}
                />
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className='flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground'>Max Points</Label>
                  <Input
                    type='number'
                    className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    value={assignmentData.max_points}
                    onChange={e => handleAssignmentInputChange('max_points', Number(e.target.value))}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground'>Due Date (optional)</Label>
                  <Input
                    type='date'
                    disabled={true}
                    className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    value={assignmentData.due_date}
                    onChange={e => handleAssignmentInputChange('due_date', e.target.value)}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <Label className='text-sm font-medium text-foreground'>Category (optional)</Label>
                  <Input
                    type='text'
                    className='w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                    placeholder='e.g., Homework, Project'
                    value={assignmentData.assignment_category}
                    onChange={e => handleAssignmentInputChange('assignment_category', e.target.value)}
                  />
                </div>
              </div>


              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Assign Rubric
                </Label>

                <Select
                  value={assignmentData.rubric_uuid || undefined}
                  onValueChange={value =>
                    handleAssignmentInputChange('rubric_uuid', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rubric" />
                  </SelectTrigger>

                  <SelectContent>
                    {rubrics?.data?.content?.length ? (
                      rubrics.data.content.map((rubric: any) => (
                        <SelectItem key={rubric.uuid} value={rubric.uuid}>
                          {rubric.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        No rubrics available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Submission Types
                </Label>

                <div className="flex flex-wrap gap-2 border rounded-lg border-border p-2">
                  {SUBMISSION_TYPES.map(type => {
                    const selected = assignmentData.submission_types.includes(type);

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSubmissionType(type)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
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
                  <p className="text-xs text-muted-foreground">
                    Select one or more submission types
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">Status</Label>

                <Select
                  value={assignmentData.status}
                  onValueChange={value => handleAssignmentInputChange('status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={assignmentData.active}
                  onCheckedChange={checked => handleAssignmentInputChange('active', checked)}
                />
                <Label className="text-sm font-medium text-foreground">Active</Label>
              </div>

              <div className='flex gap-4 items-end justify-end pt-2'>
                <div className='flex justify-end self-end'>
                  {assignmentUuid && (
                    <Button variant='destructive' onClick={handleDeleteAssignment}>
                      Delete Assignment
                    </Button>
                  )}
                </div>
                <Button onClick={handleSaveAssignment}>
                  {assignmentUuid ? 'Update Assignment' : 'Save Assignment'}
                </Button>
              </div>
            </div>


          )}




          {/* Only show questions UI if assignmentUuid exists */}
          {assignmentUuid && (
            <div className='hidden mt-8 pt-6 border-t'>
              <div className='mb-6 flex justify-between items-center'>
                <h4 className='text-lg font-semibold text-foreground'>Questions</h4>
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
                      <th className='w-1/4 px-4 py-3 text-left text-sm font-semibold text-foreground'>Question</th>
                      <th className='px-4 py-3 text-left text-sm font-semibold text-foreground'>Answer/Options</th>
                      <th className='w-24 px-4 py-3 text-left text-sm font-semibold text-foreground'>Points</th>
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
                              className='w-full resize-none rounded-lg border border-input bg-background px-3 py-2 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => deleteQuestion(qIndex)}
                                  className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
                                >
                                  <Trash2 className='h-4 w-4 text-destructive' />
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
                                  className='w-4 h-4'
                                />
                                <input
                                  value={opt.text}
                                  onChange={e => updateOptionText(qIndex, oIndex, e.target.value)}
                                  className='flex-1 rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                                  placeholder='Enter option text'
                                />
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => deleteOption(qIndex, oIndex)}
                                  className='opacity-0 group-hover:opacity-100 transition-opacity'
                                >
                                  <X className='h-4 w-4 text-destructive' />
                                </Button>
                              </div>
                            ))}

                          {q.type === 'ESSAY' && (
                            <textarea
                              className='w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none'
                              placeholder='Expected answer or grading criteria'
                              rows={4}
                            />
                          )}

                          {q.type === 'SHORT_ANSWER' && (
                            <input
                              className='w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                              placeholder='Expected answer'
                            />
                          )}

                          {q.type === 'MATCHING' &&
                            q.pairs?.map((pair: any, pIndex: any) => (
                              <div key={pIndex} className='mb-3 grid grid-cols-2 gap-3'>
                                <input
                                  className='rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
                                  value={pair.left}
                                  placeholder='Left side'
                                />
                                <input
                                  className='rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
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
                            className='w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all'
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