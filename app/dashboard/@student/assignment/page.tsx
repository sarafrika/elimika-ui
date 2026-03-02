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
  getAllAssignmentsOptions,
  submitAssignmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Paperclip,
  Save,
  Search,
  Send,
  Upload,
  X
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

const elimikaDesignSystem = {
  components: {
    pageContainer: 'container mx-auto px-4 py-6 max-w-7xl',
  },
};

function AssignmentsPage() {
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'points' | 'title'>('dueDate');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [enrollmentUuid] = useState('mock-enrollment-uuid'); // In real app, get from context

  // Fetch assignments
  const { data: assignmentsData, isLoading } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });
  const assignments = assignmentsData?.data?.content || [];

  // Submit assignment mutation
  const submitAssignmentMut = useMutation({
    ...submitAssignmentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsSubmissionDialogOpen(false);
      setSubmissionText('');
      setUploadedFiles([]);
    },
  });

  // Helper functions
  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyStatus = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return { label: 'Overdue', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (days === 0) return { label: 'Due Today', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (days <= 3) return { label: 'Due Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: `${days} days left`, color: 'text-muted-foreground', bgColor: 'bg-muted' };
  };

  const getSubmissionStatus = (assignment: any) => {
    // In real app, check if student has submitted this assignment
    // For now, randomly mock it
    const random = Math.random();
    if (random > 0.7) {
      return {
        status: 'graded',
        score: 85,
        maxScore: assignment.max_points,
        submittedAt: '2024-04-10T14:30:00',
      };
    } else if (random > 0.4) {
      return {
        status: 'submitted',
        submittedAt: '2024-04-10T14:30:00',
      };
    }
    return { status: 'pending' };
  };

  // Filter and sort assignments
  const processedAssignments = useMemo(() => {
    let filtered = assignments.filter((assignment: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          assignment.title?.toLowerCase().includes(query) ||
          assignment.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter((assignment: any) => {
        const submission = getSubmissionStatus(assignment);
        return submission.status === activeTab;
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'dueDate') {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === 'points') {
        return b.max_points - a.max_points;
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [assignments, searchQuery, activeTab, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = assignments.length;
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let totalScore = 0;
    let gradedCount = 0;

    assignments.forEach((assignment: any) => {
      const submission = getSubmissionStatus(assignment);
      if (submission.status === 'pending') pending++;
      else if (submission.status === 'submitted') submitted++;
      else if (submission.status === 'graded') {
        graded++;
        totalScore += submission.score || 0;
        gradedCount++;
      }
    });

    return {
      total,
      pending,
      submitted,
      graded,
      averageScore: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
    };
  }, [assignments]);

  const handleSubmit = () => {
    if (!selectedAssignment) return;

    submitAssignmentMut.mutate({
      path: { assignmentUuid: selectedAssignment.uuid },
      query: {
        enrollmentUuid,
        content: submissionText,
        fileUrls: uploadedFiles.join(','),
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // In real app, upload files to storage and get URLs
    const mockUrls = files.map(file => `https://storage.example.com/${file.name}`);
    setUploadedFiles([...uploadedFiles, ...mockUrls]);
  };

  if (isLoading) {
    return (
      <div className={elimikaDesignSystem.components.pageContainer}>
        <div className='space-y-6'>
          <Skeleton className='h-12 w-64' />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-24 w-full' />
            ))}
          </div>
          <Skeleton className='h-96 w-full' />
        </div>
      </div>
    );
  }

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Stats Cards */}
      <section className='mb-6'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <BookOpen className='text-primary h-5 w-5' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs'>Total</p>
                  <p className='text-foreground text-2xl font-bold'>{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-yellow-100 rounded-lg p-2'>
                  <Clock className='h-5 w-5 text-yellow-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs'>Pending</p>
                  <p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Send className='h-5 w-5 text-primary' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs'>Submitted</p>
                  <p className='text-2xl font-bold text-primary'>{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-green-100 rounded-lg p-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs'>Graded</p>
                  <p className='text-2xl font-bold text-green-600'>{stats.graded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='bg-purple-100 rounded-lg p-2'>
                  <Award className='h-5 w-5 text-primary' />
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-xs'>Avg Score</p>
                  <p className='text-2xl font-bold text-primary'>{stats.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters */}
      <section className='mb-6'>
        <Card className='border-border/50'>
          <CardContent className='p-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              {/* Search */}
              <div className='relative flex-1 sm:max-w-sm'>
                <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search assignments...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='border-border/50 pl-9'
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground text-sm'>Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className='w-40 border-border/50'>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className='mb-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='all'>All ({stats.total})</TabsTrigger>
          <TabsTrigger value='pending'>Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value='submitted'>Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value='graded'>Graded ({stats.graded})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Assignments List */}
      <section>
        {processedAssignments.length === 0 ? (
          <Card className='border-border/50'>
            <CardContent className='p-12 text-center'>
              <BookOpen className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='text-foreground mb-2 text-lg font-semibold'>
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
          <div className='space-y-4'>
            {processedAssignments.map((assignment: any) => {
              const submission = getSubmissionStatus(assignment);
              const urgency = getUrgencyStatus(assignment.due_date);
              const daysUntilDue = getDaysUntilDue(assignment.due_date);

              return (
                <Card
                  key={assignment.uuid}
                  className='group border-border/50 transition-all hover:shadow-lg'
                >
                  <CardContent className='p-4 sm:p-6'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                      {/* Left: Assignment Info */}
                      <div className='flex-1'>
                        <div className='mb-3 flex flex-wrap items-start gap-2'>
                          <h3 className='text-foreground text-lg font-semibold'>
                            {assignment.title}
                          </h3>

                          {/* Status Badge */}
                          {submission.status === 'graded' && (
                            <Badge className='bg-green-100 text-green-800'>
                              <CheckCircle className='mr-1 h-3 w-3' />
                              Graded: {submission.score}/{submission.maxScore}
                            </Badge>
                          )}
                          {submission.status === 'submitted' && (
                            <Badge className='bg-primary/10 text-primary'>
                              <Send className='mr-1 h-3 w-3' />
                              Submitted
                            </Badge>
                          )}
                          {submission.status === 'pending' && daysUntilDue < 0 && (
                            <Badge className='bg-destructive/10 text-destructive'>
                              <AlertCircle className='mr-1 h-3 w-3' />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <div
                          className='text-muted-foreground mb-3 line-clamp-2 text-sm'
                          dangerouslySetInnerHTML={{ __html: assignment.description || '' }}
                        />

                        {/* Meta Info */}
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground'>
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                            <Badge className={`${urgency.bgColor} ${urgency.color} ml-1`}>
                              {urgency.label}
                            </Badge>
                          </div>

                          <div className='flex items-center gap-1.5'>
                            <Award className='text-muted-foreground h-4 w-4' />
                            <span className='text-muted-foreground'>
                              {assignment.max_points} points
                            </span>
                          </div>

                          <Badge variant='outline'>{assignment.assignment_category}</Badge>

                          {assignment.submission_types?.map((type: string) => (
                            <Badge key={type} variant='secondary' className='text-xs'>
                              {type}
                            </Badge>
                          ))}
                        </div>

                        {/* Grading Info */}
                        {submission.status === 'graded' && (
                          <div className='mt-3'>
                            <div className='mb-1 flex items-center justify-between'>
                              <span className='text-foreground text-sm font-medium'>
                                Your Score
                              </span>
                              <span className='text-foreground text-sm font-bold'>
                                {Math.round(
                                  ((submission.score || 0) / (submission.maxScore || 100)) * 100
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                ((submission.score || 0) / (submission.maxScore || 100)) * 100
                              }
                              className='h-2'
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className='flex shrink-0 flex-col gap-2 sm:ml-4'>
                        {submission.status === 'pending' && (
                          <Button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsSubmissionDialogOpen(true);
                            }}
                            className='w-full sm:w-auto'
                          >
                            <Send className='mr-2 h-4 w-4' />
                            Submit
                          </Button>
                        )}

                        {submission.status === 'submitted' && (
                          <Button variant='outline' disabled className='w-full sm:w-auto'>
                            <Clock className='mr-2 h-4 w-4' />
                            Awaiting Grade
                          </Button>
                        )}

                        {submission.status === 'graded' && (
                          <Button
                            variant='outline'
                            onClick={() => {
                              setSelectedAssignment({ ...assignment, submission });
                              setIsSubmissionDialogOpen(true);
                            }}
                            className='w-full sm:w-auto'
                          >
                            <FileText className='mr-2 h-4 w-4' />
                            View Feedback
                          </Button>
                        )}

                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setSelectedAssignment(assignment);
                          }}
                          className='text-muted-foreground w-full sm:w-auto'
                        >
                          View Details
                          <ChevronRight className='ml-1 h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Submission Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-foreground'>
              {selectedAssignment?.submission?.status === 'graded'
                ? 'Assignment Feedback'
                : 'Submit Assignment'}
            </DialogTitle>
            <DialogDescription className='text-muted-foreground'>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment?.submission?.status === 'graded' ? (
            /* Graded View */
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
                  value={
                    (selectedAssignment.submission.score /
                      selectedAssignment.submission.maxScore) *
                    100
                  }
                  className='h-2'
                />
              </div>

              <div>
                <h4 className='text-foreground mb-2 font-semibold'>Instructor Feedback</h4>
                <div className='bg-accent/5 text-foreground rounded-lg border border-border/50 p-4'>
                  <p className='text-sm'>
                    Excellent analysis of the chord progressions. The audio example demonstrates
                    good understanding of the concepts. Minor improvement needed in identifying
                    secondary dominants.
                  </p>
                </div>
              </div>

              <div>
                <h4 className='text-foreground mb-2 font-semibold'>Your Submission</h4>
                <div className='bg-muted/30 text-foreground rounded-lg border border-border/50 p-4'>
                  <p className='text-sm'>
                    This is my analysis of the music theory concepts covered in the lesson...
                  </p>
                </div>
              </div>

              <Button variant='outline' className='w-full'>
                <Download className='mr-2 h-4 w-4' />
                Download Graded Assignment
              </Button>
            </div>
          ) : (
            /* Submission Form */
            <div className='space-y-4'>
              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>Instructions</h4>
                <div
                  className='text-muted-foreground rounded-lg bg-muted/30 p-3 text-sm'
                  dangerouslySetInnerHTML={{
                    __html: selectedAssignment?.instructions || 'No instructions provided',
                  }}
                />
              </div>

              <div>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>
                  Submission Text
                  {selectedAssignment?.submission_types?.includes('TEXT') && (
                    <Badge variant='secondary' className='ml-2 text-xs'>
                      Required
                    </Badge>
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

              {selectedAssignment?.submission_types?.includes('DOCUMENT') && (
                <div>
                  <h4 className='text-foreground mb-2 text-sm font-semibold'>
                    Attach Files
                    <Badge variant='secondary' className='ml-2 text-xs'>
                      Optional
                    </Badge>
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
                          onClick={() =>
                            setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                          }
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                    <label className='border-border/50 hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors'>
                      <Upload className='text-muted-foreground h-5 w-5' />
                      <span className='text-muted-foreground text-sm'>
                        Click to upload or drag and drop
                      </span>
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
                <Button
                  variant='outline'
                  className='flex-1'
                  disabled={submitAssignmentMut.isPending}
                >
                  <Save className='mr-2 h-4 w-4' />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  className='flex-1'
                  disabled={!submissionText || submitAssignmentMut.isPending}
                >
                  {submitAssignmentMut.isPending ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className='mr-2 h-4 w-4' />
                      Submit Assignment
                    </>
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