'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, Image, PlusCircle, Trash2, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Switch } from '../../../../components/ui/switch';
import { Textarea } from '../../../../components/ui/textarea';
import { cn } from '../../../../lib/utils';
import {
  deleteAssignmentAttachmentMutation,
  getAllAssessmentRubricsOptions,
  getAssignmentAttachmentsOptions,
  getAssignmentAttachmentsQueryKey,
  searchAssignmentsOptions,
  uploadAssignmentAttachmentMutation,
} from '../../../../services/client/@tanstack/react-query.gen';

export type AssignmentCreationFormProps = {
  lessons: any;
  assignmentId?: string | null;
  selectedLessonId: string;
  selectedLesson: any;
  setSelectedLessonId: (id: string) => void;
  setSelectedLesson: (lesson: any) => void;
  onSelectAssignment?: (assignmentUuid: string | null) => void;

  // API callbacks
  createAssignmentForLesson: (lessonId: string, payload: any) => Promise<string>;
  updateAssignmentForLesson: (assignmentUuid: string, payload: any) => Promise<void>;
  deleteAssignmentForLesson: (assignmentUuid: string) => Promise<void>;

  isPending: boolean;
};

const SUBMISSION_TYPES = ['PDF', 'AUDIO', 'TEXT'];

export const AssignmentCreationForm = ({
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

  const { data: rubrics } = useQuery(
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
    submission_types: [] as string[],
    lesson_uuid: '',
  });

  const { data: attachments } = useQuery({
    ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: assignmentUuid as string } }),
    enabled: !!assignmentUuid
  })
  console.log(attachments?.data, "atts")

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadAssignmentMut = useMutation(uploadAssignmentAttachmentMutation());

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
        submission_types: [],
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
        setSelectedAssignmentUuid(createdAssignmentUuid);
        onSelectAssignment?.(createdAssignmentUuid);
        toast.success('Assignment created successfully!');
      }
    } catch (err) {
      toast.error(`Failed to ${assignmentUuid ? 'update' : 'create'} assignment.`);
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
      setSelectedAssignmentUuid(null);
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

  const handleAttachmentUpload = () => {
    if (!mediaFile || !assignmentUuid) {
      toast.error('Please select a file and ensure assignment is created');
      return;
    }

    uploadAssignmentMut.mutate(
      {
        body: { file: mediaFile },
        path: { assignmentUuid },
      },
      {
        onSuccess: () => {
          toast.success('Attachment uploaded successfully');
          setMediaFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          qc.invalidateQueries({
            queryKey: getAssignmentAttachmentsQueryKey({
              path: { assignmentUuid },
            }),
          });
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Attachment upload failed');
        },
      }
    );
  };

  const deleteAttachmentMut = useMutation(deleteAssignmentAttachmentMutation())
  const handleDeleteAttachment = async (attachmentUuid: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      deleteAttachmentMut.mutate({ path: { assignmentUuid: assignmentUuid as string, attachmentUuid: attachmentUuid } }, {
        onSuccess: () => {
          toast.success("Deleted successfully")
          qc.invalidateQueries({
            queryKey: getAssignmentAttachmentsQueryKey({
              path: { assignmentUuid: assignmentUuid as string },
            }),
          });
        },
        onError: (error) => {
          toast.error(error?.message)
        }
      })
    } catch (error) {
    }
  }


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

              <div className='grid grid-cols-2 gap-4'>
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

              <Separator />

              {/* Assignment Attachments Section */}
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1'>
                  <h4 className='text-foreground text-base font-semibold'>
                    Assignment Attachments
                  </h4>
                  <p className='text-muted-foreground text-xs'>
                    Upload documents, images, audio, or video files for this assignment
                  </p>
                </div>

                <div className="space-y-3">
                  {attachments?.data?.map(file => (
                    <div
                      key={file.uuid}
                      className="flex items-start justify-between rounded-lg border border-border bg-white p-4 hover:border-primary transition"
                    >
                      {/* Left: File info */}
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getFileIcon(file.mime_type)}
                        </span>

                        <div>
                          <p className="font-medium text-muted-foreground">
                            {file.original_filename}
                          </p>

                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {file.file_url}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(Number(file.file_size_bytes))} •{' '}
                            {new Date(file.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        {/* View */}
                        {/* <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-primary/20 px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a> */}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteAttachment(file.uuid)}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/20 px-2.5 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
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
                    if (file) {
                      setMediaFile(file);
                    }
                  }}
                >
                  {/* Hidden file input */}
                  <Input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*,application/pdf,video/*,audio/*,.doc,.docx,.txt'
                    className='hidden'
                    onChange={e => setMediaFile(e.target.files?.[0] || null)}
                  />

                  {/* Clickable drop area */}
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

                  <Button
                    type='button'
                    variant='secondary'
                    disabled={!mediaFile || uploadAssignmentMut.isPending}
                    onClick={handleAttachmentUpload}
                    className='w-full'
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

                  <p className='text-muted-foreground text-xs'>
                    Supported formats: PDF, Images (JPG, PNG), Audio (MP3, WAV), Video (MP4), Documents
                  </p>
                </div>
              </div>

              <div className='flex items-end justify-end gap-4 pt-2'>
                <div className='flex justify-end self-end'>
                  {assignmentUuid && (
                    <Button size={'sm'} variant='destructive' onClick={handleDeleteAssignment}>
                      {isPending ? <Spinner /> : <Trash2 />}
                    </Button>
                  )}
                </div>
                <Button size={'sm'} onClick={handleSaveAssignment} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Spinner className='mr-2 h-4 w-4' />
                      Saving...
                    </>
                  ) : (
                    <>{assignmentUuid ? 'Update Assignment' : 'Save Assignment'}</>
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

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function getFileIcon(mime: string) {
  if (mime.includes('pdf')) return <FileSpreadsheet />
  if (mime.includes('image')) return <Image />
  if (mime.includes('word')) return <FileText />
  if (mime.includes('video')) return <Video />
  return '📎'
}