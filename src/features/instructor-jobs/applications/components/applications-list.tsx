'use client';

import Link from 'next/link';

import {
  canReapply,
  canWithdraw,
  isLiveApplication,
} from '@/components/profile-job-marketplace/application-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRate } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobApplication } from '@/services/client';

import { applicationPageHref, jobPageHref } from '../../job-routes';
import { applicationNextStep, isJobOpen, organisationOf } from '../application-view';
import { ApplicationStageChip, ApplicationStageTracker } from './application-stage';

type Application = ClassMarketplaceJobApplication;

type ListProps = {
  applications: Application[];
  now: number;
  onWithdraw: (application: Application) => void;
};

/** "Mwangaza Learning Centre · Westlands · KES 4,500 / session" */
export function applicationJobMeta(application: Application) {
  const job = application.job;
  const place = job?.branch_name || (job?.location_type === 'ONLINE' ? 'Online' : null);
  const pay =
    typeof job?.instructor_pay === 'number' ? formatRate(job.instructor_pay, job.rate_basis) : null;
  return [organisationOf(job), place, pay].filter(Boolean).join(' · ');
}

const titleOf = (application: Application) => application.job?.title || 'Untitled job';

function RowActions({
  application,
  onWithdraw,
  className,
}: {
  application: Application;
  onWithdraw: (application: Application) => void;
  className?: string;
}) {
  const title = titleOf(application);
  const uuid = application.uuid;
  const reapplyJobUuid =
    canReapply(application.status) && isJobOpen(application.job) ? application.job_uuid : null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {canWithdraw(application.status) ? (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onWithdraw(application)}
          aria-label={`Withdraw your application for ${title}`}
        >
          Withdraw
        </Button>
      ) : null}
      {reapplyJobUuid ? (
        <Button variant='outline' size='sm' asChild>
          <Link href={jobPageHref(reapplyJobUuid)} aria-label={`Apply again for ${title}`}>
            Apply again
          </Link>
        </Button>
      ) : null}
      {uuid ? (
        <Button variant='outline' size='sm' asChild>
          <Link href={applicationPageHref(uuid)} aria-label={`View your application for ${title}`}>
            View
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function JobCell({ application }: { application: Application }) {
  const title = titleOf(application);
  return (
    <div className='min-w-0'>
      {application.uuid ? (
        <Link
          href={applicationPageHref(application.uuid)}
          className='text-foreground font-semibold break-words hover:underline'
        >
          {title}
        </Link>
      ) : (
        <span className='text-foreground font-semibold break-words'>{title}</span>
      )}
      <p className='text-muted-foreground mt-0.5 text-sm break-words'>
        {applicationJobMeta(application)}
      </p>
    </div>
  );
}

function StageCell({ application }: { application: Application }) {
  return (
    <div className='flex flex-col items-start gap-2'>
      <ApplicationStageChip status={application.status} />
      {isLiveApplication(application.status) ? (
        <ApplicationStageTracker status={application.status} />
      ) : null}
    </div>
  );
}

function NextStepCell({ application, now }: { application: Application; now: number }) {
  const step = applicationNextStep(application, now);
  return (
    <div className='min-w-0'>
      <p
        className={cn(
          'text-foreground text-sm break-words',
          step.emphasis ? 'font-semibold' : 'font-medium'
        )}
      >
        {step.title}
      </p>
      {step.detail ? (
        <p className='text-muted-foreground text-sm break-words'>{step.detail}</p>
      ) : null}
    </div>
  );
}

/** A table on wide screens and stacked cards on phones. */
export function ApplicationsList({ applications, now, onWithdraw }: ListProps) {
  return (
    <>
      <div className='hidden md:block'>
        <Table className='table-fixed'>
          <TableHeader className='bg-muted/40'>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='text-muted-foreground w-[34%] px-5 text-xs font-semibold'>
                Job
              </TableHead>
              <TableHead className='text-muted-foreground w-[17%] px-3 text-xs font-semibold'>
                Stage
              </TableHead>
              <TableHead className='text-muted-foreground px-3 text-xs font-semibold'>
                Next step
              </TableHead>
              <TableHead className='text-muted-foreground w-[250px] px-5 text-right text-xs font-semibold'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map(application => (
              <TableRow key={application.uuid} className='border-border/60'>
                <TableCell className='px-5 py-4 align-top whitespace-normal'>
                  <JobCell application={application} />
                </TableCell>
                <TableCell className='px-3 py-4 align-top whitespace-normal'>
                  <StageCell application={application} />
                </TableCell>
                <TableCell className='px-3 py-4 align-top whitespace-normal'>
                  <NextStepCell application={application} now={now} />
                </TableCell>
                <TableCell className='px-5 py-4 align-top whitespace-normal'>
                  <RowActions
                    application={application}
                    onWithdraw={onWithdraw}
                    className='justify-end'
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className='divide-border/60 divide-y md:hidden'>
        {applications.map(application => (
          <li key={application.uuid} className='space-y-3 px-4 py-4'>
            <JobCell application={application} />
            <StageCell application={application} />
            <NextStepCell application={application} now={now} />
            <RowActions application={application} onWithdraw={onWithdraw} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function ApplicationsListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className='divide-border/60 divide-y' aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className='grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr)_170px_minmax(0,1.3fr)_220px] md:items-center md:gap-5'
        >
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-24 rounded-full' />
            <Skeleton className='h-1.5 w-36' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <div className='flex gap-2 md:justify-end'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-14' />
          </div>
        </div>
      ))}
    </div>
  );
}
