"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { extractEntity } from '@/lib/api-helpers';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, CommerceCatalogueItem, Course } from '@/services/client';

type CatalogueScope = 'admin' | 'organization' | 'instructor' | 'course_creator';

type CatalogueRow = {
  id: string;
  displayTitle: string;
  typeLabel: 'Course' | 'Class' | 'Item';
  isActive: boolean;
  isPublic: boolean;
  price: number | string | null | undefined;
  currency: string | null | undefined;
  productCode: string | null | undefined;
  variantCode: string | null | undefined;
  courseId: string | null | undefined;
  classId: string | null | undefined;
  createdAt: string | Date | null | undefined;
  updatedAt: string | Date | null | undefined;
  detailsHref: string | null;
  raw: CommerceCatalogueItem;
};

type TitleMaps = {
  courseTitleMap: Map<string, string>;
  classTitleMap: Map<string, string>;
};

const scopeCopy: Record<
  CatalogueScope,
  { title: string; description: string; includeHiddenByDefault: boolean }
> = {
  admin: {
    title: 'System catalogue',
    description: 'Review every purchasable course and class across the network.',
    includeHiddenByDefault: true,
  },
  organization: {
    title: 'Organisation catalogue',
    description: 'Manage purchasable items scoped to your organisation.',
    includeHiddenByDefault: false,
  },
  instructor: {
    title: 'Instructor catalogue',
    description: 'See how your courses and classes show up to buyers.',
    includeHiddenByDefault: false,
  },
  course_creator: {
    title: 'Creator catalogue',
    description: 'Track how published offerings appear in the marketplace.',
    includeHiddenByDefault: false,
  },
};

const formatMoney = (amount: number | string | undefined | null, currency = 'KES') => {
  if (amount === undefined || amount === null) return 'No price set';
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(numeric)) return 'No price set';

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const buildRows = (items: CommerceCatalogueItem[]): CatalogueRow[] =>
  items.map((item, index) => {
    const id =
      item.uuid ||
      item.variant_code ||
      item.product_code ||
      item.course_uuid ||
      item.class_definition_uuid ||
      `catalogue-${index}`;

    const detailsHref = item.course_uuid
      ? `/dashboard/course-management/preview/${item.course_uuid}`
      : item.class_definition_uuid
        ? `/dashboard/trainings/overview/${item.class_definition_uuid}`
        : null;

    return {
      id,
      displayTitle: 'Loading title…',
      typeLabel: item.course_uuid ? 'Course' : item.class_definition_uuid ? 'Class' : 'Item',
      isActive: item.active !== false,
      isPublic: (item as CommerceCatalogueItem & { publicly_visible?: boolean }).publicly_visible !== false,
      price: (item as CommerceCatalogueItem & { price?: number | string | null }).price ?? null,
      currency: (item as CommerceCatalogueItem & { currency_code?: string | null }).currency_code ?? null,
      productCode: item.product_code ?? null,
      variantCode: item.variant_code ?? null,
      courseId: item.course_uuid ?? null,
      classId: item.class_definition_uuid ?? null,
      createdAt: (item as CommerceCatalogueItem & { created_date?: string | Date | null }).created_date ?? null,
      updatedAt: (item as CommerceCatalogueItem & { updated_date?: string | Date | null }).updated_date ?? null,
      detailsHref,
      raw: item,
    };
  });

const useTitleMaps = (rows: CatalogueRow[]): TitleMaps => {
  const courseIds = useMemo(
    () => Array.from(new Set(rows.map(row => row.courseId).filter(Boolean))) as string[],
    [rows]
  );
  const classIds = useMemo(
    () => Array.from(new Set(rows.map(row => row.classId).filter(Boolean))) as string[],
    [rows]
  );

  const courseQueries = useQueries({
    queries: courseIds.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const classQueries = useQueries({
    queries: classIds.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const courseTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    courseQueries.forEach((query, index) => {
      const course = extractEntity<Course>(query.data);
      if (course?.title || course?.name) {
        map.set(courseIds[index], course.title || course.name || '');
      }
    });
    return map;
  }, [courseIds, courseQueries]);

  const classTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    classQueries.forEach((query, index) => {
      const classDef = extractEntity<ClassDefinition>(query.data);
      if (classDef?.title || classDef?.name) {
        map.set(classIds[index], classDef.title || classDef.name || '');
      }
    });
    return map;
  }, [classIds, classQueries]);

  return { courseTitleMap, classTitleMap };
};

const attachTitles = (rows: CatalogueRow[], maps: TitleMaps): CatalogueRow[] =>
  rows.map(row => {
    if (row.classId && maps.classTitleMap.has(row.classId)) {
      return { ...row, displayTitle: maps.classTitleMap.get(row.classId) as string };
    }
    if (row.courseId && maps.courseTitleMap.has(row.courseId)) {
      return { ...row, displayTitle: maps.courseTitleMap.get(row.courseId) as string };
    }
    const fallback =
      row.productCode ||
      row.variantCode ||
      row.courseId ||
      row.classId ||
      row.raw.title ||
      'Catalogue item';
    return { ...row, displayTitle: fallback };
  });

