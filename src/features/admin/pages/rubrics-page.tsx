'use client';

import { Archive, ClipboardList, Eye, EyeOff, Globe2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  DataTable,
  DetailGrid,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreatorsByIds } from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import type { AssessmentRubric } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FilterBar } from '../components/filter-bar';
import { SectionBoundary } from '../components/section-boundary';
import {
  RUBRICS_PAGE_SIZE,
  useRubricMatrix,
  useRubrics,
  useRubricStatistics,
  useUpdateRubric,
} from '../hooks/use-rubrics';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const searchParam = stringParam();
const typeParam = stringParam('any');
const visibilityParam = stringParam('any');
const statusParam = stringParam('any');
const activeParam = stringParam('any');
const pageParam = numberParam(0);

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'destructive'> = {
  PUBLISHED: 'success',
  IN_REVIEW: 'warning',
  DRAFT: 'neutral',
  ARCHIVED: 'destructive',
};

export function RubricsPage() {
  const [q] = useSearchState('q', searchParam);
  const [type] = useSearchState('type', typeParam);
  const [visibility] = useSearchState('visibility', visibilityParam);
  const [status] = useSearchState('status', statusParam);
  const [active] = useSearchState('active', activeParam);
  const [page, setPage] = useSearchState('page', pageParam);

  const [openRubric, setOpenRubric] = useState<AssessmentRubric | null>(null);
  const [pendingArchive, setPendingArchive] = useState<AssessmentRubric | null>(null);
  const [pendingVisibility, setPendingVisibility] = useState<AssessmentRubric | null>(null);

  const { counts, query: statsQuery } = useRubricStatistics();
  const { rubrics, totalRows, pageCount, query, isFiltered } = useRubrics({
    q,
    type: type === 'any' ? undefined : type,
    visibility,
    status: status === 'any' ? undefined : status,
    active,
    page,
  });

  // One batched lookup for every creator on the page — never a request per row.
  const creatorIds = useMemo(
    () => rubrics.map(rubric => rubric.course_creator_uuid).filter(Boolean),
    [rubrics]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);

  const { matrix, query: matrixQuery } = useRubricMatrix(openRubric?.uuid ?? null);
  const update = useUpdateRubric();

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Rubrics'
          title='Assessment rubrics'
          description='Every rubric on the platform, who wrote it, and whether others can reuse it.'
        />

        <SectionBoundary
          label='the rubric counts'
          loading={statsQuery.isLoading}
          error={statsQuery.error}
          onRetry={statsQuery.refetch}
          skeleton={
            <div className='grid gap-4 sm:grid-cols-2'>
              {[0, 1].map(item => (
                <StatCardSkeleton key={item} />
              ))}
            </div>
          }
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <StatCard label='Rubrics' value={counts.total} icon={ClipboardList} />
            <StatCard
              label='Shared publicly'
              value={counts.public}
              icon={Globe2}
              hint='Discoverable by other course creators'
            />
          </div>
        </SectionBoundary>

        <FilterBar
          values={{ q, visibility, status, active }}
          searchPlaceholder='Search rubric titles…'
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'DRAFT', label: 'Draft' },
                { value: 'IN_REVIEW', label: 'In review' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'ARCHIVED', label: 'Archived' },
              ],
            },
            {
              key: 'visibility',
              label: 'Visibility',
              options: [
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ],
            },
            {
              key: 'active',
              label: 'Availability',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        <SectionBoundary
          label='the rubrics'
          loading={query.isLoading && rubrics.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && rubrics.length === 0}
          emptyTitle={isFiltered ? 'Nothing matches these filters' : 'No rubrics yet'}
          emptyDescription={
            isFiltered
              ? 'Clear the search or filters to see every rubric.'
              : 'Rubrics appear here once a course creator writes one.'
          }
          skeleton={
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          }
        >
          <DataTable
            hideToolbar
            data={rubrics}
            isLoading={query.isLoading}
            getRowId={rubric => rubric.uuid ?? rubric.title}
            onRowClick={rubric => setOpenRubric(rubric)}
            pageSize={RUBRICS_PAGE_SIZE}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'rubric',
                header: 'Rubric',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {row.original.title}
                    </p>
                    {row.original.description ? (
                      <p className='text-muted-foreground truncate text-xs'>
                        {row.original.description}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'type',
                header: 'Type',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-sm'>
                    {row.original.rubric_category || row.original.rubric_type || '—'}
                  </span>
                ),
              },
              {
                id: 'creator',
                header: 'Creator',
                cell: ({ row }) => {
                  const creator = courseCreatorMap[row.original.course_creator_uuid];
                  return (
                    <span className='text-muted-foreground text-sm'>
                      {creator?.full_name ?? '—'}
                    </span>
                  );
                },
              },
              {
                id: 'visibility',
                header: 'Visibility',
                cell: ({ row }) => (
                  <StatusBadge
                    label={row.original.is_public ? 'Public' : 'Private'}
                    tone={row.original.is_public ? 'info' : 'neutral'}
                  />
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <div className='flex flex-wrap gap-1'>
                    <StatusBadge
                      label={row.original.status}
                      tone={STATUS_TONE[row.original.status] ?? 'neutral'}
                    />
                    {row.original.active === false ? (
                      <StatusBadge label='Inactive' tone='neutral' />
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'weight',
                header: 'Weight',
                cell: ({ row }) =>
                  row.original.total_weight ? (
                    <span className='text-muted-foreground font-mono text-xs'>
                      {row.original.total_weight} {row.original.weight_unit ?? ''}
                    </span>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  ),
              },
              {
                id: 'updated',
                header: 'Updated',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.updated_date ?? row.original.created_date) || '—'}
                  </span>
                ),
              },
            ]}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          Rubric edits have no ownership check on the backend today, so any instructor or course
          creator can change any rubric. Tightening that is a backend change.
        </p>
      </div>

      <Sheet open={openRubric !== null} onOpenChange={open => !open && setOpenRubric(null)}>
        <SheetContent className='w-full sm:max-w-[640px]'>
          <SheetHeader>
            <SheetTitle>{openRubric?.title}</SheetTitle>
            <SheetDescription>
              {openRubric?.rubric_category || openRubric?.rubric_type} ·{' '}
              {openRubric?.is_public ? 'Public' : 'Private'}
            </SheetDescription>
          </SheetHeader>

          <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-4'>
            {openRubric ? (
              <DetailGrid
                columns={2}
                items={[
                  { label: 'Status', value: openRubric.status },
                  { label: 'Active', value: openRubric.active ? 'Yes' : 'No' },
                  {
                    label: 'Weight',
                    value: openRubric.total_weight
                      ? `${openRubric.total_weight} ${openRubric.weight_unit ?? ''}`
                      : '—',
                  },
                  { label: 'Max score', value: openRubric.max_score ?? '—' },
                  { label: 'Pass mark', value: openRubric.min_passing_score ?? '—' },
                  { label: 'Created', value: formatDate(openRubric.created_date) || '—' },
                ]}
              />
            ) : null}

            <SectionBoundary
              label='the rubric matrix'
              loading={matrixQuery.isLoading}
              error={matrixQuery.error}
              onRetry={matrixQuery.refetch}
              empty={!matrixQuery.isLoading && !matrix}
              emptyTitle='No matrix yet'
              emptyDescription='This rubric has no criteria or scoring levels.'
            >
              {matrix ? (
                <div className='space-y-3'>
                  <p className='text-muted-foreground text-xs'>
                    {matrix.criteria.length} criteria · {matrix.scoring_levels.length} scoring
                    levels · {matrix.is_complete ? 'every cell written' : 'some cells empty'}
                  </p>
                  <ul className='flex flex-col gap-2'>
                    {matrix.criteria.map(criterion => (
                      <li
                        key={criterion.uuid}
                        className='border-border/60 rounded-md border px-3 py-2'
                      >
                        <p className='text-foreground text-sm font-medium'>{criterion.component_name}</p>
                        {criterion.description ? (
                          <p className='text-muted-foreground text-xs'>{criterion.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className='flex flex-wrap gap-2'>
                    {matrix.scoring_levels.map(level => (
                      <StatusBadge key={level.uuid} tone='neutral' label={level.name} />
                    ))}
                  </div>
                </div>
              ) : null}
            </SectionBoundary>

            <p className='text-muted-foreground text-xs'>
              Which courses use this rubric cannot be looked up in reverse — the association is
              only readable per course.
            </p>

            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                className='rounded-md'
                disabled={!openRubric}
                onClick={() => setPendingVisibility(openRubric)}
              >
                {openRubric?.is_public ? (
                  <>
                    <EyeOff className='mr-2 size-4' />
                    Make private
                  </>
                ) : (
                  <>
                    <Eye className='mr-2 size-4' />
                    Make public
                  </>
                )}
              </Button>
              <Button
                variant='outline'
                className='border-destructive/40 text-destructive rounded-md'
                disabled={!openRubric || openRubric.status === 'ARCHIVED'}
                onClick={() => setPendingArchive(openRubric)}
              >
                <Archive className='mr-2 size-4' />
                Archive
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={open => !open && setPendingArchive(null)}
        action='archiveRubric'
        subject={{ name: pendingArchive?.title ?? '' }}
        isPending={update.isPending}
        onConfirm={() => {
          if (!pendingArchive) return;
          update.mutate(
            { rubric: pendingArchive, changes: { status: 'ARCHIVED', active: false } },
            {
              onSuccess: () => {
                setPendingArchive(null);
                setOpenRubric(null);
              },
            }
          );
        }}
      />

      <ConfirmDialog
        open={pendingVisibility !== null}
        onOpenChange={open => !open && setPendingVisibility(null)}
        action='setRubricVisibility'
        subject={{
          name: pendingVisibility?.title ?? '',
          detail: pendingVisibility?.is_public ? 'private' : 'public',
        }}
        isPending={update.isPending}
        onConfirm={() => {
          if (!pendingVisibility) return;
          update.mutate(
            { rubric: pendingVisibility, changes: { is_public: !pendingVisibility.is_public } },
            { onSuccess: () => setPendingVisibility(null) }
          );
        }}
      />
    </div>
  );
}
