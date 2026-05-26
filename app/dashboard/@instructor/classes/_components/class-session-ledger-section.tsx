'use client';

import { CardContent } from '@/components/ui/card';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import { ClassSessionLedgerTable } from './class-session-ledger-table';
import type { ClassSessionLedgerRow } from './class-session-ledger-table.utils';

type ClassSessionLedgerSectionProps = {
  selectedClass: InstructorClassWithSchedule;
  roleLabel?: string;
  difficultyLabel: string;
  rows: ClassSessionLedgerRow[];
  sessionProgress: number;
  remainingSessions: number;
  rosterCount: number;
  showFinancialColumns: boolean;
  tableTitle?: string;
  tableDescription?: string;
};

export function ClassSessionLedgerSection({
  selectedClass,
  roleLabel = 'Instructor view',
  difficultyLabel,
  rows,
  sessionProgress,
  remainingSessions,
  rosterCount,
  showFinancialColumns,
  tableTitle = 'Session ledger',
  tableDescription = 'A session-by-session view of attendance, delivery, and settlement details.',
}: ClassSessionLedgerSectionProps) {
  const courseName = selectedClass.course?.name || selectedClass.title || 'Untitled class';
  const description =
    selectedClass.course?.description ||
    selectedClass.description ||
    'No class description has been provided yet.';
  const classFormat = selectedClass.session_format || 'Not specified';

  return (
    <div className='space-y-3'>
      <section className='overflow-hidden p-0'>
        {/* <div className='border-border/70 border-b px-4 py-4 sm:px-5 sm:py-5'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='rounded-full px-3 py-1 text-[11px] font-semibold'>
                  {roleLabel}
                </Badge>
                <Badge variant='secondary' className='rounded-full px-3 py-1 text-[11px] font-semibold'>
                  {rows.length} sessions
                </Badge>
              </div>

              <div className='space-y-1'>
                <h2 className='text-foreground text-xl font-semibold leading-tight sm:text-2xl'>
                  {selectedClass.title}
                </h2>
                <p className='text-muted-foreground text-sm sm:text-base'>{courseName}</p>
              </div>

              <div className='text-muted-foreground max-w-4xl text-sm leading-6 sm:text-[15px]'>
                <HTMLTextPreview htmlContent={description} className='[&_p]:mb-0' />
              </div>
            </div>

            <div className='grid min-w-0 gap-3 sm:min-w-[280px] sm:grid-cols-2 lg:w-[360px]'>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <Clock3 className='h-4 w-4' />
                  Sessions
                </p>
                <p className='text-foreground mt-2 text-lg font-semibold'>{rows.length}</p>
              </div>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <BarChart3 className='h-4 w-4' />
                  Progress
                </p>
                <p className='text-foreground mt-2 text-lg font-semibold'>{sessionProgress}%</p>
              </div>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <Users className='h-4 w-4' />
                  Learners
                </p>
                <p className='text-foreground mt-2 text-lg font-semibold'>{rosterCount}</p>
              </div>
              <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
                <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
                  <GraduationCap className='h-4 w-4' />
                  Format
                </p>
                <p className='text-foreground mt-2 text-sm font-semibold'>{classFormat}</p>
              </div>
            </div>
          </div>

          <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
              <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.14em]'>
                Class type
              </p>
              <p className='text-foreground mt-1 text-sm font-semibold'>
                {selectedClass.session_format || 'Not specified'}
              </p>
            </div>
            <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
              <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.14em]'>
                Difficulty
              </p>
              <p className='text-foreground mt-1 text-sm font-semibold'>{difficultyLabel}</p>
            </div>
            <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
              <p className='text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.14em]'>
                Remaining sessions
              </p>
              <p className={cn('mt-1 text-sm font-semibold', remainingSessions > 0 ? 'text-primary' : 'text-success')}>
                {remainingSessions}
              </p>
            </div>
          </div>
        </div> */}

        <CardContent className='space-y-4 px-0 py-0'>
          <div className='border-border/70 border-b px-4 py-4 sm:px-5'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-1'>
                <h3 className='text-foreground text-lg font-semibold'>
                  {tableTitle}
                </h3>

                <p className='text-muted-foreground text-sm'>
                  {tableDescription}
                </p>
              </div>

              <div className='flex flex-col items-start gap-2 sm:items-end'>
                <p className='text-muted-foreground text-xs tracking-[0.16em] uppercase'>
                  Payment details {showFinancialColumns ? 'visible' : 'hidden'}
                </p>

                <div className='bg-primary/5 border-primary/10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5'>
                  <span className='text-muted-foreground text-[11px] font-medium uppercase tracking-wide'>
                    Amount / Hr / Student
                  </span>

                  <span className='text-primary text-sm font-semibold'>
                    KSh {selectedClass?.training_fee}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className='px-4 pb-4 sm:px-5 sm:pb-5'>
            <ClassSessionLedgerTable
              rows={rows}
              showFinancialColumns={showFinancialColumns}
              emptyTitle='No class sessions available'
              emptyDescription='Once sessions are scheduled, they will appear in this ledger.'
            />
          </div>
        </CardContent>
      </section>
    </div>
  );
}
