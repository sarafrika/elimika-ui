'use client';

import type { AdminDataTablePagination as AdminDataTablePaginationConfig } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminDataTablePaginationProps extends AdminDataTablePaginationConfig {
  className?: string;
}

export function AdminDataTablePagination({
  className,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: AdminDataTablePaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(totalItems, (page + 1) * pageSize);

  return (
    <div
      className={cn(
        'border-border/60 text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-4 text-sm sm:flex-row',
        className
      )}
    >
      <div>
        Showing <span className='text-foreground font-medium'>{start}</span> –{' '}
        <span className='text-foreground font-medium'>{end}</span> of{' '}
        <span className='text-foreground font-medium'>{totalItems}</span> entries
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 0}
          onClick={() => onPageChange(Math.max(page - 1, 0))}
        >
          Previous
        </Button>
        <div className='text-foreground flex items-center gap-1 text-xs font-medium tracking-wide uppercase'>
          Page {page + 1} <span className='text-muted-foreground'>/</span> {safeTotalPages}
        </div>
        <Button
          variant='outline'
          size='sm'
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, Math.max(totalPages - 1, 0)))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
