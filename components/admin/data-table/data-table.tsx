'use client';

import { AdminDataTablePagination } from './data-table-pagination';
import { AdminDataTableToolbar } from './data-table-toolbar';
import {
  AdminDataTableColumn,
  AdminDataTableEmptyState,
  AdminDataTableFilter,
  AdminDataTablePagination as AdminDataTablePaginationConfig,
  AdminDataTableSearch,
} from './types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AdminDataTableProps<TData> {
  title: string;
  description?: string;
  columns: AdminDataTableColumn<TData>[];
  data: TData[];
  search?: AdminDataTableSearch;
  filters?: AdminDataTableFilter[];
  pagination?: AdminDataTablePaginationConfig;
  emptyState?: AdminDataTableEmptyState;
  headerActions?: ReactNode;
  isLoading?: boolean;
  selectedId?: string | null;
  getRowId?: (item: TData, index: number) => string;
  onRowClick?: (item: TData) => void;
}

export function AdminDataTable<TData>({
  title,
  description,
  columns,
  data,
  search,
  filters,
  pagination,
  emptyState,
  headerActions,
  isLoading,
  selectedId,
  getRowId,
  onRowClick,
}: AdminDataTableProps<TData>) {
  const showEmptyState = !isLoading && data.length === 0;
  const showTable = !showEmptyState;

  return (
    <Card className='border-border/50 overflow-hidden border shadow-sm'>
      <CardHeader className='space-y-4'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <Badge variant='outline' className='border-primary/40 bg-primary/10 text-xs font-semibold uppercase tracking-wide'>
              Administrative
            </Badge>
            <CardTitle className='mt-2 text-xl font-semibold'>{title}</CardTitle>
            {description ? (
              <CardDescription className='max-w-2xl text-sm leading-relaxed'>{description}</CardDescription>
            ) : null}
          </div>
          {headerActions ? <div className='flex items-center gap-2'>{headerActions}</div> : null}
        </div>
        {search || (filters && filters.length) ? (
          <AdminDataTableToolbar search={search} filters={filters} />
        ) : null}
      </CardHeader>
      <CardContent className='p-0'>
        {showTable ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.id} className={column.className} style={column.width ? { width: column.width } : undefined}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      {columns.map(column => (
                        <TableCell key={column.id}>
                          <Skeleton className='h-4 w-full' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data.map((item, index) => {
                    const rowId = getRowId?.(item, index) ?? String(index);
                    return (
                      <TableRow
                        key={rowId}
                        className={cn(
                          'transition-colors hover:bg-muted/40',
                          onRowClick ? 'cursor-pointer' : undefined,
                          selectedId && rowId === selectedId ? 'bg-primary/5' : undefined
                        )}
                        onClick={() => (onRowClick ? onRowClick(item) : undefined)}
                      >
                        {columns.map(column => (
                          <TableCell key={column.id} className={column.className}>
                            {column.cell(item)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        ) : null}
        {showEmptyState && emptyState ? (
          <div className='flex flex-col items-center justify-center space-y-4 px-6 py-16 text-center'>
            {emptyState.icon ? <div className='text-primary/70'>{emptyState.icon}</div> : null}
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold'>{emptyState.title}</h3>
              {emptyState.description ? (
                <p className='text-muted-foreground text-sm'>{emptyState.description}</p>
              ) : null}
            </div>
            {emptyState.action ?? null}
          </div>
        ) : null}
      </CardContent>
      {pagination ? (
        <CardFooter>
          <AdminDataTablePagination {...pagination} className='w-full' />
        </CardFooter>
      ) : null}
    </Card>
  );
}