export function CatalogueWorkspace({
  scope,
  title,
  description,
  variant = 'page',
}: {
  scope: CatalogueScope;
  title?: string;
  description?: string;
  variant?: 'page' | 'embedded';
}) {
  const copy = scopeCopy[scope];
  const [includeHidden, setIncludeHidden] = useState(copy.includeHiddenByDefault);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'class' | 'item'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchActiveOnly = scope === 'admin' ? false : !includeHidden;

  const catalogueQuery = useQuery({
    ...listCatalogItemsOptions({
      query: { active_only: fetchActiveOnly },
    }),
  });

  useEffect(() => {
    if (catalogueQuery.error) {
      toast.error('Unable to load catalogue right now.');
    }
  }, [catalogueQuery.error]);

  const rows = useMemo(
    () => buildRows((catalogueQuery.data?.data as CommerceCatalogueItem[]) ?? []),
    [catalogueQuery.data]
  );

  const titleMaps = useTitleMaps(rows);
  const rowsWithTitles = useMemo(() => attachTitles(rows, titleMaps), [rows, titleMaps]);

  const filteredRows = useMemo(() => {
    let result = rowsWithTitles;

    if (!includeHidden) {
      result = result.filter(row => row.isActive && row.isPublic);
    }

    if (typeFilter !== 'all') {
      result = result.filter(row => row.typeLabel.toLowerCase() === typeFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(row => (statusFilter === 'active' ? row.isActive : !row.isActive));
    }

    if (visibilityFilter !== 'all') {
      result = result.filter(row => (visibilityFilter === 'public' ? row.isPublic : !row.isPublic));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        row =>
          row.displayTitle.toLowerCase().includes(query) ||
          row.productCode?.toLowerCase().includes(query) ||
          row.variantCode?.toLowerCase().includes(query) ||
          row.courseId?.toLowerCase().includes(query) ||
          row.classId?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const aDate = toTimestamp(a.updatedAt ?? a.createdAt);
      const bDate = toTimestamp(b.updatedAt ?? b.createdAt);
      return bDate - aDate;
    });
  }, [includeHidden, rowsWithTitles, typeFilter, statusFilter, visibilityFilter, searchQuery]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredRows.find(row => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedId]);

  const selectedRow = filteredRows.find(row => row.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(row => row.isActive).length;
    const publicItems = rows.filter(row => row.isPublic).length;
    const privateItems = total - publicItems;
    return { total, active, publicItems, privateItems };
  }, [rows]);

  const heightClass = variant === 'page' ? 'lg:h-[calc(100vh-140px)]' : 'lg:h-[520px]';

  const handleCopy = async (value?: string | null) => {
    if (!value) {
      toast.error('No value to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Unable to copy');
    }
  };

  return (
    <div className={`flex flex-col gap-4 overflow-hidden lg:flex-row ${heightClass}`}>
      <Card className='lg:w-[420px] lg:min-w-[380px] lg:max-w-[440px]'>
        <CardHeader className='space-y-3'>
          <div className='space-y-1.5'>
            <Badge variant='outline' className='w-fit'>
              {title ?? copy.title}
            </Badge>
            <CardTitle className='text-2xl font-semibold'>{title ?? copy.title}</CardTitle>
            <CardDescription>{description ?? copy.description}</CardDescription>
          </div>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <div className='relative w-full'>
                <Input
                  placeholder='Search title, SKU, code, or ID'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  className='pl-9'
                />
                <Search className='text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2' />
              </div>
              <Button
                variant='outline'
                size='icon'
                onClick={() => catalogueQuery.refetch()}
                disabled={catalogueQuery.isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${catalogueQuery.isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
              <Select value={typeFilter} onValueChange={value => setTypeFilter(value as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  <SelectItem value='course'>Courses</SelectItem>
                  <SelectItem value='class'>Classes</SelectItem>
                  <SelectItem value='item'>Items</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={visibilityFilter}
                onValueChange={value => setVisibilityFilter(value as typeof visibilityFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Visibility' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All visibility</SelectItem>
                  <SelectItem value='public'>Public</SelectItem>
                  <SelectItem value='private'>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2'>
              <div>
                <p className='text-xs font-medium'>Include inactive & private</p>
                <p className='text-muted-foreground text-[11px]'>Show hidden SKUs in the list</p>
              </div>
              <Switch checked={includeHidden} onCheckedChange={setIncludeHidden} />
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4'>
              <StatPill label='Total' value={stats.total} />
              <StatPill label='Active' value={stats.active} />
              <StatPill label='Public' value={stats.publicItems} />
              <StatPill label='Private' value={stats.privateItems} />
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <ScrollArea className='h-[420px] pr-3'>
            <div className='space-y-2 pb-3'>
              {catalogueQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`catalogue-skeleton-${index}`}
                    className='rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4'
                  >
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='mt-2 h-3 w-1/3' />
                  </div>
                ))
              ) : filteredRows.length === 0 ? (
                <div className='text-muted-foreground flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 text-sm'>
                  <p className='font-semibold text-foreground'>No catalogue items match your filters.</p>
                  <p className='text-xs'>
                    Adjust the filters or include inactive and private items to widen the view.
                  </p>
                </div>
              ) : (
                filteredRows.map(row => (
                  <button
                    key={row.id}
                    type='button'
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === row.id
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40'
                        : 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <p className='line-clamp-1 font-semibold'>{row.displayTitle}</p>
                          <Badge variant='outline' className='text-[11px]'>
                            {row.typeLabel}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground text-xs line-clamp-1'>
                          {row.variantCode || row.productCode || row.courseId || row.classId || 'No identifier'}
                        </p>
                      </div>
                      <div className='flex flex-col items-end gap-1 text-xs'>
                        <Badge variant={row.isActive ? 'secondary' : 'outline'} className='w-fit'>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={row.isPublic ? 'success' : 'secondary'} className='w-fit'>
                          {row.isPublic ? 'Public' : 'Private'}
                        </Badge>
                        <p className='text-muted-foreground mt-1'>{formatMoney(row.price, row.currency ?? undefined)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className='flex-1'>
        <CardHeader className='flex flex-col gap-3 border-b lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-1'>
            <Badge variant='outline' className='w-fit'>
              Selection
            </Badge>
            <CardTitle className='text-xl font-semibold'>
              {selectedRow ? selectedRow.displayTitle : 'Select a catalogue item'}
            </CardTitle>
            <CardDescription>
              {selectedRow
                ? 'Review pricing, visibility, and linked course or class metadata.'
                : 'Choose an item from the list to see its details.'}
            </CardDescription>
          </div>
          {selectedRow?.detailsHref ? (
            <Button variant='secondary' size='sm' asChild>
              <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                <ExternalLink className='h-4 w-4' />
                Open linked view
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className='p-0'>
          {catalogueQuery.isLoading ? (
            <div className='space-y-4 p-6'>
              <Skeleton className='h-6 w-1/3' />
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-32 w-full' />
            </div>
          ) : selectedRow ? (
            <ScrollArea className='h-[520px] px-6 py-5 pr-8'>
              <div className='space-y-5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant={selectedRow.isActive ? 'success' : 'secondary'} className='gap-1'>
                    {selectedRow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={selectedRow.isPublic ? 'secondary' : 'outline'} className='gap-1'>
                    {selectedRow.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <Badge variant='outline' className='gap-1'>
                    {selectedRow.typeLabel}
                  </Badge>
                </div>

                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  <DetailTile label='Product code' value={selectedRow.productCode ?? '—'} />
                  <DetailTile label='Variant code' value={selectedRow.variantCode ?? '—'} />
                  <DetailTile label='Course ID' value={selectedRow.courseId ?? '—'} />
                  <DetailTile label='Class ID' value={selectedRow.classId ?? '—'} />
                  <DetailTile label='Created' value={formatDate(selectedRow.createdAt)} />
                  <DetailTile label='Updated' value={formatDate(selectedRow.updatedAt)} />
                </div>

                <div className='rounded-xl border bg-muted/30 p-4'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Pricing</p>
                  <p className='mt-1 text-lg font-semibold'>
                    {selectedRow.price !== null && selectedRow.price !== undefined
                      ? formatMoney(selectedRow.price, selectedRow.currency ?? undefined)
                      : 'No price set'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {selectedRow.currency ? `Currency: ${selectedRow.currency}` : 'Default currency applied'}
                  </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' onClick={() => handleCopy(selectedRow.variantCode ?? selectedRow.productCode)}>
                    <Copy className='mr-2 h-4 w-4' />
                    Copy SKU
                  </Button>
                  {selectedRow.detailsHref ? (
                    <Button variant='secondary' size='sm' asChild>
                      <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                        <ExternalLink className='h-4 w-4' />
                        View linked record
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className='text-muted-foreground flex h-[520px] items-center justify-center px-6 text-sm'>
              Select a catalogue item on the left to load its details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-full border px-3 py-2 text-center'>
      <p className='text-[11px] uppercase tracking-wide'>{label}</p>
      <p className='font-semibold text-foreground'>{value}</p>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-dashed border-border/60 bg-card/80 p-3'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='mt-1 break-all text-sm font-semibold text-foreground'>{value}</p>
    </div>
  );
}

const toTimestamp = (value: string | Date | null | undefined) => {
  if (!value) return 0;
  const parsed = value instanceof Date ? value : new Date(value);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
