'use client';

import {
  keepPreviousData,
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Spinner from '@/components/ui/spinner';
import { useSearchErrors, useSearchQuery } from '@/hooks/use-search-query';
import { STALE_TIMES } from '@/lib/query-client';
import { SEARCH_UNAVAILABLE_TITLE } from '@/components/search/search-unavailable';
import { cn } from '@/lib/utils';

export type EntityOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type EntityQueryOptions<TData, TKey extends QueryKey> = UseQueryOptions<TData, Error, TData, TKey>;

export type EntityComboboxProps<TData, TKey extends QueryKey = QueryKey> = {
  /** Heading for the server results when other groups are shown alongside. */
  groupHeading?: string;
  /** Selected id, or empty. */
  value: string | null | undefined;
  onChange: (value: string, option: EntityOption | undefined) => void;
  /**
   * The generated `*Options(...)` for one page of candidates. `q` is the debounced term
   * (2+ characters) or undefined; send it as `q` where the endpoint supports it.
   */
  queryOptions: (q: string | undefined) => EntityQueryOptions<TData, TKey>;
  /** Pull the options out of a response. */
  toOptions: (data: TData) => EntityOption[];
  /** Label for the selected id when it is not in the current page (e.g. from a lookup). */
  selectedLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /**
   * Rendered above the server results, e.g. a "None" item or a "Public rubrics" group. A
   * function receives the debounced term and a `select` that also closes the picker.
   */
  extraGroups?:
    | ReactNode
    | ((context: {
        q: string | undefined;
        select: (value: string, option: EntityOption | undefined) => void;
      }) => ReactNode);
  disabled?: boolean;
  /** Keep the dropdown inside its parent sheet/dialog when false. */
  portalled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/**
 * A picker backed by a server search: Popover + `Command shouldFilter={false}` so cmdk
 * does not filter the server's already-ranked page. Fetches only while open, keeps the
 * previous page while a new term loads, and falls back to the unfiltered page (with a
 * notice) when the search index answers 503.
 */
export function EntityCombobox<TData, TKey extends QueryKey = QueryKey>({
  value,
  onChange,
  queryOptions,
  toOptions,
  selectedLabel,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches',
  extraGroups,
  groupHeading,
  disabled,
  portalled = true,
  className,
  'aria-label': ariaLabel,
}: EntityComboboxProps<TData, TKey>) {
  const [open, setOpen] = useState(false);
  const search = useSearchQuery();
  const query = useQuery({
    ...queryOptions(search.q),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.entity,
  });
  useSearchErrors(search.q, query.error);

  const options = query.data ? toOptions(query.data) : [];
  const select = (next: string, option: EntityOption | undefined) => {
    onChange(next, option);
    setOpen(false);
  };
  const selected = options.find(option => option.value === value);
  const triggerLabel = selected?.label ?? (value ? (selectedLabel ?? value) : placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          <span className='truncate'>{triggerLabel}</span>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={portalled}
        className='w-[--radix-popover-trigger-width] min-w-[280px] p-0'
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search.input}
            onValueChange={search.setInput}
            placeholder={searchPlaceholder}
          />
          <CommandList aria-busy={query.isFetching}>
            {search.searchUnavailable ? (
              <p className='text-muted-foreground border-b px-3 py-2 text-xs' role='status'>
                {SEARCH_UNAVAILABLE_TITLE}. Showing the first results instead.
              </p>
            ) : search.tooShort ? (
              <p className='text-muted-foreground px-3 py-2 text-xs'>Type at least 2 characters</p>
            ) : null}
            {query.isLoading ? (
              <div className='text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm'>
                <Spinner /> Loading…
              </div>
            ) : query.isError && !search.searchUnavailable ? (
              <p className='text-destructive px-3 py-4 text-sm' role='alert'>
                Could not load options.
              </p>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {typeof extraGroups === 'function' ? extraGroups({ q: search.q, select }) : extraGroups}
            {options.length > 0 ? (
              <CommandGroup heading={groupHeading}>
                {options.map(option => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => select(option.value, option)}
                  >
                    <Check
                      className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className='min-w-0'>
                      <p className='truncate'>{option.label}</p>
                      {option.description ? (
                        <p className='text-muted-foreground truncate text-xs'>{option.description}</p>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The same picker over a list that is already loaded and bounded (e.g. the courses an
 * instructor may deliver): the endpoint has no `q`, so cmdk filters the labels in the
 * browser. Use `EntityCombobox` whenever the endpoint can search.
 */
export function OptionCombobox({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Filter…',
  emptyText = 'No matches',
  loading,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string | null | undefined;
  onChange: (value: string, option: EntityOption | undefined) => void;
  options: EntityOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
        >
          <span className='truncate'>{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] min-w-[280px] p-0' align='start'>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {loading ? (
              <div className='text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm'>
                <Spinner /> Loading…
              </div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {options.length > 0 ? (
              <CommandGroup>
                {options.map(option => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, option.description ?? '']}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value, option);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className='min-w-0'>
                      <p className='truncate'>{option.label}</p>
                      {option.description ? (
                        <p className='text-muted-foreground truncate text-xs'>{option.description}</p>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
