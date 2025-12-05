"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, RefreshCw, ShoppingBag, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractEntity } from '@/lib/api-helpers';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, CommerceCatalogueItem, Course } from '@/services/client';

type CatalogueRow = CommerceCatalogueItem & {
  displayTitle: string;
  isPublic: boolean;
  isActive: boolean;
  detailsHref: string | null;
  typeLabel: 'Course' | 'Class' | 'Item';
};

const DEFAULT_CURRENCY = 'KES';

const formatMoney = (amount: number | string | undefined, currency = DEFAULT_CURRENCY) => {
  if (amount === undefined || amount === null) return '—';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '—';

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export default function AdminCataloguePage() {
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'course' | 'class'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');

  const catalogueQuery = useQuery({
    ...listCatalogItemsOptions({
      query: { active_only: false }, // Admin sees everything
    }),
  });

  const items = (catalogueQuery.data?.data ?? []) as CommerceCatalogueItem[];

  useEffect(() => {
    if (catalogueQuery.error) {
      toast.error('Unable to load catalogue right now.');
    }
  }, [catalogueQuery.error]);

  const courseIds = useMemo(
    () => Array.from(new Set(items.map(item => item.course_uuid).filter(Boolean))) as string[],
    [items]
  );

  const classDefinitionIds = useMemo(
    () =>
      Array.from(new Set(items.map(item => item.class_definition_uuid).filter(Boolean))) as string[],
    [items]
  );

  const courseQueries = useQueries({
    queries: courseIds.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const classQueries = useQueries({
    queries: classDefinitionIds.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const courseTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    courseQueries.forEach((query, index) => {
      const course = extractEntity<Course>(query.data);
      if (course?.title) {
        map.set(courseIds[index], course.title);
      }
    });
    return map;
  }, [courseIds, courseQueries]);

  const classTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    classQueries.forEach((query, index) => {
      const classDef = extractEntity<ClassDefinition>(query.data);
      if (classDef?.title) {
        map.set(classDefinitionIds[index], classDef.title);
      }
    });
    return map;
  }, [classDefinitionIds, classQueries]);

  const catalogueRows: CatalogueRow[] = useMemo(() => {
    const buildTitle = (item: CommerceCatalogueItem) => {
      if (item.class_definition_uuid && classTitleMap.has(item.class_definition_uuid)) {
        return classTitleMap.get(item.class_definition_uuid) as string;
      }
      if (item.course_uuid && courseTitleMap.has(item.course_uuid)) {
        return courseTitleMap.get(item.course_uuid) as string;
      }
      return 'Untitled item';
    };

    const rows = items.map(item => {
      const isPublic =
        (item as CommerceCatalogueItem & { publicly_visible?: boolean }).publicly_visible ?? true;
      const isActive = item.active !== false;
      const detailsHref = item.course_uuid
        ? `/dashboard/course-management/preview/${item.course_uuid}`
        : item.class_definition_uuid
          ? `/dashboard/trainings/overview/${item.class_definition_uuid}`
          : null;

      const typeLabel = item.course_uuid ? 'Course' : item.class_definition_uuid ? 'Class' : 'Item';

      return {
        ...item,
        displayTitle: buildTitle(item),
        isPublic,
        isActive,
        detailsHref,
        typeLabel,
      } as CatalogueRow;
    });

    return rows;
  }, [classTitleMap, courseTitleMap, items]);

  const filteredRows = useMemo(() => {
    let filtered = catalogueRows;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(row => row.typeLabel.toLowerCase() === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(row =>
        filterStatus === 'active' ? row.isActive : !row.isActive
      );
    }

    // Apply visibility filter
    if (filterVisibility !== 'all') {
      filtered = filtered.filter(row =>
        filterVisibility === 'public' ? row.isPublic : !row.isPublic
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        row =>
          row.displayTitle.toLowerCase().includes(query) ||
          row.variant_code?.toLowerCase().includes(query) ||
          row.product_code?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [catalogueRows, filterType, filterStatus, filterVisibility, searchQuery]);

  const handleCopySku = async (sku?: string) => {
    if (!sku) {
      toast.error('No SKU available to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(sku);
      toast.success('SKU copied to clipboard');
    } catch (error) {
      toast.error('Unable to copy SKU');
    }
  };

  const stats = useMemo(() => {
    const total = catalogueRows.length;
    const active = catalogueRows.filter(row => row.isActive).length;
    const publicItems = catalogueRows.filter(row => row.isPublic).length;
    const courses = catalogueRows.filter(row => row.typeLabel === 'Course').length;
    const classes = catalogueRows.filter(row => row.typeLabel === 'Class').length;

    return { total, active, inactive: total - active, publicItems, privateItems: total - publicItems, courses, classes };
  }, [catalogueRows]);

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ['Title', 'Type', 'SKU', 'Product Code', 'Currency', 'Visibility', 'Status'].join(','),
      ...filteredRows.map(row =>
        [
          `"${row.displayTitle}"`,
          row.typeLabel,
          row.variant_code ?? '',
          row.product_code ?? '',
          row.currency_code ?? '',
          row.isPublic ? 'Public' : 'Private',
          row.isActive ? 'Active' : 'Inactive',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogue-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Catalogue exported to CSV');
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-2'>
          <Badge variant='outline' className='gap-2'>
            <ShoppingBag className='h-3.5 w-3.5' />
            Admin Catalogue Management
          </Badge>
          <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>Platform Catalogue</h1>
          <p className='text-muted-foreground max-w-2xl text-sm'>
            View and manage all courses and classes available for purchase on the platform
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleExport}>
            <Download className='mr-2 h-4 w-4' />
            Export CSV
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => catalogueQuery.refetch()}
            disabled={catalogueQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${catalogueQuery.isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-6'>
        <StatCard label='Total Items' value={stats.total} />
        <StatCard label='Active' value={stats.active} variant='success' />
        <StatCard label='Inactive' value={stats.inactive} variant='secondary' />
        <StatCard label='Public' value={stats.publicItems} />
        <StatCard label='Courses' value={stats.courses} />
        <StatCard label='Classes' value={stats.classes} />
      </div>

      <Card className='border-border/70'>
        <CardHeader>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-lg font-semibold'>All Catalogue Items</CardTitle>
                <CardDescription>
                  {filteredRows.length} {filteredRows.length === 1 ? 'item' : 'items'} {filteredRows.length !== catalogueRows.length && `(filtered from ${catalogueRows.length})`}
                </CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className='flex flex-col gap-3'>
              <Input
                placeholder='Search by title, SKU, or product code...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full'
              />
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground'>Type</Label>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='course'>Courses</SelectItem>
                      <SelectItem value='class'>Classes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground'>Status</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground'>Visibility</Label>
                  <Select value={filterVisibility} onValueChange={(value: any) => setFilterVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Visibility</SelectItem>
                      <SelectItem value='public'>Public</SelectItem>
                      <SelectItem value='private'>Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-end'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterVisibility('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {catalogueQuery.isLoading ? (
            <CatalogueSkeleton />
          ) : filteredRows.length ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='min-w-[200px]'>Title</TableHead>
                    <TableHead className='min-w-[120px]'>SKU</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(item => (
                    <TableRow key={item.uuid ?? item.variant_code}>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-sm font-semibold text-foreground'>{item.displayTitle}</span>
                            <Badge variant='secondary'>{item.typeLabel}</Badge>
                          </div>
                          <p className='text-muted-foreground text-xs'>
                            {item.course_uuid ?? item.class_definition_uuid ?? '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{item.variant_code ?? '—'}</TableCell>
                      <TableCell className='text-sm'>{item.product_code ?? '—'}</TableCell>
                      <TableCell className='text-sm'>{item.currency_code ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isPublic ? 'default' : 'secondary'}>
                          {item.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'destructive'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex flex-wrap justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => handleCopySku(item.variant_code)}>
                            <Copy className='h-4 w-4' />
                            <span className='sr-only sm:not-sr-only sm:ml-2'>Copy</span>
                          </Button>
                          {item.detailsHref ? (
                            <Button variant='ghost' size='sm' asChild>
                              <Link prefetch href={item.detailsHref} className='gap-2'>
                                <ExternalLink className='h-4 w-4' />
                                <span className='sr-only sm:not-sr-only'>View</span>
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/40 p-8 text-center'>
              <ShoppingBag className='h-10 w-10 text-muted-foreground' />
              <div className='space-y-1'>
                <p className='text-base font-semibold text-foreground'>
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterVisibility !== 'all'
                    ? 'No matching items found'
                    : 'No catalogue items yet'}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterVisibility !== 'all'
                    ? 'Try adjusting your filters or search query.'
                    : 'Catalogue items will appear here when courses or classes are published.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, variant = 'default' }: { label: string; value: number; variant?: 'default' | 'success' | 'secondary' }) {
  const colorClasses = {
    default: 'border-border/60',
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    secondary: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30',
  };

  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${colorClasses[variant]}`}>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='mt-2 text-2xl font-semibold'>{value}</p>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2, 3, 4].map(key => (
        <div key={key} className='flex items-center gap-3 rounded-lg border border-border/70 p-3'>
          <Skeleton className='h-10 w-full max-w-[200px]' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-32' />
        </div>
      ))}
    </div>
  );
}
