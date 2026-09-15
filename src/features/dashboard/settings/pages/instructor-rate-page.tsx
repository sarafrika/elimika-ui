'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingApplication, CourseTrainingRateCard } from '@/services/client';
import { searchTrainingApplicationsInfiniteOptions } from '@/services/client/@tanstack/react-query.gen';
import { formatDurationFromParts } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Info, Laptop, MapPin, Users } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

const PAGE_SIZE = 20;
const RATE_DEFINITIONS = [
  {
    id: 'group_online',
    title: 'Online group',
    sessionType: 'Group session',
    delivery: 'Online',
    icon: Users,
  },
  {
    id: 'private_online',
    title: 'Online private',
    sessionType: 'Private session',
    delivery: 'Online',
    icon: Laptop,
  },
  {
    id: 'group_inperson',
    title: 'In-person group',
    sessionType: 'Group session',
    delivery: 'In person',
    icon: Users,
  },
  {
    id: 'private_inperson',
    title: 'In-person private',
    sessionType: 'Private session',
    delivery: 'In person',
    icon: MapPin,
  },
] as const;

type RateDefinition = (typeof RATE_DEFINITIONS)[number];
type ApplicationWithRateCard = CourseTrainingApplication & {
  uuid: string;
  rate_card: CourseTrainingRateCard;
};

function formatRate(amount: number | null | undefined, currency: string) {
  if (amount == null || !Number.isFinite(amount)) return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
}

function formatDate(value: Date | undefined | null) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not provided'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatParticipants(rate: RateDefinition, classLimit: number | null | undefined) {
  if (rate.id.startsWith('private_')) return '1';
  return classLimit != null && classLimit > 0 ? `Up to ${classLimit}` : 'Not provided';
}

