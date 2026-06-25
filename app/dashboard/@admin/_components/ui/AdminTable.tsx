'use client';

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns3,
  Rows2,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface FacetedFilter {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
}

interface AdminTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** Column id to run the global text search against (matched on render value). */
  searchPlaceholder?: string;
  /** Optional faceted (multi-select) filters rendered in the toolbar. */
  facetedFilters?: FacetedFilter[];
  /** Extra toolbar content (right side). */
  toolbar?: ReactNode;
  enableRowSelection?: boolean;
  /** Render bulk actions for the current selection. */
  bulkActions?: (selected: TData[], reset: () => void) => ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  /** Mark the selected row (for list/detail pages). */
  selectedRowId?: string | null;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** When true, the table fills its parent and the body scrolls under a sticky header. */
  fill?: boolean;
}

export function AdminTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchPlaceholder = 'Search…',
  facetedFilters,
  toolbar,
  enableRowSelection = false,
  bulkActions,
  onRowClick,
  getRowId,
  selectedRowId,
  pageSize = 10,
  emptyTitle = 'Nothing to show',
  emptyDescription = 'Adjust your search or filters to find what you are looking for.',
  fill = false,
}: AdminTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [dense, setDense] = useState(false);

  const selectionColumn = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return [];
    return [
      {
        id: '__select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label='Select all'
            onClick={event => event.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label='Select row'
            onClick={event => event.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>,
    ];
  }, [enableRowSelection]);

  const table = useReactTable({
    data,
    columns: [...selectionColumn, ...columns],
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  const hideableColumns = table.getAllColumns().filter(column => column.getCanHide());
  const cellPad = dense ? 'px-3 py-2.5' : 'px-4 py-4';

  return (
    <div className={cn('flex flex-col gap-3', fill && 'h-full min-h-0')}>
      {/* Toolbar */}
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-1 flex-wrap items-center gap-2'>
          <div className='relative min-w-[200px] flex-1 sm:max-w-xs'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={globalFilter}
              onChange={event => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              className='h-9 rounded-md border-border/70 bg-background pl-9 shadow-sm'
            />
            {globalFilter ? (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-1 top-1/2 size-7 -translate-y-1/2'
                onClick={() => setGlobalFilter('')}
              >
                <X className='size-4' />
              </Button>
            ) : null}
          </div>
          {facetedFilters?.map(filter => {
            const column = table.getColumn(filter.columnId);
            if (!column) return null;
            return <FacetedFilterMenu key={filter.columnId} column={column} filter={filter} />;
          })}
        </div>

        <div className='flex items-center gap-2'>
          {toolbar}
          <Button
            variant='outline'
            size='sm'
            className='h-9 rounded-md'
            onClick={() => setDense(value => !value)}
            title={dense ? 'Comfortable rows' : 'Compact rows'}
          >
            {dense ? <Rows3 className='size-4' /> : <Rows2 className='size-4' />}
          </Button>
          {hideableColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='h-9 rounded-md'>
                  <Columns3 className='mr-1.5 size-4' />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {columnLabel(column)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* Bulk action bar */}
      {enableRowSelection && selectedRows.length > 0 ? (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5'>
          <span className='text-sm font-medium text-foreground'>
            {selectedRows.length} selected
          </span>
          <div className='flex items-center gap-2'>
            {bulkActions?.(selectedRows, () => table.resetRowSelection())}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => table.resetRowSelection()}
              className='h-8'
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div
        className={cn(
          'overflow-hidden rounded-md border border-border/70 bg-card shadow-sm',
          fill && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <div className={cn(fill ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto')}>
          <Table>
            <TableHeader className='sticky top-0 z-10 bg-muted/60 backdrop-blur'>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className='border-border/60 hover:bg-transparent'>
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          cellPad,
                          'text-xs font-medium uppercase tracking-wide text-muted-foreground'
                        )}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type='button'
                            onClick={header.column.getToggleSortingHandler()}
                            className='inline-flex items-center gap-1 hover:text-foreground'
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: Math.min(pageSize, 8) }).map((_, rowIndex) => (
                  <TableRow key={`sk-${rowIndex}`} className='border-border/50'>
                    {table.getVisibleLeafColumns().map(column => (
                      <TableCell key={column.id} className={cellPad}>
                        <Skeleton className='h-4 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => {
                  const isSelected = selectedRowId != null && row.id === selectedRowId;
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        'border-border/50 transition-colors',
                        onRowClick && 'cursor-pointer',
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                      )}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className={cn(cellPad, 'text-sm')}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className='p-0'>
                    <EmptyState
                      icon={SlidersHorizontal}
                      title={emptyTitle}
                      description={emptyDescription}
                      variant='default'
                      className='my-8 border-none bg-transparent'
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <TablePagination table={table} />
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className='size-3.5' />;
  if (sorted === 'desc') return <ArrowDown className='size-3.5' />;
  return <ChevronsUpDown className='size-3.5 opacity-50' />;
}

function columnLabel<TData, TValue>(column: Column<TData, TValue>): string {
  const meta = column.columnDef.meta as { label?: string } | undefined;
  if (meta?.label) return meta.label;
  const header = column.columnDef.header;
  if (typeof header === 'string') return header;
  return column.id;
}

function FacetedFilterMenu<TData, TValue>({
  column,
  filter,
}: {
  column: Column<TData, TValue>;
  filter: FacetedFilter;
}) {
  const selected = new Set((column.getFilterValue() as string[]) ?? []);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='h-9 rounded-md border-dashed'>
          <SlidersHorizontal className='mr-1.5 size-4' />
          {filter.title}
          {selected.size > 0 ? (
            <Badge variant='secondary' className='ml-1.5 rounded px-1.5 text-[10px]'>
              {selected.size}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-52'>
        <DropdownMenuLabel>{filter.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filter.options.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            onCheckedChange={checked => {
              const next = new Set(selected);
              if (checked) next.add(option.value);
              else next.delete(option.value);
              const values = Array.from(next);
              column.setFilterValue(values.length ? values : undefined);
            }}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.size > 0 ? (
          <>
            <DropdownMenuSeparator />
            <button
              type='button'
              className='w-full px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground'
              onClick={() => column.setFilterValue(undefined)}
            >
              Clear filter
            </button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TablePagination<TData>({ table }: { table: TableInstance<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-sm text-muted-foreground'>
        Showing {from}–{to} of {total}
      </p>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          className='rounded-md'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span className='px-2 text-sm text-muted-foreground'>
          Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant='outline'
          size='sm'
          className='rounded-md'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
