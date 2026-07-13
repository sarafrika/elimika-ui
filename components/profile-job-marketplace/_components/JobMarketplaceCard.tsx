'use client';

import { BriefcaseBusiness, CalendarDays, MapPin, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { StatusBadge } from '@/app/dashboard/@admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format-currency';
import type { ClassMarketplaceJob, Course, TrainingProgram } from '@/services/client/types.gen';

type ClassMarketplaceJobWithProgram = ClassMarketplaceJob & {
  readonly program_uuid?: string | null;
};

function formatEnumLabel(value?: string | null) {
  if (!value) return 'Not provided';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return 'Not provided';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getApplicationStatusLabel(status?: string | null) {
  if (!status) return 'Not applied';
  return formatEnumLabel(status);
}

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function getDisplayOrganisationLabel(job: ClassMarketplaceJob, organisationName?: string | null) {
  if (organisationName) return organisationName;
  if (job.organisation_uuid) return `Organisation ${shortId(job.organisation_uuid)}`;
  return 'Organisation';
}

function getJobProgramUuid(job: ClassMarketplaceJobWithProgram) {
  return job.program_uuid ?? null;
}

function getDisplayContentLabel(
  job: ClassMarketplaceJobWithProgram,
  course?: Course | null,
  program?: TrainingProgram | null
) {
  const programUuid = getJobProgramUuid(job);
  if (program?.title) return program.title;
  if (programUuid) return `Program ${shortId(programUuid)}`;
  if (course?.name) return course.name;
  if (job.course_uuid) return `Course ${shortId(job.course_uuid)}`;
  return 'Course or program';
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
      {children}
    </Badge>
  );
}

function JobBadgeRow({
  job,
  course,
  program,
  organisationName,
}: {
  job: ClassMarketplaceJobWithProgram;
  course?: Course | null;
  program?: TrainingProgram | null;
  organisationName?: string | null;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {typeof job.training_fee === 'number' ? (
        <Badge className='rounded-md border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'>
          {formatCurrency(job.training_fee)} / session
        </Badge>
      ) : (
        <MetaBadge>Fee not specified</MetaBadge>
      )}
      <MetaBadge>{formatEnumLabel(job.class_visibility)}</MetaBadge>
      <MetaBadge>{formatEnumLabel(job.session_format)}</MetaBadge>
      <MetaBadge>{formatEnumLabel(job.location_type)}</MetaBadge>
      <MetaBadge>{getDisplayOrganisationLabel(job, organisationName)}</MetaBadge>
      <MetaBadge>{getDisplayContentLabel(job, course, program)}</MetaBadge>
    </div>
  );
}

export function JobCard({
  job,
  onView,
  onEdit,
  onCancel,
  isManagementView,
  course,
  program,
  organisationName,
  applicationStatus,
  hasApplied,
  applicationsHref,
}: {
  job: ClassMarketplaceJobWithProgram;
  onView: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  isManagementView: boolean;
  course?: Course | null;
  program?: TrainingProgram | null;
  organisationName?: string | null;
  applicationStatus?: string | null;
  hasApplied?: boolean;
  applicationsHref?: string;
}) {
  const title = job.title ?? 'Untitled job';
  const applicationLabel = getApplicationStatusLabel(applicationStatus);

  return (
    <div className='group flex gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm transition hover:border-border hover:shadow-md'>
      <div className='flex flex-col items-center gap-2'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
          {isManagementView ? <ShieldCheck className='size-5' /> : <BriefcaseBusiness className='size-5' />}
        </div>
      </div>

      <div className='min-w-0 flex-1 space-y-3'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h3 className='truncate text-lg font-semibold tracking-tight text-foreground'>{title}</h3>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {getDisplayOrganisationLabel(job, organisationName)} · {getDisplayContentLabel(job, course, program)}
            </p>
          </div>
          <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
            <StatusBadge status={job.status} />
            {!isManagementView && applicationStatus ? (
              <StatusBadge status={applicationStatus} label={applicationLabel} />
            ) : null}
          </div>
        </div>

        <JobBadgeRow
          job={job}
          course={course}
          program={program}
          organisationName={organisationName}
        />

        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CalendarDays className='size-4 text-primary' />
            <span>{formatDateTime(job.default_start_time)}</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <MapPin className='size-4 text-primary' />
            <span>{job.location_name || formatEnumLabel(job.location_type)}</span>
          </div>
        </div>

        <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>
          {job.description || 'No description has been provided for this posting yet.'}
        </p>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <Button variant='outline' size='sm' onClick={onView}>
            View
          </Button>
          {isManagementView && applicationsHref ? (
            <Button asChild variant='secondary' size='sm'>
              <Link href={applicationsHref}>View applications</Link>
            </Button>
          ) : null}
          {isManagementView && onEdit ? (
            <Button variant='outline' size='sm' onClick={onEdit}>
              <Pencil className='mr-1 size-4' />
              Edit
            </Button>
          ) : null}
          {isManagementView && onCancel ? (
            <Button variant='destructive' size='sm' onClick={onCancel}>
              <Trash2 className='mr-1 size-4' />
              Cancel
            </Button>
          ) : null}

          {!isManagementView && hasApplied ? (
            <StatusBadge status='approved' label='You already applied' />
          ) : null}
        </div>
      </div>
    </div>
  );
}
