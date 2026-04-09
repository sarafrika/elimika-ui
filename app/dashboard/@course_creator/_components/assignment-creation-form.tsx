'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Image,
  PlusCircle,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SimpleEditor } from '../../../../components/tiptap-templates/simple/simple-editor';
import { Button } from '../../../../components/ui/button';
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
import { useCourseCreator } from '../../../../context/course-creator-context';
import { cn } from '../../../../lib/utils';
import {
  deleteAssignmentAttachmentMutation,
  getAssignmentAttachmentsOptions,
  getAssignmentAttachmentsQueryKey,
  searchAssessmentRubricsOptions,
  searchAssignmentsOptions,
  uploadAssignmentAttachmentMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  AssessmentRubric,
  Assignment,
  AssignmentAttachment,
  Lesson,
  PagedDtoLesson,
  ResponseDtoVoid,
  SubmissionTypesEnum,
} from '../../../../services/client/types.gen';

export type AssignmentCreationFormProps = {
  courseId: string;
  lessons: PagedDtoLesson | undefined;
  assignmentId?: string | null;
  selectedLessonId: string;
  selectedLesson: Lesson | null;
  setSelectedLessonId: (id: string) => void;
  setSelectedLesson: (lesson: Lesson) => void;
  onSelectAssignment?: (assignmentUuid: string | null) => void;

  // API callbacks
  createAssignmentForLesson: (lessonId: string, payload: AssignmentFormState) => Promise<string>;
  updateAssignmentForLesson: (
    assignmentUuid: string,
    payload: AssignmentFormState
  ) => Promise<void>;
  deleteAssignmentForLesson: (assignmentUuid: string) => Promise<void>;

  isPending: boolean;
};

const SUBMISSION_TYPES = ['DOCUMENT', 'AUDIO', 'TEXT'];

const EMPTY_ASSIGNMENT = {
  title: '',
  description: '',
  instructions: '',
  max_points: 0,
  rubric_uuid: '',
  is_published: false,
  active: false,
  due_date: '',
  assignment_category: '',
  submission_types: [] as string[],
  lesson_uuid: '',
};

type AssignmentFormState = typeof EMPTY_ASSIGNMENT;

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as ResponseDtoVoid | undefined)?.message ||
  (error instanceof Error ? error.message : fallback);

const toSubmissionTypes = (
  value: SubmissionTypesEnum | SubmissionTypesEnum[] | undefined
): string[] => (Array.isArray(value) ? value : value ? [value] : []);

