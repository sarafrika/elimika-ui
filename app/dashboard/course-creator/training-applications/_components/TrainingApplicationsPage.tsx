'use client';

import { FileText, Layers, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import { useInstructorsByIds, useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { dayjs } from '@/lib/date';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { CreatorApplicationReview } from '@/src/features/rate-card/components/creator-application-review';
import { CreatorRateUpdateReview } from '@/src/features/rate-card/components/creator-rate-update-review';
import {
  type TrainingApplicationEntry,
  useCreatorRateUpdates,
  useTrainingApplicationList,
} from '@/src/features/rate-card/hooks';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
];
const TYPE_FILTERS = [
  { value: 'all', label: 'All applicants' },
  { value: 'instructor', label: 'Instructors' },
  { value: 'organisation', label: 'Organisations' },
];
const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2, revoked: 3 };
const PAGE_SIZE = 10;
const UPDATE_CONCURRENCY = 4;

type TabId = 'applications' | 'rate-updates';
type UpdateParent = {
  key: string;
  kind: TrainingApplicationKind;
  parentUuid: string;
  title?: string;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function TrainingApplicationsPage() {
  const { profile: courseCreator } = useCourseCreator();
  const creatorUuid = courseCreator?.uuid ?? '';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: TabId = searchParams.get('tab') === 'rate-updates' ? 'rate-updates' : 'applications';

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'rate-updates') params.set('tab', next);
    else params.delete('tab');
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  const { entries, loading, error, refetch } = useTrainingApplicationList(
    { course_creator_uuid: creatorUuid },
    Boolean(creatorUuid)
  );

  const instructorIds = useMemo(() => applicantIds(entries, 'instructor'), [entries]);
  const organisationIds = useMemo(() => applicantIds(entries, 'organisation'), [entries]);
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const { organisationMap } = useOrganisationsByIds(organisationIds);
  const applicantName = useCallback(
    (entry: TrainingApplicationEntry) => {
      const uuid = entry.application.applicant_uuid ?? '';
      return entry.application.applicant_type === 'organisation'
        ? (organisationMap[uuid]?.name ?? 'Organisation')
        : (instructorMap[uuid]?.full_name ?? 'Instructor');
    },
    [instructorMap, organisationMap]
  );

  const updateParents = useMemo<UpdateParent[]>(() => {
    const parents = new Map<string, UpdateParent>();
    for (const entry of entries) {
      if (entry.application.status !== 'approved' || !entry.application.pending_rate_update_uuid)
        continue;
      const key = `${entry.kind}:${entry.parentUuid}`;
      if (!parents.has(key))
        parents.set(key, {
          key,
          kind: entry.kind,
          parentUuid: entry.parentUuid,
          title: entry.title,
        });
    }
    return [...parents.values()];
  }, [entries]);
  const pendingUpdates = entries.filter(
    entry => entry.application.status === 'approved' && entry.application.pending_rate_update_uuid
  ).length;
  const pendingApplications = entries.filter(
    entry => entry.application.status === 'pending'
  ).length;

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-4 pb-10 sm:px-6'>
      <PageHeader
        title='Training applications'
        description='Approve who may train your courses and programs, and at what rates. You see every rate an applicant proposes before you decide.'
      />

      <Tabs value={tab} onValueChange={setTab} className='space-y-5'>
        <TabsList>
          <TabsTrigger value='applications'>
            Applications{loading ? '' : ` (${pendingApplications} pending)`}
          </TabsTrigger>
          <TabsTrigger value='rate-updates'>
            Rate card updates{loading ? '' : ` (${pendingUpdates})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='applications' className='mt-0'>
          <ApplicationsTab
            entries={entries}
            loading={loading}
            error={error}
            onRetry={refetch}
            creatorUuid={creatorUuid}
            applicantName={applicantName}
          />
        </TabsContent>

        <TabsContent value='rate-updates' className='mt-0'>
          <AsyncSection
            loading={loading}
            error={error}
            onRetry={refetch}
            errorTitle='Couldn’t load rate card updates'
            empty={updateParents.length === 0}
            skeleton={<ReviewSkeleton />}
            emptyState={
              <EmptyState
                icon={Layers}
                title='No rate card updates waiting'
                description='When an approved applicant changes their rates, the update appears here for you to approve.'
              />
            }
          >
            <RateUpdatesList parents={updateParents} />
          </AsyncSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function applicantIds(entries: TrainingApplicationEntry[], type: 'instructor' | 'organisation') {
  return entries.flatMap(entry =>
    entry.application.applicant_type === type && entry.application.applicant_uuid
      ? [entry.application.applicant_uuid]
      : []
  );
}

function ApplicationsTab({
  entries,
  loading,
  error,
  onRetry,
  creatorUuid,
  applicantName,
}: {
  entries: TrainingApplicationEntry[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  creatorUuid: string;
  applicantName: (entry: TrainingApplicationEntry) => string;
}) {
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const term = useDeferredValue(search.trim().toLowerCase());

  const filtered = useMemo(
    () =>
      entries
        .filter(entry => status === 'all' || entry.application.status === status)
        .filter(entry => type === 'all' || entry.application.applicant_type === type)
        .filter(
          entry =>
            !term ||
            applicantName(entry).toLowerCase().includes(term) ||
            (entry.title ?? '').toLowerCase().includes(term)
        )
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.application.status ?? ''] ?? 9) -
            (STATUS_ORDER[b.application.status ?? ''] ?? 9)
        ),
    [entries, status, type, term, applicantName]
  );

  useEffect(() => setVisible(PAGE_SIZE), [status, type, term]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-44' aria-label='Filter by status'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className='w-44' aria-label='Filter by applicant type'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='relative ml-auto w-full sm:w-72'>
          <Search
            aria-hidden
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
          />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search applicant or course'
            aria-label='Search applications'
            className='pl-9'
          />
        </div>
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        errorTitle='Couldn’t load training applications'
        empty={filtered.length === 0}
        skeleton={<ReviewSkeleton />}
        emptyState={
          <EmptyState
            icon={FileText}
            title={entries.length ? 'No applications match' : 'No training applications yet'}
            description={
              entries.length
                ? 'Try another status, applicant type or search.'
                : 'Applications appear here when instructors or organisations apply to train your courses.'
            }
          />
        }
      >
        <div className='space-y-5'>
          {filtered.slice(0, visible).map(entry => {
            const name = applicantName(entry);
            const applicantUuid = entry.application.applicant_uuid;
            const isOrganisation = entry.application.applicant_type === 'organisation';
            return (
              <CreatorApplicationReview
                key={`${entry.kind}-${entry.uuid}`}
                entry={entry}
                canDecide={
                  entry.creatorUuid
                    ? entry.creatorUuid === creatorUuid
                    : Boolean(entry.application.rate_floor_flags)
                }
                leading={
                  <Avatar className='size-10'>
                    <AvatarFallback className='bg-primary/10 text-primary text-sm'>
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                }
                heading={
                  applicantUuid ? (
                    <Link
                      href={dashboardUrl('course_creator', `manage-applicant/${applicantUuid}`)}
                      className='hover:underline'
                    >
                      {name}
                    </Link>
                  ) : (
                    name
                  )
                }
                subheading={[
                  isOrganisation ? 'Organisation' : 'Instructor',
                  entry.application.created_date
                    ? `applied ${dayjs(entry.application.created_date).format('D MMM YYYY')}`
                    : null,
                  entry.title ?? (entry.kind === 'program' ? 'Program' : 'Course'),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            );
          })}
          {filtered.length > visible ? (
            <div className='flex justify-center'>
              <Button variant='outline' onClick={() => setVisible(count => count + PAGE_SIZE)}>
                Show more ({filtered.length - visible} left)
              </Button>
            </div>
          ) : null}
        </div>
      </AsyncSection>
    </div>
  );
}

/** One request per course or program, at most a few at a time; no cross-course endpoint exists. */
function RateUpdatesList({ parents }: { parents: UpdateParent[] }) {
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  const markSettled = useCallback(
    (key: string) =>
      setSettled(previous => (previous.has(key) ? previous : new Set(previous).add(key))),
    []
  );
  const active = settled.size + UPDATE_CONCURRENCY;

  return (
    <div className='space-y-8'>
      {parents.map((parent, index) => (
        <ParentRateUpdates
          key={parent.key}
          parent={parent}
          enabled={index < active}
          onSettled={markSettled}
        />
      ))}
    </div>
  );
}

function ParentRateUpdates({
  parent,
  enabled,
  onSettled,
}: {
  parent: UpdateParent;
  enabled: boolean;
  onSettled: (key: string) => void;
}) {
  const { updates, query } = useCreatorRateUpdates(
    parent.kind,
    enabled ? parent.parentUuid : null,
    'pending'
  );
  const done = query.isSuccess || query.isError;

  useEffect(() => {
    if (done) onSettled(parent.key);
  }, [done, onSettled, parent.key]);

  return (
    <section className='space-y-3'>
      <h2 className='text-muted-foreground text-sm font-semibold'>
        {parent.title ?? (parent.kind === 'program' ? 'Program' : 'Course')}
      </h2>
      <AsyncSection
        loading={!done && !query.data}
        error={query.error}
        onRetry={() => void query.refetch()}
        errorTitle='Couldn’t load these rate card updates'
        empty={updates.length === 0}
        skeleton={<ReviewSkeleton count={1} />}
        emptyState={
          <p className='text-muted-foreground rounded-lg border border-dashed p-4 text-sm'>
            No updates waiting for this {parent.kind}.
          </p>
        }
      >
        <div className='space-y-4'>
          {updates.map(update => (
            <CreatorRateUpdateReview
              key={update.uuid}
              update={update}
              kind={parent.kind}
              parentUuid={parent.parentUuid}
              title={parent.title}
            />
          ))}
        </div>
      </AsyncSection>
    </section>
  );
}

function ReviewSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className='space-y-5'>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className='bg-card space-y-4 rounded-xl border p-5'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-4 w-72 max-w-full' />
            </div>
          </div>
          <Skeleton className='h-56 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      ))}
    </div>
  );
}
