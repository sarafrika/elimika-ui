'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useClassDetails } from '@/hooks/use-class-details';
import { useClassRoster } from '@/hooks/use-class-roster';
import {
  getAssignmentByUuidOptions,
  getAssignmentSubmissionsOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
  getRubricMatrixOptions,
  gradeSubmissionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { AssignmentSubmission, QuizAttempt, RubricMatrix } from '@/services/client/types.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Bell, PanelLeft, PanelRight, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SubmissionInsightsPanel } from './SubmissionInsightsPanel';
import { SubmissionStudentList } from './SubmissionStudentList';
import { SubmissionWorkspace } from './SubmissionWorkspace';
import type { AssignmentCardData, SubmissionStudent } from './assignment-types';

type AssignmentSubmissionOverlayProps = {
  taskId: string;
};

function formatDateLabel(value?: string | Date) {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No due date' : `Due ${format(date, 'MMM dd, yyyy')}`;
}

function parseTaskId(taskId: string) {
  if (taskId.startsWith('assignment_')) {
    return { taskType: 'assignment' as const, uuid: taskId.replace('assignment_', '') };
  }

  if (taskId.startsWith('quiz_')) {
    return { taskType: 'quiz' as const, uuid: taskId.replace('quiz_', '') };
  }

  return null;
}

function detectSubmissionKind(submission: AssignmentSubmission | null, attempt: QuizAttempt | null) {
  if (attempt) return 'quiz' as const;
  if (!submission) return 'text' as const;
  const fileUrl = submission.file_urls?.[0]?.toLowerCase();
  if (!fileUrl) return submission.submission_text ? ('text' as const) : ('document' as const);
  if (fileUrl.endsWith('.mp3') || fileUrl.endsWith('.wav') || fileUrl.endsWith('.m4a')) {
    return 'audio' as const;
  }
  return 'document' as const;
}

export function AssignmentSubmissionOverlay({ taskId }: AssignmentSubmissionOverlayProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId') ?? '';
  const parsedTask = parseTaskId(taskId);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [score, setScore] = useState('');
  const [comments, setComments] = useState('');

  const { data: classDetails } = useClassDetails(classId);
  const { rosterAllEnrollments } = useClassRoster(classId);

  const assignmentQuery = useQuery({
    ...getAssignmentByUuidOptions({ path: { uuid: parsedTask?.uuid as string } }),
    enabled: parsedTask?.taskType === 'assignment' && !!parsedTask.uuid,
  });

  const quizQuery = useQuery({
    ...getQuizByUuidOptions({ path: { uuid: parsedTask?.uuid as string } }),
    enabled: parsedTask?.taskType === 'quiz' && !!parsedTask?.uuid,
  });

  const assignmentSubmissionsQuery = useQuery({
    ...getAssignmentSubmissionsOptions({ path: { assignmentUuid: parsedTask?.uuid as string } }),
    enabled: parsedTask?.taskType === 'assignment' && !!parsedTask?.uuid,
  });

  const quizAttemptsQuery = useQuery({
    ...getQuizAttemptsOptions({
      path: { quizUuid: parsedTask?.uuid as string },
      query: { pageable: { page: 0, size: 100, sort: [] } },
    }),
    enabled: parsedTask?.taskType === 'quiz' && !!parsedTask?.uuid,
  });

  const task = assignmentQuery.data?.data ?? quizQuery.data?.data ?? null;
  const course = classDetails.course;
  const lessonTitle =
    classDetails.lessons.find(lesson => lesson.uuid === task?.lesson_uuid)?.title || 'Lesson';
  const rubricUuid = task?.rubric_uuid ?? null;

  const rubricQuery = useQueries({
    queries: rubricUuid
      ? [
        {
          ...getRubricMatrixOptions({ path: { rubricUuid } }),
          enabled: !!rubricUuid,
        },
      ]
      : [],
  });

  const rubricMatrix = (rubricQuery[0]?.data?.data as RubricMatrix | undefined) ?? null;

  const submissions = assignmentSubmissionsQuery.data?.data ?? [];
  const attempts = quizAttemptsQuery.data?.data?.content ?? [];

  const students = useMemo<SubmissionStudent[]>(() => {
    if (parsedTask?.taskType === 'assignment') {
      return submissions
        .map(submission => {
          const rosterEntry = rosterAllEnrollments.find(
            entry => entry.enrollment?.uuid === submission.enrollment_uuid
          );
          if (!rosterEntry?.enrollment?.uuid) return null;

          return {
            attendanceLabel: rosterEntry.enrollment.did_attend ? 'Present' : 'Pending',
            comments: submission.instructor_comments ? [submission.instructor_comments] : [],
            fileUrls: submission.file_urls ?? [],
            id: rosterEntry.enrollment.uuid,
            insightLabel: submission.is_graded ? 'Graded' : 'Awaiting review',
            name: rosterEntry.user?.full_name || 'Student',
            roleLabel: rosterEntry.user?.email || 'Learner',
            score: submission.score ?? 0,
            sections: [],
            submissionKind: detectSubmissionKind(submission, null),
            submissionStatus:
              submission.submission_status_display || (submission.is_graded ? 'Graded' : 'Submitted'),
            submissionText: submission.submission_text,
            submittedAt: submission.submitted_at ? new Date(submission.submitted_at).toISOString() : undefined,
          } satisfies SubmissionStudent;
        })
        .filter((item): item is SubmissionStudent => item !== null);
    }

    return attempts
      .map(attempt => {
        const rosterEntry = rosterAllEnrollments.find(
          entry => entry.enrollment?.uuid === attempt.enrollment_uuid
        );
        if (!rosterEntry?.enrollment?.uuid) return null;

        return {
          attendanceLabel: rosterEntry.enrollment.did_attend ? 'Present' : 'Pending',
          comments: [],
          id: rosterEntry.enrollment.uuid,
          insightLabel: attempt.is_passed ? 'Passed' : 'Needs review',
          name: rosterEntry.user?.full_name || 'Student',
          roleLabel: rosterEntry.user?.email || 'Learner',
          score: attempt.score ?? 0,
          sections: [],
          submissionKind: 'quiz',
          submissionStatus: attempt.grade_display || `${attempt.status}`,
          submittedAt: attempt.submitted_at ? new Date(attempt.submitted_at).toISOString() : undefined,
        } satisfies SubmissionStudent;
      })
      .filter((item): item is SubmissionStudent => item !== null);
  }, [attempts, parsedTask?.taskType, rosterAllEnrollments, submissions]);

  const filteredStudents = useMemo(
    () => students.filter(student => student.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search, students]
  );

  const selectedStudent =
    filteredStudents.find(student => student.id === selectedStudentId) ??
    students.find(student => student.id === selectedStudentId) ??
    filteredStudents[0] ??
    students[0];

  const selectedSubmission =
    parsedTask?.taskType === 'assignment'
      ? submissions.find(item => item.enrollment_uuid === selectedStudent?.id) ?? null
      : null;
  const selectedAttempt =
    parsedTask?.taskType === 'quiz'
      ? attempts.find(item => item.enrollment_uuid === selectedStudent?.id) ?? null
      : null;

  const gradeSubmissionMut = useMutation(gradeSubmissionMutation());

  const assignmentCard = useMemo<AssignmentCardData | null>(() => {
    if (!task || !parsedTask) return null;
    return {
      ctaLabel: parsedTask.taskType === 'assignment' ? 'Grade Submission' : 'View Attempt',
      dueLabel: formatDateLabel(
        parsedTask.taskType === 'assignment' ? task.due_date : selectedAttempt?.submitted_at
      ),
      iconTone: 'blue',
      id: taskId,
      instructor: classDetails.class?.title || 'Instructor task',
      lesson: lessonTitle,
      lessonUuid: task.lesson_uuid,
      rubricUuid,
      status: parsedTask.taskType === 'assignment' ? 'ongoing' : 'graded',
      statusLabel: parsedTask.taskType === 'assignment' ? 'Submission' : 'Attempt',
      studentSummary: course?.name,
      subtitle: task.title,
      taskType: parsedTask.taskType,
    };
  }, [classDetails.class?.title, course?.name, lessonTitle, parsedTask, rubricUuid, selectedAttempt?.submitted_at, task, taskId]);

  const handleClose = () => {
    router.push('/dashboard/assignment');
  };

  const handleGradeSubmission = () => {
    if (!parsedTask || parsedTask.taskType !== 'assignment' || !selectedSubmission?.uuid) return;

    const maxScore = selectedSubmission.max_score ?? task?.max_points ?? 100;
    const numericScore = Number(score || selectedSubmission.score || 0);

    if (!Number.isFinite(numericScore)) {
      toast.error('Enter a valid score before saving.');
      return;
    }

    gradeSubmissionMut.mutate(
      {
        path: {
          assignmentUuid: parsedTask.uuid,
          submissionUuid: selectedSubmission.uuid,
        },
        query: {
          comments: comments || selectedSubmission.instructor_comments || undefined,
          maxScore,
          score: numericScore,
        },
      },
      {
        onSuccess: () => {
          toast.success('Submission graded successfully.');
          queryClient.invalidateQueries({
            queryKey: getAssignmentSubmissionsOptions({
              path: { assignmentUuid: parsedTask.uuid },
            }).queryKey,
          });
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to grade submission.');
        },
      }
    );
  };

  if (!parsedTask || !assignmentCard) {
    return (
      <div className='p-6 text-sm text-muted-foreground'>
        This task could not be resolved.
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-[100] bg-[color-mix(in_oklch,var(--el-brand-50)_80%,var(--background))]'>
      <header className='bg-primary text-primary-foreground flex h-16 items-center justify-between gap-3 border-b px-4 shadow-sm'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold'>
            {filteredStudents.length}
          </span>
          <div className='min-w-0'>
            <h1 className='truncate text-lg font-semibold'>
              {assignmentCard.lesson} · {assignmentCard.subtitle}
            </h1>
            <p className='text-primary-foreground/80 truncate text-xs'>
              Submission workspace · {assignmentCard.dueLabel}
            </p>
          </div>
        </div>

        <div className='hidden min-w-0 flex-1 justify-center lg:flex'>
          <div className='relative w-full max-w-xl'>
            <Search className='text-primary-foreground/70 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search students'
              className='h-11 rounded-full border-white/15 bg-white/10 pl-11 text-primary-foreground placeholder:text-primary-foreground/60'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelLeft className='h-4 w-4' />
                Students
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-[88vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Student submissions</SheetTitle>
                <SheetDescription>Select a student submission to review.</SheetDescription>
              </SheetHeader>
              <SubmissionStudentList
                onClose={handleClose}
                onSelect={setSelectedStudentId}
                search={search}
                selectedStudentId={selectedStudent?.id ?? ''}
                setSearch={setSearch}
                showCloseAction={false}
                students={filteredStudents}
              />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='text-primary-foreground gap-2 hover:bg-white/10 xl:hidden'
              >
                <PanelRight className='h-4 w-4' />
                Insights
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[92vw] max-w-sm p-0'>
              <SheetHeader className='sr-only'>
                <SheetTitle>Submission insights</SheetTitle>
                <SheetDescription>Review grading insights and actions for this student.</SheetDescription>
              </SheetHeader>
              {selectedStudent ? (
                <SubmissionInsightsPanel
                  rubricMatrix={rubricMatrix}
                  showFooterAction={false}
                  student={selectedStudent}
                  taskType={parsedTask.taskType}
                />
              ) : null}
            </SheetContent>
          </Sheet>

          <Button variant='ghost' size='icon' className='text-primary-foreground hover:bg-white/10'>
            <Bell className='h-4 w-4' />
          </Button>
          <Button variant='ghost' onClick={handleClose} className='text-primary-foreground hover:bg-white/10'>
            Close
          </Button>
        </div>
      </header>

      <section className='grid h-[calc(100vh-4rem)] min-h-0 xl:grid-cols-[300px_minmax(0,1fr)_340px]'>
        <div className='hidden min-h-0 min-w-0 overflow-hidden xl:block'>
          <SubmissionStudentList
            onClose={handleClose}
            onSelect={setSelectedStudentId}
            search={search}
            selectedStudentId={selectedStudent?.id ?? ''}
            setSearch={setSearch}
            students={filteredStudents}
          />
        </div>

        <div className='min-h-0 min-w-0 overflow-hidden'>
          <SubmissionWorkspace
            assignment={assignmentCard}
            comments={comments}
            onCloseDetails={handleClose}
            onCommentsChange={setComments}
            onGradeSubmission={handleGradeSubmission}
            onScoreChange={setScore}
            rubricMatrix={rubricMatrix}
            score={score}
            student={selectedStudent}
            submission={selectedSubmission}
            taskType={parsedTask.taskType}
            quizAttempt={selectedAttempt}
            isSavingGrade={gradeSubmissionMut.isPending}
          />
        </div>

        <div className='min-h-0 min-w-0 overflow-hidden xl:block'>
          {selectedStudent ? (
            <SubmissionInsightsPanel
              rubricMatrix={rubricMatrix}
              student={selectedStudent}
              taskType={parsedTask.taskType}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
