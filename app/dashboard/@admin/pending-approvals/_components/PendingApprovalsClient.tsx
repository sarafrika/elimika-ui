'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Course, CourseCreator, Instructor, Organisation } from '@/services/client';
import {
  getPendingOrganisationsOptions,
  listPendingCoursesOptions,
  moderateOrganisationMutation,
  searchCourseCreatorsOptions,
  searchInstructorsOptions,
  verifyCourseCreatorMutation,
  verifyInstructorMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { statusToneClass } from '../../_components/ui/admin-theme';

const PAGEABLE = { page: 0, size: 50 };

function formatDate(value?: Date | string | null): string {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '-'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function isInstructor(value: unknown): value is Instructor {
  const record = objectRecord(value);
  return typeof record?.uuid === 'string' && typeof record.user_uuid === 'string';
}

function isCourseCreator(value: unknown): value is CourseCreator {
  const record = objectRecord(value);
  return typeof record?.uuid === 'string' && typeof record.user_uuid === 'string';
}

function includesTerm(values: Array<string | null | undefined>, term: string) {
  if (!term) return true;
  return values.some(value =>
    String(value ?? '')
      .toLowerCase()
      .includes(term)
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className='bg-card border-border/70 flex items-center gap-3 rounded-md border p-4 shadow-sm'>
      <span
        className={`flex size-10 items-center justify-center rounded-md border ${statusToneClass.warning}`}
      >
        <Icon className='size-5' />
      </span>
      <div>
        <p className='text-muted-foreground text-xs font-medium uppercase'>{label}</p>
        <p className='text-foreground text-xl font-semibold tabular-nums'>{value}</p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className='border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm'>
      <AlertTriangle className='size-4 shrink-0' />
      {message}
    </div>
  );
}

function ApproveButton({
  isPending,
  onClick,
  label = 'Approve',
}: {
  isPending: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button size='sm' onClick={onClick} disabled={isPending}>
      {isPending ? <Spinner className='size-4' /> : <CheckCircle2 className='size-4' />}
      {isPending ? 'Approving...' : label}
    </Button>
  );
}

function InstructorCard({
  instructor,
  isPending,
  onApprove,
}: {
  instructor: Instructor;
  isPending: boolean;
  onApprove: (instructor: Instructor) => void;
}) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <StatusBadge status='pending' label='Instructor pending' />
            {instructor.is_profile_complete ? (
              <StatusBadge status='complete' label='Complete profile' />
            ) : null}
          </div>
          <p className='text-foreground truncate text-sm font-semibold'>
            {instructor.full_name || 'Instructor'}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {instructor.professional_headline || instructor.bio || 'No headline provided'}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/instructors/${instructor.user_uuid}`}>
              <ExternalLink className='size-4' />
              Open dossier
            </Link>
          </Button>
          <ApproveButton isPending={isPending} onClick={() => onApprove(instructor)} />
        </div>
      </div>
      <DetailGrid
        columns={3}
        items={[
          {
            label: 'Profile UUID',
            value: <span className='font-mono text-xs break-all'>{instructor.uuid}</span>,
          },
          { label: 'Location', value: instructor.formatted_location || '-' },
          { label: 'Submitted', value: formatDate(instructor.created_date) },
        ]}
      />
    </div>
  );
}

function CreatorCard({
  creator,
  isPending,
  onApprove,
}: {
  creator: CourseCreator;
  isPending: boolean;
  onApprove: (creator: CourseCreator) => void;
}) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <StatusBadge status='pending' label='Creator pending' />
            {creator.is_profile_complete ? (
              <StatusBadge status='complete' label='Complete profile' />
            ) : null}
          </div>
          <p className='text-foreground truncate text-sm font-semibold'>
            {creator.full_name || 'Course creator'}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {creator.professional_headline || creator.bio || 'No headline provided'}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/course-creators/${creator.user_uuid}`}>
              <ExternalLink className='size-4' />
              Open dossier
            </Link>
          </Button>
          <ApproveButton isPending={isPending} onClick={() => onApprove(creator)} />
        </div>
      </div>
      <DetailGrid
        columns={3}
        items={[
          {
            label: 'Profile UUID',
            value: <span className='font-mono text-xs break-all'>{creator.uuid}</span>,
          },
          { label: 'Website', value: creator.website || '-' },
          { label: 'Submitted', value: formatDate(creator.created_date) },
        ]}
      />
    </div>
  );
}