export default function InstructorRateCardsPage() {
  const user = useUserProfile();
  const instructorId = user?.instructor?.uuid;
  const [courseId, setCourseId] = useState('');
  const [selectedRate, setSelectedRate] = useState<{
    applicationId: string;
    rate: RateDefinition;
  } | null>(null);
  const applicationsQuery = useInfiniteQuery({
    ...searchTrainingApplicationsInfiniteOptions({
      query: {
        searchParams: { applicant_uuid_eq: instructorId },
        pageable: { page: 0, size: PAGE_SIZE },
      },
    }),
    enabled: Boolean(instructorId),
    staleTime: STALE_TIMES.entity,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const metadata = lastPage.data?.metadata;
      if (lastPage.error || lastPage.success === false) return undefined;
      const hasNext =
        metadata?.hasNext ??
        (metadata?.totalPages != null
          ? pages.length < metadata.totalPages
          : (lastPage.data?.content?.length ?? 0) === PAGE_SIZE);
      return hasNext
        ? {
          query: {
            searchParams: { applicant_uuid_eq: instructorId },
            pageable: { page: pages.length, size: PAGE_SIZE },
          },
        }
        : undefined;
    },
  });

  const groups = useMemo(() => {
    const byCourse = new Map<string, ApplicationWithRateCard[]>();
    const seen = new Set<string>();
    for (const page of applicationsQuery.data?.pages ?? []) {
      if (page.error || page.success === false) continue;
      for (const application of page.data?.content ?? []) {
        const { uuid, course_uuid, rate_card } = application;
        if (!uuid || !course_uuid || !rate_card || seen.has(uuid)) continue;
        seen.add(uuid);
        const cards = byCourse.get(course_uuid) ?? [];
        cards.push({ ...application, uuid, rate_card });
        byCourse.set(course_uuid, cards);
      }
    }
    return Array.from(byCourse, ([id, cards]) => ({ id, cards }));
  }, [applicationsQuery.data]);
  const courseIds = useMemo(() => groups.map(group => group.id), [groups]);
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds);
  const group = groups.find(item => item.id === courseId) ?? groups[0];
  const course = group ? courseMap[group.id] : undefined;
  const courseName = course?.name || (group ? `Course ${group.id}` : '');
  const duration = coursesLoading
    ? 'Loading…'
    : formatDurationFromParts(course?.duration_hours, course?.duration_minutes) || 'Not provided';
  const selectedApplication = group?.cards.find(item => item.uuid === selectedRate?.applicationId);
  const hasResponseError = applicationsQuery.data?.pages.some(
    page => page.error || page.success === false
  );

  if (user?.isLoading || applicationsQuery.isLoading) {
    return (
      <div className='space-y-6' role='status' aria-label='Loading rate cards'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-80 w-full' />
      </div>
    );
  }

  if (!instructorId) {
    return (
      <EmptyState
        title='Instructor profile unavailable'
        description='An instructor profile is required to view course rate cards.'
      />
    );
  }

  if (
    (applicationsQuery.isError && !applicationsQuery.data) ||
    (hasResponseError && !groups.length)
  ) {
    return (
      <EmptyState
        title='Unable to load rate cards'
        description='Please try loading your rate cards again.'
        action={<Button onClick={() => void applicationsQuery.refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className='min-w-0 rounded-xl'>
      <div className='mx-auto px-4 pb-8 sm:px-7 sm:pb-10'>
        <div className='border-border flex flex-col gap-6 border-b pb-7 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-2xl'>
            <h1 className='text-foreground mt-2 text-3xl font-bold'>Course rate cards</h1>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              Select a course to compare its rate cards across every available session format.
            </p>
          </div>
          {group && (
            <div className='w-full lg:max-w-sm'>
              <label
                className='text-foreground mb-2 block text-sm font-semibold'
                htmlFor='course-rate-select'
              >
                Course
              </label>
              <Select
                value={group.id}
                onValueChange={value => {
                  setCourseId(value);
                  setSelectedRate(null);
                }}
              >
                <SelectTrigger id='course-rate-select' className='w-full bg-background h-11'>
                  <SelectValue placeholder='Select a course' />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {courseMap[item.id]?.name || `Course ${item.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {group ? (
          <>
            <section
              className='border-border grid gap-4 border-b py-6 sm:grid-cols-3'
              aria-label='Selected course details'
            >
              <CourseDetail
                label='Selected course'
                value={coursesLoading ? 'Loading course…' : courseName}
              />
              <CourseDetail
                label='Class size'
                value={
                  course?.class_limit != null
                    ? `Up to ${course.class_limit} learners`
                    : 'Not provided'
                }
              />
              <CourseDetail label='Rate cards loaded' value={String(group.cards.length)} />
            </section>
            <section className='space-y-6 pt-7' aria-label='Course rate cards'>
              {group.cards.map((application, index) => {
                const card = application.rate_card;
                const currency = card.currency || 'KES';
                return (
                  <Card key={application.uuid} className='min-w-0 overflow-hidden'>
                    <CardHeader>
                      <div className='flex flex-wrap items-center justify-between gap-3'>
                        <CardTitle>
                          <h2 className='text-lg'>Rate card {index + 1}</h2>
                        </CardTitle>
                        <Badge variant='secondary'>
                          {application.status?.replaceAll('_', ' ') || 'Status unavailable'}
                        </Badge>
                      </div>
                      <CardDescription>All prices are per learner in {currency}.</CardDescription>
                      <div className='text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs'>
                        <span>Application: {application.uuid}</span>
                        <span className='flex items-center gap-1.5'>
                          <CalendarDays className='h-3.5 w-3.5' />
                          Submitted: {formatDate(application.created_date)}
                        </span>
                        {application.reviewed_at && (
                          <span>Reviewed: {formatDate(application.reviewed_at)}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className='px-0'>
                      <Table aria-label={`Rate card ${index + 1} for ${courseName}`}>
                        <TableHeader className='bg-muted/60'>
                          <TableRow>
                            <TableHead className='min-w-52 px-4'>Session format</TableHead>
                            <TableHead className='min-w-32'>Duration</TableHead>
                            <TableHead className='min-w-40'>No. of participants</TableHead>
                            <TableHead className='min-w-32'>Per hour</TableHead>
                            <TableHead className='min-w-32'>Per session</TableHead>
                            <TableHead className='min-w-32'>Per day</TableHead>
                            <TableHead className='min-w-36'>Session type</TableHead>
                            <TableHead className='w-24 text-right'>
                              <span className='sr-only'>Details</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {RATE_DEFINITIONS.map(rate => {
                            const Icon = rate.icon;
                            return (
                              <TableRow key={rate.id}>
                                <TableCell className='px-4 py-4'>
                                  <div className='flex items-center gap-3'>
                                    <span className='bg-primary/10 text-primary grid h-9 w-9 shrink-0 place-items-center rounded-md'>
                                      <Icon className='h-4 w-4' />
                                    </span>
                                    <div>
                                      <p className='text-foreground font-semibold'>{rate.title}</p>
                                      <p className='text-muted-foreground text-xs'>
                                        {rate.delivery}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p>{duration}</p>
                                  <p className='text-muted-foreground text-xs'>Full course</p>
                                </TableCell>
                                <TableCell>
                                  {coursesLoading && rate.id.startsWith('group_')
                                    ? 'Loading…'
                                    : formatParticipants(rate, course?.class_limit)}
                                </TableCell>
                                <TableCell className='font-semibold'>
                                  {formatRate(card[`${rate.id}_hourly_rate`], currency)}
                                </TableCell>
                                <TableCell className='font-semibold'>
                                  {formatRate(card[`${rate.id}_session_rate`], currency)}
                                </TableCell>
                                <TableCell className='font-semibold'>
                                  {formatRate(card[`${rate.id}_daily_rate`], currency)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant='secondary'>{rate.sessionType}</Badge>
                                </TableCell>
                                <TableCell className='text-right'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    aria-label={`View ${rate.title}, rate card ${index + 1}`}
                                    onClick={() =>
                                      setSelectedRate({ applicationId: application.uuid, rate })
                                    }
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {application.application_notes && (
                        <p className='text-muted-foreground mt-4 px-5 text-sm whitespace-pre-wrap'>
                          <span className='text-foreground font-medium'>Application notes: </span>
                          {application.application_notes}
                        </p>
                      )}
                      {application.review_notes && (
                        <p className='text-muted-foreground mt-3 px-5 text-sm whitespace-pre-wrap'>
                          <span className='text-foreground font-medium'>Review notes: </span>
                          {application.review_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
            <aside className='border-border text-muted-foreground mt-6 flex items-start gap-3 border-t pt-5 text-sm'>
              <Info className='mt-0.5 h-4 w-4 shrink-0' />
              <p>
                Hourly, session and daily prices are separate rates. “Not set” means a price has not
                been provided for that billing period.
              </p>
            </aside>
          </>
        ) : (
          <EmptyState
            className='mt-7'
            title='No rate cards found'
            description='Rate cards from your course training applications will appear here.'
          />
        )}

        {(applicationsQuery.isError || hasResponseError) && groups.length > 0 && (
          <EmptyState
            className='mt-6'
            variant='compact'
            title='Unable to load more rate cards'
            action={
              <Button variant='outline' onClick={() => void applicationsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        )}
        {applicationsQuery.hasNextPage && (
          <div className='mt-6 space-y-2 text-center'>
            <p className='text-muted-foreground text-sm'>
              More applications are available. Load more to see additional courses and rate cards.
            </p>
            <Button
              variant='outline'
              disabled={applicationsQuery.isFetching}
              onClick={() => void applicationsQuery.fetchNextPage()}
            >
              {applicationsQuery.isFetchingNextPage && <Spinner />}Load more rate cards
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedRate && selectedApplication)}
        onOpenChange={open => {
          if (!open) setSelectedRate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRate?.rate.title}</DialogTitle>
            <DialogDescription>
              {courseName} · {selectedRate?.rate.sessionType}
            </DialogDescription>
          </DialogHeader>
          {selectedRate && selectedApplication && (
            <div className='space-y-4 pt-2'>
              <p className='text-muted-foreground text-sm'>
                Prices per learner in {selectedApplication.rate_card.currency || 'KES'}.
              </p>
              <div className='divide-border border-border divide-y border-y'>
                <RateDetail icon={<Clock3 />} label='Duration (full course)' value={duration} />
                <RateDetail
                  icon={<Users />}
                  label='No. of participants'
                  value={
                    coursesLoading && selectedRate.rate.id.startsWith('group_')
                      ? 'Loading…'
                      : formatParticipants(selectedRate.rate, course?.class_limit)
                  }
                />
                <RateDetail
                  icon={<Clock3 />}
                  label='Per hour'
                  value={formatRate(
                    selectedApplication.rate_card[`${selectedRate.rate.id}_hourly_rate`],
                    selectedApplication.rate_card.currency || 'KES'
                  )}
                />
                <RateDetail
                  icon={<Clock3 />}
                  label='Per session'
                  value={formatRate(
                    selectedApplication.rate_card[`${selectedRate.rate.id}_session_rate`],
                    selectedApplication.rate_card.currency || 'KES'
                  )}
                />
                <RateDetail
                  icon={<CalendarDays />}
                  label='Per day'
                  value={formatRate(
                    selectedApplication.rate_card[`${selectedRate.rate.id}_daily_rate`],
                    selectedApplication.rate_card.currency || 'KES'
                  )}
                />
                <RateDetail
                  icon={<Users />}
                  label='Session type'
                  value={selectedRate.rate.sessionType}
                />
                <RateDetail
                  icon={selectedRate.rate.delivery === 'Online' ? <Laptop /> : <MapPin />}
                  label='Delivery'
                  value={selectedRate.rate.delivery}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
      <p className='text-foreground mt-1 text-sm font-semibold'>{value}</p>
    </div>
  );
}

function RateDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-4 py-3 text-sm'>
      <span className='text-muted-foreground flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4'>
        {icon}
        {label}
      </span>
      <span className='text-foreground max-w-64 text-right font-medium'>{value}</span>
    </div>
  );
}
