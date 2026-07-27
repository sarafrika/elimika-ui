'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ClassSessionLedgerRow } from './class-session-ledger-table.utils';

const ITEMS_PER_PAGE = 10;

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
}

function statusBadgeClassName(tone: ClassSessionLedgerRow['statusTone']) {
  switch (tone) {
    case 'success':
      return 'border-success/30 bg-success/10 text-success';
    case 'warning':
      return 'border-warning/30 bg-warning/10 text-warning';
    case 'info':
      return 'border-primary/30 bg-primary/10 text-primary';
    default:
      return 'border-border/70 bg-muted/50 text-muted-foreground';
  }
}

function valueClassName(value: string) {
  if (value === 'Yes' || value === '100%' || value === '85%' || value === '60%') {
    return 'text-success';
  }

  if (value === 'No' || value === 'Absent') {
    return 'text-destructive';
  }

  if (value === 'Late' || value === 'Very late') {
    return 'text-warning';
  }

  return 'text-foreground';
}

type ClassSessionLedgerTableProps = {
  rows: ClassSessionLedgerRow[];
  showFinancialColumns?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ClassSessionLedgerTable({
  rows,
  showFinancialColumns = true,
  emptyTitle = 'No sessions found',
  emptyDescription = 'Try another filter or check back later for more scheduled sessions.',
}: ClassSessionLedgerTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(Math.ceil(rows.length / ITEMS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRows = rows.slice(pageStartIndex, pageStartIndex + ITEMS_PER_PAGE);
  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );

  const resultStart = rows.length ? pageStartIndex + 1 : 0;
  const resultEnd = Math.min(pageStartIndex + paginatedRows.length, rows.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className='overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-sm'>
      <div className='overflow-x-auto'>
        <Table className='min-w-[1120px]'>
          <TableHeader>
            <TableRow className='border-border/70 hover:bg-transparent'>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                #
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Session Dates &amp; Time
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Class Duration
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Trainer Attendance
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Student Attendance
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Training
              </TableHead>
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Assessment
              </TableHead>
              {showFinancialColumns ? (
                <>
                  <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                    Order Amount
                  </TableHead>
                  <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                    Payable Amount
                  </TableHead>
                </>
              ) : null}
              <TableHead className='px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Status
              </TableHead>
              <TableHead className='px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map(row => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'border-border/70 hover:bg-muted/30',
                    row.statusTone === 'success' ? 'bg-success/5' : '',
                    row.statusTone === 'warning' ? 'bg-warning/5' : '',
                    row.statusTone === 'info' ? 'bg-primary/5' : ''
                  )}
                >
                  <TableCell className='px-4 py-4 text-sm font-semibold text-foreground'>
                    {row.index}
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm text-foreground whitespace-nowrap'>
                    {row.sessionDateTime}
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm text-foreground whitespace-nowrap'>
                    {row.classDuration}
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm whitespace-nowrap'>
                    <span className={valueClassName(row.trainerAttendance)}>
                      {row.trainerAttendance}
                    </span>
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm whitespace-nowrap'>
                    <span className={valueClassName(row.studentAttendance)}>
                      {row.studentAttendance}
                    </span>
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm whitespace-nowrap'>
                    <span className={valueClassName(row.training)}>{row.training}</span>
                  </TableCell>
                  <TableCell className='px-4 py-4 text-sm whitespace-nowrap'>
                    <span className={valueClassName(row.assessment)}>{row.assessment}</span>
                  </TableCell>
                  {showFinancialColumns ? (
                    <>
                      <TableCell className='px-4 py-4 text-sm text-foreground whitespace-nowrap'>
                        {row.orderAmount ?? 'Ksh 0'}
                      </TableCell>
                      <TableCell className='px-4 py-4 text-sm text-foreground whitespace-nowrap'>
                        {row.payableAmount ?? 'Ksh 0'}
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell className='px-4 py-4 text-sm whitespace-nowrap'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        statusBadgeClassName(row.statusTone)
                      )}
                    >
                      {row.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className='px-4 py-4 text-right'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:text-foreground h-8 w-8 rounded-full'
                      aria-label={`Open actions for session ${row.index}`}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className='hover:bg-transparent'>
                <TableCell
                  colSpan={showFinancialColumns ? 11 : 9}
                  className='py-12 text-center'
                >
                  <div className='space-y-2'>
                    <p className='text-foreground text-sm font-semibold'>{emptyTitle}</p>
                    <p className='text-muted-foreground text-sm'>{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='border-border/70 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground text-sm'>
          Showing {resultStart} to {resultEnd} of {rows.length} sessions
        </p>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
            disabled={safeCurrentPage === 1}
            className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
            aria-label='Previous page'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>

          <div className='flex items-center gap-1.5'>
            {visiblePageNumbers.map((pageNumber, index) => {
              const previousPageNumber = visiblePageNumbers[index - 1];
              const shouldShowGap =
                previousPageNumber !== undefined && pageNumber - previousPageNumber > 1;

              return (
                <div key={pageNumber} className='flex items-center gap-1.5'>
                  {shouldShowGap ? <span className='px-1 text-sm text-muted-foreground'>…</span> : null}
                  <button
                    type='button'
                    onClick={() => setCurrentPage(pageNumber)}
                    aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors',
                      pageNumber === safeCurrentPage
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {pageNumber}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type='button'
            onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
            disabled={safeCurrentPage === totalPages}
            className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
            aria-label='Next page'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
