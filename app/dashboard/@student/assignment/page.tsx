'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  getAssignmentAttachmentsOptions,
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  submitAssignmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  File,
  FileText,
  Paperclip,
  Save,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useStudent } from '../../../../context/student-context';
import useStudentClassDefinitions from '../../../../hooks/use-student-class-definition';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-4 py-6 max-w-7xl',
  },
};

/** Returns an icon and colour class based on file extension */
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-red-500' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: 'text-blue-500' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return { icon: File, color: 'text-green-500' };
    default:
      return { icon: File, color: 'text-muted-foreground' };
  }
}

function AssignmentsPage() {
  const student = useStudent();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'points' | 'title'>('dueDate');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [enrollmentUuid] = useState('mock-enrollment-uuid');

  /** Which schedule card currently has its details panel open (by schedule uuid) */
  const [expandedScheduleUuid, setExpandedScheduleUuid] = useState<string | null>(null);

  // 1️⃣ Get student classes
  const { classDefinitions, loading } = useStudentClassDefinitions(student);
  const classes = classDefinitions || [];

  // 2️⃣ Extract class IDs
  const classIds = classes
    .map((c: any) => c.classDetails?.class_definition?.uuid)
    .filter(Boolean);

  // 3️⃣ Fetch assignment schedules for all classes
  const assignmentScheduleQueries = useQueries({
    queries: classIds.map((classId: string) => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid: classId } }),
      enabled: !!classId,
    })),
  });

  const isSchedulesLoading = assignmentScheduleQueries.some(q => q.isLoading);

  // 4️⃣ Combine all schedules
  const assignmentSchedules = assignmentScheduleQueries.flatMap(
    query => query.data?.data || []
  );

  // 5️⃣ Extract unique assignment UUIDs
  const assignmentUuids = [
    ...new Set(
      assignmentSchedules.map((s: any) => s.assignment_uuid).filter(Boolean)
    ),
  ] as string[];

  // 6️⃣ Fetch assignment details + attachments for each UUID
  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map((uuid: string) => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map((uuid: string) => ({
      ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
    })),
  });

  const isDetailsLoading = assignmentDetailQueries.some(q => q.isLoading);

  // 7️⃣ Build lookup maps
  const assignmentDetailsMap = useMemo(() => {
    const map: Record<string, any> = {};
    assignmentDetailQueries.forEach(query => {
      const data = query.data?.data;
      if (data?.uuid) map[data.uuid] = data;
    });
    return map;
  }, [assignmentDetailQueries]);

  const assignmentAttachmentsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignmentAttachmentQueries.forEach((query, index) => {
      const uuid = assignmentUuids[index];
      if (uuid) map[uuid] = query.data?.data ?? [];
    });
    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  // 8️⃣ Merge schedule + details + attachments — single source of truth
  const mergedAssignments: any[] = useMemo(() => {
    return assignmentSchedules
      .map((schedule: any) => ({
        ...schedule,
        assignment: assignmentDetailsMap[schedule.assignment_uuid] ?? null,
        attachments: assignmentAttachmentsMap[schedule.assignment_uuid] ?? [],
      }))
      .filter(item => !!item.assignment);
  }, [assignmentSchedules, assignmentDetailsMap, assignmentAttachmentsMap]);

  const isLoading = loading || isSchedulesLoading || isDetailsLoading;

  // Submit mutation
  const submitAssignmentMut = useMutation({
    ...submitAssignmentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsSubmissionDialogOpen(false);
      setSubmissionText('');
      setUploadedFiles([]);
    },
  });

  // Helpers
  const getDaysUntilDue = (dueAt: string) => {
    const diffTime = new Date(dueAt).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyStatus = (dueAt: string) => {
    const days = getDaysUntilDue(dueAt);
    if (days < 0) return { label: 'Overdue', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (days === 0) return { label: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (days <= 3) return { label: 'Due Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: `${days} days left`, color: 'text-muted-foreground', bgColor: 'bg-muted' };
  };

  const getSubmissionStatus = (scheduleItem: any) => {
    // TODO: replace with real submission lookup
    const random = Math.random();
    if (random > 0.7) {
      return {
        status: 'graded',
        score: 85,
        maxScore: scheduleItem.assignment?.max_points ?? 100,
        submittedAt: '2024-04-10T14:30:00',
      };
    } else if (random > 0.4) {
      return { status: 'submitted', submittedAt: '2024-04-10T14:30:00' };
    }
    return { status: 'pending' };
  };

  // Filter + sort
  const processedAssignments = useMemo(() => {
    let filtered = mergedAssignments.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.assignment?.title?.toLowerCase().includes(q) ||
        item.assignment?.description?.toLowerCase().includes(q)
      );
    });

    if (activeTab !== 'all') {
      filtered = filtered.filter(item => getSubmissionStatus(item).status === activeTab);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      if (sortBy === 'points') return (b.assignment?.max_points ?? 0) - (a.assignment?.max_points ?? 0);
      return (a.assignment?.title ?? '').localeCompare(b.assignment?.title ?? '');
    });

    return filtered;
  }, [mergedAssignments, searchQuery, activeTab, sortBy]);

  // Stats
  const stats = useMemo(() => {
    let pending = 0, submitted = 0, graded = 0, totalScore = 0, gradedCount = 0;
    mergedAssignments.forEach(item => {
      const s = getSubmissionStatus(item);
      if (s.status === 'pending') pending++;
      else if (s.status === 'submitted') submitted++;
      else if (s.status === 'graded') { graded++; totalScore += s.score ?? 0; gradedCount++; }
    });
    return {
      total: mergedAssignments.length,
      pending,
      submitted,
      graded,
      averageScore: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
    };
  }, [mergedAssignments]);

  const handleSubmit = () => {
    if (!selectedAssignment) return;
    submitAssignmentMut.mutate({
      path: { assignmentUuid: selectedAssignment.assignment.uuid },
      query: { enrollmentUuid, content: submissionText, fileUrls: uploadedFiles.join(',') },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files.map(f => `https://storage.example.com/${f.name}`)]);
  };

  const toggleDetails = (scheduleUuid: string) =>
    setExpandedScheduleUuid(prev => (prev === scheduleUuid ? null : scheduleUuid));

  if (isLoading) {
    return (
      <div className={elimikaDesignSystem.components.pageContainer}>
        <div className='space-y-6'>
          <Skeleton className='h-12 w-64' />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => <Skeleton key={i} className='h-24 w-full' />)}
          </div>
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    );
  }

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* ── Stats ── */}
      <section className='mb-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          {[
            { label: 'Total', value: stats.total, icon: BookOpen, iconCls: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Pending', value: stats.pending, icon: Clock, iconCls: 'text-yellow-600', bg: 'bg-yellow-100' },
            { label: 'Submitted', value: stats.submitted, icon: Send, iconCls: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Graded', value: stats.graded, icon: CheckCircle, iconCls: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Avg Score', value: `${stats.averageScore}%`, icon: Award, iconCls: 'text-primary', bg: 'bg-purple-100' },
          ].map(({ label, value, icon: Icon, iconCls, bg }) => (
            <Card key={label} className='border-border/50'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`${bg} rounded-lg p-2`}><Icon className={`${iconCls} h-5 w-5`} /></div>
                  <div className='flex-1'>
                    <p className='text-muted-foreground text-xs'>{label}</p>
                    <p className={`text-2xl font-bold ${iconCls}`}>{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Filters ── */}
      <section className='mb-6'>
        <Card className='border-border/50'>
          <CardContent className='p-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='relative flex-1 sm:max-w-sm'>
                <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search assignments...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='border-border/50 pl-9'
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className='text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2'>
                    <X className='h-4 w-4' />
                  </button>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground text-sm'>Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className='w-40 border-border/50'><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='dueDate'>Due Date</SelectItem>
                    <SelectItem value='points'>Points</SelectItem>
                    <SelectItem value='title'>Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className='mb-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='all'>All ({stats.total})</TabsTrigger>
          <TabsTrigger value='pending'>Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value='submitted'>Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value='graded'>Graded ({stats.graded})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Assignment Cards ── */}
      <section>
        {processedAssignments.length === 0 ? (
          <Card className='border-border/50'>
            <CardContent className='p-12 text-center'>
              <BookOpen className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='text-foreground mb-2 text-lg font-semibold'>No assignments found</h3>
              <p className='text-muted-foreground text-sm'>
                {searchQuery
                  ? 'Try adjusting your search query'
                  : activeTab === 'all'
                    ? 'You have no assignments at the moment'
                    : `You have no ${activeTab} assignments`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {processedAssignments.map((scheduleItem: any) => {
              const { assignment, attachments, due_at, max_attempts, uuid: scheduleUuid } = scheduleItem;
              const submission = getSubmissionStatus(scheduleItem);
              const urgency = getUrgencyStatus(due_at);
              const daysUntilDue = getDaysUntilDue(due_at);
              const isExpanded = expandedScheduleUuid === scheduleUuid;

              return (
                <Card key={scheduleUuid} className='group border-border/50 transition-all hover:shadow-lg'>
                  <CardContent className='p-4 sm:p-6'>

                    {/* ── Top row: info + actions ── */}
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>

                      {/* Left */}
                      <div className='flex-1'>
                        <div className='mb-3 flex flex-wrap items-start gap-2'>
                          <h3 className='text-foreground text-lg font-semibold'>{assignment.title}</h3>

                          {submission.status === 'graded' && (
                            <Badge className='bg-green-100 text-green-800'>
                              <CheckCircle className='mr-1 h-3 w-3' />
                              Graded: {submission.score}/{submission.maxScore}
                            </Badge>
                          )}
                          {submission.status === 'submitted' && (
                            <Badge className='bg-primary/10 text-primary'>
                              <Send className='mr-1 h-3 w-3' />Submitted
                            </Badge>
                          )}
                          {submission.status === 'pending' && daysUntilDue < 0 && (
                            <Badge className='bg-destructive/10 text-destructive'>
                              <AlertCircle className='mr-1 h-3 w-3' />Overdue
                            </Badge>
                          )}
                        </div>

                        <div
                          className='text-muted-foreground mb-3 line-clamp-2 text-sm'
                          dangerouslySetInnerHTML={{ __html: assignment.description || '' }}
                        />

                        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground'>
                              Due: {new Date(due_at).toLocaleDateString()}
                            </span>
                            <Badge className={`${urgency.bgColor} ${urgency.color} ml-1`}>
                              {urgency.label}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-1.5'>
                            <Award className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground'>{assignment.max_points} points</span>
                          </div>
                          {max_attempts && (
                            <div className='flex items-center gap-1.5'>
                              <FileText className='text-muted-foreground h-4 w-4' />
                              <span className='text-muted-foreground'>
                                {max_attempts} attempt{max_attempts !== 1 ? 's' : ''} allowed
                              </span>
                            </div>
                          )}
                          <Badge variant='outline'>{assignment.assignment_category}</Badge>
                          {assignment.submission_types?.map((type: string) => (
                            <Badge key={type} variant='secondary' className='text-xs'>{type}</Badge>
                          ))}
                          {attachments.length > 0 && (
                            <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                              <Paperclip className='h-3.5 w-3.5' />
                              {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {submission.status === 'graded' && (
                          <div className='mt-3'>
                            <div className='mb-1 flex items-center justify-between'>
                              <span className='text-foreground text-sm font-medium'>Your Score</span>
                              <span className='text-foreground text-sm font-bold'>
                                {Math.round(((submission.score ?? 0) / (submission.maxScore ?? 100)) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={((submission.score ?? 0) / (submission.maxScore ?? 100)) * 100}
                              className='h-2'
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      <div className='flex shrink-0 flex-col gap-2 sm:ml-4'>
                        {submission.status === 'pending' && (
                          <Button
                            onClick={() => { setSelectedAssignment(scheduleItem); setIsSubmissionDialogOpen(true); }}
                            className='w-full sm:w-auto'
                          >
                            <Send className='mr-2 h-4 w-4' />Submit
                          </Button>
                        )}
                        {submission.status === 'submitted' && (
                          <Button variant='outline' disabled className='w-full sm:w-auto'>
                            <Clock className='mr-2 h-4 w-4' />Awaiting Grade
                          </Button>
                        )}
                        {submission.status === 'graded' && (
                          <Button
                            variant='outline'
                            onClick={() => { setSelectedAssignment({ ...scheduleItem, submission }); setIsSubmissionDialogOpen(true); }}
                            className='w-full sm:w-auto'
                          >
                            <FileText className='mr-2 h-4 w-4' />View Feedback
                          </Button>
                        )}

                        {/* View Details toggle */}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleDetails(scheduleUuid)}
                          className='text-muted-foreground w-full sm:w-auto'
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                          {isExpanded
                            ? <ChevronUp className='ml-1 h-4 w-4' />
                            : <ChevronDown className='ml-1 h-4 w-4' />}
                        </Button>
                      </div>
                    </div>

                    {/* ── Collapsible Details Panel ── */}
                    {isExpanded && (
                      <div className='mt-5 space-y-5 border-t border-border/50 pt-5'>

                        {/* Instructions */}
                        {assignment.instructions && (
                          <div>
                            <h4 className='text-foreground mb-2 text-sm font-semibold'>Instructions</h4>
                            <div
                              className='text-muted-foreground rounded-lg bg-muted/30 p-3 text-sm leading-relaxed'
                              dangerouslySetInnerHTML={{ __html: assignment.instructions }}
                            />
                          </div>
                        )}

                        {/* Assignment material attachments */}
                        <div>
                          <h4 className='text-foreground mb-2 text-sm font-semibold flex items-center gap-2'>
                            <Paperclip className='h-4 w-4' />
                            Assignment Materials
                            <Badge variant='secondary' className='text-xs'>
                              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                            </Badge>
                          </h4>

                          {attachments.length === 0 ? (
                            <p className='text-muted-foreground text-sm italic'>No attachments for this assignment.</p>
                          ) : (
                            <div className='grid gap-2 sm:grid-cols-2'>
                              {attachments.map((attachment: any) => {
                                const { icon: FileIcon, color } = getFileIcon(attachment.original_filename);
                                return (
                                  <a
                                    key={attachment.uuid}
                                    href={attachment.file_url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='group/file flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 transition-all hover:bg-muted/50 hover:border-primary/40 hover:shadow-sm'
                                  >
                                    {/* File icon tile */}
                                    <div className='shrink-0 rounded-md border border-border/30 bg-background p-2 shadow-sm'>
                                      <FileIcon className={`h-5 w-5 ${color}`} />
                                    </div>

                                    {/* Filename */}
                                    <div className='min-w-0 flex-1'>
                                      <p className='text-foreground truncate text-sm font-medium'>
                                        {attachment.original_filename}
                                      </p>
                                      <p className='text-muted-foreground text-xs mt-0.5'>
                                        Click to open
                                      </p>
                                    </div>

                                    {/* Open indicator */}
                                    <ExternalLink className='h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/file:text-primary' />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Quick-submit CTA when still pending */}
                        {submission.status === 'pending' && (
                          <div className='flex justify-end pt-1'>
                            <Button
                              size='sm'
                              onClick={() => { setSelectedAssignment(scheduleItem); setIsSubmissionDialogOpen(true); }}
                            >
                              <Send className='mr-2 h-3.5 w-3.5' />Submit Assignment
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Submission Dialog ── */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-foreground'>
              {selectedAssignment?.submission?.status === 'graded'
                ? 'Assignment Feedback'
                : 'Submit Assignment'}
            </DialogTitle>
            <DialogDescription className='text-muted-foreground'>
              {selectedAssignment?.assignment?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment?.submission?.status === 'graded' ? (
            /* Graded view */
            <div className='space-y-4'>
              <div className='bg-muted/50 rounded-lg border border-border/50 p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-foreground font-semibold'>Final Score</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-3xl font-bold text-green-600'>
                      {selectedAssignment.submission.score}
                    </span>
                    <span className='text-muted-foreground text-lg'>
                      / {selectedAssignment.submission.maxScore}
                    </span>
                  </div>
                </div>
                <Progress
                  value={(selectedAssignment.submission.score / selectedAssignment.submission.maxScore) * 100}
                  className='h-2'
                />
              </div>
              <div>
                <h4 className='text-foreground mb-2 font-semibold'>Instructor Feedback</h4>
                <div className='bg-accent/5 text-foreground rounded-lg border border-border/50 p-4'>
                  <p className='text-sm'>
                    Excellent analysis of the chord progressions. The audio example demonstrates good
                    understanding of the concepts. Minor improvement needed in identifying secondary dominants.
                  </p>
                </div>
              </div>
              <div>
                <h4 className='text-foreground mb-2 font-semibold'>Your Submission</h4>
                <div className='bg-muted/30 text-foreground rounded-lg border border-border/50 p-4'>
                  <p className='text-sm'>This is my analysis of the music theory concepts covered in the lesson...</p>
                </div>
              </div>
              <Button variant='outline' className='w-full'>
                <Download className='mr-2 h-4 w-4' />Download Graded Assignment
              </Button>
            </div>
          ) : (
            /* Submission form */
            <div className='space-y-4'>
              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>Instructions</h4>
                <div
                  className='text-muted-foreground rounded-lg bg-muted/30 p-3 text-sm'
                  dangerouslySetInnerHTML={{
                    __html: selectedAssignment?.assignment?.instructions || 'No instructions provided',
                  }}
                />
              </div>

              {/* Attachments inside dialog for easy reference while writing */}
              {(selectedAssignment?.attachments?.length ?? 0) > 0 && (
                <div>
                  <h4 className='text-foreground mb-2 text-sm font-semibold flex items-center gap-2'>
                    <Paperclip className='h-4 w-4' />Assignment Materials
                  </h4>
                  <div className='space-y-2'>
                    {selectedAssignment.attachments.map((attachment: any) => {
                      const { icon: FileIcon, color } = getFileIcon(attachment.original_filename);
                      return (
                        <a
                          key={attachment.uuid}
                          href={attachment.file_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='group/file flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 transition-all hover:bg-muted/50 hover:border-primary/40'
                        >
                          <div className='shrink-0 rounded-md border border-border/30 bg-background p-2 shadow-sm'>
                            <FileIcon className={`h-5 w-5 ${color}`} />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='text-foreground truncate text-sm font-medium'>
                              {attachment.original_filename}
                            </p>
                          </div>
                          <ExternalLink className='h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/file:text-primary' />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>
                  Submission Text
                  {selectedAssignment?.assignment?.submission_types?.includes('TEXT') && (
                    <Badge variant='secondary' className='ml-2 text-xs'>Required</Badge>
                  )}
                </h4>
                <Textarea
                  placeholder='Enter your submission text here...'
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  rows={8}
                  className='border-border/50'
                />
              </div>

              {selectedAssignment?.assignment?.submission_types?.includes('DOCUMENT') && (
                <div>
                  <h4 className='text-foreground mb-2 text-sm font-semibold'>
                    Attach Files
                    <Badge variant='secondary' className='ml-2 text-xs'>Optional</Badge>
                  </h4>
                  <div className='space-y-2'>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3'
                      >
                        <div className='flex items-center gap-2'>
                          <Paperclip className='text-muted-foreground h-4 w-4' />
                          <span className='text-foreground text-sm'>{file.split('/').pop()}</span>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                    <label className='border-border/50 hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors'>
                      <Upload className='text-muted-foreground h-5 w-5' />
                      <span className='text-muted-foreground text-sm'>Click to upload or drag and drop</span>
                      <input
                        type='file'
                        multiple
                        onChange={handleFileUpload}
                        className='hidden'
                        accept='.pdf,.doc,.docx,.txt,.jpg,.png'
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className='flex gap-2'>
                <Button variant='outline' className='flex-1' disabled={submitAssignmentMut.isPending}>
                  <Save className='mr-2 h-4 w-4' />Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  className='flex-1'
                  disabled={!submissionText || submitAssignmentMut.isPending}
                >
                  {submitAssignmentMut.isPending ? 'Submitting...' : (
                    <><Send className='mr-2 h-4 w-4' />Submit Assignment</>
                  )}
                </Button>
              </div>

              {submitAssignmentMut.isError && (
                <div className='flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
                  <AlertTriangle className='h-4 w-4' />
                  <span>Failed to submit assignment. Please try again.</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AssignmentsPage;