'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PAGE_SIZES } from '@/src/features/organisation/groups/lib/roster';

export type RosterPaginationProps = {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  /** Rows rendered on the current page. */
  rowsOnPage: number;
  startIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

/** Windowed page numbers so a 40-page roster doesn't render 40 buttons. */
function pageWindow(page: number, totalPages: number): number[] {
  const span = 5;
  const start = Math.max(1, Math.min(page - Math.floor(span / 2), totalPages - span + 1));
  const from = Math.max(1, start);
  const to = Math.min(totalPages, from + span - 1);
  const pages: number[] = [];
  for (let n = from; n <= to; n += 1) pages.push(n);
  return pages;
}

export function RosterPagination({
  page,
  pageSize,
  totalPages,
  totalElements,
  rowsOnPage,
  startIndex,
  onPageChange,
  onPageSizeChange,
}: RosterPaginationProps) {
  const first = rowsOnPage === 0 ? 0 : startIndex + 1;
  const last = startIndex + rowsOnPage;

  return (
    <div className='flex flex-col items-center justify-between gap-4 border-t px-4 py-3 sm:flex-row'>
      <p className='text-muted-foreground text-sm'>
        Showing {first} to {last} of {totalElements} student{totalElements === 1 ? '' : 's'}
      </p>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label='Previous page'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        {pageWindow(page, totalPages).map(n => (
          <Button
            key={n}
            variant={n === page ? 'outline' : 'ghost'}
            size='icon'
            className={cn('h-8 w-8', n === page && 'border-primary text-primary')}
            onClick={() => onPageChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </Button>
        ))}
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label='Next page'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
        <Select value={String(pageSize)} onValueChange={value => onPageSizeChange(Number(value))}>
          <SelectTrigger className='ml-2 h-8 w-[130px]' aria-label='Rows per page'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(size => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
