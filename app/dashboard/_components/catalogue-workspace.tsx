"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Copy,
  ExternalLink,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Package,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  User,
  UserCheck,
  TrendingUp,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { extractEntity } from '@/lib/api-helpers';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getInstructorByUuidOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, CommerceCatalogueItem, Course, CourseCreator, Instructor } from '@/services/client';

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
  courseMap: Map<string, Course>;
  classMap: Map<string, ClassDefinition>;
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

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courseQueries.forEach((query, index) => {
      const course = extractEntity<Course>(query.data);
      if (course) {
        map.set(courseIds[index], course);
      }
    });
    return map;
  }, [courseIds, courseQueries]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    classQueries.forEach((query, index) => {
      const classDef = extractEntity<ClassDefinition>(query.data);
      if (classDef) {
        map.set(classIds[index], classDef);
      }
    });
    return map;
  }, [classIds, classQueries]);

  return { courseTitleMap, classTitleMap, courseMap, classMap };
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
  const includeHidden = copy.includeHiddenByDefault;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const profile = useUserProfile();

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

  const activeOrgUuid = useMemo(() => {
    const affiliations = profile?.organisation_affiliations ?? [];
    const activeAffiliation = affiliations.find(aff => aff.active);
    return (
      activeAffiliation?.organisation_uuid ??
      affiliations[0]?.organisation_uuid ??
      profile?.organizations?.[0]?.uuid ??
      null
    );
  }, [profile?.organisation_affiliations, profile?.organizations]);

  const filterRowsByScope = useMemo(() => {
    return (row: CatalogueRow) => {
      switch (scope) {
        case 'admin':
          return true;
        case 'organization': {
          if (!activeOrgUuid) return true;
          const classDef = row.classId ? titleMaps.classMap.get(row.classId) : undefined;
          if (classDef?.organisation_uuid) {
            return classDef.organisation_uuid === activeOrgUuid;
          }
          return true;
        }
        case 'instructor': {
          const instructorUuid = profile?.instructor?.uuid;
          if (!instructorUuid) return true;
          const classDef = row.classId ? titleMaps.classMap.get(row.classId) : undefined;
          const classMatches = classDef?.default_instructor_uuid === instructorUuid;
          const course = row.courseId ? titleMaps.courseMap.get(row.courseId) : undefined;
          const courseMatches = course?.course_creator_uuid === instructorUuid;
          return classMatches || courseMatches;
        }
        case 'course_creator': {
          const creatorUuid = profile?.courseCreator?.uuid;
          if (!creatorUuid) return true;
          const course = row.courseId ? titleMaps.courseMap.get(row.courseId) : undefined;
          const directCourseMatch = course?.course_creator_uuid === creatorUuid;
          const classCourseMatch = (() => {
            if (!row.classId) return false;
            const classDef = titleMaps.classMap.get(row.classId);
            if (!classDef?.course_uuid) return false;
            const linkedCourse = titleMaps.courseMap.get(classDef.course_uuid);
            return linkedCourse?.course_creator_uuid === creatorUuid;
          })();
          return directCourseMatch || classCourseMatch;
        }
        default:
          return true;
      }
    };
  }, [scope, activeOrgUuid, profile?.courseCreator?.uuid, profile?.instructor?.uuid, titleMaps.classMap, titleMaps.courseMap]);

  const scopedRows = useMemo(
    () => rowsWithTitles.filter(filterRowsByScope),
    [rowsWithTitles, filterRowsByScope]
  );

  const filteredRows = useMemo(() => {
    const result = includeHidden ? scopedRows : scopedRows.filter(row => row.isActive && row.isPublic);

    return [...result].sort((a, b) => {
      const aDate = toTimestamp(a.updatedAt ?? a.createdAt);
      const bDate = toTimestamp(b.updatedAt ?? b.createdAt);
      return bDate - aDate;
    });
  }, [includeHidden, scopedRows]);

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

  const displayedRows = useMemo(() => filteredRows.slice(0, displayLimit), [filteredRows, displayLimit]);
  const hasMore = filteredRows.length > displayLimit;
  const remaining = filteredRows.length - displayLimit;

  const stats = useMemo(() => {
    const total = scopedRows.length;
    const active = scopedRows.filter(row => row.isActive).length;
    const publicItems = scopedRows.filter(row => row.isPublic).length;
    const privateItems = total - publicItems;
    return { total, active, publicItems, privateItems };
  }, [scopedRows]);

  const heightClass = variant === 'page' ? 'lg:h-[calc(100vh-140px)]' : 'lg:h-[520px]';

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

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
    <div className={`flex flex-col gap-4 overflow-hidden lg:flex-row ${heightClass} min-h-0`}>
      <Card className='lg:w-[420px] lg:min-w-[380px] lg:max-w-[440px] flex h-full min-h-0 flex-col'>
        <CardHeader className='space-y-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-2'>
              <CardTitle className='text-xl font-semibold text-foreground'>{title ?? copy.title}</CardTitle>
              <CardDescription className='text-sm'>{description ?? copy.description}</CardDescription>
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={() => catalogueQuery.refetch()}
              disabled={catalogueQuery.isFetching}
              className='shrink-0'
            >
              <RefreshCw className={`h-4 w-4 ${catalogueQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            <StatPill label='Total' value={stats.total} />
            <StatPill label='Active' value={stats.active} variant='success' />
            <StatPill label='Public' value={stats.publicItems} variant='info' />
            <StatPill label='Private' value={stats.privateItems} variant='muted' />
          </div>
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden pt-0'>
          <ScrollArea className='h-full pr-3'>
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
                  <p className='font-semibold text-foreground'>No catalogue items available here yet.</p>
                  <p className='text-xs'>Try refreshing or publish items to this catalogue.</p>
                </div>
              ) : (
                <>
                {displayedRows.map(row => {
                  const typeIcon = row.typeLabel === 'Course' ? BookOpen : row.typeLabel === 'Class' ? GraduationCap : Package;
                  const TypeIcon = typeIcon;

                  return (
                    <button
                      key={row.id}
                      type='button'
                      onClick={() => setSelectedId(row.id)}
                      className={`group w-full rounded-[16px] border p-3.5 text-left transition-all duration-200 ${
                        selectedId === row.id
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/20'
                          : 'border-border/60 bg-card hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
                      }`}
                    >
                      <div className='flex gap-3'>
                        {/* Icon */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-colors ${
                          selectedId === row.id
                            ? 'bg-primary/15 text-primary'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                        }`}>
                          <TypeIcon className='h-4.5 w-4.5' />
                        </div>

                        {/* Content */}
                        <div className='flex-1 space-y-2 overflow-hidden'>
                          {/* Title */}
                          <h3 className='line-clamp-1 text-sm font-semibold leading-tight text-foreground'>
                            {row.displayTitle}
                          </h3>

                          {/* Meta row */}
                          <div className='flex flex-wrap items-center gap-1.5'>
                            <Badge
                              variant='outline'
                              className='gap-1 border-primary/40 bg-primary/5 text-[10px] font-medium text-primary'
                            >
                              {row.typeLabel}
                            </Badge>
                            {row.isActive && (
                              <Badge
                                className='gap-1 text-[10px]'
                                variant='default'
                              >
                                <CheckCircle2 className='h-2.5 w-2.5' />
                                Active
                              </Badge>
                            )}
                            {row.isPublic && (
                              <Badge
                                className='gap-1 text-[10px]'
                                variant='secondary'
                              >
                                <Eye className='h-2.5 w-2.5' />
                                Public
                              </Badge>
                            )}
                            {!row.isActive && (
                              <Badge
                                className='gap-1 text-[10px]'
                                variant='outline'
                              >
                                <XCircle className='h-2.5 w-2.5' />
                                Inactive
                              </Badge>
                            )}
                            {!row.isPublic && (
                              <Badge
                                className='gap-1 text-[10px]'
                                variant='outline'
                              >
                                <EyeOff className='h-2.5 w-2.5' />
                                Private
                              </Badge>
                            )}
                            <div className='ml-auto flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary'>
                              <DollarSign className='h-3 w-3' />
                              <span className='text-[11px]'>{formatMoney(row.price, row.currency ?? undefined)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {hasMore && (
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={handleLoadMore}
                  >
                    Load {remaining > 20 ? '20' : remaining} more ({remaining} remaining)
                  </Button>
                )}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className='flex min-h-0 flex-1 flex-col'>
        <CardHeader className='flex flex-col gap-3 border-b border-border/60 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex-1 space-y-1.5'>
            <div className='flex items-center gap-2'>
              {selectedRow && (
                <div className='flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10'>
                  {selectedRow.typeLabel === 'Course' && <BookOpen className='h-4 w-4 text-primary' />}
                  {selectedRow.typeLabel === 'Class' && <GraduationCap className='h-4 w-4 text-primary' />}
                  {selectedRow.typeLabel === 'Item' && <Package className='h-4 w-4 text-primary' />}
                </div>
              )}
              <CardTitle className='text-lg font-semibold text-foreground'>
                {selectedRow ? selectedRow.displayTitle : 'Select a catalogue item'}
              </CardTitle>
            </div>
            <CardDescription className='text-sm'>
              {selectedRow
                ? 'Review pricing, visibility, and linked metadata'
                : 'Choose an item from the list to see its details'}
            </CardDescription>
          </div>
          {selectedRow?.detailsHref ? (
            <Button variant='default' size='sm' asChild className='shrink-0'>
              <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                <ExternalLink className='h-4 w-4' />
                Open
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden p-0'>
          {catalogueQuery.isLoading ? (
            <div className='space-y-4 p-6'>
              <Skeleton className='h-6 w-1/3' />
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-32 w-full' />
            </div>
          ) : selectedRow ? (
            <ScrollArea className='h-full px-6 py-5 pr-8'>
              <div className='space-y-6'>
                {/* Status Badges */}
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant={selectedRow.isActive ? 'default' : 'secondary'} className='gap-1.5'>
                    {selectedRow.isActive ? <CheckCircle2 className='h-3.5 w-3.5' /> : <XCircle className='h-3.5 w-3.5' />}
                    {selectedRow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={selectedRow.isPublic ? 'secondary' : 'outline'} className='gap-1.5'>
                    {selectedRow.isPublic ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' />}
                    {selectedRow.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <Badge variant='outline' className='gap-1.5'>
                    {selectedRow.typeLabel === 'Course' && <BookOpen className='h-3.5 w-3.5' />}
                    {selectedRow.typeLabel === 'Class' && <GraduationCap className='h-3.5 w-3.5' />}
                    {selectedRow.typeLabel === 'Item' && <Package className='h-3.5 w-3.5' />}
                    {selectedRow.typeLabel}
                  </Badge>
                </div>

                {/* Description (if available) */}
                {(() => {
                  const linkedEntity = selectedRow.courseId ? titleMaps.courseMap.get(selectedRow.courseId) : selectedRow.classId ? titleMaps.classMap.get(selectedRow.classId) : null;
                  const description = linkedEntity?.description || linkedEntity?.summary;

                  return description ? (
                    <div className='rounded-[16px] border border-border/60 bg-muted/30 p-5'>
                      <p className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                        <BookOpen className='h-3.5 w-3.5' />
                        Description
                      </p>
                      <div
                        className='prose prose-sm max-w-none text-foreground'
                        dangerouslySetInnerHTML={{ __html: description.replace(/<[^>]*>/g, '').substring(0, 300) + (description.length > 300 ? '...' : '') }}
                      />
                    </div>
                  ) : null;
                })()}

                {/* Creator/Instructor Information */}
                <CatalogueItemCreatorInfo
                  selectedRow={selectedRow}
                  courseMap={titleMaps.courseMap}
                  classMap={titleMaps.classMap}
                />

                {/* Pricing - More Prominent */}
                <CatalogueItemPricing
                  selectedRow={selectedRow}
                  courseMap={titleMaps.courseMap}
                />

                {/* Key Information */}
                <div className='space-y-3'>
                  <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    <Calendar className='h-3.5 w-3.5' />
                    Timeline
                  </p>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <DetailTile label='Created' value={formatDate(selectedRow.createdAt)} />
                    <DetailTile label='Updated' value={formatDate(selectedRow.updatedAt)} />
                  </div>
                </div>

                {/* Technical Details - Collapsed by default look */}
                <details className='group rounded-[16px] border border-border/60 bg-card/50' open>
                  <summary className='flex cursor-pointer items-center justify-between p-4 text-sm font-semibold text-foreground transition hover:bg-muted/30'>
                    Technical Details
                    <span className='text-muted-foreground transition group-open:rotate-180'>▼</span>
                  </summary>
                  <div className='space-y-3 border-t border-border/60 p-4'>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <DetailTile label='Product code' value={selectedRow.productCode ?? '—'} />
                      <DetailTile label='Variant code' value={selectedRow.variantCode ?? '—'} />
                      {selectedRow.courseId && <DetailTile label='Course ID' value={selectedRow.courseId} />}
                      {selectedRow.classId && <DetailTile label='Class ID' value={selectedRow.classId} />}
                    </div>
                  </div>
                </details>

                {/* Actions */}
                <div className='flex flex-wrap gap-2 border-t border-border/60 pt-4'>
                  <Button variant='outline' size='sm' onClick={() => handleCopy(selectedRow.variantCode ?? selectedRow.productCode)}>
                    <Copy className='mr-2 h-4 w-4' />
                    Copy SKU
                  </Button>
                  {selectedRow.detailsHref ? (
                    <Button variant='default' size='sm' asChild>
                      <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                        <ExternalLink className='h-4 w-4' />
                        View full details
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className='text-muted-foreground flex h-full items-center justify-center px-6 text-sm'>
              Select a catalogue item on the left to load its details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CatalogueItemCreatorInfo({
  selectedRow,
  courseMap,
  classMap,
}: {
  selectedRow: CatalogueRow;
  courseMap: Map<string, Course>;
  classMap: Map<string, ClassDefinition>;
}) {
  const course = selectedRow.courseId ? courseMap.get(selectedRow.courseId) : null;
  const classDef = selectedRow.classId ? classMap.get(selectedRow.classId) : null;

  const courseCreatorUuid = course?.course_creator_uuid;
  const instructorUuid = classDef?.default_instructor_uuid;

  const { data: creatorData } = useQuery({
    ...getCourseCreatorByUuidOptions({
      path: { uuid: courseCreatorUuid ?? '' },
    }),
    enabled: Boolean(courseCreatorUuid),
  });

  const { data: instructorData } = useQuery({
    ...getInstructorByUuidOptions({
      path: { uuid: instructorUuid ?? '' },
    }),
    enabled: Boolean(instructorUuid),
  });

  const creator = extractEntity<CourseCreator>(creatorData);
  const instructor = extractEntity<Instructor>(instructorData);

  if (!creator && !instructor) return null;

  return (
    <div className='space-y-3'>
      <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        <UserCheck className='h-3.5 w-3.5' />
        People
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {creator && (
          <div className='rounded-[12px] border border-border/60 bg-card/80 p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                <User className='h-5 w-5 text-primary' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Course Creator</p>
                <p className='mt-1 truncate text-sm font-semibold text-foreground'>
                  {creator.first_name} {creator.last_name}
                </p>
                {creator.email && (
                  <p className='truncate text-xs text-muted-foreground'>{creator.email}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {instructor && (
          <div className='rounded-[12px] border border-border/60 bg-card/80 p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                <GraduationCap className='h-5 w-5 text-primary' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Instructor</p>
                <p className='mt-1 truncate text-sm font-semibold text-foreground'>
                  {instructor.first_name} {instructor.last_name}
                </p>
                {instructor.email && (
                  <p className='truncate text-xs text-muted-foreground'>{instructor.email}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogueItemPricing({
  selectedRow,
  courseMap,
}: {
  selectedRow: CatalogueRow;
  courseMap: Map<string, Course>;
}) {
  const course = selectedRow.courseId ? courseMap.get(selectedRow.courseId) : null;

  return (
    <div className='space-y-3'>
      <div className='rounded-[16px] border border-primary/20 bg-primary/5 p-5'>
        <p className='mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary'>
          <DollarSign className='h-3.5 w-3.5' />
          Pricing & Revenue
        </p>
        <p className='mt-2 text-2xl font-bold text-foreground'>
          {selectedRow.price !== null && selectedRow.price !== undefined
            ? formatMoney(selectedRow.price, selectedRow.currency ?? undefined)
            : 'No price set'}
        </p>
        <p className='mt-1 text-xs text-muted-foreground'>
          {selectedRow.currency ? `Currency: ${selectedRow.currency}` : 'Default currency applied'}
        </p>

        {/* Revenue Share Information */}
        {course && course.creator_share_percentage !== undefined && course.instructor_share_percentage !== undefined && (
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-[10px] border border-border/60 bg-card/60 p-3'>
              <div className='flex items-center gap-2'>
                <Percent className='h-3.5 w-3.5 text-primary' />
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Creator Share</p>
              </div>
              <p className='mt-1.5 text-lg font-bold text-foreground'>{course.creator_share_percentage}%</p>
            </div>
            <div className='rounded-[10px] border border-border/60 bg-card/60 p-3'>
              <div className='flex items-center gap-2'>
                <TrendingUp className='h-3.5 w-3.5 text-primary' />
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Instructor Share</p>
              </div>
              <p className='mt-1.5 text-lg font-bold text-foreground'>{course.instructor_share_percentage}%</p>
            </div>
          </div>
        )}

        {/* Revenue Allocation Context */}
        {course?.revenue_allocation_context && (
          <div className='mt-3 rounded-[10px] border border-border/60 bg-muted/20 p-3'>
            <p className='text-xs text-muted-foreground'>{course.revenue_allocation_context}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, variant = 'default' }: { label: string; value: number; variant?: 'default' | 'success' | 'info' | 'muted' }) {
  const variantClasses = {
    default: 'border-border bg-card',
    success: 'border-success/30 bg-success/5',
    info: 'border-info/30 bg-info/5',
    muted: 'border-border/60 bg-muted/40',
  };

  const textClasses = {
    default: 'text-foreground',
    success: 'text-success-foreground',
    info: 'text-info-foreground',
    muted: 'text-muted-foreground',
  };

  return (
    <div className={`rounded-[12px] border px-3 py-2.5 text-center transition-all hover:shadow-sm ${variantClasses[variant]}`}>
      <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${textClasses[variant]}`}>{value}</p>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-[12px] border border-border/60 bg-muted/30 p-3.5 transition-all hover:bg-muted/50'>
      <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      <p className='mt-1.5 break-all text-sm font-semibold text-foreground'>{value}</p>
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
