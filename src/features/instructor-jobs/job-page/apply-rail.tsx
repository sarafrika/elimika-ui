'use client';

import { Building2 } from 'lucide-react';
import Link from 'next/link';

import {
  HIRING_STAGES,
  isClassCreatedStatus,
  isExitStatus,
  stageIndexOf,
  statusLabel,
} from '@/components/profile-job-marketplace/application-status';
import { isHiredApplication } from '@/components/profile-job-marketplace/hired-jobs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

import { ReadinessChip } from '../components/readiness-chip';
import { findWorkFilteredHref } from '../find-work/find-work-filters';
import { sessionDate } from '../job-facts';
import { applyGate } from '../job-readiness';
import {
  applicationPageHref,
  findWorkHref,
  hiredJobHref,
  myApplicationsHref,
} from '../job-routes';
import { EligibilityChecks } from './eligibility-checks';
import type { JobPageData } from './use-job-page';
import { SectionCard } from '@/components/data-display';

function stageSentence(status: string | null | undefined, organisation: string, interviewAt?: Date) {
  switch ((status ?? '').toLowerCase()) {
    case 'shortlisted':
      return `${organisation} shortlisted you. They may invite you to an interview next.`;
    case 'interviewing':
      return interviewAt
        ? `${organisation} invited you to an interview on ${formatDateTime(interviewAt)}.`
        : `${organisation} wants to interview you.`;
    case 'offered':
      return `${organisation} made you an offer. Hiring confirms it.`;
    case 'hired':
      return `You’re hired. ${organisation} creates the class next.`;
    case 'assigned':
      return 'You’re hired and the class is created.';
    default:
      return `${organisation} has your application and will review it.`;
  }
}

