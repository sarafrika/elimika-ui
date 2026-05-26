'use client';

import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import {
  getAssignmentSchedulesOptions,
  getQuizSchedulesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassAssignmentSchedule, ClassQuizSchedule } from '@/services/client/types.gen';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ClassSessionLedgerSection } from './class-session-ledger-section';
import {
  buildClassSessionLedgerRows,
  type ClassSessionLedgerRow,
} from './class-session-ledger-table.utils';
import type { DateFilter } from './new-class-page.utils';

type ClassDeliveryStatusTabProps = {
  isLoadingClasses: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  dateFilter: DateFilter;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
  roleLabel?: string;
  studentCount: number;
  totalInstances: number;
  completionRate: number;
  visibleInstances: InstructorClassWithSchedule['schedule'];
  selectedInstanceUuid?: string;
  onAddClasses: () => void;
};

function DeliverySkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-40 rounded-[14px]' />
      <Skeleton className='h-[620px] rounded-[14px]' />
    </div>
  );
}

export function ClassDeliveryStatusTab(props: ClassDeliveryStatusTabProps) {
  const {
    isLoadingClasses,
    selectedClass,
    dateFilter,
    difficultyMap = {},
    roleLabel = 'Instructor view',
    studentCount,
    totalInstances,
    completionRate,
    visibleInstances,
  } = props;

  const { difficultyMap: fallbackDifficultyMap } = useDifficultyLevels();
  const mergedDifficultyMap = { ...fallbackDifficultyMap, ...difficultyMap };
  const showFinancialColumns = roleLabel !== 'Student view';
  const classUuid = selectedClass?.uuid;

  const [{ data: assignmentScheduleResp }, { data: quizScheduleResp }] = useQueries({
    queries: [
      {
        ...getAssignmentSchedulesOptions({ path: { classUuid: classUuid ?? '' } }),
        enabled: Boolean(classUuid),
      },
      {
        ...getQuizSchedulesOptions({ path: { classUuid: classUuid ?? '' } }),
        enabled: Boolean(classUuid),
      },
    ],
  });

  const assignmentSchedules: ClassAssignmentSchedule[] = assignmentScheduleResp?.data ?? [];
  const quizSchedules: ClassQuizSchedule[] = quizScheduleResp?.data ?? [];

  const rows = useMemo<ClassSessionLedgerRow[]>(() => {
    if (!selectedClass) return [];

    return buildClassSessionLedgerRows({
      selectedClass,
      visibleInstances,
      assignmentSchedules,
      quizSchedules,
      showFinancialColumns,
    });
  }, [
    assignmentSchedules,
    quizSchedules,
    selectedClass,
    showFinancialColumns,
    visibleInstances,
  ]);

  if (isLoadingClasses || !selectedClass) {
    return <DeliverySkeleton />;
  }

  const difficultyLabel = selectedClass.course?.difficulty_uuid
    ? mergedDifficultyMap[selectedClass.course.difficulty_uuid] ?? 'General'
    : 'General';

  const filterLabel =
    dateFilter === 'current-day'
      ? 'Today'
      : dateFilter === 'current-week'
        ? 'This week'
        : dateFilter === 'upcoming'
          ? 'Upcoming'
          : 'All dates';

  const assessmentCount = assignmentSchedules.length + quizSchedules.length;

  return (
    <div className='space-y-3'>
      <section className='overflow-hidden p-0'>
        {/* <div className='border-border/70 border-b px-4 py-4 sm:px-5 sm:py-5'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='rounded-full px-3 py-1 text-[11px] font-semibold'>
                {roleLabel}
              </Badge>
              <Badge variant='secondary' className='rounded-full px-3 py-1 text-[11px] font-semibold'>
                {filterLabel}
              </Badge>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <CalendarDays className='h-4 w-4' />
                  Filter
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>
                  {filterLabel}
                </p>
              </div>

              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <BarChart3 className='h-4 w-4' />
                  Delivery rate
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>
                  {completionRate}%
                </p>
              </div>

              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <Users className='h-4 w-4' />
                  Students
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>
                  {studentCount}
                </p>
              </div>

              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <CircleDot className='h-4 w-4' />
                  Instances
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>
                  {totalInstances}
                </p>
              </div>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <Pen className='h-4 w-4' />
                  Assessments
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>
                  {assessmentCount}
                </p>
              </div>
            </div>
          </div>
        </div> */}

        <CardContent className=''>
          <ClassSessionLedgerSection
            selectedClass={selectedClass}
            roleLabel={roleLabel}
            difficultyLabel={difficultyLabel}
            rows={rows}
            sessionProgress={completionRate}
            remainingSessions={Math.max(
              totalInstances - Math.round((completionRate / 100) * totalInstances),
              0
            )}
            rosterCount={studentCount}
            showFinancialColumns={showFinancialColumns}
            tableTitle='Delivery table'
            tableDescription='This table mirrors the session-level delivery overview used by the class workspace.'
          />
        </CardContent>
      </section>
    </div>
  );
}
