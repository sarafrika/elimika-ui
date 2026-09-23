'use client';

import { useMemo } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatusBadge,
} from '@/components/data-display';
import { useCoursesByIds, useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import type { Instructor } from '@/services/client';
import {
  useInstructorApplications,
  useInstructorBookings,
  useInstructorClasses,
  useInstructorReviews,
} from '../hooks/use-person-record';
import { SectionBoundary } from './section-boundary';

export function TeachingTab({
  instructor,
  loading,
  personName,
}: {
  instructor: Instructor | null;
  loading: boolean;
  personName: string;
}) {
  if (loading) return <SectionCardSkeleton rows={5} />;

  if (!instructor) {
    return (
      <SectionCard title='Teaching'>
        <p className='text-muted-foreground text-sm'>
          {personName || 'This person'} has no instructor profile, so there is nothing to teach
          with.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <RatingRow instructorUuid={instructor.uuid} />
      <div className='grid gap-4 xl:grid-cols-2'>
        <ClassesBlock instructorUuid={instructor.uuid} />
        <BookingsBlock instructorUuid={instructor.uuid} />
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        <ReviewsBlock instructorUuid={instructor.uuid} />
        <ApplicationsBlock instructorUuid={instructor.uuid} />
      </div>
    </div>
  );
}

function RatingRow({ instructorUuid }: { instructorUuid?: string }) {
  const { summary, summaryQuery } = useInstructorReviews(instructorUuid);
  const { classes } = useInstructorClasses(instructorUuid);

  const active = classes.filter(entry => entry.is_active !== false).length;

  return (
    <SectionBoundary
      label='the teaching summary'
      loading={summaryQuery.isLoading && !summaryQuery.data}
      error={summaryQuery.error}
      onRetry={() => summaryQuery.refetch()}
      skeleton={<SectionCardSkeleton rows={2} withHeader={false} />}
    >
      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard label='Classes' value={classes.length} hint={`${active} active`} />
        <StatCard
          label='Rating'
          value={summary?.average_rating != null ? summary.average_rating.toFixed(1) : '—'}
          hint={
            summary?.review_count != null ? `${Number(summary.review_count)} reviews` : 'No reviews'
          }
        />
        <StatCard
          label='Sessions booked'
          value={<BookingsCount instructorUuid={instructorUuid} />}
          hint='One-to-one bookings'
        />
      </div>
    </SectionBoundary>
  );
}

function BookingsCount({ instructorUuid }: { instructorUuid?: string }) {
  const { total } = useInstructorBookings(instructorUuid);
  return <>{total || '—'}</>;
}

function ClassesBlock({ instructorUuid }: { instructorUuid?: string }) {
  const { classes, query } = useInstructorClasses(instructorUuid);

  return (
    <SectionBoundary
      label='the classes'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && classes.length === 0}
      skeleton={<SectionCardSkeleton rows={4} />}
      emptyTitle='No classes'
      emptyDescription='This instructor is not the default teacher on any class.'
    >
      <SectionCard title='Classes' description='Where this person is the default instructor'>
        <ul className='divide-border/60 divide-y'>
          {classes.map(entry => (
            <li key={entry.uuid} className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'>
              <span className='min-w-0 flex-1'>
                <span className='text-foreground block truncate text-sm font-semibold'>
                  {entry.title}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {entry.session_format ?? '—'} · {entry.location_type ?? '—'} ·{' '}
                  {entry.completed_session_count ?? 0}/{entry.scheduled_session_count ?? 0} sessions
                </span>
              </span>
              <StatusBadge status={entry.is_active === false ? 'inactive' : 'active'} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}

function BookingsBlock({ instructorUuid }: { instructorUuid?: string }) {
  const { bookings, query } = useInstructorBookings(instructorUuid);

  // Names come from two batched lookups for the whole page, never one call per row.
  const studentIds = useMemo(
    () => bookings.map(booking => booking.student_uuid).filter(Boolean),
    [bookings]
  );
  const courseIds = useMemo(
    () => bookings.map(booking => booking.course_uuid).filter(Boolean),
    [bookings]
  );
  const { studentMap } = useStudentsByIds(studentIds);
  const { courseMap } = useCoursesByIds(courseIds);
  const userIds = useMemo(
    () => Object.values(studentMap).map(student => student.user_uuid).filter(Boolean) as string[],
    [studentMap]
  );
  const { userMap } = useUsersByIds(userIds);

  const nameFor = (studentUuid?: string) => {
    const student = studentUuid ? studentMap[studentUuid] : undefined;
    if (!student) return 'Learner';
    const user = student.user_uuid ? userMap[student.user_uuid] : undefined;
    return user?.full_name ?? student.full_name ?? 'Learner';
  };

  return (
    <SectionBoundary
      label='the bookings'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && bookings.length === 0}
      skeleton={<SectionCardSkeleton rows={4} />}
      emptyTitle='No bookings'
      emptyDescription='Nobody has booked a one-to-one session with this instructor.'
    >
      <SectionCard title='Bookings' description='Most recent first'>
        <ul className='divide-border/60 divide-y'>
          {bookings.map(booking => (
            <li key={booking.uuid} className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'>
              <span className='min-w-0 flex-1'>
                <span className='text-foreground block truncate text-sm font-semibold'>
                  {nameFor(booking.student_uuid)}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {courseMap[booking.course_uuid]?.name ?? 'Course'} ·{' '}
                  {booking.start_time ? formatDate(booking.start_time) : '—'}
                  {booking.payment_reference ? (
                    <span className='font-mono'> · {booking.payment_reference}</span>
                  ) : null}
                </span>
              </span>
              <span className='font-mono text-sm'>
                {booking.price_amount != null
                  ? `${booking.currency ?? ''} ${booking.price_amount}`.trim()
                  : '—'}
              </span>
              <StatusBadge status={booking.status} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}

function ReviewsBlock({ instructorUuid }: { instructorUuid?: string }) {
  const { summary, reviews, reviewsQuery } = useInstructorReviews(instructorUuid);

  return (
    <SectionBoundary
      label='the reviews'
      loading={reviewsQuery.isLoading && !reviewsQuery.data}
      error={reviewsQuery.error}
      onRetry={() => reviewsQuery.refetch()}
      empty={!reviewsQuery.isLoading && reviews.length === 0}
      skeleton={<SectionCardSkeleton rows={3} />}
      emptyTitle='No reviews yet'
      emptyDescription='Learners have not reviewed this instructor.'
    >
      <SectionCard
        title='Reviews'
        description={
          summary?.average_rating != null
            ? `${summary.average_rating.toFixed(1)} average from ${Number(summary.review_count ?? 0)}`
            : undefined
        }
      >
        <ul className='divide-border/60 divide-y'>
          {reviews.slice(0, 6).map(review => (
            <li key={review.uuid} className='space-y-1 py-2.5 first:pt-0'>
              <span className='flex items-center gap-2'>
                <span className='font-mono text-sm'>{review.rating ?? '—'}</span>
                <span className='text-foreground text-sm font-semibold'>
                  {review.headline ?? 'Review'}
                </span>
              </span>
              {review.comments ? (
                <p className='text-muted-foreground text-xs'>{review.comments}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}

function ApplicationsBlock({ instructorUuid }: { instructorUuid?: string }) {
  const { applications, query } = useInstructorApplications(instructorUuid);

  return (
    <SectionBoundary
      label='the job applications'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      empty={!query.isLoading && applications.length === 0}
      skeleton={<SectionCardSkeleton rows={3} />}
      emptyTitle='No applications'
      emptyDescription='This instructor has not applied for any marketplace jobs.'
    >
      <SectionCard title='Marketplace applications'>
        <ul className='divide-border/60 divide-y'>
          {applications.map(application => (
            <li
              key={application.uuid}
              className='flex flex-wrap items-center gap-2 py-2.5 first:pt-0'
            >
              <span className='min-w-0 flex-1'>
                <span className='text-foreground block truncate text-sm font-semibold'>
                  {application.job?.title ?? (
                    <span className='font-mono'>{application.job_uuid?.slice(0, 8)}…</span>
                  )}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {application.job?.organisation_name ?? 'Organisation'}
                  {application.reviewed_at ? ` · reviewed ${formatDate(application.reviewed_at)}` : ''}
                </span>
              </span>
              <StatusBadge status={application.status} />
            </li>
          ))}
        </ul>
        <DetailGrid
          className='mt-4'
          columns={2}
          items={[
            {
              label: 'Verified instructor',
              value: applications[0]?.instructor_admin_verified ? 'Yes' : 'Not on file',
            },
            {
              label: 'Approved to train',
              value: applications[0]?.training_approved ? 'Yes' : 'Not on file',
            },
          ]}
        />
      </SectionCard>
    </SectionBoundary>
  );
}