/** Five bars for applied → hired; the current stage is outlined. */
export function StageTracker({ status }: { status: string | null | undefined }) {
  const index = isClassCreatedStatus(status) ? HIRING_STAGES.length : stageIndexOf(status);
  return (
    <div
      role='img'
      aria-label={`Stage ${Math.min(index + 1, HIRING_STAGES.length)} of ${HIRING_STAGES.length}: ${statusLabel(status)}`}
      className='flex gap-1'
    >
      {HIRING_STAGES.map((stage, position) => (
        <span
          key={stage}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            position < index
              ? 'bg-primary'
              : position === index
                ? 'bg-primary/30 ring-primary ring-1 ring-inset'
                : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

export function ApplyRail({
  data,
  onApply,
  onSeeClashes,
  clashCount,
}: {
  data: JobPageData;
  onApply: () => void;
  onSeeClashes: () => void;
  clashCount: number;
}) {
  const { job, facts, open, readiness, eligibility, eligibilityQuery, application } = data;
  if (!job || !facts) return null;
  const organisationName = data.organisation?.name ?? 'The organisation';
  const status = data.applicationStatus;

  if (status) {
    const hired = isHiredApplication(status);
    return (
      <SectionCard
        title='Your application'
        description={
          application?.created_date ? `Applied ${formatDate(application.created_date)}` : undefined
        }
        className='border-primary/30'
      >
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <ReadinessChip label={statusLabel(status)} tone={hired ? 'success' : 'brand'} />
            {application?.updated_date ? (
              <span className='text-muted-foreground text-[13px]'>
                Updated {formatDate(application.updated_date)}
              </span>
            ) : null}
          </div>
          <StageTracker status={status} />
          <p className='text-foreground text-sm'>
            {stageSentence(status, organisationName, application?.interview_at)}
          </p>
          {application?.application_note ? (
            <blockquote className='border-border/70 bg-muted/30 text-muted-foreground rounded-md border px-3 py-2.5 text-sm whitespace-pre-line'>
              {application.application_note}
            </blockquote>
          ) : null}
          <Button asChild className='h-11'>
            <Link
              href={
                hired && job.uuid
                  ? hiredJobHref(job.uuid)
                  : application?.uuid
                    ? applicationPageHref(application.uuid)
                    : myApplicationsHref()
              }
            >
              {hired ? 'View hire' : 'Track application'}
            </Link>
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (!open) {
    return (
      <SectionCard
        title='Applications closed'
        description={facts.first ? `Closed ${sessionDate(facts.first, 'ddd D MMM')}` : undefined}
      >
        <div className='flex flex-col gap-3'>
          <p className='text-foreground text-sm'>
            {job.status === 'open'
              ? 'This job stopped taking applications when its first session started.'
              : 'This job is no longer taking applications.'}
          </p>
          <Button asChild variant='outline' className='h-11'>
            <Link href={findWorkHref()}>Browse open jobs</Link>
          </Button>
        </div>
      </SectionCard>
    );
  }

  const ready = readiness?.state === 'ready';
  const gate = applyGate(eligibility, data.rate);
  const reapplying = eligibility?.can_reapply === true && isExitStatus(eligibility.application_status);

  return (
    <SectionCard
      title='Can you apply?'
      description={
        ready ? 'Every check passes.' : 'Fix anything marked and the button unlocks.'
      }
      className='border-primary/30'
      bodyClassName='px-5 pt-1 pb-5'
    >
      <div className='flex flex-col'>
        <EligibilityChecks
          job={job}
          eligibility={eligibility}
          rate={data.rate}
          loading={eligibilityQuery.isLoading && !eligibility}
          error={eligibilityQuery.error}
          onRetry={() => eligibilityQuery.refetch()}
          sessionCount={facts.sessionCount}
          clashCount={clashCount}
          contentTitle={data.contentTitle}
          creatorName={data.creatorName}
          onSeeClashes={onSeeClashes}
        />
        {reapplying ? (
          <p className='text-muted-foreground mt-2 text-[13px]'>
            Your earlier application was {statusLabel(eligibility?.application_status).toLowerCase()}.
            You can apply again.
          </p>
        ) : null}
        <Button className='mt-3 h-11' disabled={!ready} onClick={onApply}>
          {reapplying ? 'Apply again' : 'Apply for this job'}
        </Button>
        <div className='text-muted-foreground mt-2 text-center text-[13px]'>
          {!readiness || readiness.state === 'checking' ? (
            <Skeleton className='mx-auto h-3 w-48' />
          ) : ready ? (
            'About a minute. You can withdraw until you’re hired.'
          ) : (
            gate.hint ?? readiness.fix
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/** The posting organisation, with a way into its other open jobs. */
export function OrganisationCard({ data }: { data: JobPageData }) {
  const { job, organisation, moreFromOrganisation } = data;
  if (!job?.organisation_uuid) return null;
  const name = organisation?.name ?? 'this organisation';

  return (
    <section
      aria-label='Organisation'
      className='border-border/70 bg-card flex flex-col gap-3 rounded-md border p-5 shadow-sm'
    >
      <div className='flex items-center gap-3'>
        <span
          aria-hidden
          className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'
        >
          <Building2 className='size-4.5' />
        </span>
        <div className='min-w-0'>
          {organisation ? (
            <p className='text-foreground truncate font-semibold'>{organisation.name}</p>
          ) : data.organisationLoading ? (
            <Skeleton className='h-4 w-36' />
          ) : (
            <p className='text-foreground font-semibold'>Organisation</p>
          )}
          <p className='text-muted-foreground text-[13px]'>
            {organisation?.admin_verified ? 'Verified organisation' : 'Organisation'}
          </p>
        </div>
      </div>
      {moreFromOrganisation === undefined ? (
        <Skeleton className='h-4 w-48' />
      ) : moreFromOrganisation > 0 ? (
        <Link
          href={findWorkFilteredHref({ organisation: job.organisation_uuid })}
          className='text-primary text-sm font-medium hover:underline'
        >
          {moreFromOrganisation} more open job{moreFromOrganisation === 1 ? '' : 's'} from {name}
        </Link>
      ) : (
        <p className='text-muted-foreground text-sm'>No other open jobs from {name} right now.</p>
      )}
    </section>
  );
}
