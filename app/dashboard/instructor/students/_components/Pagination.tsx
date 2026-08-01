import { Button } from '../../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';

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
  const safeTotalPages = Math.max(totalPages, 1);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalItems);

  const pages = (() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
    }

    const visible = new Set([1, safeTotalPages, currentPage, currentPage - 1, currentPage + 1]);

    const sorted = Array.from(visible)
      .filter(page => page >= 1 && page <= safeTotalPages)
      .sort((a, b) => a - b);

    const pageItems: Array<number | 'ellipsis'> = [];

    sorted.forEach((page, index) => {
      const previous = sorted[index - 1];
      if (index > 0 && previous !== undefined && page - previous > 1) {
        pageItems.push('ellipsis');
      }
      pageItems.push(page);
    });

    return pageItems;
  })();

  return (
    <div className='border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3'>
      {/* Left info */}
      <p className='text-muted-foreground text-xs whitespace-nowrap'>
        Showing {start} to {end} of {totalItems} students
      </p>

      {/* Right controls */}
      <div className='flex items-center gap-1'>
        {/* Prev */}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label='Previous page'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </Button>

        {/* Pages */}
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${currentPage}-${safeTotalPages}-${index}`}
              className='text-muted-foreground px-1 text-xs'
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'ghost'}
              size='icon'
              onClick={() => onPageChange(page)}
              className='h-7 w-7 text-xs'
            >
              {page}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
          aria-label='Next page'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <polyline points='9 18 15 12 9 6' />
          </svg>
        </Button>

        {/* Rows per page */}
        <div className='border-border ml-2 flex items-center gap-2 border-l pl-2'>
          <span className='text-muted-foreground text-xs whitespace-nowrap'>Rows per page</span>

          <Select
            value={String(rowsPerPage)}
            onValueChange={val => onRowsPerPageChange?.(Number(val))}
          >
            <SelectTrigger className='h-8 w-[70px] text-xs'>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value='10'>10</SelectItem>
              <SelectItem value='20'>20</SelectItem>
              <SelectItem value='50'>50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
