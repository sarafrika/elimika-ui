'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import { searchAssessmentRubricsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { AssessmentRubric } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Eye } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { nextEvaluationPage } from './course-evaluation-utils';

export type SavedEvaluationRubric = AssessmentRubric & { uuid: string };

type Props = {
  creatorUuid?: string;
  value?: string | null;
  title?: string;
  label: string;
  emptyLabel?: string;
  disabled?: boolean;
  saving?: boolean;
  onChange: (rubric: SavedEvaluationRubric | null) => void;
  onPreview: (rubricUuid: string) => void;
};

export function EvaluationRubricPicker({
  creatorUuid,
  value,
  title,
  label,
  emptyLabel = 'Select rubric',
  disabled,
  saving,
  onChange,
  onPreview,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className='flex min-w-0 items-center gap-1'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className='min-w-0 flex-1 justify-between font-normal'
            disabled={disabled || !creatorUuid}
            aria-label={label}
          >
            <span className='truncate'>{value ? title || 'Selected rubric' : emptyLabel}</span>
            {saving ? <Spinner /> : <ChevronsUpDown className='size-4 shrink-0' />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-80 max-w-[calc(100vw-2rem)] p-3'>
          {open && creatorUuid && (
            <RubricChoices
              creatorUuid={creatorUuid}
              value={value}
              label={label}
              onSelect={rubric => {
                onChange(rubric);
                setOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={`View ${label}`}
          onClick={() => onPreview(value)}
        >
          <Eye className='size-4' />
        </Button>
      )}
    </div>
  );
}

function RubricChoices({
  creatorUuid,
  value,
  label,
  onSelect,
}: {
  creatorUuid: string;
  value?: string | null;
  label: string;
  onSelect: (rubric: SavedEvaluationRubric | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search.trim());
  const query = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        searchParams: {
          course_creator_uuid_eq: creatorUuid,
          ...(deferredSearch ? { title_like: deferredSearch } : {}),
        },
        pageable: { page, size: 20 },
      },
    }),
    enabled: Boolean(creatorUuid),
    staleTime: STALE_TIMES.entity,
  });
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const rubrics = failed
    ? []
    : (query.data?.data?.content ?? []).filter((rubric): rubric is SavedEvaluationRubric =>
        Boolean(rubric.uuid)
      );
  const hasNext = nextEvaluationPage(query.data?.data?.metadata, page) !== undefined;

  return (
    <div className='space-y-2'>
      <Input
        value={search}
        onChange={event => {
          setSearch(event.target.value);
          setPage(0);
        }}
        aria-label={`Search rubrics for ${label}`}
        placeholder='Search rubrics…'
      />
      <Button
        type='button'
        variant='ghost'
        className='w-full justify-start'
        onClick={() => onSelect(null)}
      >
        No rubric / use fallback
      </Button>
      {query.isLoading ? (
        <Skeleton className='h-24 w-full' />
      ) : failed ? (
        <EmptyState
          variant='compact'
          title='Could not load rubrics'
          action={
            <Button type='button' variant='outline' size='sm' onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      ) : rubrics.length === 0 ? (
        <p className='text-muted-foreground px-2 py-4 text-sm'>No matching rubrics.</p>
      ) : (
        <div className='max-h-64 overflow-y-auto'>
          {rubrics.map(rubric => (
            <Button
              key={rubric.uuid}
              type='button'
              variant='ghost'
              className='h-auto w-full justify-between py-2 text-left font-normal'
              onClick={() => onSelect(rubric)}
            >
              <span className='min-w-0'>
                <span className='block whitespace-normal'>{rubric.title}</span>
                <span className='text-muted-foreground block text-xs'>{rubric.rubric_type}</span>
              </span>
              {value === rubric.uuid && <Check className='size-4 shrink-0' />}
            </Button>
          ))}
        </div>
      )}
      {(page > 0 || hasNext) && (
        <div className='flex items-center justify-between border-t pt-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(previous => previous - 1)}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-xs'>Page {page + 1}</span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={!hasNext || query.isFetching}
            onClick={() => setPage(previous => previous + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
