'use client';

import {
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
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Rows2, Rows3, Search } from 'lucide-react';
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

export interface FacetedFilter {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
}

/** Paging handled by the server: the table renders one page and asks for the next. */
export interface ServerPagination {
  page: number;
  pageCount: number;
  totalRows?: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  /** Multi-select filters in the toolbar. */
  facetedFilters?: FacetedFilter[];
  /** Extra toolbar content, right aligned. */
  toolbar?: ReactNode;
  enableRowSelection?: boolean;
  /** Actions shown while rows are selected. */
  bulkActions?: (selected: TData[], reset: () => void) => ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  /** Highlight the row currently open in a detail view. */
  selectedRowId?: string | null;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Fill the parent and scroll the body under a sticky header. */
  fill?: boolean;
  /** Provide this to page on the server instead of in the browser. */
  serverPagination?: ServerPagination;
}

export function DataTable<TData, TValue>({
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
  emptyDescription = 'Adjust the search or filters to find what you are looking for.',
  fill = false,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [dense, setDense] = useState(false);

  const tableColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: '__select',
      size: 44,
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label='Select all rows on this page'
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(Boolean(value))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label='Select row'
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(Boolean(value))}
          onClick={event => event.stopPropagation()}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    getRowId,
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: serverPagination ? undefined : getPaginationRowModel(),
    manualPagination: Boolean(serverPagination),
    initialState: { pagination: { pageSize } },
  });

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
  const rows = table.getRowModel().rows;
  const cellPadding = dense ? 'py-1.5' : 'py-3';

  return (
    <div className={cn('flex flex-col gap-3', fill && 'h-full min-h-0')}>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-[220px] flex-1'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={globalFilter}
            onChange={event => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className='border-border/70 rounded-md pl-9'
          />
        </div>

        {facetedFilters?.map(filter => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;
          const selected = new Set((column.getFilterValue() as string[]) ?? []);
          return (
            <DropdownMenu key={filter.columnId}>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='rounded-md'>
                  {filter.title}
                  {selected.size > 0 ? (
                    <Badge variant='secondary' className='ml-2 rounded-sm px-1.5'>
                      {selected.size}
                    </Badge>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-48'>
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
                      column.setFilterValue(next.size ? Array.from(next) : undefined);
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        <div className='ml-auto flex items-center gap-2'>
          {toolbar}
          <Button
            variant='outline'
            size='icon'
            className='rounded-md'
            aria-label={dense ? 'Comfortable rows' : 'Compact rows'}
            onClick={() => setDense(value => !value)}
          >
            {dense ? <Rows3 className='size-4' /> : <Rows2 className='size-4' />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='rounded-md'>
                <Columns3 className='mr-2 size-4' />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {enableRowSelection && selectedRows.length > 0 ? (
        <div className='border-primary/30 bg-primary/5 flex flex-wrap items-center gap-3 rounded-md border px-4 py-2.5'>
          <span className='text-foreground text-sm font-medium'>
            {selectedRows.length} selected
          </span>
          <div className='flex flex-wrap items-center gap-2'>
            {bulkActions?.(selectedRows, () => setRowSelection({}))}
            <Button variant='ghost' size='sm' onClick={() => setRowSelection({})}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'border-border/70 bg-card overflow-hidden rounded-md border',
          fill && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <div className={cn(fill && 'min-h-0 flex-1 overflow-auto')}>
          <Table>
            <TableHeader className={cn('bg-muted/40', fill && 'sticky top-0 z-10')}>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        className='text-muted-foreground h-10 text-xs font-semibold'
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type='button'
                            className='flex items-center gap-1.5'
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className='size-3.5' />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className='size-3.5' />
                            ) : (
                              <ChevronsUpDown className='size-3.5 opacity-50' />
                            )}
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
                  <TableRow key={rowIndex} className='hover:bg-transparent'>
                    {tableColumns.map((_column, columnIndex) => (
                      <TableCell key={columnIndex} className={cellPadding}>
                        <Skeleton className='h-4 w-full' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={tableColumns.length} className='p-0'>
                    <EmptyState
                      variant='plain'
                      title={emptyTitle}
                      description={emptyDescription}
                      className='py-12'
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      selectedRowId && row.id === selectedRowId && 'bg-primary/5'
                    )}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className={cellPadding}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TablePager table={table} serverPagination={serverPagination} rowCount={rows.length} />
    </div>
  );
}

function TablePager<TData>({
  table,
  serverPagination,
  rowCount,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  serverPagination?: ServerPagination;
  rowCount: number;
}) {
  if (serverPagination) {
    const { page, pageCount, totalRows, onPageChange } = serverPagination;
    return (
      <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm'>
        <span>
          Page {page + 1} of {Math.max(pageCount, 1)}
          {typeof totalRows === 'number' ? ` · ${totalRows} in total` : null}
        </span>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='rounded-md'
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='rounded-md'
            disabled={page + 1 >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = pageIndex * pageSize + rowCount;

  return (
    <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm'>
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='rounded-md'
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='rounded-md'
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
