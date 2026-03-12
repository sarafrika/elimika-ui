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
  Loader2,
  Paperclip,
  Save,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStudent } from '../../../../context/student-context';
import useStudentClassDefinitions from '../../../../hooks/use-student-class-definition';
import { getAuthToken } from '../../../../services/auth/get-token';
import DragDropUpload from './drag-drop';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-7xl',
  },
};

// ─── File helpers ────────────────────────────────────────────────────────────
function getFileIcon(filename: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();
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

export const downloadFile = async (url: string, filename: string) => {
  const token = await getAuthToken();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Uploads each File to the server and returns an array of public URLs.
 * Adjust the endpoint + response shape to match your actual API.
 */
async function uploadFiles(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const token = await getAuthToken();

  const urls = await Promise.all(
    files.map(async file => {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
      const data = await res.json();
      // Adjust to whatever your API returns, e.g. data.url / data.file_url / data.path
      return (data.url ?? data.file_url ?? data.path) as string;
    })
  );

  return urls;
}

// ─── Submission-type guard: should we show the file upload section? ──────────
function requiresFileUpload(submissionTypes: string[] = []) {
  return submissionTypes.some(t =>
    ['DOCUMENT', 'PDF', 'FILE', 'ATTACHMENT'].includes(t.toUpperCase())
  );
}

// ─── Reusable attachment row ─────────────────────────────────────────────────
function AttachmentRow({ attachment }: { attachment: any }) {
  const { icon: FileIcon, color } = getFileIcon(attachment.original_filename);
  return (
    <div className='group/file border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm'>
      <div className='border-border/30 bg-background shrink-0 rounded-md border p-2 shadow-sm'>
        <FileIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-foreground truncate text-xs font-medium sm:text-sm'>
          {attachment.original_filename}
        </p>
        <p className='text-muted-foreground mt-0.5 text-xs'>Open or download</p>
      </div>
      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <a
          href={attachment.file_url}
          target='_blank'
          rel='noopener noreferrer'
          className='hover:bg-muted rounded p-1.5 sm:p-2'
          title='Open file'
        >
          <ExternalLink className='text-muted-foreground hover:text-primary h-4 w-4' />
        </a>
        <button
          onClick={e => {
            e.stopPropagation();
            downloadFile(attachment.file_url, attachment.original_filename);
          }}
          className='hover:bg-muted rounded p-1.5 sm:p-2'
          title='Download file'
        >
          <Download className='text-muted-foreground hover:text-primary h-4 w-4' />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function AssignmentsPage() {
  const student = useStudent();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'points' | 'title'>('dueDate');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedScheduleUuid, setExpandedScheduleUuid] = useState<string | null>(null);
  const [enrollmentUuid] = useState('c6590ad9-06b5-4aa0-a2e6-c1550102109e');

  // 1️⃣ Student classes
  const { classDefinitions, loading } = useStudentClassDefinitions(student);
  const classIds = (classDefinitions ?? [])
    .map((c: any) => c.classDetails?.class_definition?.uuid)
    .filter(Boolean);

  // 2️⃣ Fetch schedules
  const assignmentScheduleQueries = useQueries({
    queries: classIds.map((classId: string) => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid: classId } }),
      enabled: !!classId,
    })),
  });
  const isSchedulesLoading = assignmentScheduleQueries.some(q => q.isLoading);
  const assignmentSchedules = assignmentScheduleQueries.flatMap(q => q.data?.data || []);

  // 3️⃣ Unique UUIDs
  const assignmentUuids = [
    ...new Set(assignmentSchedules.map((s: any) => s.assignment_uuid).filter(Boolean)),
  ] as string[];

  // 4️⃣ Details + attachments
  const assignmentDetailQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });
  const assignmentAttachmentQueries = useQueries({
    queries: assignmentUuids.map(uuid => ({
      ...getAssignmentAttachmentsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
    })),
  });
  const isDetailsLoading = assignmentDetailQueries.some(q => q.isLoading);

  // 5️⃣ Lookup maps
  const assignmentDetailsMap = useMemo(() => {
    const map: Record<string, any> = {};
    assignmentDetailQueries.forEach(q => {
      const d = q.data?.data;
      if (d?.uuid) map[d.uuid] = d;
    });
    return map;
  }, [assignmentDetailQueries]);

  const assignmentAttachmentsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignmentAttachmentQueries.forEach((q, i) => {
      const uuid = assignmentUuids[i];
      if (uuid) map[uuid] = q.data?.data ?? [];
    });
    return map;
  }, [assignmentAttachmentQueries, assignmentUuids]);

  // 6️⃣ Merge
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
      setUploadError(null);
    },
  });

  // Helpers
  const getDaysUntilDue = (dueAt: string) =>
    Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86_400_000);

  const getUrgencyStatus = (dueAt: string) => {
    const days = getDaysUntilDue(dueAt);
    if (days < 0)
      return { label: 'Overdue', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (days === 0)
      return { label: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (days <= 3) return { label: 'Due Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: `${days}d left`, color: 'text-muted-foreground', bgColor: 'bg-muted' };
  };

  // TODO: replace with real submission API lookup
  const getSubmissionStatus = (scheduleItem: any) => {
    const r = Math.random();
    if (r > 0.7)
      return {
        status: 'graded',
        score: 85,
        maxScore: scheduleItem.assignment?.max_points ?? 100,
        submittedAt: '2024-04-10T14:30:00',
      };
    if (r > 0.4) return { status: 'submitted', submittedAt: '2024-04-10T14:30:00' };
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
      if (sortBy === 'points')
        return (b.assignment?.max_points ?? 0) - (a.assignment?.max_points ?? 0);
      return (a.assignment?.title ?? '').localeCompare(b.assignment?.title ?? '');
    });
    return filtered;
  }, [mergedAssignments, searchQuery, activeTab, sortBy]);

  // Stats
  const stats = useMemo(() => {
    let pending = 0,
      submitted = 0,
      graded = 0,
      totalScore = 0,
      gradedCount = 0;
    mergedAssignments.forEach(item => {
      const s = getSubmissionStatus(item);
      if (s.status === 'pending') pending++;
      else if (s.status === 'submitted') submitted++;
      else if (s.status === 'graded') {
        graded++;
        totalScore += (s as any).score ?? 0;
        gradedCount++;
      }
    });
    return {
      total: mergedAssignments.length,
      pending,
      submitted,
      graded,
      averageScore: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
    };
  }, [mergedAssignments]);

  // ── Submit handler (uploads files first, then submits) ──────────────────────
  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    setUploadError(null);

    let fileUrls: string[] = [];

    // if (uploadedFiles.length > 0) {
    //   setIsUploading(true);
    //   try {
    //     fileUrls = await uploadFiles(uploadedFiles);
    //   } catch (err: any) {
    //     setUploadError(err?.message ?? 'File upload failed. Please try again.');
    //     setIsUploading(false);
    //     return;
    //   } finally {
    //     setIsUploading(false);
    //   }
    // }

    submitAssignmentMut.mutate({
      path: { assignmentUuid: selectedAssignment.assignment.uuid },
      query: {
        enrollmentUuid,
        content: submissionText,
        // fileUrls: fileUrls.join(',')
      },
    });
  };

  const handleFilesAdded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setUploadError(null);
  };

  const toggleDetails = (uuid: string) =>
    setExpandedScheduleUuid(prev => (prev === uuid ? null : uuid));

  const openSubmitDialog = (scheduleItem: any) => {
    setSelectedAssignment(scheduleItem);
    setSubmissionText('');
    setUploadedFiles([]);
    setUploadError(null);
    setIsSubmissionDialogOpen(true);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={elimikaDesignSystem.components.pageContainer}>
        <div className='space-y-4 sm:space-y-6'>
          <Skeleton className='h-10 w-48 sm:h-12 sm:w-64' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-20 w-full sm:h-24' />
            ))}
          </div>
          <Skeleton className='h-72 w-full sm:h-96' />
        </div>
      </div>
    );
  }

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* ── Stats ── */}
      <section className='mb-4 sm:mb-6'>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5'>
          {(
            [
              {
                label: 'Total',
                value: stats.total,
                icon: BookOpen,
                iconCls: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'Pending',
                value: stats.pending,
                icon: Clock,
                iconCls: 'text-yellow-600',
                bg: 'bg-yellow-100',
              },
              {
                label: 'Submitted',
                value: stats.submitted,
                icon: Send,
                iconCls: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                label: 'Graded',
                value: stats.graded,
                icon: CheckCircle,
                iconCls: 'text-green-600',
                bg: 'bg-green-100',
              },
              {
                label: 'Avg Score',
                value: `${stats.averageScore}%`,
                icon: Award,
                iconCls: 'text-primary',
                bg: 'bg-purple-100',
              },
            ] as const
          ).map(({ label, value, icon: Icon, iconCls, bg }) => (
            <Card key={label} className='border-border/50'>
              <CardContent className='p-3 sm:p-4'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className={`${bg} shrink-0 rounded-lg p-1.5 sm:p-2`}>
                    <Icon className={`${iconCls} h-4 w-4 sm:h-5 sm:w-5`} />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-muted-foreground text-[10px] sm:text-xs'>{label}</p>
                    <p className={`truncate text-lg font-bold sm:text-2xl ${iconCls}`}>{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Filters ── */}
      <section className='mb-4 sm:mb-6'>
        <Card className='border-border/50'>
          <CardContent className='p-3 sm:p-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              {/* Search */}
              <div className='relative w-full sm:max-w-sm'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search assignments...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='border-border/50 pr-9 pl-9 text-sm'
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
              </div>
              {/* Sort */}
              <div className='flex items-center gap-2 self-end sm:self-auto'>
                <span className='text-muted-foreground text-sm whitespace-nowrap'>Sort by:</span>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className='border-border/50 w-36 text-sm sm:w-40'>
                    <SelectValue />
                  </SelectTrigger>
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
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className='mb-4 sm:mb-6'>
        <TabsList className='grid h-9 w-full grid-cols-4 sm:h-10'>
          <TabsTrigger value='all' className='px-1 text-xs sm:px-3 sm:text-sm'>
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value='pending' className='px-1 text-xs sm:px-3 sm:text-sm'>
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value='submitted' className='px-1 text-xs sm:px-3 sm:text-sm'>
            Done ({stats.submitted})
          </TabsTrigger>
          <TabsTrigger value='graded' className='px-1 text-xs sm:px-3 sm:text-sm'>
            Graded ({stats.graded})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Assignment Cards ── */}
      <section>
        {processedAssignments.length === 0 ? (
          <Card className='border-border/50'>
            <CardContent className='p-8 text-center sm:p-12'>
              <BookOpen className='text-muted-foreground mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12' />
              <h3 className='text-foreground mb-2 text-base font-semibold sm:text-lg'>
                No assignments found
              </h3>
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
          <div className='space-y-3 sm:space-y-4'>
            {processedAssignments.map((scheduleItem: any) => {
              const {
                assignment,
                attachments,
                due_at,
                max_attempts,
                uuid: scheduleUuid,
              } = scheduleItem;
              const submission = getSubmissionStatus(scheduleItem);
              const urgency = getUrgencyStatus(due_at);
              const daysUntilDue = getDaysUntilDue(due_at);
              const isExpanded = expandedScheduleUuid === scheduleUuid;

              return (
                <Card
                  key={scheduleUuid}
                  className='group border-border/50 transition-all hover:shadow-lg'
                >
                  <CardContent className='p-3 sm:p-4 lg:p-6'>
                    {/* ── Summary row ── */}
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      {/* Left */}
                      <div className='min-w-0 flex-1'>
                        {/* Title + status badges */}
                        <div className='mb-2 flex flex-wrap items-start gap-2'>
                          <h3 className='text-foreground text-base leading-snug font-semibold sm:text-lg'>
                            {assignment.title}
                          </h3>
                          {submission.status === 'graded' && (
                            <Badge className='bg-green-100 text-xs text-green-800'>
                              <CheckCircle className='mr-1 h-3 w-3' />
                              Graded: {(submission as any).score}/{(submission as any).maxScore}
                            </Badge>
                          )}
                          {submission.status === 'submitted' && (
                            <Badge className='bg-primary/10 text-primary text-xs'>
                              <Send className='mr-1 h-3 w-3' />
                              Submitted
                            </Badge>
                          )}
                          {submission.status === 'pending' && daysUntilDue < 0 && (
                            <Badge className='bg-destructive/10 text-destructive text-xs'>
                              <AlertCircle className='mr-1 h-3 w-3' />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <div
                          className='text-muted-foreground mb-2 line-clamp-2 text-xs sm:mb-3 sm:text-sm'
                          dangerouslySetInnerHTML={{ __html: assignment.description || '' }}
                        />

                        {/* Meta chips */}
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm'>
                          <div className='flex items-center gap-1'>
                            <Calendar className='text-muted-foreground h-3.5 w-3.5' />
                            <span className='text-muted-foreground'>
                              {new Date(due_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <Badge
                              className={`${urgency.bgColor} ${urgency.color} ml-0.5 text-[10px] sm:text-xs`}
                            >
                              {urgency.label}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Award className='text-muted-foreground h-3.5 w-3.5' />
                            <span className='text-muted-foreground'>
                              {assignment.max_points} pts
                            </span>
                          </div>
                          {max_attempts && (
                            <div className='flex items-center gap-1'>
                              <FileText className='text-muted-foreground h-3.5 w-3.5' />
                              <span className='text-muted-foreground'>
                                {max_attempts} attempt{max_attempts !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          <Badge variant='outline' className='text-[10px] sm:text-xs'>
                            {assignment.assignment_category}
                          </Badge>
                          {assignment.submission_types?.map((t: string) => (
                            <Badge key={t} variant='secondary' className='text-[10px] sm:text-xs'>
                              {t}
                            </Badge>
                          ))}
                          {attachments.length > 0 && (
                            <span className='text-muted-foreground flex items-center gap-1 text-[10px] sm:text-xs'>
                              <Paperclip className='h-3 w-3' />
                              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Score bar */}
                        {submission.status === 'graded' && (
                          <div className='mt-2 sm:mt-3'>
                            <div className='mb-1 flex items-center justify-between text-xs sm:text-sm'>
                              <span className='text-foreground font-medium'>Your Score</span>
                              <span className='text-foreground font-bold'>
                                {Math.round(
                                  ((submission as any).score / (submission as any).maxScore) * 100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                ((submission as any).score / (submission as any).maxScore) * 100
                              }
                              className='h-1.5 sm:h-2'
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      <div className='flex flex-row gap-2 sm:ml-4 sm:shrink-0 sm:flex-col'>
                        {submission.status === 'pending' && (
                          <Button
                            size='sm'
                            className='flex-1 text-xs sm:flex-none sm:text-sm'
                            onClick={() => openSubmitDialog(scheduleItem)}
                          >
                            <Send className='mr-1.5 h-3.5 w-3.5' />
                            Submit
                          </Button>
                        )}
                        {submission.status === 'submitted' && (
                          <Button
                            variant='outline'
                            size='sm'
                            disabled
                            className='flex-1 text-xs sm:flex-none sm:text-sm'
                          >
                            <Clock className='mr-1.5 h-3.5 w-3.5' />
                            Awaiting Grade
                          </Button>
                        )}
                        {submission.status === 'graded' && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1 text-xs sm:flex-none sm:text-sm'
                            onClick={() => {
                              setSelectedAssignment({ ...scheduleItem, submission });
                              setIsSubmissionDialogOpen(true);
                            }}
                          >
                            <FileText className='mr-1.5 h-3.5 w-3.5' />
                            Feedback
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleDetails(scheduleUuid)}
                          className='text-muted-foreground flex-1 text-xs sm:flex-none sm:text-sm'
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                          {isExpanded ? (
                            <ChevronUp className='ml-1 h-3.5 w-3.5' />
                          ) : (
                            <ChevronDown className='ml-1 h-3.5 w-3.5' />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* ── Collapsible Details Panel ── */}
                    {isExpanded && (
                      <div className='border-border/50 mt-4 space-y-4 border-t pt-4 sm:mt-5 sm:space-y-5 sm:pt-5'>
                        {/* Instructions */}
                        {assignment.instructions && (
                          <div>
                            <h4 className='text-foreground mb-1.5 text-xs font-semibold sm:mb-2 sm:text-sm'>
                              Instructions
                            </h4>
                            <div
                              className='text-muted-foreground bg-muted/30 rounded-lg p-3 text-xs leading-relaxed sm:text-sm'
                              dangerouslySetInnerHTML={{ __html: assignment.instructions }}
                            />
                          </div>
                        )}

                        {/* Attachments */}
                        <div>
                          <h4 className='text-foreground mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm'>
                            <Paperclip className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                            Assignment Materials
                            <Badge variant='secondary' className='text-[10px] sm:text-xs'>
                              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
                            </Badge>
                          </h4>
                          {attachments.length === 0 ? (
                            <p className='text-muted-foreground text-xs italic sm:text-sm'>
                              No attachments for this assignment.
                            </p>
                          ) : (
                            <div className='grid gap-2 sm:grid-cols-2'>
                              {attachments.map((att: any) => (
                                <AttachmentRow key={att.uuid} attachment={att} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quick-submit */}
                        {submission.status === 'pending' && (
                          <div className='flex justify-end pt-1'>
                            <Button
                              size='sm'
                              className='text-xs sm:text-sm'
                              onClick={() => openSubmitDialog(scheduleItem)}
                            >
                              <Send className='mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5' />
                              Submit Assignment
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

      {/* ═══════════════════════════════════════════════════════════════════════
          SUBMISSION DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className='max-h-[92vh] w-full overflow-y-auto p-4 sm:max-w-2xl sm:p-6'>
          <DialogHeader className='mb-1'>
            <DialogTitle className='text-foreground text-base sm:text-lg'>
              {selectedAssignment?.submission?.status === 'graded'
                ? 'Assignment Feedback'
                : 'Submit Assignment'}
            </DialogTitle>
            <DialogDescription className='text-muted-foreground text-xs sm:text-sm'>
              {selectedAssignment?.assignment?.title}
            </DialogDescription>
          </DialogHeader>

          {/* ── Graded view ── */}
          {selectedAssignment?.submission?.status === 'graded' ? (
            <div className='space-y-4'>
              <div className='bg-muted/50 border-border/50 rounded-lg border p-3 sm:p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-foreground text-sm font-semibold sm:text-base'>
                    Final Score
                  </span>
                  <div className='flex items-center gap-1.5 sm:gap-2'>
                    <span className='text-2xl font-bold text-green-600 sm:text-3xl'>
                      {selectedAssignment.submission.score}
                    </span>
                    <span className='text-muted-foreground text-base sm:text-lg'>
                      / {selectedAssignment.submission.maxScore}
                    </span>
                  </div>
                </div>
                <Progress
                  value={
                    (selectedAssignment.submission.score / selectedAssignment.submission.maxScore) *
                    100
                  }
                  className='h-2'
                />
              </div>
              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>Instructor Feedback</h4>
                <div className='bg-accent/5 text-foreground border-border/50 rounded-lg border p-3 text-xs leading-relaxed sm:p-4 sm:text-sm'>
                  Excellent analysis of the chord progressions. The audio example demonstrates good
                  understanding of the concepts. Minor improvement needed in identifying secondary
                  dominants.
                </div>
              </div>
              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>Your Submission</h4>
                <div className='bg-muted/30 text-foreground border-border/50 rounded-lg border p-3 text-xs sm:p-4 sm:text-sm'>
                  This is my analysis of the music theory concepts covered in the lesson...
                </div>
              </div>
              <Button variant='outline' className='w-full text-sm'>
                <Download className='mr-2 h-4 w-4' />
                Download Graded Assignment
              </Button>
            </div>
          ) : (
            /* ── Submission form ── */
            <div className='space-y-4'>
              {/* Instructions */}
              <div>
                <h4 className='text-foreground mb-1.5 text-xs font-semibold sm:text-sm'>
                  Instructions
                </h4>
                <div
                  className='text-muted-foreground bg-muted/30 rounded-lg p-3 text-xs leading-relaxed sm:text-sm'
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedAssignment?.assignment?.instructions || 'No instructions provided.',
                  }}
                />
              </div>

              {/* Reference attachments */}
              {(selectedAssignment?.attachments?.length ?? 0) > 0 && (
                <div>
                  <h4 className='text-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold sm:text-sm'>
                    <Paperclip className='h-3.5 w-3.5' />
                    Assignment Materials
                  </h4>
                  <div className='space-y-2'>
                    {selectedAssignment.attachments.map((att: any) => (
                      <AttachmentRow key={att.uuid} attachment={att} />
                    ))}
                  </div>
                </div>
              )}

              {/* Text submission */}
              <div>
                <h4 className='text-foreground mb-1.5 flex items-center gap-2 text-xs font-semibold sm:text-sm'>
                  Submission Text
                  {selectedAssignment?.assignment?.submission_types?.includes('TEXT') && (
                    <Badge variant='secondary' className='text-[10px] sm:text-xs'>
                      Required
                    </Badge>
                  )}
                </h4>
                <Textarea
                  placeholder='Enter your submission text here...'
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  rows={6}
                  className='border-border/50 resize-none text-sm'
                />
              </div>

              {/* File upload — shown when submission type requires files */}
              {requiresFileUpload(selectedAssignment?.assignment?.submission_types) && (
                <div>
                  <h4 className='text-foreground mb-2 flex items-center gap-2 text-xs font-semibold sm:text-sm'>
                    Attach Files
                    <Badge variant='secondary' className='text-[10px] sm:text-xs'>
                      Optional
                    </Badge>
                  </h4>

                  {/* Staged file list */}
                  {uploadedFiles.length > 0 && (
                    <div className='mb-2 space-y-1.5'>
                      {uploadedFiles.map((file, i) => (
                        <div
                          key={i}
                          className='border-border/50 bg-muted/30 flex items-center justify-between rounded-lg border px-3 py-2'
                        >
                          <div className='flex min-w-0 items-center gap-2'>
                            <Paperclip className='text-muted-foreground h-4 w-4 shrink-0' />
                            <span className='text-foreground truncate text-xs sm:text-sm'>
                              {file.name}
                            </span>
                            <span className='text-muted-foreground shrink-0 text-[10px]'>
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='ml-1 h-7 w-7 shrink-0 p-0'
                            onClick={() =>
                              setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))
                            }
                          >
                            <X className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <DragDropUpload
                    accept='.pdf,.doc,.docx,.txt,.jpg,.png'
                    onFilesAdded={handleFilesAdded}
                  >
                    <Upload className='text-muted-foreground h-5 w-5' />
                    <span className='text-muted-foreground text-xs sm:text-sm'>
                      Click to upload or drag and drop
                    </span>
                    <span className='text-muted-foreground/70 text-[10px] sm:text-xs'>
                      PDF, DOC, DOCX, TXT, JPG, PNG
                    </span>
                  </DragDropUpload>
                </div>
              )}

              {/* Upload progress */}
              {isUploading && (
                <div className='border-border/50 bg-muted/30 text-foreground flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm'>
                  <Loader2 className='h-4 w-4 shrink-0 animate-spin' />
                  <span>
                    Uploading {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}...
                  </span>
                </div>
              )}

              {/* Upload error */}
              {uploadError && (
                <div className='border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm'>
                  <AlertTriangle className='h-4 w-4 shrink-0' />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className='flex gap-2 pt-1'>
                <Button
                  variant='outline'
                  className='flex-1 text-xs sm:text-sm'
                  disabled={submitAssignmentMut.isPending || isUploading}
                >
                  <Save className='mr-1.5 h-3.5 w-3.5' />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  className='flex-1 text-xs sm:text-sm'
                  disabled={!submissionText || submitAssignmentMut.isPending || isUploading}
                >
                  {submitAssignmentMut.isPending || isUploading ? (
                    <>
                      <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                      {isUploading ? 'Uploading...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className='mr-1.5 h-3.5 w-3.5' />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>

              {/* Submission error */}
              {submitAssignmentMut.isError && (
                <div className='border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs sm:text-sm'>
                  <AlertTriangle className='h-4 w-4 shrink-0' />
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
