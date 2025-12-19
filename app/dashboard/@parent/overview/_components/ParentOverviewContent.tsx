'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import type {
  GuardianDashboardSnapshot,
  GuardianLinkedStudent,
  GuardianShareScope,
} from '@/services/guardian';
import { useGuardianDashboard, useGuardianStudents } from '@/services/guardian';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { GuardianStudentSelector } from './GuardianStudentSelector';
import { GuardianLearnerSummary } from './GuardianLearnerSummary';
import {
  GuardianCourseProgressGrid,
  type CourseProgressFilter,
} from './GuardianCourseProgressGrid';
import { GuardianProgramTimeline } from './GuardianProgramTimeline';
import { GuardianAttendancePanel } from './GuardianAttendancePanel';
import { GuardianEnrollmentNotice } from './GuardianEnrollmentNotice';
import { GuardianEmptyState } from './GuardianEmptyState';
import { ParentDashboardSkeleton } from './ParentDashboardSkeleton';

const STUDENT_SELECTION_KEY = 'guardian-dashboard:selected-student';

export function ParentOverviewContent() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const profile = useUserProfile();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(STUDENT_SELECTION_KEY);
  });
  const [courseFilter, setCourseFilter] = useState<CourseProgressFilter>('all');
  const [liveMessage, setLiveMessage] = useState('');
  const [inactiveStudent, setInactiveStudent] = useState<GuardianLinkedStudent | null>(null);

  useEffect(() => {
    replaceBreadcrumbs([
      { title: 'Parent portal', href: '/dashboard/overview' },
      { title: 'Overview' },
    ]);
  }, [replaceBreadcrumbs]);

  const {
    data: students = [],
    isLoading: isLoadingStudents,
    error: studentsError,
    refetch: refetchStudents,
  } = useGuardianStudents();

  const activeStudent = useMemo(
    () => students.find(student => student.student_uuid === selectedStudentId),
    [students, selectedStudentId]
  );

  useEffect(() => {
    if (!students.length || isLoadingStudents) {
      return;
    }

    const current = students.find(student => student.student_uuid === selectedStudentId);
    if (current && current.status === 'ACTIVE') {
      return;
    }

    const firstActive = students.find(student => student.status === 'ACTIVE');
    if (firstActive) {
      setSelectedStudentId(firstActive.student_uuid);
    } else if (!selectedStudentId) {
      setSelectedStudentId(students[0]?.student_uuid ?? null);
    }
  }, [students, selectedStudentId, isLoadingStudents]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedStudentId) {
      localStorage.setItem(STUDENT_SELECTION_KEY, selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (activeStudent) {
      setLiveMessage(`Loaded ${activeStudent.student_name}'s dashboard`);
    }
  }, [activeStudent]);

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: isDashboardRefetching,
  } = useGuardianDashboard(activeStudent?.student_uuid);

  const shareScope: GuardianShareScope =
    dashboard?.share_scope ?? activeStudent?.share_scope ?? 'FULL';
  const showAcademicWidgets = shareScope !== 'ATTENDANCE';
  const canLinkLearners = profile?.user_domain?.some(domain =>
    ['admin', 'instructor'].includes(domain)
  );

  const ageRestrictionNotice = useMemo(() => {
    if (!dashboard?.compliance_notices?.length) {
      return null;
    }
    return dashboard.compliance_notices.find(notice => notice.code?.toLowerCase().includes('age'));
  }, [dashboard?.compliance_notices]);

  const handleRefresh = async () => {
    const tasks: Promise<unknown>[] = [refetchStudents()];
    if (activeStudent?.student_uuid) {
      tasks.push(refetchDashboard());
    }
    await Promise.all(tasks);
  };

  const renderDashboard = (snapshot?: GuardianDashboardSnapshot) => {
    if (!snapshot) {
      return null;
    }

    const courseProgress = snapshot.course_progress?.slice(0, 10) ?? [];
    const programProgress = snapshot.program_progress ?? [];

    return (
      <>
        <GuardianLearnerSummary
          studentName={snapshot.student_name}
          relationship={snapshot.relationship ?? activeStudent?.relationship}
          gradeLevel={activeStudent?.grade_level}
          shareScope={shareScope}
          lastSyncedAt={snapshot.last_synced_at ?? activeStudent?.last_synced_at}
        />

        <div
          className={cn(
            'grid gap-4',
            showAcademicWidgets ? 'lg:grid-cols-[2fr,1fr]' : 'lg:grid-cols-1'
          )}
        >
          {showAcademicWidgets && (
            <div className='space-y-4'>
              <GuardianCourseProgressGrid
                courses={courseProgress}
                filter={courseFilter}
                onFilterChange={setCourseFilter}
              />
              <GuardianProgramTimeline programs={programProgress} />
            </div>
          )}
          <div className={cn('space-y-4', showAcademicWidgets ? '' : 'lg:col-span-1')}>
            <GuardianAttendancePanel shareScope={shareScope} />
          </div>
        </div>
      </>
    );
  };

  if (isLoadingStudents || (isDashboardLoading && !dashboard && !!activeStudent)) {
    return <ParentDashboardSkeleton />;
  }

  if (!isLoadingStudents && !students.length) {
    return <GuardianEmptyState />;
  }

  return (
    <div className='space-y-6'>
      <div className='border-border/70 bg-card rounded-3xl border p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-3'>
            <Badge variant='outline' className='tracking-[0.3em] uppercase'>
              Parent portal
            </Badge>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Welcome back, {profile?.first_name ?? 'Guardian'}
              </h1>
              <p className='text-muted-foreground text-sm'>
                Monitor coursework, attendance, and program milestones for each linked learner.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='secondary'
                size='sm'
                onClick={handleRefresh}
                disabled={isDashboardLoading || isDashboardRefetching}
                className='gap-2'
              >
                <RefreshCw
                  className={cn(
                    'size-4',
                    (isDashboardLoading || isDashboardRefetching) && 'animate-spin'
                  )}
                />
                Refresh data
              </Button>
              {canLinkLearners && (
                <Button asChild variant='ghost' size='sm'>
                  <Link href='/dashboard/students?view=links'>Link another learner</Link>
                </Button>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-3 lg:min-w-[360px]'>
            <GuardianStudentSelector
              students={students}
              selectedStudentId={activeStudent?.student_uuid ?? selectedStudentId}
              onSelect={setSelectedStudentId}
              onInactiveAttempt={setInactiveStudent}
              isDisabled={Boolean(studentsError)}
            />
            <p className='text-muted-foreground text-xs'>
              Switching learners updates the dashboard instantly and is announced for screen
              readers.
            </p>
          </div>
        </div>
      </div>

      {studentsError ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load linked learners</AlertTitle>
          <AlertDescription className='mt-2 flex flex-col gap-3 text-sm'>
            <span>
              {studentsError instanceof Error
                ? studentsError.message
                : 'Please try refreshing the page.'}
            </span>
            <Button size='sm' variant='outline' onClick={() => refetchStudents()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {dashboardError ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load this learner</AlertTitle>
          <AlertDescription className='mt-2 space-y-3 text-sm'>
            <p>
              {dashboardError instanceof Error
                ? dashboardError.message
                : 'Select a different learner or refresh to try again.'}
            </p>
            <div className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={() => refetchDashboard()}>
                Retry
              </Button>
              <Button size='sm' variant='ghost' onClick={() => setSelectedStudentId(null)}>
                Re-select learner
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {ageRestrictionNotice ? <GuardianEnrollmentNotice notice={ageRestrictionNotice} /> : null}

      {renderDashboard(dashboard)}

      <div className='sr-only' aria-live='polite'>
        {liveMessage}
      </div>

      <Dialog
        open={Boolean(inactiveStudent)}
        onOpenChange={open => {
          if (!open) {
            setInactiveStudent(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link pending</DialogTitle>
            <DialogDescription>
              {inactiveStudent?.student_name} must accept the guardian invitation before you can
              view their dashboard. Contact the instructor or resend the invite from the admin area.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='secondary' onClick={() => setInactiveStudent(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
