'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  MoreVertical,
  Package,
  Percent,
  RefreshCw,
  TrendingUp,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { extractEntity } from '@/lib/api-helpers';
import type {
  ClassDefinition,
  CommerceCatalogueItem,
  Course,
  CourseCreator,
  Instructor,
} from '@/services/client';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getInstructorByUuidOptions,
  listCatalogItemsOptions,
} from '@/services/client/@tanstack/react-query.gen';

type CatalogueScope = 'admin' | 'organization' | 'instructor' | 'course_creator';

type CatalogueRow = {
  id: string;
  displayTitle: string;
  typeLabel: 'Course' | 'Class' | 'Item';
  isActive: boolean;
  isPublic: boolean;
  unitAmount: number | string | null | undefined;
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

type CatalogueItemWithOrganisation = CommerceCatalogueItem & { organisation_uuid?: string | null };
type CourseWithOrganisation = Course & { organisation_uuid?: string | null };

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
      isPublic:
        (item as CommerceCatalogueItem & { publicly_visible?: boolean }).publicly_visible !== false,
      unitAmount:
        (item as CommerceCatalogueItem & { unit_amount?: number | string | null }).unit_amount ??
        (item as CommerceCatalogueItem & { price?: number | string | null }).price ??
        null,
      currency:
        (item as CommerceCatalogueItem & { currency_code?: string | null }).currency_code ?? null,
      productCode: item.product_code ?? null,
      variantCode: item.variant_code ?? null,
      courseId: item.course_uuid ?? null,
      classId: item.class_definition_uuid ?? null,
      createdAt:
        (item as CommerceCatalogueItem & { created_date?: string | Date | null }).created_date ??
        null,
      updatedAt:
        (item as CommerceCatalogueItem & { updated_date?: string | Date | null }).updated_date ??
        null,
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

export default function CatalogueTableWorkspace({
  scope,
  title,
  description,
}: {
  scope: CatalogueScope;
  title?: string;
  description?: string;
}) {
  const copy = scopeCopy[scope];
  const includeHidden = copy.includeHiddenByDefault;
  const [selectedRow, setSelectedRow] = useState<CatalogueRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const profile = useUserProfile();
  const organisation = useOrganisation();

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
    if (organisation?.uuid) return organisation.uuid;
    const affiliations = profile?.organisation_affiliations ?? [];
    const activeAffiliation = affiliations.find(aff => aff.active);
    return (
      activeAffiliation?.organisation_uuid ??
      affiliations[0]?.organisation_uuid ??
      profile?.organizations?.[0]?.uuid ??
      null
    );
  }, [organisation?.uuid, profile?.organisation_affiliations, profile?.organizations]);

  const getOrganisationUuidForRow = useMemo(() => {
    return (row: CatalogueRow) => {
      const itemOrg = (row.raw as CatalogueItemWithOrganisation).organisation_uuid;
      if (itemOrg) return itemOrg;

      const classDef = row.classId ? titleMaps.classMap.get(row.classId) : undefined;
      if (classDef?.organisation_uuid) {
        return classDef.organisation_uuid;
      }

      const course = row.courseId ? titleMaps.courseMap.get(row.courseId) : undefined;
      const courseOrg = course ? (course as CourseWithOrganisation).organisation_uuid : undefined;
      if (courseOrg) {
        return courseOrg;
      }

      if (classDef?.course_uuid) {
        const linkedCourse = titleMaps.courseMap.get(classDef.course_uuid);
        const linkedOrg = linkedCourse
          ? (linkedCourse as CourseWithOrganisation).organisation_uuid
          : undefined;
        if (linkedOrg) {
          return linkedOrg;
        }
      }

      return null;
    };
  }, [titleMaps.classMap, titleMaps.courseMap]);

  const filterRowsByScope = useMemo(() => {
    return (row: CatalogueRow) => {
      switch (scope) {
        case 'admin':
          return true;
        case 'organization': {
          if (!activeOrgUuid) return false;
          const owningOrgUuid = getOrganisationUuidForRow(row);
          if (!owningOrgUuid) return false;
          return owningOrgUuid === activeOrgUuid;
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
  }, [
    scope,
    activeOrgUuid,
    profile?.courseCreator?.uuid,
    profile?.instructor?.uuid,
    titleMaps.classMap,
    titleMaps.courseMap,
    getOrganisationUuidForRow,
  ]);

  const scopedRows = useMemo(
    () => rowsWithTitles.filter(filterRowsByScope),
    [rowsWithTitles, filterRowsByScope]
  );

  const filteredRows = useMemo(() => {
    const result = includeHidden
      ? scopedRows
      : scopedRows.filter(row => row.isActive && row.isPublic);

    return [...result].sort((a, b) => {
      const aDate = toTimestamp(a.updatedAt ?? a.createdAt);
      const bDate = toTimestamp(b.updatedAt ?? b.createdAt);
      return bDate - aDate;
    });
  }, [includeHidden, scopedRows]);

  const stats = useMemo(() => {
    const total = scopedRows.length;
    const active = scopedRows.filter(row => row.isActive).length;
    const publicItems = scopedRows.filter(row => row.isPublic).length;
    const privateItems = total - publicItems;
    return { total, active, publicItems, privateItems };
  }, [scopedRows]);

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

  const handleRowClick = (row: CatalogueRow) => {
    setSelectedRow(row);
    setIsSheetOpen(true);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-2'>
              <CardTitle className='text-2xl font-semibold'>{title ?? copy.title}</CardTitle>
              <CardDescription className='text-sm'>
                {description ?? copy.description}
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => catalogueQuery.refetch()}
              disabled={catalogueQuery.isFetching}
              className='shrink-0'
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${catalogueQuery.isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4'>
            <StatCard label='Total' value={stats.total} />
            <StatCard label='Active' value={stats.active} variant='success' />
            <StatCard label='Public' value={stats.publicItems} variant='info' />
            <StatCard label='Private' value={stats.privateItems} variant='muted' />
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[250px]'>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className='hidden md:table-cell'>Product Code</TableHead>
                  <TableHead className='hidden lg:table-cell'>Last Updated</TableHead>
                  <TableHead className='w-[80px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogueQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className='h-4 w-full' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-4 w-16' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-6 w-20' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-6 w-20' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-4 w-24' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-4 w-32' />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Skeleton className='h-4 w-28' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-8 w-8' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='h-24 text-center'>
                      <div className='flex flex-col items-center gap-2'>
                        <p className='text-muted-foreground text-sm'>No catalogue items found</p>
                        <p className='text-muted-foreground text-xs'>
                          Try adjusting your filters or create new items
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map(row => (
                    <TableRow
                      key={row.id}
                      className='hover:bg-muted/50 cursor-pointer'
                      onClick={() => handleRowClick(row)}
                    >
                      {/* Name */}
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-3'>
                          <div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
                            {row.typeLabel === 'Course' && (
                              <BookOpen className='text-primary h-4 w-4' />
                            )}
                            {row.typeLabel === 'Class' && (
                              <GraduationCap className='text-primary h-4 w-4' />
                            )}
                            {row.typeLabel === 'Item' && (
                              <Package className='text-primary h-4 w-4' />
                            )}
                          </div>
                          <span className='line-clamp-2'>{row.displayTitle}</span>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge variant='outline' className='gap-1'>
                          {row.typeLabel}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={row.isActive ? 'default' : 'secondary'} className='gap-1'>
                          {row.isActive ? (
                            <CheckCircle2 className='h-3 w-3' />
                          ) : (
                            <XCircle className='h-3 w-3' />
                          )}
                          {row.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Visibility */}
                      <TableCell>
                        <Badge variant={row.isPublic ? 'secondary' : 'outline'} className='gap-1'>
                          {row.isPublic ? (
                            <Eye className='h-3 w-3' />
                          ) : (
                            <EyeOff className='h-3 w-3' />
                          )}
                          {row.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </TableCell>

                      {/* Price */}
                      <TableCell className='font-semibold'>
                        {formatMoney(row.unitAmount, row.currency ?? undefined)}
                      </TableCell>

                      {/* Product Code */}
                      <TableCell className='hidden md:table-cell'>
                        <code className='text-muted-foreground text-xs'>
                          {row.productCode ?? '—'}
                        </code>
                      </TableCell>

                      {/* Last Updated */}
                      <TableCell className='hidden text-xs lg:table-cell'>
                        <div className='text-muted-foreground'>{formatDate(row.updatedAt)}</div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant='ghost' size='icon'>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                handleRowClick(row);
                              }}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                handleCopy(row.variantCode ?? row.productCode);
                              }}
                            >
                              <Copy className='mr-2 h-4 w-4' />
                              Copy SKU
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className='flex w-full max-w-2xl flex-col border-l p-0 sm:max-w-2xl md:max-w-6xl'>
          <SheetHeader className='flex-shrink-0 border-b px-6 py-5'>
            <div className='flex items-center gap-3'>
              {selectedRow && (
                <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                  {selectedRow.typeLabel === 'Course' && (
                    <BookOpen className='text-primary h-5 w-5' />
                  )}
                  {selectedRow.typeLabel === 'Class' && (
                    <GraduationCap className='text-primary h-5 w-5' />
                  )}
                  {selectedRow.typeLabel === 'Item' && <Package className='text-primary h-5 w-5' />}
                </div>
              )}
              <div className='mt-4 flex-1 sm:mt-0'>
                <SheetTitle className='text-xl font-semibold'>
                  {selectedRow ? selectedRow.displayTitle : 'Catalogue Details'}
                </SheetTitle>
                <SheetDescription className='text-sm'>
                  {selectedRow
                    ? 'Review pricing, visibility, and linked metadata'
                    : 'Choose an item to see its details'}
                </SheetDescription>
              </div>
            </div>
            {selectedRow && (
              <div className='flex flex-wrap items-center gap-2 pt-3'>
                <div className='border-primary/30 bg-primary/5 flex items-center gap-2 rounded-full border px-3 py-1.5'>
                  <DollarSign className='text-primary h-4 w-4' />
                  <span className='text-sm font-semibold'>
                    {formatMoney(selectedRow.unitAmount, selectedRow.currency ?? undefined)}
                  </span>
                  {selectedRow.currency && (
                    <span className='text-muted-foreground text-xs'>({selectedRow.currency})</span>
                  )}
                </div>
                {selectedRow?.detailsHref && (
                  <Button variant='default' size='sm' asChild>
                    <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                      <ExternalLink className='h-4 w-4' />
                      Open
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>
          <ScrollArea className='h-0 flex-1'>
            {catalogueQuery.isLoading ? (
              <div className='space-y-4 px-6 py-5'>
                <Skeleton className='h-6 w-1/3' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-32 w-full' />
              </div>
            ) : selectedRow ? (
              <div className='px-6 py-5'>
                <CatalogueDetailsBody
                  selectedRow={selectedRow}
                  titleMaps={titleMaps}
                  handleCopy={handleCopy}
                />
              </div>
            ) : (
              <div className='text-muted-foreground flex h-full items-center justify-center px-6 text-sm'>
                Select a catalogue item to load its details.
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CatalogueDetailsBody({
  selectedRow,
  titleMaps,
  handleCopy,
}: {
  selectedRow: CatalogueRow;
  titleMaps: TitleMaps;
  handleCopy: (value?: string | null) => Promise<void>;
}) {
  return (
    <div className='space-y-6'>
      {/* Status Badges */}
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant={selectedRow.isActive ? 'default' : 'secondary'} className='gap-1.5'>
          {selectedRow.isActive ? (
            <CheckCircle2 className='h-3.5 w-3.5' />
          ) : (
            <XCircle className='h-3.5 w-3.5' />
          )}
          {selectedRow.isActive ? 'Active' : 'Inactive'}
        </Badge>
        <Badge variant={selectedRow.isPublic ? 'secondary' : 'outline'} className='gap-1.5'>
          {selectedRow.isPublic ? (
            <Eye className='h-3.5 w-3.5' />
          ) : (
            <EyeOff className='h-3.5 w-3.5' />
          )}
          {selectedRow.isPublic ? 'Public' : 'Private'}
        </Badge>
        <Badge variant='outline' className='gap-1.5'>
          {selectedRow.typeLabel === 'Course' && <BookOpen className='h-3.5 w-3.5' />}
          {selectedRow.typeLabel === 'Class' && <GraduationCap className='h-3.5 w-3.5' />}
          {selectedRow.typeLabel === 'Item' && <Package className='h-3.5 w-3.5' />}
          {selectedRow.typeLabel}
        </Badge>
      </div>

      {/* Description */}
      {(() => {
        const linkedEntity = selectedRow.courseId
          ? titleMaps.courseMap.get(selectedRow.courseId)
          : selectedRow.classId
            ? titleMaps.classMap.get(selectedRow.classId)
            : null;
        const description = linkedEntity?.description || linkedEntity?.summary;

        return description ? (
          <div className='border-border/60 bg-muted/30 rounded-xl border p-4'>
            <p className='text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold uppercase'>
              <BookOpen className='h-3.5 w-3.5' />
              Description
            </p>
            <div
              className='text-foreground text-sm leading-relaxed'
              dangerouslySetInnerHTML={{
                __html:
                  description.replace(/<[^>]*>/g, '').substring(0, 300) +
                  (description.length > 300 ? '...' : ''),
              }}
            />
          </div>
        ) : null;
      })()}

      {/* Creator/Instructor */}
      <CatalogueItemCreatorInfo
        selectedRow={selectedRow}
        courseMap={titleMaps.courseMap}
        classMap={titleMaps.classMap}
      />

      {/* Pricing */}
      <CatalogueItemPricing selectedRow={selectedRow} courseMap={titleMaps.courseMap} />

      {/* Timeline */}
      <div className='space-y-3'>
        <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase'>
          <Calendar className='h-3.5 w-3.5' />
          Timeline
        </p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <DetailTile label='Created' value={formatDate(selectedRow.createdAt)} />
          <DetailTile label='Updated' value={formatDate(selectedRow.updatedAt)} />
        </div>
      </div>

      {/* Technical Details */}
      <details className='border-border/60 bg-card/50 group rounded-xl border' open>
        <summary className='hover:bg-muted/30 flex cursor-pointer items-center justify-between p-4 text-sm font-semibold transition'>
          Technical Details
          <span className='text-muted-foreground transition group-open:rotate-180'>▼</span>
        </summary>
        <div className='border-border/60 space-y-3 border-t p-4'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <DetailTile label='Product code' value={selectedRow.productCode ?? '—'} />
            <DetailTile label='Variant code' value={selectedRow.variantCode ?? '—'} />
            {selectedRow.courseId && <DetailTile label='Course ID' value={selectedRow.courseId} />}
            {selectedRow.classId && <DetailTile label='Class ID' value={selectedRow.classId} />}
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className='border-border/60 flex flex-wrap gap-2 border-t pt-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => handleCopy(selectedRow.variantCode ?? selectedRow.productCode)}
        >
          <Copy className='mr-2 h-4 w-4' />
          Copy SKU
        </Button>
      </div>
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
      <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase'>
        <UserCheck className='h-3.5 w-3.5' />
        People
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {creator && (
          <div className='border-border/60 bg-card/80 rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                <User className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-muted-foreground text-[10px] font-medium uppercase'>
                  Course Creator
                </p>
                <p className='text-foreground mt-1 truncate text-sm font-semibold'>
                  {creator.full_name}
                </p>
                {creator.website && (
                  <p className='text-muted-foreground truncate text-xs'>{creator.website}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {instructor && (
          <div className='border-border/60 bg-card/80 rounded-xl border p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                <GraduationCap className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-muted-foreground text-[10px] font-medium uppercase'>
                  Instructor
                </p>
                <p className='text-foreground mt-1 truncate text-sm font-semibold'>
                  {instructor.full_name}
                </p>
                {instructor.website && (
                  <p className='text-muted-foreground truncate text-xs'>{instructor.website}</p>
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
      <div className='border-primary/20 bg-primary/5 rounded-xl border p-5'>
        <p className='text-primary mb-1 flex items-center gap-2 text-xs font-semibold uppercase'>
          <DollarSign className='h-3.5 w-3.5' />
          Pricing & Revenue
        </p>
        <p className='text-foreground mt-2 text-2xl font-bold'>
          {formatMoney(selectedRow.unitAmount, selectedRow.currency ?? undefined)}
        </p>
        <p className='text-muted-foreground mt-1 text-xs'>
          {selectedRow.currency ? `Currency: ${selectedRow.currency}` : 'Default currency applied'}
        </p>

        {course &&
          course.creator_share_percentage !== undefined &&
          course.instructor_share_percentage !== undefined && (
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <div className='border-border/60 bg-card/60 rounded-lg border p-3'>
                <div className='flex items-center gap-2'>
                  <Percent className='text-primary h-3.5 w-3.5' />
                  <p className='text-muted-foreground text-[10px] font-medium uppercase'>
                    Creator Share
                  </p>
                </div>
                <p className='text-foreground mt-1.5 text-lg font-bold'>
                  {course.creator_share_percentage}%
                </p>
              </div>
              <div className='border-border/60 bg-card/60 rounded-lg border p-3'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='text-primary h-3.5 w-3.5' />
                  <p className='text-muted-foreground text-[10px] font-medium uppercase'>
                    Instructor Share
                  </p>
                </div>
                <p className='text-foreground mt-1.5 text-lg font-bold'>
                  {course.instructor_share_percentage}%
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'info' | 'muted';
}) {
  const variantClasses = {
    default: 'border-border bg-card',
    success: 'border-success/30 bg-success/5',
    info: 'border-primary/30 bg-primary/5',
    muted: 'border-border/60 bg-muted/40',
  };

  return (
    <div className={`rounded-lg border p-3 text-center ${variantClasses[variant]}`}>
      <p className='text-muted-foreground text-xs font-medium uppercase'>{label}</p>
      <p className='mt-1 text-xl font-bold'>{value}</p>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-border/60 bg-muted/30 hover:bg-muted/50 rounded-lg border p-3 transition-all'>
      <p className='text-muted-foreground text-[10px] font-medium uppercase'>{label}</p>
      <p className='text-foreground mt-1.5 text-sm font-semibold break-all'>{value}</p>
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
