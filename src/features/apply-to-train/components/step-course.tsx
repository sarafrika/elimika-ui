'use client';

import { Search, SearchX, ShieldAlert } from 'lucide-react';

import { SectionError } from '@/components/data/async-section';
import { SearchUnavailable } from '@/components/search/search-unavailable';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { clearSearchUnavailable } from '@/lib/search/availability';
import { cn } from '@/lib/utils';
import type { ApplyItem } from '../types';
import {
  type CatalogueFilters,
  type CatalogueFit,
  type CatalogueShow,
  useApplyCatalogue,
} from '../use-apply-catalogue';
import { ApplyItemCard } from './apply-item-card';

const FIT_PILLS: { value: CatalogueFit; label: string }[] = [
  { value: 'open', label: 'All open' },
  { value: 'skills', label: 'Matches my skills' },
  { value: 'applied', label: 'Already applied' },
];

const SHOW_OPTIONS: { value: CatalogueShow; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'courses', label: 'Courses' },
  { value: 'programmes', label: 'Programmes' },
];

/** Step 1: search the catalogue and choose what to apply for. */
export function StepCourse({
  filters,
  onFilters,
  selectedUuid,
  onChoose,
  onDetails,
}: {
  filters: CatalogueFilters;
  onFilters: (filters: CatalogueFilters) => void;
  selectedUuid: string | null;
  onChoose: (item: ApplyItem) => void;
  onDetails: (item: ApplyItem) => void;
}) {
  const catalogue = useApplyCatalogue(filters);
  const set = (patch: Partial<CatalogueFilters>) => onFilters({ ...filters, page: 0, ...patch });
  const { query, items, facets } = catalogue;

  return (
    <div className='space-y-4'>
      <div className='bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-3.5 shadow-sm'>
        <label className='relative block min-w-0 flex-[1_1_280px]'>
          <span className='sr-only'>Search courses and programmes</span>
          <Search
            aria-hidden
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2'
          />
          <Input
            type='search'
            className='h-11 pl-10'
            placeholder='Search by name, code or category'
            value={filters.q}
            onChange={event => set({ q: event.target.value })}
          />
        </label>
        <div role='group' aria-label='Show' className='bg-muted flex rounded-xl p-1'>
          {SHOW_OPTIONS.map(option => (
            <button
              key={option.value}
              type='button'
              aria-pressed={filters.show === option.value}
              onClick={() => set({ show: option.value })}
              className={cn(
                'h-9 rounded-lg px-3 text-sm font-medium',
                filters.show === option.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
              <span className='text-muted-foreground ml-1.5 font-mono text-xs'>
                {facets.show[option.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* <div role='group' aria-label='Filter' className='flex flex-wrap gap-2'>
        {FIT_PILLS.map(pill => (
          <Pill
            key={pill.value}
            label={pill.label}
            count={facets.fit[pill.value]}
            on={filters.fit === pill.value}
            onClick={() => set({ fit: pill.value })}
          />
        ))}
        {facets.categories.map(category => (
          <Pill
            key={category.uuid}
            label={category.name}
            count={category.count}
            on={filters.category === category.uuid}
            onClick={() =>
              set({ category: filters.category === category.uuid ? null : category.uuid })
            }
          />
        ))}
      </div> */}

      {catalogue.unavailable ? (
        <SearchUnavailable
          variant='card'
          description='The course catalogue runs on search, which is down for a moment. Try again shortly.'
          onRetry={() => {
            clearSearchUnavailable();
            void query.refetch();
          }}
        />
      ) : catalogue.forbidden ? (
        <EmptyState
          variant='card'
          icon={ShieldAlert}
          title='Your instructor profile isn’t approved yet'
          description='You can apply to train once an admin approves your instructor profile.'
        />
      ) : query.error ? (
        <SectionError
          title='Couldn’t load the catalogue'
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <CardGridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          variant='card'
          icon={SearchX}
          title='Nothing matches'
          description='Clear the search or pick another filter.'
          action={
            <Button
              variant='outline'
              size='sm'
              onClick={() => onFilters({ ...filters, q: '', category: null, fit: 'open', page: 0 })}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div
            className={cn(
              'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 transition-opacity',
              query.isPlaceholderData && 'opacity-60'
            )}
          >
            {items.map((item, index) => (
              <ApplyItemCard
                key={item.uuid}
                item={item}
                index={index}
                selected={item.uuid === selectedUuid}
                onDetails={() => onDetails(item)}
                onChoose={() => onChoose(item)}
              />
            ))}
          </div>
          {catalogue.totalPages > 1 ? (
            <div className='flex items-center justify-between gap-3'>
              <Button
                variant='outline'
                disabled={filters.page === 0}
                onClick={() => onFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </Button>
              <span className='text-muted-foreground text-sm'>
                Page {filters.page + 1} of {catalogue.totalPages}
              </span>
              <Button
                variant='outline'
                disabled={filters.page + 1 >= catalogue.totalPages}
                onClick={() => onFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Pill({
  label,
  count,
  on,
  onClick,
}: {
  label: string;
  count: number;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors',
        on
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card text-foreground hover:bg-muted'
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 font-mono text-xs',
          on ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CardGridSkeleton() {
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className='h-[380px] rounded-2xl' />
      ))}
    </div>
  );
}
