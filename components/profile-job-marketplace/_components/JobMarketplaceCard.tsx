'use client';

import { BriefcaseBusiness, CalendarDays, MapPin, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
      <Badge variant='secondary' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.status)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.class_visibility)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.session_format)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.location_type)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {getDisplayOrganisationLabel(job, organisationName)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {getDisplayContentLabel(job, course, program)}
      </Badge>
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
  const statusStyles: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground border-border',
    approved: 'bg-success/10 text-success border-success/30',
    rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <Card className='group flex gap-4 rounded-[22px] border-border border-1 bg-card/50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <div className='flex flex-row items-center justify-between'>
        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          {isManagementView ? <ShieldCheck className='size-5' /> : <BriefcaseBusiness className='size-5' />}
        </div>

        <div>
          {!isManagementView && applicationStatus ? (
            <Badge
              variant='outline'
              className={cn(
                'rounded-full px-3 py-1 capitalize',
                statusStyles[applicationStatus.toLowerCase()] || 'bg-muted text-muted-foreground'
              )}
            >
              {applicationLabel}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className='min-w-0 flex-1 space-y-3'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='truncate text-lg font-semibold text-foreground'>{title}</h3>
            </div>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {getDisplayOrganisationLabel(job, organisationName)} · {getDisplayContentLabel(job, course, program)}
            </p>
          </div>
          <Badge variant={job.status === 'open' ? 'secondary' : 'outline'} className='rounded-full px-3 py-1'>
            {formatEnumLabel(job.status)}
          </Badge>
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
          <Button variant='outline' className='rounded-xl' onClick={onView}>
            View
          </Button>
          {isManagementView && applicationsHref ? (
            <Button asChild variant='secondary' className='rounded-xl'>
              <Link href={applicationsHref}>View applications</Link>
            </Button>
          ) : null}
          {isManagementView && onEdit ? (
            <Button variant='outline' className='rounded-xl' onClick={onEdit}>
              <Pencil className='mr-1 size-4' />
              Edit
            </Button>
          ) : null}
          {isManagementView && onCancel ? (
            <Button variant='destructive' className='rounded-xl' onClick={onCancel}>
              <Trash2 className='mr-1 size-4' />
              Cancel
            </Button>
          ) : null}

          {!isManagementView && hasApplied ? (
            <Badge variant='success' className='rounded-full px-3 py-1'>
              You already applied to this job
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
