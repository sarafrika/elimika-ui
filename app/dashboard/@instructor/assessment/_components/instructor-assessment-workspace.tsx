'use client';

import { AssignmentDialog } from '@/app/dashboard/@course_creator/_components/assignment-management-form';
import { QuizDialog } from '@/app/dashboard/@course_creator/_components/quiz-management-form';
import DeleteModal from '@/components/custom-modals/delete-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import {
  cx,
  elimikaDesignSystem,
  getCardClasses,
  getEmptyStateClasses,
  getHeaderClasses,
  getStatCardClasses,
} from '@/lib/design-system';
import {
  deleteAssignmentMutation,
  deleteQuizMutation,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getPendingGradingOptions,
  getStudentByIdOptions,
  getSubmissionAttachmentsOptions,
  getUserByUuidOptions,
  gradeSubmissionMutation,
  returnSubmissionMutation,
  searchAssignmentsOptions,
  searchAssignmentsQueryKey,
  searchAttemptsOptions,
  searchQuizzesOptions,
  searchQuizzesQueryKey,
  searchSubmissionsOptions,
  searchSubmissionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  ListChecks,
  Loader2,
  PenLine,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Undo2,
  Users,
} from 'lucide-react';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type WorkspaceTab = 'overview' | 'tasks' | 'submissions' | 'grades' | 'exams';
type TaskType = 'assignment' | 'quiz';

type Props = {
  defaultTab?: WorkspaceTab;
  defaultTaskType?: TaskType;
  embedded?: boolean;
};

type CourseOption = {
  id: string;
  title: string;
  classTitles: string[];
};

type EnrichedAssignment = any & {
  courseId: string;
  courseTitle: string;
};

type EnrichedQuiz = any & {
  courseId: string;
  courseTitle: string;
};

type EnrichedSubmission = any & {
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  classTitle: string;
};

type EnrichedAttempt = any & {
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  classTitle: string;
};

const ALL_COURSES = 'all-courses';

const getStatusVariant = (status?: string) => {
  const normalized = status?.toLowerCase();

  if (normalized?.includes('graded') || normalized?.includes('passed')) return 'success' as const;
  if (normalized?.includes('pending') || normalized?.includes('draft')) return 'secondary' as const;
  if (
    normalized?.includes('failed') ||
    normalized?.includes('missing') ||
    normalized?.includes('returned')
  ) {
    return 'destructive' as const;
  }

  return 'outline' as const;
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'Not available';
  return moment(value).format('ddd, MMM D, YYYY · h:mm A');
};

