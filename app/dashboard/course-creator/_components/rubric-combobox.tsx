'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Check, Globe } from 'lucide-react';
import { type EntityOption, EntityCombobox } from '@/components/search/entity-combobox';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import { withQ } from '@/lib/search/params';
import { cn } from '@/lib/utils';
import type { AssessmentRubric } from '@/services/client';
import {
  getAssessmentRubricByUuidOptions,
  searchAssessmentRubricsOptions,
  searchPublicRubricsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const PAGE = { page: 0, size: 20 };
const NONE = '__none__';

function rubricOptions(rubrics: readonly AssessmentRubric[] | undefined): EntityOption[] {
  return (rubrics ?? []).flatMap(rubric =>
    rubric.uuid
      ? [
          {
            value: rubric.uuid,
            label: rubric.title,
            description: rubric.rubric_type || undefined,
          },
        ]
      : []
  );
}

/**
 * A rubric picker for course creators: their own rubrics searched through `q` on
 * `/rubrics/search`, plus a "Public rubrics" group from discovery search, since a creator may
 * use their own rubrics or public ones. Nothing is loaded until the picker opens.
 */
export function RubricCombobox({
  creatorUuid,
  value,
  onChange,
  allowNone = true,
  noneLabel = 'None',
  placeholder = 'Select a rubric',
  disabled,
  className,
  'aria-label': ariaLabel = 'Rubric',
}: {
  creatorUuid: string | undefined;
  value: string | null | undefined;
  /** The rubric's uuid, or '' for "None". */
  onChange: (uuid: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  // The selected rubric may be on another page, or someone else's public rubric.
  const selectedQuery = useQuery({
    ...getAssessmentRubricByUuidOptions({ path: { uuid: value ?? '' } }),
    enabled: Boolean(value),
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const selectedTitle = selectedQuery.data?.data?.title;

  return (
    <EntityCombobox
      value={value || ''}
      onChange={next => onChange(next === NONE ? '' : next)}
      queryOptions={q => ({
        ...searchAssessmentRubricsOptions({
          query: {
            searchParams: withQ({ course_creator_uuid_eq: creatorUuid ?? '' }, q),
            pageable: PAGE,
          },
        }),
        enabled: Boolean(creatorUuid),
      })}
      toOptions={data => rubricOptions(data.data?.content)}
      selectedLabel={selectedTitle ?? (selectedQuery.isError ? 'Rubric not shared' : 'Loading…')}
      placeholder={placeholder}
      searchPlaceholder='Search rubrics…'
      emptyText='No rubric matches'
      groupHeading='Your rubrics'
      disabled={disabled || !creatorUuid}
      className={className}
      aria-label={ariaLabel}
      extraGroups={({ q, select }) => (
        <>
          {allowNone ? (
            <CommandGroup>
              <CommandItem value={NONE} onSelect={() => select(NONE, undefined)}>
                <Check className={cn('size-4', value ? 'opacity-0' : 'opacity-100')} />
                <span className='text-muted-foreground'>{noneLabel}</span>
              </CommandItem>
            </CommandGroup>
          ) : null}
          <PublicRubricsGroup q={q} creatorUuid={creatorUuid} value={value} onSelect={select} />
        </>
      )}
    />
  );
}

/** Public rubrics by other creators, searched with the same term. */
function PublicRubricsGroup({
  q,
  creatorUuid,
  value,
  onSelect,
}: {
  q: string | undefined;
  creatorUuid: string | undefined;
  value: string | null | undefined;
  onSelect: (value: string, option: EntityOption | undefined) => void;
}) {
  const query = useQuery({
    ...searchPublicRubricsOptions({ query: { ...(q ? { q } : {}), pageable: PAGE } }),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const options = rubricOptions(
    extractPage<AssessmentRubric>(query.data).items.filter(
      rubric => rubric.course_creator_uuid !== creatorUuid
    )
  );
  if (options.length === 0) return null;

  return (
    <CommandGroup heading='Public rubrics'>
      {options.map(option => (
        <CommandItem
          key={option.value}
          value={`public:${option.value}`}
          onSelect={() => onSelect(option.value, option)}
        >
          <Check className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
          <Globe aria-hidden className='text-muted-foreground size-3.5' />
          <div className='min-w-0'>
            <p className='truncate'>{option.label}</p>
            {option.description ? (
              <p className='text-muted-foreground truncate text-xs'>{option.description}</p>
            ) : null}
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
