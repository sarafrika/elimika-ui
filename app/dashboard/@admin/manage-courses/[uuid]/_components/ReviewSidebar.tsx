'use client';

import { CheckCircle2, ExternalLink, ShieldOff, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Course } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { adminTheme } from '../../../_components/ui/admin-theme';

function money(value?: number | string | null): string {
  if (value == null || value === '') return '—';
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : `KES ${n.toLocaleString()}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-right font-medium text-foreground'>{value ?? '—'}</span>
    </div>
  );
}

export function ReviewSidebar({
  course,
  isPending,
  onApprove,
  onReject,
  onRevoke,
}: {
  course: Course;
  isPending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
}) {
  const approved = course.admin_approved === true;
  const introVideo = course.intro_video_url
    ? toAuthenticatedMediaUrl(course.intro_video_url) || course.intro_video_url
    : undefined;

  return (
    <aside className='space-y-4'>
      {/* Decision panel */}
      <div className={adminTheme.cardPadded}>
        <p className={adminTheme.sectionLabel}>Moderation decision</p>
        <div className='mt-3 flex flex-col gap-2'>
          {approved ? (
            <>
              <p className='text-sm text-muted-foreground'>
                This course is approved and can accept enrollments.
              </p>
              <Button variant='outline' onClick={onRevoke} disabled={isPending}>
                <ShieldOff className='size-4' />
                Revoke approval
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onApprove} disabled={isPending}>
                <CheckCircle2 className='size-4' />
                Approve course
              </Button>
              <Button variant='outline' onClick={onReject} disabled={isPending}>
                <XCircle className='size-4' />
                Reject with feedback
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Commercials */}
      <div className={adminTheme.cardPadded}>
        <p className={adminTheme.sectionLabel}>Pricing &amp; revenue</p>
        <div className='mt-3 space-y-2.5'>
          <Row label='Price' value={money(course.price)} />
          <Row label='Min. training fee' value={money(course.minimum_training_fee)} />
          <Separator className='my-1' />
          <Row
            label='Creator share'
            value={course.creator_share_percentage != null ? `${course.creator_share_percentage}%` : '—'}
          />
          <Row
            label='Instructor share'
            value={
              course.instructor_share_percentage != null ? `${course.instructor_share_percentage}%` : '—'
            }
          />
          {course.revenue_share_notes ? (
            <p className='rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground'>
              {course.revenue_share_notes}
            </p>
          ) : null}
        </div>
      </div>

      {/* Logistics */}
      <div className={adminTheme.cardPadded}>
        <p className={adminTheme.sectionLabel}>Course facts</p>
        <div className='mt-3 space-y-2.5'>
          <Row label='Total duration' value={course.total_duration_display ?? '—'} />
          <Row label='Class limit' value={course.class_limit ?? 'Unlimited'} />
          <Row
            label='Age range'
            value={`${course.age_lower_limit ?? '—'} – ${course.age_upper_limit ?? '—'}`}
          />
          <Row
            label='Enrollment'
            value={course.accepts_new_enrollments ? 'Open' : 'Closed'}
          />
          {introVideo ? (
            <Row
              label='Intro video'
              value={
                <a
                  href={introVideo}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 text-primary hover:underline'
                >
                  Watch <ExternalLink className='size-3.5' />
                </a>
              }
            />
          ) : (
            <Row label='Intro video' value='Not provided' />
          )}
          <Separator className='my-1' />
          <div className='text-xs text-muted-foreground'>
            <span className='font-medium uppercase tracking-wide'>UUID</span>
            <p className='mt-0.5 break-all font-mono'>{course.uuid}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
