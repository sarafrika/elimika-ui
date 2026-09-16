import { ArrowRight, BriefcaseBusiness, CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTimeWithZone } from '@/lib/date';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication } from '@/services/client';
import { JOB_HIRES_PATH, jobLabel, jobPay } from '../hired-jobs';

export function HiredJobCard({
  application,
  job,
  organisationName,
}: {
  application: ClassMarketplaceJobApplication;
  job: ClassMarketplaceJob;
  organisationName?: string;
}) {
  return (
    <Link
      href={`${JOB_HIRES_PATH}/${application.job_uuid}`}
      className='group focus-visible:ring-ring block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
    >
      <Card className='group-hover:border-primary/50 h-full transition-colors'>
        <CardContent className='flex h-full flex-col gap-4'>
          <div className='flex items-start gap-3'>
            <div className='bg-primary/10 text-primary shrink-0 rounded-md p-3'>
              <BriefcaseBusiness className='size-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h2 className='text-foreground text-lg font-semibold break-words'>
                {job.title || 'Training job'}
              </h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                {organisationName || 'Organisation'}
              </p>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <StatusBadge
              tone='success'
              label={application.status === 'assigned' ? 'Class created' : 'Hired · awaiting class'}
            />
            {job.session_format && <Badge variant='outline'>{jobLabel(job.session_format)}</Badge>}
            {job.location_type && <Badge variant='outline'>{jobLabel(job.location_type)}</Badge>}
          </div>
          <p className='text-muted-foreground line-clamp-2 text-sm'>
            {job.description || 'View this job’s training assignment and class details.'}
          </p>
          <div className='space-y-2 text-sm'>
            <p className='flex items-start gap-2'>
              <CalendarDays className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <span>
                {formatDateTimeWithZone(
                  job.default_start_time ?? job.session_templates?.[0]?.start_time,
                  {
                    zone: job.session_templates?.[0]?.timezone,
                    fallback: 'Schedule to be confirmed',
                  }
                )}
              </span>
            </p>
            <p className='flex items-start gap-2'>
              <MapPin className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <span>{job.location_name || jobLabel(job.location_type)}</span>
            </p>
          </div>
          <div className='border-border mt-auto flex flex-wrap items-end justify-between gap-3 border-t pt-4'>
            <div>
              <p className='text-muted-foreground text-xs'>Instructor pay</p>
              <p className='mt-1 font-semibold'>{jobPay(job)}</p>
            </div>
            <span className='text-primary inline-flex items-center gap-2 text-sm font-medium'>
              View job details
              <ArrowRight className='size-4' />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
