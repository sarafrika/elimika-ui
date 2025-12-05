"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, RefreshCw, ShoppingBag, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function OrganizationCataloguePage() {
  const [showHidden, setShowHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const catalogueQuery = useQuery({
    ...listCatalogItemsOptions({
      query: { active_only: !showHidden },
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

    if (!showHidden) {
      filtered = filtered.filter(row => row.isActive && row.isPublic);
    }

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
  }, [catalogueRows, showHidden, searchQuery]);

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

    return { total, active, publicItems, courses, classes };
  }, [catalogueRows]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-2'>
          <Badge variant='outline' className='gap-2'>
            <ShoppingBag className='h-3.5 w-3.5' />
            Course & Class Catalogue
          </Badge>
          <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>Purchasable Catalogue</h1>
          <p className='text-muted-foreground max-w-2xl text-sm'>
            Browse all courses and classes available for purchase on the platform. View SKUs, pricing, and availability.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
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

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        <StatCard label='Total Items' value={stats.total} />
        <StatCard label='Active Items' value={stats.active} />
        <StatCard label='Public Items' value={stats.publicItems} />
        <StatCard label='Courses' value={stats.courses} />
        <StatCard label='Classes' value={stats.classes} />
      </div>

      <Card className='border-border/70'>
        <CardHeader>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-1'>
              <CardTitle className='text-lg font-semibold'>All Catalogue Items</CardTitle>
              <CardDescription>
                {filteredRows.length} {filteredRows.length === 1 ? 'item' : 'items'} available
              </CardDescription>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Input
                placeholder='Search by title or SKU...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full sm:w-64'
              />
              <div className='flex items-center gap-2 text-sm'>
                <Switch
                  id='toggle-hidden-catalogue'
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
                <label htmlFor='toggle-hidden-catalogue' className='text-muted-foreground cursor-pointer whitespace-nowrap'>
                  Show hidden
                </label>
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
                            Product {item.product_code ?? '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{item.variant_code ?? '—'}</TableCell>
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
                            <span className='sr-only sm:not-sr-only sm:ml-2'>Copy SKU</span>
                          </Button>
                          {item.detailsHref ? (
                            <Button variant='ghost' size='sm' asChild>
                              <Link prefetch href={item.detailsHref} className='gap-2'>
                                <ExternalLink className='h-4 w-4' />
                                <span className='sr-only sm:not-sr-only'>View details</span>
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
                  {searchQuery ? 'No matching items found' : 'No catalogue items yet'}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {searchQuery
                    ? 'Try adjusting your search query or filters.'
                    : 'Publish a class or course to auto-generate catalogue items.'}
                </p>
              </div>
              {!searchQuery && (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
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
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-32' />
        </div>
      ))}
    </div>
  );
}
