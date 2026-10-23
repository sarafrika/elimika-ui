import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (value: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const rowsId = useId();
  const safeTotalPages = Math.max(totalPages, 1);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  const pages = (() => {
    if (safeTotalPages <= 7) return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
    const sorted = [...new Set([1, safeTotalPages, currentPage, currentPage - 1, currentPage + 1])]
      .filter(page => page >= 1 && page <= safeTotalPages)
      .sort((a, b) => a - b);
    const items: Array<number | 'ellipsis'> = [];
    sorted.forEach((page, index) => {
      const previous = sorted[index - 1];
      if (previous !== undefined && page - previous > 1) items.push('ellipsis');
      items.push(page);
    });
    return items;
  })();

  return (
    <div className='border-border flex flex-col items-start justify-between gap-3 border-t px-5 py-3.5 md:flex-row md:flex-wrap md:items-center'>
      <p className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
        Showing {start} to {end} of {totalItems} students
      </p>
      <nav aria-label='Student pagination' className='flex flex-wrap items-center gap-1.5'>
        <Button
          variant='outline'
          size='icon'
          className='size-7 rounded-lg'
          aria-label='Previous page'
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className='size-3.5' />
        </Button>
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className='text-muted-foreground px-1 text-xs'>
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size='icon'
              className='size-7 rounded-lg text-xs tabular-nums'
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant='outline'
          size='icon'
          className='size-7 rounded-lg'
          aria-label='Next page'
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
        >
          <ChevronRight className='size-3.5' />
        </Button>
      </nav>
      <div className='flex items-center gap-2'>
        <label htmlFor={rowsId} className='text-muted-foreground text-xs whitespace-nowrap'>
          Rows per page
        </label>
        <Select
          value={String(rowsPerPage)}
          onValueChange={value => onRowsPerPageChange?.(Number(value))}
          disabled={!onRowsPerPageChange}
        >
          <SelectTrigger id={rowsId} className='h-8 w-16 rounded-lg text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map(value => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
