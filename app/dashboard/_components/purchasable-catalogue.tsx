"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { extractEntity } from '@/lib/api-helpers';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, CommerceCatalogItem, Course } from '@/services/client';

type CatalogueRow = CommerceCatalogItem & {
  displayTitle: string;
  isPublic: boolean;
  isActive: boolean;
  detailsHref: string | null;
  typeLabel: 'Course' | 'Class' | 'Item';
};

export default function PurchasableCatalogue() {
  const [showHidden, setShowHidden] = useState(false);

  const catalogueQuery = useQuery({
    ...listCatalogItemsOptions({
      query: { active_only: true },
    }),
  });

  const items = (catalogueQuery.data?.data ?? []) as CommerceCatalogItem[];

  useEffect(() => {
    if (catalogueQuery.error) {
      toast.error('Unable to load purchasable catalogue right now.');
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
    const buildTitle = (item: CommerceCatalogItem) => {
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
        (item as CommerceCatalogItem & { publicly_visible?: boolean }).publicly_visible ?? true;
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
      };
    });

    if (showHidden) return rows;

    return rows.filter(row => row.isActive && row.isPublic);
  }, [classTitleMap, courseTitleMap, items, showHidden]);

  const hiddenCount = useMemo(
    () =>
      items.filter(
        item => ((item as CommerceCatalogItem & { publicly_visible?: boolean }).publicly_visible ?? true) === false
      ).length,
    [items]
  );

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

  return (
    <Card className='border-border/70'>
      <CardHeader className='gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <CardTitle className='text-base font-semibold'>Catalogue</CardTitle>
          <CardDescription>
            SKUs mapped to your courses and classes. Refresh to pull the latest from commerce.
          </CardDescription>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-center gap-2 text-sm'>
            <Switch
              id='toggle-hidden-catalogue'
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
            <label htmlFor='toggle-hidden-catalogue' className='text-muted-foreground cursor-pointer'>
              Show hidden/private
            </label>
          </div>
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
      </CardHeader>
      <CardContent>
        {catalogueQuery.isLoading ? (
          <CatalogueSkeleton />
        ) : catalogueRows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogueRows.map(item => (
                <TableRow key={item.uuid ?? item.variant_code}>
                  <TableCell>
                    <div className='space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-semibold text-foreground'>{item.displayTitle}</span>
                        <Badge variant='secondary'>{item.typeLabel}</Badge>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Product {item.product_code ?? '—'} · {(item.course_uuid ?? item.class_definition_uuid) ?? '—'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className='font-mono text-sm'>{item.variant_code ?? '—'}</TableCell>
                  <TableCell className='text-sm'>{item.currency_code ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.isPublic ? 'success' : 'outlineDestructive'}>
                      {item.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'success' : 'destructive'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex flex-wrap justify-end gap-2'>
                      <Button variant='outline' size='sm' onClick={() => handleCopySku(item.variant_code)}>
                        <Copy className='mr-2 h-4 w-4' />
                        Copy SKU
                      </Button>
                      {item.detailsHref ? (
                        <Button variant='ghost' size='sm' asChild>
                          <Link prefetch href={item.detailsHref} className='gap-2'>
                            <ExternalLink className='h-4 w-4' />
                            View details
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className='flex flex-col items-start gap-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-6'>
            <p className='text-base font-semibold text-foreground'>No purchasable catalogue items yet.</p>
            <p className='text-muted-foreground text-sm'>
              Publish a class/course to auto-generate a SKU.
              {hiddenCount > 0 && !showHidden ? ' Toggle “Show hidden/private” to include private items.' : ''}
            </p>
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
        )}
      </CardContent>
    </Card>
  );
}

function CatalogueSkeleton() {
  return (
    <div className='space-y-3'>
      {[0, 1, 2].map(key => (
        <div key={key} className='flex items-center gap-3 rounded-lg border border-border/70 p-3'>
          <Skeleton className='h-10 w-1/3 min-w-[160px]' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-32' />
        </div>
      ))}
    </div>
  );
}