export const AssignmentCreationForm = ({
  courseId,
  lessons,
  assignmentId,
  selectedLessonId,
  selectedLesson,
  setSelectedLessonId,
  setSelectedLesson,
  onSelectAssignment,
  createAssignmentForLesson,
  updateAssignmentForLesson,
  deleteAssignmentForLesson,
  isPending,
}: AssignmentCreationFormProps) => {
  const qc = useQueryClient();
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
  const rubrics: AssessmentRubric[] = searchRubs?.data?.content ?? [];

  // ── Assignment state (must come before any derived values) ────────────────
  const [assignmentData, setAssignmentData] = useState<AssignmentFormState>({
    ...EMPTY_ASSIGNMENT,
  });

  // Now safe to derive selectedRubric from assignmentData
  const selectedRubric = rubrics.find(r => r.uuid === assignmentData.rubric_uuid);

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

  const { data: attachments } = useQuery({
    ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: assignmentUuid as string } }),
    enabled: !!assignmentUuid,
  });

  // ── File upload state ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadAssignmentMut = useMutation(uploadAssignmentAttachmentMutation());
  const deleteAttachmentMut = useMutation(deleteAssignmentAttachmentMutation());
  const isCreatingNewAssignment = !assignmentUuid;
  const isSavingWithAttachment = isCreatingNewAssignment && !!mediaFile;
  const isSavingAssignment =
    isPending || uploadAssignmentMut.isPending || deleteAttachmentMut.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAssignmentInputChange = <K extends keyof AssignmentFormState>(
    field: K,
    value: AssignmentFormState[K]
  ) => {
    setAssignmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssignmentSelect = (selectedUuid: string | null) => {
    if (onSelectAssignment) onSelectAssignment(selectedUuid);

    const selectedAssignment = assignments?.data?.content?.find(
      (a: Assignment) => a.uuid === selectedUuid
    );

    if (selectedAssignment) {
      setAssignmentData({
        title: selectedAssignment.title || '',
        description: selectedAssignment.description || '',
        instructions: selectedAssignment.instructions || '',
        max_points: selectedAssignment.max_points || 0,
        rubric_uuid: selectedAssignment.rubric_uuid || '',
        is_published: selectedAssignment.is_published ?? false,
        active: false,
        due_date:
          selectedAssignment.due_date instanceof Date
            ? selectedAssignment.due_date.toISOString()
            : '',
        assignment_category: selectedAssignment.assignment_category || '',
        submission_types: toSubmissionTypes(selectedAssignment.submission_types),
        lesson_uuid: selectedLessonId as string,
      });
    } else {
      setAssignmentData({ ...EMPTY_ASSIGNMENT });
    }
  };

  const uploadAttachmentForAssignment = (targetAssignmentUuid: string, file: File) =>
    new Promise<void>((resolve, reject) => {
      uploadAssignmentMut.mutate(
        { body: { file }, path: { assignmentUuid: targetAssignmentUuid } },
        {
          onSuccess: () => {
            qc.invalidateQueries({
              queryKey: getAssignmentAttachmentsQueryKey({
                path: { assignmentUuid: targetAssignmentUuid },
              }),
            });
            resolve();
          },
          onError: (err: unknown) => reject(err),
        }
      );
    });

  const resetSelectedMediaFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        setSelectedAssignmentUuid(createdAssignmentUuid);
        onSelectAssignment?.(createdAssignmentUuid);

        if (mediaFile) {
          await uploadAttachmentForAssignment(createdAssignmentUuid, mediaFile);
          resetSelectedMediaFile();
          toast.success('Assignment created and attachment uploaded successfully!');
        } else {
          toast.success('Assignment created successfully!');
        }
      }
    } catch (err) {
      toast.error(
        assignmentUuid
          ? 'Failed to update assignment.'
          : mediaFile
            ? 'Failed to save assignment and upload attachment.'
            : 'Failed to create assignment.'
      );
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentUuid) return;
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.'))
      return;

    try {
      await deleteAssignmentForLesson(assignmentUuid);
      setSelectedAssignmentUuid(null);
      onSelectAssignment?.(null);
      setAssignmentData({ ...EMPTY_ASSIGNMENT });
      toast.success('Assignment deleted successfully');
    } catch (err) {
      toast.error('Failed to delete assignment.');
    }
  };

  const toggleSubmissionType = (type: string) => {
    setAssignmentData(prev => ({
      ...prev,
      submission_types: prev.submission_types.includes(type)
        ? prev.submission_types.filter(t => t !== type)
        : [...prev.submission_types, type],
    }));
  };

  const handleAttachmentUpload = () => {
    if (!mediaFile || !assignmentUuid) {
      toast.error('Please select a file and ensure assignment is created');
      return;
    }

    uploadAssignmentMut.mutate(
      { body: { file: mediaFile }, path: { assignmentUuid } },
      {
        onSuccess: () => {
          toast.success('Attachment uploaded successfully');
          resetSelectedMediaFile();
          qc.invalidateQueries({
            queryKey: getAssignmentAttachmentsQueryKey({ path: { assignmentUuid } }),
          });
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err, 'Attachment upload failed'));
        },
      }
    );
  };

  const handleDeleteAttachment = (attachmentUuid: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    deleteAttachmentMut.mutate(
      { path: { assignmentUuid: assignmentUuid as string, attachmentUuid } },
      {
        onSuccess: () => {
          toast.success('Deleted successfully');
          qc.invalidateQueries({
            queryKey: getAssignmentAttachmentsQueryKey({
              path: { assignmentUuid: assignmentUuid as string },
            }),
          });
        },
        onError: error => {
          toast.error(getErrorMessage(error, 'Failed to delete attachment'));
        },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className='grid grid-cols-4 gap-6'>
      {/* Lessons sidebar */}
      <div className='shadow-sm'>
        <h3 className='text-foreground mb-4 text-lg font-semibold'>Lessons</h3>

        {lessons?.content?.length ? (
          <ul className='flex flex-col gap-2 space-y-2'>
            {lessons.content
              .sort((a: Lesson, b: Lesson) => a.lesson_number - b.lesson_number)
              .map((lesson: Lesson) => (
                <li
                  key={lesson.uuid}
                  onClick={() => {
                    if (!lesson.uuid) return;
                    setSelectedLessonId(lesson.uuid);
                    setSelectedLesson(lesson);
                    handleAssignmentSelect(null);
                    setSelectedAssignmentUuid(null);
                    setAssignmentData({ ...EMPTY_ASSIGNMENT });
                  }}
                  className={cn(
                    'flex cursor-pointer flex-col items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    selectedLessonId === lesson.uuid
                      ? 'bg-primary/10 border-primary text-primary border-2 shadow-sm'
                      : 'hover:bg-muted text-foreground border-2 border-transparent'
                  )}
                >
                  <p className='text-xs'>LESSON {lesson.lesson_number}.</p>
                  <p className='line-clamp-2'>{lesson.title}</p>
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

      {/* Assignment form */}
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

          {/* Existing assignments list */}
          <div className='flex flex-col gap-2'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-col'>
                <h4 className='text-foreground text-base font-semibold'>Existing Assignments</h4>
                <p className='text-muted-foreground text-xs'>
                  Select an assignment to edit or create a new one.
                </p>
              </div>
            </div>

            {assignments?.data?.content?.length ? (
              <ul className='flex flex-col gap-2'>
                {assignments.data.content
                  .filter((a: Assignment) => Boolean(a.assignment_category && a.uuid))
                  .map((assignment: Assignment, idx: number) => (
                    <li
                      key={assignment.uuid}
                      onClick={() => {
                        if (!assignment.uuid) return;
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

              {/* Title */}
              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Assignment Title</Label>
                <Input
                  type='text'
                  placeholder='Enter assignment title'
                  value={assignmentData.title}
                  onChange={e => handleAssignmentInputChange('title', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>
                  Description (optional)
                </Label>
                <SimpleEditor
                  value={assignmentData.description}
                  onChange={value => handleAssignmentInputChange('description', value)}
                />
              </div>

              {/* Instructions */}
              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>
                  Instructions (optional)
                </Label>
                <SimpleEditor
                  value={assignmentData.instructions}
                  onChange={value => handleAssignmentInputChange('instructions', value)}
                />
              </div>

              {/* Max points + Category */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-2'>
                  <Label className='text-foreground text-sm font-medium'>Max Points</Label>
                  <Input
                    type='number'
                    value={assignmentData.max_points}
                    onChange={e =>
                      handleAssignmentInputChange('max_points', Number(e.target.value))
                    }
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <Label className='text-foreground text-sm font-medium'>Category (optional)</Label>
                  <Input
                    type='text'
                    placeholder='e.g., Homework, Project'
                    value={assignmentData.assignment_category}
                    onChange={e =>
                      handleAssignmentInputChange('assignment_category', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* ── Rubric ─────────────────────────────────────────────────── */}
              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium'>Evaluation Criteria</Label>
                <p className='text-muted-foreground text-xs'>
                  Associate a grading rubric with this assignment
                </p>

                {isLoadingRubrics ? (
                  <div className='flex items-center gap-2 py-2'>
                    <Spinner className='h-4 w-4' />
                    <span className='text-muted-foreground text-xs'>
                      Loading evalutaion rubrics...
                    </span>
                  </div>
                ) : (
                  <>
                    <Select
                      value={assignmentData.rubric_uuid || '__none__'}
                      onValueChange={v =>
                        handleAssignmentInputChange('rubric_uuid', v === '__none__' ? '' : v)
                      }
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select a rubric (optional)' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none__'>
                          <span className='text-muted-foreground'>None</span>
                        </SelectItem>
                        {rubrics.map(r => (
                          <SelectItem key={r.uuid} value={r.uuid ?? ''}>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{r.title}</span>
                              {r.description && (
                                <span className='text-muted-foreground line-clamp-1 text-xs'>
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
                          onClick={() => handleAssignmentInputChange('rubric_uuid', '')}
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
                            <p className='text-warning-foreground font-medium'>
                              No rubric selected
                            </p>
                            <p className='text-warning-foreground/80 text-xs'>
                              If none of the available rubrics fit, you can create a new one.
                            </p>
                          </div>
                        </div>
                        <Link href='/dashboard/rubrics' target='_blank'>
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

              {/* Submission types */}
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

              {/* Status */}
              <div className='flex flex-col gap-2'>
                <Label className='text-foreground text-sm font-medium'>Status</Label>
                <Select
                  value={assignmentData.is_published ? 'PUBLISHED' : 'DRAFT'}
                  onValueChange={value =>
                    handleAssignmentInputChange('is_published', value === 'PUBLISHED')
                  }
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

              {/* Active toggle */}
              {/* <div className='flex items-center gap-3'>
                <Switch
                  checked={assignmentData.active}
                  onCheckedChange={checked => handleAssignmentInputChange('active', checked)}
                />
                <Label className='text-foreground text-sm font-medium'>Active</Label>
              </div> */}

              <Separator />

              {/* Attachments */}
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1'>
                  <h4 className='text-foreground text-base font-semibold'>
                    Assignment Attachments
                  </h4>
                  <p className='text-muted-foreground text-xs'>
                    Upload documents, images, audio, or video files for this assignment
                  </p>
                </div>

                <div className='space-y-3'>
                  {attachments?.data?.map((file: AssignmentAttachment) => (
                    <div
                      key={file.uuid}
                      className='border-border hover:border-primary flex items-start justify-between rounded-lg border bg-white p-4 transition'
                    >
                      <div className='flex items-start gap-3'>
                        <span className='flex h-8 w-8 items-center justify-center text-xl'>
                          {getFileIcon(file.mime_type ?? '')}
                        </span>
                        <div>
                          <p className='text-foreground font-medium'>{file.original_filename}</p>
                          <p className='text-muted-foreground max-w-xs truncate text-xs'>
                            {file.file_url}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {formatFileSize(Number(file.file_size_bytes))} •{' '}
                            {file.created_date
                              ? new Date(file.created_date).toLocaleDateString()
                              : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => file.uuid && handleDeleteAttachment(file.uuid)}
                        className='border-destructive/20 text-destructive hover:bg-destructive/5 inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium'
                      >
                        <Trash2 className='h-4 w-4' />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div
                  className={cn(
                    'space-y-4 rounded-lg border-2 border-dashed p-6 transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                  )}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setMediaFile(file);
                  }}
                >
                  <Input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*,application/pdf,video/*,audio/*,.doc,.docx,.txt'
                    className='hidden'
                    onChange={e => setMediaFile(e.target.files?.[0] || null)}
                  />

                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                    className='bg-muted/40 hover:bg-muted flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border px-6 py-8 text-center transition-colors'
                  >
                    <p className='text-foreground text-sm font-medium'>
                      Drag & drop a file here, or click to browse
                    </p>
                    {mediaFile ? (
                      <p className='text-primary max-w-full truncate text-[13px]'>
                        {mediaFile.name}
                      </p>
                    ) : (
                      <p className='text-muted-foreground text-[13px]'>
                        Documents, Images, Audio, or Video files
                      </p>
                    )}
                  </div>

                  <div className='flex justify-center'>
                    <Button
                      type='button'
                      variant='secondary'
                      disabled={
                        !mediaFile ||
                        uploadAssignmentMut.isPending ||
                        isCreatingNewAssignment
                      }
                      onClick={handleAttachmentUpload}
                      className='bg-primary w-full max-w-fit text-white'
                    >
                      {uploadAssignmentMut.isPending ? (
                        <>
                          <Spinner className='mr-2 h-4 w-4' />
                          Uploading...
                        </>
                      ) : (
                        'Upload Assignment Attachment'
                      )}
                    </Button>
                  </div>

                  {isCreatingNewAssignment && mediaFile ? (
                    <p className='text-muted-foreground text-center text-xs'>
                      Save the assignment first to upload this file automatically.
                    </p>
                  ) : null}

                  <p className='text-muted-foreground text-xs'>
                    Supported formats: PDF, Images (JPG, PNG), Audio (MP3, WAV), Video (MP4),
                    Documents
                  </p>
                </div>
              </div>

              {/* Save / delete */}
              <div className='flex items-end justify-end gap-4 pt-2'>
                {assignmentUuid && (
                <Button size='sm' variant='destructive' onClick={handleDeleteAssignment}>
                  {isPending ? <Spinner /> : <Trash2 />}
                </Button>
              )}
                <Button size='sm' onClick={handleSaveAssignment} disabled={isSavingAssignment}>
                  {isSavingAssignment ? (
                    <>
                      <Spinner className='mr-2 h-4 w-4' />
                      {isSavingWithAttachment ? 'Saving and uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {assignmentUuid
                        ? 'Update Assignment'
                        : isSavingWithAttachment
                          ? 'Save Assignment and Upload Attachment'
                          : 'Save Assignment'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getFileIcon(mime: string) {
  if (mime?.includes('pdf')) return <FileSpreadsheet className='h-5 w-5' />;
  if (mime?.includes('image')) return <Image className='h-5 w-5' />;
  if (mime?.includes('word')) return <FileText className='h-5 w-5' />;
  if (mime?.includes('video')) return <Video className='h-5 w-5' />;
  return <FileText className='h-5 w-5' />;
}
