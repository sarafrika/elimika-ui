'use client';
// admin-boundary: foundation

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSearchStatePatch } from '../state/use-search-state';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSpec {
  /** Query-string key this filter writes. */
  key: string;
  label: string;
  options: FilterOption[];
  /** Value that means "no filter"; it is dropped from the URL. */
  anyValue?: string;
}

interface FilterBarProps {
  /** Current values, read from the URL by the page. */
  values: Record<string, string>;
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: FilterSpec[];
  /** Right-aligned extras: counts, export, create. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Search and filters that live in the URL. Typing is debounced so a search does not
 * fire a request per keystroke, and changing a filter resets paging.
 */
export function FilterBar({
  values,
  searchKey = 'q',
  searchPlaceholder = 'Search…',
  filters = [],
  children,
  className,
}: FilterBarProps) {
  const patch = useSearchStatePatch();
  const [term, setTerm] = useState(values[searchKey] ?? '');

  useEffect(() => {
    setTerm(values[searchKey] ?? '');
  }, [values, searchKey]);

  useEffect(() => {
    const current = values[searchKey] ?? '';
    if (term === current) return;
    const timer = setTimeout(() => patch({ [searchKey]: term || undefined }), 250);
    return () => clearTimeout(timer);
  }, [term, values, searchKey, patch]);

  const activeFilters = filters.filter(filter => {
    const value = values[filter.key];
    return value && value !== (filter.anyValue ?? 'any');
  });

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className='relative min-w-[240px] flex-1'>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
        <Input
          value={term}
          onChange={event => setTerm(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className='border-border/70 rounded-md pl-9'
        />
      </div>

      {filters.map(filter => {
        const anyValue = filter.anyValue ?? 'any';
        return (
          <Select
            key={filter.key}
            value={values[filter.key] || anyValue}
            onValueChange={value => patch({ [filter.key]: value === anyValue ? undefined : value })}
          >
            <SelectTrigger className='border-border/70 h-9 w-auto min-w-[150px] rounded-md'>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={anyValue}>{filter.label}: any</SelectItem>
              {filter.options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {activeFilters.length || term ? (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            setTerm('');
            patch({
              [searchKey]: undefined,
              ...Object.fromEntries(filters.map(filter => [filter.key, undefined])),
            });
          }}
        >
          <X className='mr-1 size-3.5' />
          Clear
        </Button>
      ) : null}

      {children ? <div className='ml-auto flex items-center gap-2'>{children}</div> : null}
    </div>
  );
}
