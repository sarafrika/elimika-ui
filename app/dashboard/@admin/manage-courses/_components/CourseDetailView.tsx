'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock, DollarSign, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { Course } from '@/services/client';
import {
  getCourseByUuidOptions,
  moderateCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { adminTheme } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { MetricTile } from '../../_components/ui/MetricTile';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

function duration(c: Course): string {
  const h = c.duration_hours ?? 0;
  const m = c.duration_minutes ?? 0;
  if (!h && !m) return '—';
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CourseDetailView({ uuid }: { uuid: string }) {
  const { data, isLoading, refetch } = useQuery(getCourseByUuidOptions({ path: { uuid } }));
  const course = data?.data as Course | undefined;
  const moderate = useMutation(moderateCourseMutation());
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const runModerate = async (action: 'approve' | 'reject', moderationReason?: string) => {
    try {
      await moderate.mutateAsync({ path: { uuid }, query: { action, reason: moderationReason } });
      toast.success(action === 'approve' ? 'Course approved' : 'Course rejected');
      setRejectOpen(false);
      setReason('');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed');
    }
  };

  if (isLoading) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <Skeleton className='h-28 w-full rounded-md' />
          <SectionCardSkeleton rows={6} />
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <BookOpen className='size-10 text-muted-foreground' />
          <p className='text-lg font-semibold'>Course not found</p>
          <Button variant='outline' asChild>
            <Link href='/dashboard/manage-courses'>Back to courses</Link>
          </Button>
        </div>
      </main>
    );
  }

  const thumb = course.thumbnail_url ?? course.banner_url;
  const thumbSrc = thumb ? toAuthenticatedMediaUrl(thumb) || thumb : undefined;

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' asChild className='-ml-2 text-muted-foreground'>
          <Link href='/dashboard/manage-courses'>
            <ArrowLeft className='size-4' />
            Back to courses
          </Link>
        </Button>

        {/* Header */}
        <header className='flex flex-col gap-4 rounded-md border border-border/70 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40'>
              {thumbSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc} alt='' className='h-full w-full object-cover' />
              ) : (
                <BookOpen className='size-6 text-muted-foreground' />
              )}
            </div>
            <div className='min-w-0'>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground'>{course.name}</h1>
              <div className='mt-1.5'>
                <StatusBadge status={course.status} />
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' onClick={() => setRejectOpen(true)} disabled={moderate.isPending}>
              <XCircle className='size-4' />
              Reject
            </Button>
            <Button onClick={() => runModerate('approve')} disabled={moderate.isPending}>
              <CheckCircle2 className='size-4' />
              Approve
            </Button>
          </div>
        </header>

        {/* Metric tiles */}
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <MetricTile label='Status' value={<StatusBadge status={course.status} />} icon={CheckCircle2} tone='neutral' />
          <MetricTile
            label='Price'
            value={course.price != null ? Number(course.price).toLocaleString() : '—'}
            icon={DollarSign}
          />
          <MetricTile label='Duration' value={duration(course)} icon={Clock} tone='neutral' />
          <MetricTile label='Created' value={formatDate(course.created_date)} icon={CalendarDays} tone='neutral' />
        </div>

        {/* Info */}
        <SectionCard title='Course details'>
          <div className='space-y-5'>
            {course.description ? (
              <div>
                <p className={adminTheme.sectionLabel}>Description</p>
                <p className='mt-1 text-sm leading-relaxed text-foreground'>{course.description}</p>
              </div>
            ) : null}
            {course.objectives ? (
              <div>
                <p className={adminTheme.sectionLabel}>Objectives</p>
                <p className='mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground'>
                  {course.objectives}
                </p>
              </div>
            ) : null}
            {course.prerequisites ? (
              <div>
                <p className={adminTheme.sectionLabel}>Prerequisites</p>
                <p className='mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground'>
                  {course.prerequisites}
                </p>
              </div>
            ) : null}
            <DetailGrid
              items={[
                { label: 'Class limit', value: course.class_limit ?? '—' },
                { label: 'Age range', value: `${course.age_lower_limit ?? '—'} – ${course.age_upper_limit ?? '—'}` },
                { label: 'Updated', value: formatDate(course.updated_date) },
                { label: 'UUID', value: <span className='break-all font-mono text-xs'>{course.uuid}</span> },
              ]}
            />
          </div>
        </SectionCard>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Reject course</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder='Reason for rejection (optional)…'
            className='min-h-24 rounded-md'
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => runModerate('reject', reason.trim() || undefined)}
              disabled={moderate.isPending}
            >
              Reject course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