const formatEnum = (value?: string | null) => {
  if (!value) return 'Not available';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const normalizeIdentity = (value?: string | null) => value?.trim().toLowerCase() ?? '';

function SectionIntro({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className='space-y-2'>
      <Badge variant='outline' className='border-primary/30 bg-primary/5 text-primary w-fit'>
        {badge}
      </Badge>
      <h2 className='text-foreground text-xl font-semibold sm:text-2xl'>{title}</h2>
      <p className='text-muted-foreground max-w-3xl text-sm'>{description}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <div className={cx(getEmptyStateClasses(), 'min-h-[260px]')}>
      <Icon className='text-primary/70 h-10 w-10' />
      <div className='space-y-1'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='text-muted-foreground max-w-lg text-sm'>{description}</p>
      </div>
    </div>
  );
}

function SubmissionDetailDialog({
  submission,
  assignmentUuid,
  open,
  onOpenChange,
}: {
  submission: EnrichedSubmission | null;
  assignmentUuid?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: attachmentData, isLoading } = useQuery({
    ...getSubmissionAttachmentsOptions({
      path: {
        assignmentUuid: assignmentUuid as string,
        submissionUuid: submission?.uuid as string,
      },
    }),
    enabled: !!assignmentUuid && !!submission?.uuid,
  });

  const attachments = attachmentData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{submission?.assignmentTitle || 'Submission details'}</DialogTitle>
          <DialogDescription>
            Review learner work, attachments, and grading status.
          </DialogDescription>
        </DialogHeader>

        {!submission ? null : (
          <div className='space-y-5'>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='border-border/60 bg-muted/30 rounded-2xl border p-4'>
                <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                  Student
                </p>
                <p className='text-foreground mt-1 text-sm font-medium'>{submission.studentName}</p>
                <p className='text-muted-foreground mt-1 text-xs'>{submission.classTitle}</p>
              </div>
              <div className='border-border/60 bg-muted/30 rounded-2xl border p-4'>
                <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                  Status
                </p>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <Badge variant={getStatusVariant(submission.status)}>
                    {formatEnum(submission.status)}
                  </Badge>
                  <span className='text-muted-foreground text-xs'>
                    Submitted {formatDateTime(submission.submitted_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className='border-border/60 space-y-2 rounded-2xl border p-4'>
              <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                Submission text
              </p>
              <div className='text-foreground text-sm'>
                {submission.submission_text ? (
                  <RichTextRenderer htmlString={submission.submission_text} />
                ) : (
                  <p className='text-muted-foreground'>No written submission provided.</p>
                )}
              </div>
            </div>

            <div className='border-border/60 space-y-3 rounded-2xl border p-4'>
              <div className='flex items-center justify-between'>
                <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                  Attachments
                </p>
                <Badge variant='secondary'>{attachments.length}</Badge>
              </div>

              {isLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-14 w-full rounded-2xl' />
                  <Skeleton className='h-14 w-full rounded-2xl' />
                </div>
              ) : attachments.length === 0 ? (
                <p className='text-muted-foreground text-sm'>No attachment uploaded.</p>
              ) : (
                <div className='space-y-2'>
                  {attachments.map((attachment: any) => (
                    <a
                      key={attachment.uuid}
                      href={attachment.file_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='border-border/60 bg-background/80 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-between rounded-2xl border px-4 py-3 transition'
                    >
                      <div>
                        <p className='text-foreground text-sm font-medium'>
                          {attachment.original_filename || 'Submission file'}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          Open attachment in a new tab
                        </p>
                      </div>
                      <Eye className='text-muted-foreground h-4 w-4' />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GradeSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onSubmit,
  onReturn,
  isSubmitting,
  isReturning,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: EnrichedSubmission | null;
  onSubmit: (payload: { score: number; maxScore: number; comments: string }) => void;
  onReturn: (feedback: string) => void;
  isSubmitting: boolean;
  isReturning: boolean;
}) {
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [comments, setComments] = useState('');
  const [revisionFeedback, setRevisionFeedback] = useState('');

  useEffect(() => {
    if (!submission || !open) return;
    setScore(submission.score ? String(submission.score) : '');
    setMaxScore(submission.max_score ? String(submission.max_score) : '');
    setComments(submission.instructor_comments || '');
    setRevisionFeedback(submission.instructor_comments || '');
  }, [open, submission]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>
            {submission
              ? `${submission.studentName} · ${submission.assignmentTitle}`
              : 'Score learner work and leave instructor comments.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='score'>
                Score
              </label>
              <Input
                id='score'
                type='number'
                value={score}
                onChange={event => setScore(event.target.value)}
                placeholder='e.g. 84'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='max-score'>
                Max score
              </label>
              <Input
                id='max-score'
                type='number'
                value={maxScore}
                onChange={event => setMaxScore(event.target.value)}
                placeholder='e.g. 100'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-foreground text-sm font-medium' htmlFor='comments'>
              Grading comments
            </label>
            <Textarea
              id='comments'
              rows={4}
              value={comments}
              onChange={event => setComments(event.target.value)}
              placeholder='Feedback to the learner'
            />
          </div>

          <div className='border-border/60 bg-muted/30 space-y-2 rounded-2xl border p-4'>
            <label className='text-foreground text-sm font-medium' htmlFor='revision'>
              Return for revision
            </label>
            <Textarea
              id='revision'
              rows={3}
              value={revisionFeedback}
              onChange={event => setRevisionFeedback(event.target.value)}
              placeholder='Explain what the learner should revise before resubmitting'
            />
            <Button
              type='button'
              variant='outline'
              className='gap-2'
              disabled={!revisionFeedback.trim() || isReturning}
              onClick={() => onReturn(revisionFeedback)}
            >
              {isReturning ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Undo2 className='h-4 w-4' />
              )}
              Return for revision
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                score: Number(score),
                maxScore: Number(maxScore),
                comments,
              })
            }
            disabled={!score || !maxScore || isSubmitting}
          >
            {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InstructorAssessmentWorkspace({
  defaultTab = 'overview',
  defaultTaskType = 'assignment',
  embedded = false,
}: Props) {
  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const user = useUserProfile();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(defaultTab);
  const [taskType, setTaskType] = useState<TaskType>(defaultTaskType);
  const [submissionType, setSubmissionType] = useState<TaskType>('assignment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(ALL_COURSES);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EnrichedAssignment | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<EnrichedQuiz | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<EnrichedAssignment | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<EnrichedQuiz | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<EnrichedSubmission | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<EnrichedSubmission | null>(null);

  const { classes, loading: classesLoading } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const courseOptions = useMemo<CourseOption[]>(() => {
    const map = new Map<string, CourseOption>();

    classes.forEach((classItem: any) => {
      const courseId = classItem.course?.uuid;
      const courseTitle = classItem.course?.name;

      if (!courseId || !courseTitle) return;

      if (!map.has(courseId)) {
        map.set(courseId, {
          id: courseId,
          title: courseTitle,
          classTitles: [],
        });
      }

      if (classItem.title) {
        map.get(courseId)?.classTitles.push(classItem.title);
      }
    });

    return Array.from(map.values()).sort((left, right) => left.title.localeCompare(right.title));
  }, [classes]);

  const lessonQueries = useQueries({
    queries: courseOptions.map(course => ({
      ...getCourseLessonsOptions({
        path: { courseUuid: course.id },
        query: { pageable: {} },
      }),
      enabled: !!course.id,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const lessonMap = useMemo(() => {
    const map = new Map<string, { courseId: string; courseTitle: string }>();

    courseOptions.forEach((course, index) => {
      const lessons = lessonQueries[index]?.data?.data?.content ?? [];
      lessons.forEach((lesson: any) => {
        if (lesson.uuid) {
          map.set(lesson.uuid, { courseId: course.id, courseTitle: course.title });
        }
      });
    });

    return map;
  }, [courseOptions, lessonQueries]);

  const classEnrollmentQueries = useQueries({
    queries: classes.map((classItem: any) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: classItem.uuid as string },
      }),
      enabled: !!classItem.uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const classEnrollmentRows = useMemo(
    () =>
      classes.map((classItem: any, index: number) => ({
        classItem,
        enrollments: classEnrollmentQueries[index]?.data?.data ?? [],
      })),
    [classEnrollmentQueries, classes]
  );

  const uniqueStudentIds = useMemo(() => {
    const ids = new Set<string>();

    classEnrollmentRows.forEach(({ enrollments }) => {
      enrollments.forEach((enrollment: any) => {
        if (enrollment.student_uuid) {
          ids.add(enrollment.student_uuid);
        }
      });
    });

    return Array.from(ids);
  }, [classEnrollmentRows]);

  const studentQueries = useQueries({
    queries: uniqueStudentIds.map(studentUuid => ({
      ...getStudentByIdOptions({
        path: { uuid: studentUuid },
      }),
      enabled: !!studentUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();

    uniqueStudentIds.forEach((studentUuid, index) => {
      const student = studentQueries[index]?.data?.data;
      if (student) {
        map.set(studentUuid, student);
      }
    });

    return map;
  }, [studentQueries, uniqueStudentIds]);

  const userQueries = useQueries({
    queries: Array.from(studentMap.values()).map((student: any) => ({
      ...getUserByUuidOptions({
        path: { uuid: student.user_uuid as string },
      }),
      enabled: !!student?.user_uuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const userMap = useMemo(() => {
    const map = new Map<string, any>();

    Array.from(studentMap.values()).forEach((student: any, index: number) => {
      const user = userQueries[index]?.data?.data;
      if (user && student?.uuid) {
        map.set(student.uuid, user);
      }
    });

    return map;
  }, [studentMap, userQueries]);

  const enrollmentMetaMap = useMemo(() => {
    const map = new Map<
      string,
      { studentName: string; classTitle: string; courseId?: string; courseTitle?: string }
    >();

    classEnrollmentRows.forEach(({ classItem, enrollments }) => {
      enrollments.forEach((enrollment: any) => {
        if (!enrollment.uuid) return;

        const student = studentMap.get(enrollment.student_uuid);
        const user = student ? userMap.get(student.uuid) : null;

        map.set(enrollment.uuid, {
          studentName: user?.full_name || student?.full_name || 'Unknown student',
          classTitle: classItem.title || 'Untitled class',
          courseId: classItem.course?.uuid,
          courseTitle: classItem.course?.name,
        });
      });
    });

    return map;
  }, [classEnrollmentRows, studentMap, userMap]);

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    ...searchAssignmentsOptions({
      query: { searchParams: {}, pageable: {} },
    }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: quizzesData, isLoading: quizzesLoading } = useQuery({
    ...searchQuizzesOptions({
      query: { searchParams: {}, pageable: {} },
    }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    ...searchSubmissionsOptions({
      query: { searchParams: {}, pageable: {} },
    }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    ...searchAttemptsOptions({
      query: { searchParams: {}, pageable: {} },
    }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: pendingGradingData, isLoading: pendingLoading } = useQuery({
    ...getPendingGradingOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const assignments = useMemo<EnrichedAssignment[]>(
    () =>
      (assignmentsData?.data?.content ?? [])
        .map((assignment: any) => {
          const course = lessonMap.get(assignment.lesson_uuid);
          if (!course) return null;
          return {
            ...assignment,
            courseId: course.courseId,
            courseTitle: course.courseTitle,
          };
        })
        .filter(Boolean) as EnrichedAssignment[],
    [assignmentsData, lessonMap]
  );

  const quizzes = useMemo<EnrichedQuiz[]>(
    () =>
      (quizzesData?.data?.content ?? [])
        .map((quiz: any) => {
          const course = lessonMap.get(quiz.lesson_uuid);
          if (!course) return null;
          return {
            ...quiz,
            courseId: course.courseId,
            courseTitle: course.courseTitle,
          };
        })
        .filter(Boolean) as EnrichedQuiz[],
    [lessonMap, quizzesData]
  );

  const assignmentMap = useMemo(() => {
    const map = new Map<string, EnrichedAssignment>();
    assignments.forEach(assignment => {
      if (assignment.uuid) {
        map.set(assignment.uuid, assignment);
      }
    });
    return map;
  }, [assignments]);

  const quizMap = useMemo(() => {
    const map = new Map<string, EnrichedQuiz>();
    quizzes.forEach(quiz => {
      if (quiz.uuid) {
        map.set(quiz.uuid, quiz);
      }
    });
    return map;
  }, [quizzes]);

  const allSubmissions = useMemo<EnrichedSubmission[]>(
    () =>
      (submissionsData?.data?.content ?? [])
        .map((submission: any) => {
          const assignment = assignmentMap.get(submission.assignment_uuid);
          if (!assignment) return null;
          const enrollmentMeta = enrollmentMetaMap.get(submission.enrollment_uuid);

          return {
            ...submission,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: assignment.courseTitle,
            studentName: enrollmentMeta?.studentName || 'Unknown student',
            classTitle: enrollmentMeta?.classTitle || 'Assigned class',
          };
        })
        .filter(Boolean) as EnrichedSubmission[],
    [assignmentMap, enrollmentMetaMap, submissionsData]
  );

  const allAttempts = useMemo<EnrichedAttempt[]>(
    () =>
      (attemptsData?.data?.content ?? [])
        .map((attempt: any) => {
          const quiz = quizMap.get(attempt.quiz_uuid);
          if (!quiz) return null;
          const enrollmentMeta = enrollmentMetaMap.get(attempt.enrollment_uuid);

          return {
            ...attempt,
            quizTitle: quiz.title,
            courseId: quiz.courseId,
            courseTitle: quiz.courseTitle,
            studentName: enrollmentMeta?.studentName || 'Unknown student',
            classTitle: enrollmentMeta?.classTitle || 'Assigned class',
          };
        })
        .filter(Boolean) as EnrichedAttempt[],
    [attemptsData, enrollmentMetaMap, quizMap]
  );

  const pendingGrading = useMemo<EnrichedSubmission[]>(
    () =>
      (pendingGradingData?.data ?? [])
        .map((submission: any) => {
          const assignment = assignmentMap.get(submission.assignment_uuid);
          if (!assignment) return null;
          const enrollmentMeta = enrollmentMetaMap.get(submission.enrollment_uuid);

          return {
            ...submission,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: assignment.courseTitle,
            studentName: enrollmentMeta?.studentName || 'Unknown student',
            classTitle: enrollmentMeta?.classTitle || 'Assigned class',
          };
        })
        .filter(Boolean) as EnrichedSubmission[],
    [assignmentMap, enrollmentMetaMap, pendingGradingData]
  );

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assignments.filter(assignment => {
      if (selectedCourseId !== ALL_COURSES && assignment.courseId !== selectedCourseId) {
        return false;
      }

      if (!query) return true;

      return [assignment.title, assignment.courseTitle]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
    });
  }, [assignments, searchQuery, selectedCourseId]);

  console.log(instructor, 'instr');
  console.log(filteredAssignments, 'FASS');

  const filteredQuizzes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return quizzes.filter(quiz => {
      if (selectedCourseId !== ALL_COURSES && quiz.courseId !== selectedCourseId) {
        return false;
      }

      if (!query) return true;

      return [quiz.title, quiz.courseTitle]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
    });
  }, [quizzes, searchQuery, selectedCourseId]);

  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allSubmissions.filter(submission => {
      if (selectedCourseId !== ALL_COURSES && submission.courseId !== selectedCourseId) {
        return false;
      }

      if (!query) return true;

      return [submission.assignmentTitle, submission.studentName, submission.courseTitle]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
    });
  }, [allSubmissions, searchQuery, selectedCourseId]);

  const filteredAttempts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allAttempts.filter(attempt => {
      if (selectedCourseId !== ALL_COURSES && attempt.courseId !== selectedCourseId) {
        return false;
      }

      if (!query) return true;

      return [attempt.quizTitle, attempt.studentName, attempt.courseTitle]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
    });
  }, [allAttempts, searchQuery, selectedCourseId]);

  const gradebookRows = useMemo(
    () =>
      [
        ...filteredSubmissions
          .filter(item => item.score !== undefined || item.grade_display)
          .map(item => ({
            id: item.uuid as string,
            studentName: item.studentName,
            taskTitle: item.assignmentTitle,
            courseTitle: item.courseTitle,
            type: 'Assignment',
            scoreDisplay: item.grade_display || `${item.score ?? 0}/${item.max_score ?? 0}`,
            status: item.status,
            updatedAt: item.graded_at || item.updated_date || item.submitted_at,
          })),
        ...filteredAttempts
          .filter(item => item.score !== undefined || item.grade_display)
          .map(item => ({
            id: item.uuid as string,
            studentName: item.studentName,
            taskTitle: item.quizTitle,
            courseTitle: item.courseTitle,
            type: 'Quiz',
            scoreDisplay: item.grade_display || `${item.score ?? 0}/${item.max_score ?? 0}`,
            status: item.status,
            updatedAt: item.submitted_at || item.updated_date || item.created_date,
          })),
      ].sort((left, right) => moment(right.updatedAt).diff(moment(left.updatedAt))),
    [filteredAttempts, filteredSubmissions]
  );

  const stats = useMemo(
    () => ({
      assignments: assignments.length,
      quizzes: quizzes.length,
      pending: pendingGrading.length,
      gradedResults: gradebookRows.length,
    }),
    [assignments.length, gradebookRows.length, pendingGrading.length, quizzes.length]
  );

  const deleteAssignmentMut = useMutation(deleteAssignmentMutation());
  const deleteQuizMut = useMutation(deleteQuizMutation());
  const gradeSubmissionMut = useMutation(gradeSubmissionMutation());
  const returnSubmissionMut = useMutation(returnSubmissionMutation());

  const activeCourseIdForDialogs =
    selectedCourseId !== ALL_COURSES
      ? selectedCourseId
      : editingAssignment?.courseId || editingQuiz?.courseId || '';

  const canManageAssignment = (assignment?: EnrichedAssignment | null) => {
    if (!assignment) return false;
    const currentUserEmail = normalizeIdentity(user?.email);
    if (!currentUserEmail) return false;
    if (assignment.source_assignment_uuid) return false;

    return normalizeIdentity(assignment.created_by) === currentUserEmail;
  };

  const canManageQuiz = (quiz?: EnrichedQuiz | null) => {
    if (!quiz) return false;
    const currentUserEmail = normalizeIdentity(user?.email);
    if (!currentUserEmail) return false;
    if (quiz.source_quiz_uuid) return false;

    return normalizeIdentity(quiz.created_by) === currentUserEmail;
  };

  const resetAssignmentDialog = () => {
    setAssignmentDialogOpen(false);
    setEditingAssignment(null);
  };

  const resetQuizDialog = () => {
    setQuizDialogOpen(false);
    setEditingQuiz(null);
  };

  const refreshAssessmentQueries = () => {
    queryClient.invalidateQueries({
      queryKey: searchAssignmentsQueryKey({ query: { searchParams: {}, pageable: {} } }),
    });
    queryClient.invalidateQueries({
      queryKey: searchQuizzesQueryKey({ query: { searchParams: {}, pageable: {} } }),
    });
    queryClient.invalidateQueries({
      queryKey: searchSubmissionsQueryKey({ query: { searchParams: {}, pageable: {} } }),
    });
  };

  const handleDeleteAssignment = () => {
    if (!assignmentToDelete?.uuid) return;
    if (!canManageAssignment(assignmentToDelete)) {
      toast.error('Course creator assignments are view-only for instructors.');
      setAssignmentToDelete(null);
      return;
    }

    deleteAssignmentMut.mutate(
      { path: { uuid: assignmentToDelete.uuid } },
      {
        onSuccess: () => {
          toast.success('Assignment deleted.');
          setAssignmentToDelete(null);
          refreshAssessmentQueries();
        },
      }
    );
  };

  const handleDeleteQuiz = () => {
    if (!quizToDelete?.uuid) return;
    if (!canManageQuiz(quizToDelete)) {
      toast.error('Course creator quizzes are view-only for instructors.');
      setQuizToDelete(null);
      return;
    }

    deleteQuizMut.mutate(
      { path: { uuid: quizToDelete.uuid } },
      {
        onSuccess: () => {
          toast.success('Quiz deleted.');
          setQuizToDelete(null);
          refreshAssessmentQueries();
        },
      }
    );
  };

  const handleGradeSubmission = (payload: {
    score: number;
    maxScore: number;
    comments: string;
  }) => {
    if (!gradingSubmission?.uuid || !gradingSubmission.assignment_uuid) return;

    gradeSubmissionMut.mutate(
      {
        path: {
          assignmentUuid: gradingSubmission.assignment_uuid,
          submissionUuid: gradingSubmission.uuid,
        },
        query: {
          score: payload.score,
          maxScore: payload.maxScore,
          comments: payload.comments || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Submission graded successfully.');
          setGradingSubmission(null);
          queryClient.invalidateQueries({
            queryKey: searchSubmissionsQueryKey({ query: { searchParams: {}, pageable: {} } }),
          });
          queryClient.invalidateQueries({
            queryKey: getPendingGradingOptions({
              path: { instructorUuid: instructor?.uuid as string },
            }).queryKey,
          });
        },
      }
    );
  };

  const handleReturnSubmission = (feedback: string) => {
    if (!gradingSubmission?.uuid || !gradingSubmission.assignment_uuid) return;

    returnSubmissionMut.mutate(
      {
        path: {
          assignmentUuid: gradingSubmission.assignment_uuid,
          submissionUuid: gradingSubmission.uuid,
        },
        query: { feedback },
      },
      {
        onSuccess: () => {
          toast.success('Submission returned for revision.');
          setGradingSubmission(null);
          queryClient.invalidateQueries({
            queryKey: searchSubmissionsQueryKey({ query: { searchParams: {}, pageable: {} } }),
          });
          queryClient.invalidateQueries({
            queryKey: getPendingGradingOptions({
              path: { instructorUuid: instructor?.uuid as string },
            }).queryKey,
          });
        },
      }
    );
  };

  const selectedCourse = courseOptions.find(course => course.id === selectedCourseId);
  const isLoading =
    classesLoading ||
    assignmentsLoading ||
    quizzesLoading ||
    submissionsLoading ||
    attemptsLoading ||
    pendingLoading;

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-52 w-full rounded-[36px]' />
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
          <Skeleton className='h-28 w-full rounded-[28px]' />
        </div>
        <Skeleton className='h-[540px] w-full rounded-[28px]' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {!embedded ? (
        <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,97,237,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,97,237,0.12),transparent_38%)] dark:hidden' />
          <div className='relative space-y-6'>
            <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
              <div className='space-y-4'>
                <Badge className={elimikaDesignSystem.components.header.badge}>
                  Instructor assessment workspace
                </Badge>
                <div className='space-y-3'>
                  <h1 className={elimikaDesignSystem.components.header.title}>
                    Manage tasks, submissions, and grades
                  </h1>
                  <p className={elimikaDesignSystem.components.header.subtitle}>
                    Run assignment and quiz operations across your courses, review learner work, and
                    grade submissions from one responsive instructor surface.
                  </p>
                </div>
              </div>

              <Card className='border-primary/20 bg-primary/5 w-full max-w-md rounded-[32px] shadow-none'>
                <CardContent className='space-y-3 p-6'>
                  <div className='text-primary flex items-center gap-2'>
                    <Sparkles className='h-4 w-4' />
                    <span className='text-sm font-semibold'>Active assessment load</span>
                  </div>
                  <p className='text-foreground text-2xl font-semibold'>
                    {stats.pending} submission{stats.pending === 1 ? '' : 's'} waiting for action
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {selectedCourse
                      ? `Filtered to ${selectedCourse.title}.`
                      : 'Use the course filter below to narrow the workspace.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <FileText className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Assignments</p>
                      <p className='text-foreground text-2xl font-semibold'>{stats.assignments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <ListChecks className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Quizzes</p>
                      <p className='text-foreground text-2xl font-semibold'>{stats.quizzes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <ClipboardCheck className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Pending grading</p>
                      <p className='text-foreground text-2xl font-semibold'>{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <Trophy className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Recorded grades</p>
                      <p className='text-foreground text-2xl font-semibold'>
                        {stats.gradedResults}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      ) : null}

      <Card className='border-border/60 bg-card/95 overflow-hidden rounded-[32px]'>
        <CardContent className='space-y-5 p-5 sm:p-6'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-1'>
              <p className='text-foreground text-sm font-semibold'>Workspace filters</p>
              <p className='text-muted-foreground text-sm'>
                Filter the assessment workspace by course or search by learner and task name.
              </p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <div className='relative min-w-0 flex-1 sm:min-w-[260px]'>
                <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='Search task, student, or course'
                  className='pl-9'
                />
              </div>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className='sm:w-[260px]'>
                  <SelectValue placeholder='Select course' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COURSES}>All courses</SelectItem>
                  {courseOptions.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => {
                  setSelectedCourseId(ALL_COURSES);
                  setSearchQuery('');
                }}
              >
                <Filter className='h-4 w-4' />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as WorkspaceTab)}
        className='space-y-6'
      >
        <TabsList className='bg-muted/60 grid w-full grid-cols-2 gap-2 rounded-[24px] p-1 md:grid-cols-5'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='tasks'>Tasks</TabsTrigger>
          <TabsTrigger value='submissions'>Submissions</TabsTrigger>
          <TabsTrigger value='grades'>Grades</TabsTrigger>
          <TabsTrigger value='exams'>Exams</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <SectionIntro
            badge='Assessment pulse'
            title='Track what needs attention'
            description='See open grading work, current assessment volume, and the latest learner outcomes without switching pages.'
          />

          <div className='grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]'>
            <Card className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
              <CardHeader className='p-5 pb-3 sm:p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-foreground text-lg font-semibold'>Pending grading queue</h3>
                    <p className='text-muted-foreground text-sm'>
                      Assignment submissions that still need instructor action.
                    </p>
                  </div>
                  <Badge variant='secondary'>{pendingGrading.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-3 p-5 pt-0 sm:p-6 sm:pt-0'>
                {pendingGrading.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>Nothing pending right now.</p>
                ) : (
                  pendingGrading.slice(0, 5).map(item => (
                    <button
                      key={item.uuid}
                      type='button'
                      onClick={() => {
                        setGradingSubmission(item);
                        setActiveTab('grades');
                      }}
                      className='border-border/60 bg-background/70 hover:border-primary/40 hover:bg-primary/5 flex w-full flex-col gap-2 rounded-[24px] border p-4 text-left transition'
                    >
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-foreground font-medium'>{item.assignmentTitle}</p>
                        <Badge variant={getStatusVariant(item.status)}>
                          {formatEnum(item.status)}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        {item.studentName} · {item.courseTitle}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Submitted {formatDateTime(item.submitted_at)}
                      </p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className='space-y-6'>
              <Card className={getCardClasses()}>
                <CardContent className='space-y-4 p-0'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <Users className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-sm'>Active learners tracked</p>
                      <p className='text-foreground text-3xl font-semibold'>
                        {enrollmentMetaMap.size}
                      </p>
                    </div>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Learners with enrollments across your current instructor classes.
                  </p>
                </CardContent>
              </Card>

              <Card className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
                <CardHeader className='p-5 pb-3 sm:p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-foreground text-lg font-semibold'>Latest graded work</h3>
                      <p className='text-muted-foreground text-sm'>
                        Recent assignment grades and scored quiz attempts.
                      </p>
                    </div>
                    <Badge variant='secondary'>{gradebookRows.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3 p-5 pt-0 sm:p-6 sm:pt-0'>
                  {gradebookRows.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>No grades recorded yet.</p>
                  ) : (
                    gradebookRows.slice(0, 5).map(row => (
                      <div
                        key={row.id}
                        className='border-border/60 bg-background/70 rounded-[24px] border p-4'
                      >
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <p className='text-foreground font-medium'>{row.taskTitle}</p>
                          <Badge variant={getStatusVariant(row.status)}>{row.type}</Badge>
                        </div>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {row.studentName} · {row.courseTitle}
                        </p>
                        <p className='text-primary mt-1 text-xs'>{row.scoreDisplay}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='tasks' className='space-y-6'>
          <SectionIntro
            badge='Task management'
            title='Create and maintain course assessments'
            description='Manage instructor-owned assignments and quizzes by course with a cleaner, standard assessment layout.'
          />

          <div className='border-border/60 bg-card/90 flex flex-col gap-4 rounded-[28px] border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
            <Tabs
              value={taskType}
              onValueChange={value => setTaskType(value as TaskType)}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2 sm:w-[320px]'>
                <TabsTrigger value='assignment'>Assignments</TabsTrigger>
                <TabsTrigger value='quiz'>Quizzes</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* <div className='flex flex-col gap-3 sm:flex-row'>
              <Button
                disabled={selectedCourseId === ALL_COURSES}
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentDialogOpen(true);
                }}
              >
                <FileText className='mr-2 h-4 w-4' />
                New assignment
              </Button>
              <Button
                variant='outline'
                disabled={selectedCourseId === ALL_COURSES}
                onClick={() => {
                  setEditingQuiz(null);
                  setQuizDialogOpen(true);
                }}
              >
                <ListChecks className='mr-2 h-4 w-4' />
                New quiz
              </Button>
            </div> */}
          </div>

          {taskType === 'assignment' ? (
            filteredAssignments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title='No assignments found'
                description='Create a new assignment for the selected course or adjust the search and course filters.'
              />
            ) : (
              <div className='grid gap-4 xl:grid-cols-2'>
                {filteredAssignments.map(item => {
                  const isManageable = canManageAssignment(item);

                  return (
                    <Card
                      key={item.uuid}
                      className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}
                    >
                      <CardHeader className='space-y-3 p-5 pb-3 sm:p-6'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='space-y-2'>
                            <div className='flex flex-wrap gap-2'>
                              <Badge variant='secondary'>{item.courseTitle}</Badge>
                              <Badge variant={getStatusVariant(item.status)}>
                                {formatEnum(item.status)}
                              </Badge>
                              {!isManageable ? <Badge variant='outline'>View only</Badge> : null}
                            </div>
                            <h3 className='text-foreground text-lg font-semibold'>{item.title}</h3>
                          </div>
                          {isManageable ? (
                            <div className='flex items-center gap-2'>
                              <Button
                                variant='outline'
                                size='icon'
                                onClick={() => {
                                  setEditingAssignment(item);
                                  setAssignmentDialogOpen(true);
                                }}
                              >
                                <PenLine className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='outline'
                                size='icon'
                                onClick={() => setAssignmentToDelete(item)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4 p-5 pt-0 sm:p-6 sm:pt-0'>
                        <div className='text-muted-foreground text-sm'>
                          <RichTextRenderer htmlString={item.description || ''} maxChars={220} />
                        </div>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                              Due date
                            </p>
                            <p className='text-foreground mt-1 text-sm font-medium'>
                              {formatDateTime(item.due_date)}
                            </p>
                          </div>
                          <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                              Max. Points
                            </p>
                            <p className='text-foreground mt-1 text-sm font-medium'>
                              {item.points_display || `${item.max_points || 0} pts`}
                            </p>
                          </div>
                        </div>
                        {!isManageable ? (
                          <p className='text-muted-foreground text-xs'>
                            This assignment was created outside the instructor workspace and is
                            view-only here.
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : filteredQuizzes.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title='No quizzes found'
              description='Create a new quiz for the selected course or adjust the search and course filters.'
            />
          ) : (
            <div className='grid gap-4 xl:grid-cols-2'>
              {filteredQuizzes.map(item => {
                const isManageable = canManageQuiz(item);

                return (
                  <Card key={item.uuid} className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
                    <CardHeader className='space-y-3 p-5 pb-3 sm:p-6'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-2'>
                          <div className='flex flex-wrap gap-2'>
                            <Badge variant='secondary'>{item.courseTitle}</Badge>
                            <Badge variant={getStatusVariant(item.status)}>
                              {formatEnum(item.status)}
                            </Badge>
                            {!isManageable ? <Badge variant='outline'>View only</Badge> : null}
                          </div>
                          <h3 className='text-foreground text-lg font-semibold'>{item.title}</h3>
                        </div>
                        {isManageable ? (
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='icon'
                              onClick={() => {
                                setEditingQuiz(item);
                                setQuizDialogOpen(true);
                              }}
                            >
                              <PenLine className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='outline'
                              size='icon'
                              onClick={() => setQuizToDelete(item)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4 p-5 pt-0 sm:p-6 sm:pt-0'>
                      <p className='text-muted-foreground text-sm'>
                        {item.description || 'No description provided.'}
                      </p>
                      <div className='grid gap-3 sm:grid-cols-3'>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            Time limit
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {item.time_limit_display || 'Not timed'}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            Attempts
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {item.attempts_allowed || 'N/A'}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            Passing score
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {item.passing_score ?? 'N/A'}
                          </p>
                        </div>
                      </div>
                      {!isManageable ? (
                        <p className='text-muted-foreground text-xs'>
                          This quiz was created outside the instructor workspace and is view-only
                          here.
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* {selectedCourseId === ALL_COURSES ? (
            <EmptyState
              icon={BookOpen}
              title='Pick a course to create new tasks'
              description='You can still browse existing tasks across all courses, but creating a new assignment or quiz requires a specific course context.'
            />
          ) : null} */}
        </TabsContent>

        <TabsContent value='submissions' className='space-y-6'>
          <SectionIntro
            badge='Task submissions'
            title='Review learner work by assessment type'
            description='Assignments expose manual grading actions, while quiz attempts show automatically scored performance where available.'
          />

          <div className='border-border/60 bg-card/90 flex flex-col gap-4 rounded-[28px] border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
            <Tabs
              value={submissionType}
              onValueChange={value => setSubmissionType(value as TaskType)}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2 sm:w-[320px]'>
                <TabsTrigger value='assignment'>Assignment submissions</TabsTrigger>
                <TabsTrigger value='quiz'>Quiz attempts</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className='text-muted-foreground text-sm'>
              {submissionType === 'assignment'
                ? `${filteredSubmissions.length} submission${filteredSubmissions.length === 1 ? '' : 's'} found`
                : `${filteredAttempts.length} attempt${filteredAttempts.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {submissionType === 'assignment' ? (
            filteredSubmissions.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title='No assignment submissions found'
                description='Learner submissions will appear here once assignments are submitted in your courses.'
              />
            ) : (
              <div className='grid gap-4 xl:grid-cols-2'>
                {filteredSubmissions.map(item => (
                  <Card key={item.uuid} className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
                    <CardHeader className='space-y-3 p-5 pb-3 sm:p-6'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-2'>
                          <div className='flex flex-wrap gap-2'>
                            <Badge variant='secondary'>{item.courseTitle}</Badge>
                            <Badge variant={getStatusVariant(item.status)}>
                              {formatEnum(item.status)}
                            </Badge>
                          </div>
                          <h3 className='text-foreground text-lg font-semibold'>
                            {item.assignmentTitle}
                          </h3>
                          <p className='text-muted-foreground text-sm'>
                            {item.studentName} · {item.classTitle}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() => setViewingSubmission(item)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() => setGradingSubmission(item)}
                          >
                            <Award className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-4 p-5 pt-0 sm:p-6 sm:pt-0'>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            Submitted
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {formatDateTime(item.submitted_at)}
                          </p>
                        </div>
                        <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                          <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                            Grade
                          </p>
                          <p className='text-foreground mt-1 text-sm font-medium'>
                            {item.grade_display || 'Not graded yet'}
                          </p>
                        </div>
                      </div>
                      <div className='flex flex-wrap gap-3'>
                        <Button
                          variant='outline'
                          className='gap-2'
                          onClick={() => setViewingSubmission(item)}
                        >
                          <Eye className='h-4 w-4' />
                          View details
                        </Button>
                        <Button className='gap-2' onClick={() => setGradingSubmission(item)}>
                          <Award className='h-4 w-4' />
                          Grade submission
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : filteredAttempts.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title='No quiz attempts found'
              description='Quiz attempts will appear here once learners start or submit quizzes in your courses.'
            />
          ) : (
            <div className='grid gap-4 xl:grid-cols-2'>
              {filteredAttempts.map(item => (
                <Card key={item.uuid} className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
                  <CardHeader className='space-y-3 p-5 pb-3 sm:p-6'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='secondary'>{item.courseTitle}</Badge>
                        <Badge variant={getStatusVariant(item.status)}>
                          {formatEnum(item.status)}
                        </Badge>
                        <Badge variant={item.is_passed ? 'success' : 'outline'}>
                          {item.is_passed ? 'Passed' : 'Review'}
                        </Badge>
                      </div>
                      <h3 className='text-foreground text-lg font-semibold'>{item.quizTitle}</h3>
                      <p className='text-muted-foreground text-sm'>
                        {item.studentName} · {item.classTitle}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className='grid gap-3 p-5 pt-0 sm:grid-cols-3 sm:p-6 sm:pt-0'>
                    <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                      <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                        Score
                      </p>
                      <p className='text-foreground mt-1 text-sm font-medium'>
                        {item.grade_display || `${item.score ?? 0}/${item.max_score ?? 0}`}
                      </p>
                    </div>
                    <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                      <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                        Attempt
                      </p>
                      <p className='text-foreground mt-1 text-sm font-medium'>
                        Attempt {item.attempt_number || 1}
                      </p>
                    </div>
                    <div className='border-border/60 bg-background/70 rounded-2xl border p-3'>
                      <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                        Submitted
                      </p>
                      <p className='text-foreground mt-1 text-sm font-medium'>
                        {formatDateTime(item.submitted_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='grades' className='space-y-6'>
          <SectionIntro
            badge='Gradebook'
            title='Track grades across assignments and quizzes'
            description='Use the pending grading queue for manual marking, then review all recorded grades in one combined table.'
          />

          <div className='grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
            <Card className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
              <CardHeader className='p-5 pb-3 sm:p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-foreground text-lg font-semibold'>Pending grading</h3>
                    <p className='text-muted-foreground text-sm'>
                      Open each submission to score it or return it for revision.
                    </p>
                  </div>
                  <Badge variant='secondary'>{pendingGrading.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-3 p-5 pt-0 sm:p-6 sm:pt-0'>
                {pendingGrading.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No grading backlog.</p>
                ) : (
                  pendingGrading.map(item => (
                    <div
                      key={item.uuid}
                      className='border-border/60 bg-background/70 rounded-[24px] border p-4'
                    >
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div>
                          <p className='text-foreground font-medium'>{item.assignmentTitle}</p>
                          <p className='text-muted-foreground text-sm'>
                            {item.studentName} · {item.courseTitle}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          className='gap-2'
                          onClick={() => setGradingSubmission(item)}
                        >
                          <Award className='h-4 w-4' />
                          Grade
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={cx(getCardClasses(), 'p-0 hover:translate-y-0')}>
              <CardHeader className='p-5 pb-3 sm:p-6'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <h3 className='text-foreground text-lg font-semibold'>Recorded grades</h3>
                    <p className='text-muted-foreground text-sm'>
                      Latest assignment grades and quiz performance.
                    </p>
                  </div>
                  <Badge variant='secondary'>{gradebookRows.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className='p-5 pt-0 sm:p-6 sm:pt-0'>
                {gradebookRows.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No grades available yet.</p>
                ) : (
                  <div className='border-border/60 overflow-hidden rounded-[24px] border'>
                    <ScrollArea className='max-h-[520px]'>
                      <div className='min-w-[760px]'>
                        <div className='border-border/60 bg-muted/40 text-muted-foreground grid grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr_0.8fr] border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase'>
                          <span>Student</span>
                          <span>Task</span>
                          <span>Type</span>
                          <span>Score</span>
                          <span>Status</span>
                        </div>
                        {gradebookRows.map(row => (
                          <div
                            key={row.id}
                            className='border-border/40 grid grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr_0.8fr] items-center border-b px-4 py-3 text-sm last:border-b-0'
                          >
                            <div>
                              <p className='text-foreground font-medium'>{row.studentName}</p>
                              <p className='text-muted-foreground text-xs'>{row.courseTitle}</p>
                            </div>
                            <span className='text-foreground'>{row.taskTitle}</span>
                            <span className='text-muted-foreground'>{row.type}</span>
                            <span className='text-primary font-medium'>{row.scoreDisplay}</span>
                            <Badge variant={getStatusVariant(row.status)}>
                              {formatEnum(row.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='exams' className='space-y-6'>
          <SectionIntro
            badge='Exams'
            title='Exam operations are staged for backend support'
            description='The instructor UI now makes that limitation explicit instead of exposing an unfinished screen. Assignment and quiz workflows are fully usable today.'
          />

          <Card className={cx(getCardClasses(), 'hover:translate-y-0')}>
            <CardContent className='space-y-4 p-0'>
              <div className='flex items-start gap-4'>
                <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                  <GraduationCap className='h-5 w-5' />
                </div>
                <div className='space-y-3'>
                  <h3 className='text-foreground text-lg font-semibold'>
                    Exam management will plug into this workspace once the API is available
                  </h3>
                  <p className='text-muted-foreground max-w-3xl text-sm'>
                    I could not find a dedicated exam management or grading API in the generated
                    client. Rather than showing a broken interface, this section now communicates
                    the current platform capability clearly while assignments and quizzes handle the
                    active instructor assessment workflows.
                  </p>
                  <div className='flex flex-wrap gap-3'>
                    <Badge variant='secondary'>Assignments ready</Badge>
                    <Badge variant='secondary'>Quizzes ready</Badge>
                    <Badge variant='outline'>Exams awaiting backend support</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignmentDialog
        isOpen={assignmentDialogOpen}
        setOpen={setAssignmentDialogOpen}
        editingAssignmetId={editingAssignment?.uuid}
        initialValues={editingAssignment as any}
        courseId={activeCourseIdForDialogs}
        onCancel={resetAssignmentDialog}
        onSuccess={() => {
          resetAssignmentDialog();
          queryClient.invalidateQueries({
            queryKey: searchAssignmentsQueryKey({ query: { searchParams: {}, pageable: {} } }),
          });
        }}
      />

      <QuizDialog
        isOpen={quizDialogOpen}
        setOpen={setQuizDialogOpen}
        editingQuiz={editingQuiz?.uuid}
        initialValues={editingQuiz as any}
        courseId={activeCourseIdForDialogs}
        onCancel={resetQuizDialog}
        onSuccess={() => {
          resetQuizDialog();
          queryClient.invalidateQueries({
            queryKey: searchQuizzesQueryKey({ query: { searchParams: {}, pageable: {} } }),
          });
        }}
      />

      <DeleteModal
        open={!!assignmentToDelete}
        setOpen={open => !open && setAssignmentToDelete(null)}
        title='Delete assignment'
        description='This removes the assignment and its related learner submissions. This action cannot be undone.'
        onConfirm={handleDeleteAssignment}
        isLoading={deleteAssignmentMut.isPending}
        confirmText='Delete assignment'
      />

      <DeleteModal
        open={!!quizToDelete}
        setOpen={open => !open && setQuizToDelete(null)}
        title='Delete quiz'
        description='This removes the quiz from the instructor assessment workspace. This action cannot be undone.'
        onConfirm={handleDeleteQuiz}
        isLoading={deleteQuizMut.isPending}
        confirmText='Delete quiz'
      />

      <SubmissionDetailDialog
        open={!!viewingSubmission}
        onOpenChange={open => !open && setViewingSubmission(null)}
        submission={viewingSubmission}
        assignmentUuid={viewingSubmission?.assignment_uuid}
      />

      <GradeSubmissionDialog
        open={!!gradingSubmission}
        onOpenChange={open => !open && setGradingSubmission(null)}
        submission={gradingSubmission}
        onSubmit={handleGradeSubmission}
        onReturn={handleReturnSubmission}
        isSubmitting={gradeSubmissionMut.isPending}
        isReturning={returnSubmissionMut.isPending}
      />
    </div>
  );
}
