'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { StudentGroup, StudentGroupRosterEntry, TrainingBranch } from '@/services/client';
import {
  getTrainingBranchesByOrganisationOptions,
  listGroupsOptions,
  listGroupsQueryKey,
  listRosterOptions,
  listRosterQueryKey,
  removeMemberMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { GroupsFilterRail } from '@/src/features/organisation/groups/components/GroupsFilterRail';
import { RosterSkeleton } from '@/src/features/organisation/groups/components/GroupsPageSkeleton';
import { RemoveFromGroupDialog } from '@/src/features/organisation/groups/components/RemoveFromGroupDialog';
import { RosterPagination } from '@/src/features/organisation/groups/components/RosterPagination';
import { RosterTable } from '@/src/features/organisation/groups/components/RosterTable';
import { StudentDetailSheet } from '@/src/features/organisation/groups/components/StudentDetailSheet';
import {
  buildTierOptions,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  rosterDisplayName,
} from '@/src/features/organisation/groups/lib/roster';

type FilterPatch = Partial<Record<'branch' | 'tier' | 'group' | 'page' | 'size', string | null>>;

// Creating, editing and deleting groups (and their membership) lives in
// Settings → Academic Groups; this page is read-and-remove only.
const MANAGE_GROUPS_HREF = dashboardUrl('organisation', 'settings?tab=groups');

export default function GroupsRosterPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the single source of truth for every filter — no mirrored state,
  // so back/forward and deep links behave without effects fighting each other.
  const branchUuid = searchParams.get('branch');
  const tierUuid = searchParams.get('tier');
  const groupUuid = searchParams.get('group');
  const page = readPage(searchParams.get('page'));
  const pageSize = readPageSize(searchParams.get('size'));

  const applyFilters = useCallback(
    (patch: FilterPatch) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const branches = extractPage<TrainingBranch>(branchesQuery.data).items;

  // Groups are fetched per branch only: the tier pills must stay visible while a
  // tier is selected, so `tierUuid` is deliberately not sent here.
  const groupsQuery = useQuery({
    ...listGroupsOptions({
      path: { organisationUuid },
      query: branchUuid ? { branchUuid } : undefined,
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const groups = extractList<StudentGroup>(groupsQuery.data);
  const tiers = useMemo(() => buildTierOptions(groups), [groups]);

  const rosterQuery = useQuery({
    ...listRosterOptions({
      path: { organisationUuid },
      query: {
        ...(branchUuid ? { branchUuid } : {}),
        ...(tierUuid ? { tierUuid } : {}),
        ...(groupUuid ? { groupUuid } : {}),
        pageable: { page: page - 1, size: pageSize },
      },
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.live,
    placeholderData: keepPreviousData,
  });

  const rosterPage = extractPage<StudentGroupRosterEntry>(rosterQuery.data);
  const entries = rosterPage.items;
  const totalStudents = getTotalFromMetadata(rosterPage.metadata) || entries.length;
  const totalPages = Math.max(
    1,
    typeof rosterPage.metadata.totalPages === 'number'
      ? rosterPage.metadata.totalPages
      : Math.ceil(totalStudents / pageSize)
  );
  const startIndex = (page - 1) * pageSize;

  const activeTier = tiers.find(tier => tier.uuid === tierUuid) ?? null;
  const activeStream =
    activeTier?.streams.find(stream => stream.groupUuid === groupUuid) ??
    (groupUuid
      ? tiers.flatMap(tier => tier.streams).find(stream => stream.groupUuid === groupUuid)
      : undefined);

  const [viewing, setViewing] = useState<StudentGroupRosterEntry | null>(null);
  const [removing, setRemoving] = useState<StudentGroupRosterEntry | null>(null);
  const removeMember = useMutation(removeMemberMutation());

  // Every cached roster page for this organisation goes stale when a membership
  // changes, not just the one on screen — a removal reshuffles later pages too.
  // The prefix is derived from the generated key helper with the volatile
  // `query` part dropped so React Query partial-matches all of them.
  const rosterKeyPrefix = useMemo(() => {
    const [root] = listRosterQueryKey({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: DEFAULT_PAGE_SIZE } },
    });
    const { query, ...prefix } = root;
    return [prefix];
  }, [organisationUuid]);

  const refreshRoster = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rosterKeyPrefix }),
      queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
      }),
    ]);
  }, [organisationUuid, queryClient, rosterKeyPrefix]);

  const confirmRemove = (entry: StudentGroupRosterEntry) => {
    if (!entry.group_uuid || !entry.student_uuid) return;
    removeMember.mutate(
      { path: { groupUuid: entry.group_uuid, studentUuid: entry.student_uuid } },
      {
        onSuccess: async () => {
          setRemoving(null);
          toast.success('Removed from group', { description: rosterDisplayName(entry) });
          await refreshRoster();
        },
        onError: () => toast.error('Could not remove the student from this group.'),
      }
    );
  };

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Academic Groups'
        description='View students by branch and class level, and track their enrolment details.'
      />

      <GroupsFilterRail
        branches={branches}
        tiers={tiers}
        branchUuid={branchUuid}
        tierUuid={tierUuid}
        groupUuid={groupUuid}
        onBranchChange={next => applyFilters({ branch: next, page: null })}
        onTierChange={(nextTier, nextGroup) =>
          applyFilters({ tier: nextTier, group: nextGroup ?? null, page: null })
        }
      />

      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-2'>
        <h2 className='text-xl font-bold'>
          {activeTier?.name ?? 'All levels'}
          {activeStream ? (
            <span className='text-muted-foreground ml-2 text-base font-medium'>
              {activeStream.label}
            </span>
          ) : null}
        </h2>
        <span className='text-muted-foreground text-sm'>
          Total Students: <span className='text-primary font-semibold'>{totalStudents}</span>
        </span>
        <Button asChild variant='ghost' size='sm' className='ml-auto'>
          <Link href={MANAGE_GROUPS_HREF}>
            <Settings2 className='mr-2 h-4 w-4' /> Manage groups
          </Link>
        </Button>
      </div>

      <AsyncSection
        loading={rosterQuery.isLoading && !rosterQuery.data}
        error={rosterQuery.error}
        empty={entries.length === 0}
        errorTitle='Couldn’t load the student roster'
        onRetry={() => {
          void rosterQuery.refetch();
        }}
        skeleton={
          <div className='bg-card rounded-lg border p-4'>
            <RosterSkeleton rows={Math.min(pageSize, 10)} />
          </div>
        }
        emptyState={
          <div className='bg-card rounded-lg border p-6'>
            <EmptyState
              icon={Users}
              title={page > 1 ? 'Nothing on this page' : 'No students in this selection'}
              description={
                page > 1
                  ? 'The roster has fewer pages than this. Go back to the first page.'
                  : 'Add students to a group to see them on the roster.'
              }
              action={
                page > 1 ? (
                  <Button variant='outline' size='sm' onClick={() => applyFilters({ page: null })}>
                    Go to first page
                  </Button>
                ) : (
                  <Button asChild variant='outline' size='sm'>
                    <Link href={MANAGE_GROUPS_HREF}>Manage groups</Link>
                  </Button>
                )
              }
            />
          </div>
        }
      >
        <div
          className={cn(
            'bg-card rounded-lg border transition-opacity',
            rosterQuery.isFetching && 'opacity-60'
          )}
          aria-busy={rosterQuery.isFetching}
        >
          <RosterTable
            entries={entries}
            startIndex={startIndex}
            onView={setViewing}
            onRemove={setRemoving}
          />
          <RosterPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalElements={totalStudents}
            rowsOnPage={entries.length}
            startIndex={startIndex}
            onPageChange={next => applyFilters({ page: next <= 1 ? null : String(next) })}
            onPageSizeChange={next =>
              applyFilters({
                size: next === DEFAULT_PAGE_SIZE ? null : String(next),
                page: null,
              })
            }
          />
        </div>
      </AsyncSection>

      <StudentDetailSheet entry={viewing} onClose={() => setViewing(null)} />
      <RemoveFromGroupDialog
        entry={removing}
        pending={removeMember.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function readPage(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

function readPageSize(value: string | null): number {
  const parsed = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}