function PendingCourseCard({ course }: { course: Course }) {
  const thumb = course.thumbnail_url ?? course.banner_url;
  const thumbSrc = thumb ? toAuthenticatedMediaUrl(thumb) || thumb : undefined;
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='border-border/60 bg-muted/40 flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border'>
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt='' className='h-full w-full object-cover' loading='lazy' />
            ) : (
              <BookOpen className='text-muted-foreground size-5' />
            )}
          </div>
          <div className='min-w-0'>
            <div className='mb-1.5 flex flex-wrap items-center gap-2'>
              <StatusBadge status='pending' label='Course pending' />
              <StatusBadge status={course.status} />
            </div>
            <p className='text-foreground truncate text-sm font-semibold'>{course.name}</p>
            <p className='text-muted-foreground text-xs'>
              Submitted {formatDate(course.created_date)}
            </p>
          </div>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button size='sm' asChild>
            <Link href={`/dashboard/manage-courses/${course.uuid}`}>
              <ExternalLink className='size-4' />
              Review course
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrganisationCard({
  organisation,
  isPending,
  onApprove,
}: {
  organisation: Organisation;
  isPending: boolean;
  onApprove: (organisation: Organisation) => void;
}) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <StatusBadge status='pending' label='Organisation pending' />
            <StatusBadge status={organisation.active ? 'active' : 'inactive'} />
          </div>
          <p className='text-foreground truncate text-sm font-semibold'>{organisation.name}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {organisation.description || organisation.location || 'No description provided'}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/organizations/${organisation.uuid}`}>
              <ExternalLink className='size-4' />
              Open dossier
            </Link>
          </Button>
          <ApproveButton isPending={isPending} onClick={() => onApprove(organisation)} />
        </div>
      </div>
      <DetailGrid
        columns={3}
        items={[
          { label: 'Licence no.', value: organisation.licence_no || '-' },
          {
            label: 'Location',
            value: [organisation.location, organisation.country].filter(Boolean).join(', ') || '-',
          },
          { label: 'Submitted', value: formatDate(organisation.created_date) },
        ]}
      />
    </div>
  );
}

export function PendingApprovalsClient() {
  const [search, setSearch] = useState('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const instructorsQuery = useQuery({
    ...searchInstructorsOptions({
      query: {
        pageable: PAGEABLE,
        searchParams: { adminVerified: false },
      },
    }),
    staleTime: 30_000,
  });
  const creatorsQuery = useQuery({
    ...searchCourseCreatorsOptions({
      query: {
        pageable: PAGEABLE,
        searchParams: { adminVerified: 'false' },
      },
    }),
    staleTime: 30_000,
  });
  const organisationsQuery = useQuery({
    ...getPendingOrganisationsOptions({ query: { pageable: PAGEABLE } }),
    staleTime: 30_000,
  });
  const coursesQuery = useQuery({
    ...listPendingCoursesOptions({ query: { pageable: PAGEABLE } }),
    staleTime: 30_000,
  });

  const verifyInstructor = useMutation(verifyInstructorMutation());
  const verifyCreator = useMutation(verifyCourseCreatorMutation());
  const moderateOrganisation = useMutation(moderateOrganisationMutation());

  const term = search.trim().toLowerCase();
  const instructors = useMemo(
    () =>
      (instructorsQuery.data?.content ?? [])
        .filter(isInstructor)
        .filter(instructor =>
          includesTerm(
            [instructor.full_name, instructor.professional_headline, instructor.bio],
            term
          )
        ),
    [instructorsQuery.data?.content, term]
  );
  const creators = useMemo(
    () =>
      (creatorsQuery.data?.content ?? [])
        .filter(isCourseCreator)
        .filter(creator =>
          includesTerm([creator.full_name, creator.professional_headline, creator.bio], term)
        ),
    [creatorsQuery.data?.content, term]
  );
  const organisations = useMemo(
    () =>
      (organisationsQuery.data?.data?.content ?? []).filter(organisation =>
        includesTerm(
          [
            organisation.name,
            organisation.description,
            organisation.location,
            organisation.licence_no,
          ],
          term
        )
      ),
    [organisationsQuery.data?.data?.content, term]
  );
  const pendingCourses = useMemo(
    () =>
      (coursesQuery.data?.data?.content ?? []).filter(course =>
        includesTerm([course.name, course.description], term)
      ),
    [coursesQuery.data?.data?.content, term]
  );

  const approveInstructor = async (instructor: Instructor) => {
    if (!instructor.uuid) return;
    setPendingKey(`instructor-${instructor.uuid}`);
    try {
      await verifyInstructor.mutateAsync({
        path: { uuid: instructor.uuid },
        query: { reason: 'Approved from pending approvals queue' },
      });
      toast.success('Instructor approved');
      await instructorsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve instructor');
    } finally {
      setPendingKey(null);
    }
  };

  const approveCreator = async (creator: CourseCreator) => {
    if (!creator.uuid) return;
    setPendingKey(`creator-${creator.uuid}`);
    try {
      await verifyCreator.mutateAsync({
        path: { uuid: creator.uuid },
        query: { reason: 'Approved from pending approvals queue' },
      });
      toast.success('Course creator approved');
      await creatorsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve course creator');
    } finally {
      setPendingKey(null);
    }
  };

  const approveOrganisation = async (organisation: Organisation) => {
    if (!organisation.uuid) return;
    setPendingKey(`organisation-${organisation.uuid}`);
    try {
      await moderateOrganisation.mutateAsync({
        path: { uuid: organisation.uuid },
        query: { action: 'approve', reason: 'Approved from pending approvals queue' },
      });
      toast.success('Organisation approved');
      await organisationsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve organisation');
    } finally {
      setPendingKey(null);
    }
  };

  const totalPending =
    instructors.length + creators.length + organisations.length + pendingCourses.length;
  const isLoading =
    instructorsQuery.isLoading ||
    creatorsQuery.isLoading ||
    organisationsQuery.isLoading ||
    coursesQuery.isLoading;

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-5'>
        <MetricCard label='Total pending' value={totalPending} icon={CheckCircle2} />
        <MetricCard label='Instructors' value={instructors.length} icon={GraduationCap} />
        <MetricCard label='Creators' value={creators.length} icon={Sparkles} />
        <MetricCard label='Organisations' value={organisations.length} icon={Building2} />
        <MetricCard label='Courses' value={pendingCourses.length} icon={BookOpen} />
      </div>

      <SectionCard
        title='Approval queues'
        description='Each domain loads independently and actions refetch only the affected queue.'
        actions={
          <div className='relative w-full min-w-[220px] sm:w-80'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search pending approvals...'
              className='pl-9'
            />
          </div>
        }
      >
        <Tabs defaultValue='all' className='space-y-4'>
          <TabsList className='h-auto flex-wrap justify-start'>
            <TabsTrigger value='all'>All · {totalPending}</TabsTrigger>
            <TabsTrigger value='instructors'>Instructors · {instructors.length}</TabsTrigger>
            <TabsTrigger value='creators'>Creators · {creators.length}</TabsTrigger>
            <TabsTrigger value='organisations'>Organisations · {organisations.length}</TabsTrigger>
            <TabsTrigger value='courses'>Courses · {pendingCourses.length}</TabsTrigger>
          </TabsList>

          {isLoading ? <SectionCardSkeleton rows={6} withHeader={false} /> : null}

          {instructorsQuery.isError ? (
            <InlineError message='Unable to load pending instructors.' />
          ) : null}
          {creatorsQuery.isError ? (
            <InlineError message='Unable to load pending course creators.' />
          ) : null}
          {organisationsQuery.isError ? (
            <InlineError message='Unable to load pending organisations.' />
          ) : null}
          {coursesQuery.isError ? <InlineError message='Unable to load pending courses.' /> : null}

          <TabsContent value='all' className='mt-0 space-y-3'>
            {totalPending ? (
              <>
                {instructors.map(instructor => (
                  <InstructorCard
                    key={instructor.uuid}
                    instructor={instructor}
                    isPending={pendingKey === `instructor-${instructor.uuid}`}
                    onApprove={approveInstructor}
                  />
                ))}
                {creators.map(creator => (
                  <CreatorCard
                    key={creator.uuid}
                    creator={creator}
                    isPending={pendingKey === `creator-${creator.uuid}`}
                    onApprove={approveCreator}
                  />
                ))}
                {organisations.map(organisation => (
                  <OrganisationCard
                    key={organisation.uuid}
                    organisation={organisation}
                    isPending={pendingKey === `organisation-${organisation.uuid}`}
                    onApprove={approveOrganisation}
                  />
                ))}
                {pendingCourses.map(course => (
                  <PendingCourseCard key={course.uuid} course={course} />
                ))}
              </>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title='No pending approvals'
                description='Instructor, course creator, organisation, and course approval queues are clear.'
                variant='compact'
              />
            )}
          </TabsContent>

          <TabsContent value='instructors' className='mt-0 space-y-3'>
            {instructors.length ? (
              instructors.map(instructor => (
                <InstructorCard
                  key={instructor.uuid}
                  instructor={instructor}
                  isPending={pendingKey === `instructor-${instructor.uuid}`}
                  onApprove={approveInstructor}
                />
              ))
            ) : (
              <EmptyState icon={GraduationCap} title='No pending instructors' variant='compact' />
            )}
          </TabsContent>

          <TabsContent value='creators' className='mt-0 space-y-3'>
            {creators.length ? (
              creators.map(creator => (
                <CreatorCard
                  key={creator.uuid}
                  creator={creator}
                  isPending={pendingKey === `creator-${creator.uuid}`}
                  onApprove={approveCreator}
                />
              ))
            ) : (
              <EmptyState icon={Sparkles} title='No pending course creators' variant='compact' />
            )}
          </TabsContent>

          <TabsContent value='organisations' className='mt-0 space-y-3'>
            {organisations.length ? (
              organisations.map(organisation => (
                <OrganisationCard
                  key={organisation.uuid}
                  organisation={organisation}
                  isPending={pendingKey === `organisation-${organisation.uuid}`}
                  onApprove={approveOrganisation}
                />
              ))
            ) : (
              <EmptyState icon={Building2} title='No pending organisations' variant='compact' />
            )}
          </TabsContent>

          <TabsContent value='courses' className='mt-0 space-y-3'>
            {pendingCourses.length ? (
              pendingCourses.map(course => <PendingCourseCard key={course.uuid} course={course} />)
            ) : (
              <EmptyState icon={BookOpen} title='No pending courses' variant='compact' />
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>
    </div>
  );
}
