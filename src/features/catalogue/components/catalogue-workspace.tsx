'use client';

import { useQuery } from '@tanstack/react-query';
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
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { useClassesByIds, useCoursesByIds } from '@/hooks/use-batched-lookups';
import { extractEntity } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  ClassDefinition,
  CommerceCatalogueItem,
  Course,
  CourseCreator,
  Instructor,
} from '@/services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getInstructorByUuidOptions,
  listCatalogItemsOptions,
  searchCatalogueOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { publicCourseUrl } from '@/src/features/dashboard/lib/dashboard-url';

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
  /** From the `/search` course snapshot; absent on class rows and admin's plain listing. */
  courseName: string | null;
  courseCreatorUuid: string | null;
  creatorName: string | null;
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

type CatalogueDetailsQueryState = {
  isLoading: boolean;
};

/** Non-admin scopes read one page of `/search`; it carries each course's snapshot. */
const CATALOGUE_SEARCH_PAGE_SIZE = 200;

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

    // The public course page works for every scope; classes have no shared detail page yet.
    const detailsHref = item.course_uuid ? publicCourseUrl(item.course_uuid) : null;

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
      courseName: item.course?.name ?? null,
      courseCreatorUuid: item.course?.creator_uuid ?? null,
      creatorName: item.course?.creator_name ?? null,
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

type ScopeMaps = {
  courseMap: Map<string, Course>;
  classMap: Map<string, ClassDefinition>;
};

const toClassMap = (data: { class_definition?: ClassDefinition }[] | undefined) => {
  const map = new Map<string, ClassDefinition>();
  for (const item of data ?? []) {
    const classDef = item?.class_definition;
    if (classDef?.uuid) map.set(classDef.uuid, classDef);
  }
  return map;
};

/** Courses the snapshot can't answer for, and classes from ONE scope listing. */
const useScopeMaps = (
  rows: CatalogueRow[],
  scope: CatalogueScope,
  ids: { instructorUuid?: string | null; organisationUuid?: string | null }
): ScopeMaps => {
  // The snapshot has no organisation uuid, so the organisation scope still needs the courses.
  const courseIds = useMemo(() => {
    const needed = rows
      .filter(row => scope === 'organization' || !row.courseName)
      .map(row => row.courseId)
      .filter((id): id is string => !!id);
    return Array.from(new Set(needed));
  }, [rows, scope]);
  const { courseMap: courseLookup } = useCoursesByIds(courseIds);

  const instructorUuid = ids.instructorUuid ?? '';
  const organisationUuid = ids.organisationUuid ?? '';
  const instructorClassesQuery = useQuery({
    ...getClassDefinitionsForInstructorOptions({ path: { instructorUuid } }),
    enabled: scope === 'instructor' && !!instructorUuid,
    staleTime: STALE_TIMES.entity,
  });
  const organisationClassesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: scope === 'organization' && !!organisationUuid,
    staleTime: STALE_TIMES.entity,
  });
  const scopeClassData =
    scope === 'instructor'
      ? instructorClassesQuery.data?.data
      : scope === 'organization'
        ? organisationClassesQuery.data?.data
        : undefined;

  const classMap = useMemo(() => toClassMap(scopeClassData), [scopeClassData]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courseIds.forEach(courseId => {
      const course = courseLookup[courseId];
      if (course && courseId) {
        map.set(courseId, course);
      }
    });
    return map;
  }, [courseIds, courseLookup]);

  return { courseMap, classMap };
};

/** Titles for the rows on screen; only classes the scope listing missed are fetched by id. */
const useTitleMaps = (rows: CatalogueRow[], scopeMaps: ScopeMaps): TitleMaps => {
  const missingClassIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map(row => row.classId)
            .filter((id): id is string => !!id && !scopeMaps.classMap.has(id))
        )
      ),
    [rows, scopeMaps.classMap]
  );
  const { classDefinitionMap } = useClassesByIds(missingClassIds);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>(scopeMaps.classMap);
    for (const [classId, classDef] of Object.entries(classDefinitionMap)) {
      map.set(classId, classDef);
    }
    return map;
  }, [classDefinitionMap, scopeMaps.classMap]);

  const courseTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    scopeMaps.courseMap.forEach((course, courseId) => {
      if (course?.name) map.set(courseId, course.name);
    });
    return map;
  }, [scopeMaps.courseMap]);

  const classTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    classMap.forEach((classDef, classId) => {
      if (classDef?.title) map.set(classId, classDef.title);
    });
    return map;
  }, [classMap]);

  return { courseTitleMap, classTitleMap, courseMap: scopeMaps.courseMap, classMap };
};

const attachTitles = (rows: CatalogueRow[], maps: TitleMaps): CatalogueRow[] =>
  rows.map(row => {
    if (row.classId && maps.classTitleMap.has(row.classId)) {
      return { ...row, displayTitle: maps.classTitleMap.get(row.classId) as string };
    }
    if (row.courseName) {
      return { ...row, displayTitle: row.courseName };
    }
    if (row.courseId && maps.courseTitleMap.has(row.courseId)) {
      return { ...row, displayTitle: maps.courseTitleMap.get(row.courseId) as string };
    }
    const fallback =
      row.productCode || row.variantCode || row.courseId || row.classId || 'Catalogue item';
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const profile = useUserProfile();
  const organisation = useOrganisation();

  const fetchActiveOnly = scope === 'admin' ? false : !includeHidden;

  // Admin reviews the whole unbounded listing; every other scope reads the paged search.
  const listQuery = useQuery({
    ...listCatalogItemsOptions({ query: { active_only: fetchActiveOnly } }),
    enabled: scope === 'admin',
    staleTime: STALE_TIMES.entity,
  });
  const searchQuery = useQuery({
    ...searchCatalogueOptions({
      query: {
        searchParams: fetchActiveOnly ? { active: 'true' } : {},
        pageable: { page: 0, size: CATALOGUE_SEARCH_PAGE_SIZE },
      },
    }),
    enabled: scope !== 'admin',
    staleTime: STALE_TIMES.entity,
  });
  const catalogueQuery = scope === 'admin' ? listQuery : searchQuery;

  const catalogueItems = useMemo((): CommerceCatalogueItem[] => {
    if (scope === 'admin') {
      if (listQuery.error) return [];
      return listQuery.data?.data ?? [];
    }
    if (searchQuery.error) return [];
    return searchQuery.data?.data?.content ?? [];
  }, [scope, listQuery.data, listQuery.error, searchQuery.data, searchQuery.error]);

  useEffect(() => {
    if (catalogueQuery.error) {
      toast.error('Unable to load catalogue right now.');
    }
  }, [catalogueQuery.error]);

  const rows = useMemo(() => buildRows(catalogueItems), [catalogueItems]);

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

  const scopeMaps = useScopeMaps(rows, scope, {
    instructorUuid: profile?.instructor?.uuid,
    organisationUuid: activeOrgUuid,
  });

  const getOrganisationUuidForRow = useMemo(() => {
    return (row: CatalogueRow) => {
      const itemOrg = (row.raw as CatalogueItemWithOrganisation).organisation_uuid;
      if (itemOrg) return itemOrg;

      const classDef = row.classId ? scopeMaps.classMap.get(row.classId) : undefined;
      if (classDef?.organisation_uuid) {
        return classDef.organisation_uuid;
      }

      const course = row.courseId ? scopeMaps.courseMap.get(row.courseId) : undefined;
      const courseOrg = course ? (course as CourseWithOrganisation).organisation_uuid : undefined;
      if (courseOrg) {
        return courseOrg;
      }

      if (classDef?.course_uuid) {
        const linkedCourse = scopeMaps.courseMap.get(classDef.course_uuid);
        const linkedOrg = linkedCourse
          ? (linkedCourse as CourseWithOrganisation).organisation_uuid
          : undefined;
        if (linkedOrg) {
          return linkedOrg;
        }
      }

      return null;
    };
  }, [scopeMaps.classMap, scopeMaps.courseMap]);

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
          const classDef = row.classId ? scopeMaps.classMap.get(row.classId) : undefined;
          const classMatches = classDef?.default_instructor_uuid === instructorUuid;
          const courseCreatorUuid = row.courseId
            ? (row.courseCreatorUuid ?? scopeMaps.courseMap.get(row.courseId)?.course_creator_uuid)
            : undefined;
          const courseMatches = courseCreatorUuid === instructorUuid;
          return classMatches || courseMatches;
        }
        case 'course_creator': {
          const creatorUuid = profile?.courseCreator?.uuid;
          if (!creatorUuid) return true;
          // Scoped by the catalogue item's own course snapshot, so nothing is fetched to decide.
          if (!row.courseId) return false;
          const courseCreatorUuid =
            row.courseCreatorUuid ?? scopeMaps.courseMap.get(row.courseId)?.course_creator_uuid;
          return courseCreatorUuid === creatorUuid;
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
    scopeMaps.classMap,
    scopeMaps.courseMap,
    getOrganisationUuidForRow,
  ]);

  const scopedRows = useMemo(
    () => rows.filter(filterRowsByScope),
    [rows, filterRowsByScope]
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

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredRows.find(row => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedId]);

  const selectedBaseRow = filteredRows.find(row => row.id === selectedId) ?? null;
  const visibleRows = useMemo(() => {
    const rowsOnScreen = filteredRows.slice(0, displayLimit);
    return selectedBaseRow && !rowsOnScreen.includes(selectedBaseRow)
      ? [...rowsOnScreen, selectedBaseRow]
      : rowsOnScreen;
  }, [filteredRows, displayLimit, selectedBaseRow]);

  const titleMaps = useTitleMaps(visibleRows, scopeMaps);
  const titledRows = useMemo(() => attachTitles(visibleRows, titleMaps), [visibleRows, titleMaps]);
  const displayedRows = useMemo(() => titledRows.slice(0, displayLimit), [titledRows, displayLimit]);
  const selectedRow = titledRows.find(row => row.id === selectedId) ?? null;
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

  const handleSelectRow = (row: CatalogueRow) => {
    setSelectedId(row.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className={`flex flex-col gap-4 overflow-hidden lg:flex-row ${heightClass} min-h-0`}>
      <Card className='flex h-full min-h-0 flex-col lg:w-[420px] lg:max-w-[440px] lg:min-w-[380px]'>
        <CardHeader className='space-y-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-2'>
              <CardTitle className='text-foreground text-xl font-semibold'>
                {title ?? copy.title}
              </CardTitle>
              <CardDescription className='text-sm'>
                {description ?? copy.description}
              </CardDescription>
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
                    className='border-border/60 bg-muted/40 rounded-2xl border border-dashed p-4'
                  >
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='mt-2 h-3 w-1/3' />
                  </div>
                ))
              ) : filteredRows.length === 0 ? (
                <div className='text-muted-foreground border-border/60 bg-muted/40 flex flex-col items-start gap-2 rounded-2xl border border-dashed p-4 text-sm'>
                  <p className='text-foreground font-semibold'>
                    No catalogue items available here yet.
                  </p>
                  <p className='text-xs'>Try refreshing or publish items to this catalogue.</p>
                </div>
              ) : (
                <>
                  {displayedRows.map(row => {
                    const typeIcon =
                      row.typeLabel === 'Course'
                        ? BookOpen
                        : row.typeLabel === 'Class'
                          ? GraduationCap
                          : Package;
                    const TypeIcon = typeIcon;

                    return (
                      <button
                        key={row.id}
                        type='button'
                        onClick={() => handleSelectRow(row)}
                        className={`group w-full rounded-[16px] border p-3.5 text-left transition-all duration-200 ${
                          selectedId === row.id
                            ? 'border-primary bg-primary/10 ring-primary/20 shadow-md ring-1'
                            : 'border-border/60 bg-card hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
                        }`}
                      >
                        <div className='flex gap-3'>
                          {/* Icon */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-colors ${
                              selectedId === row.id
                                ? 'bg-primary/15 text-primary'
                                : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                            }`}
                          >
                            <TypeIcon className='h-4.5 w-4.5' />
                          </div>

                          {/* Content */}
                          <div className='flex-1 space-y-2 overflow-hidden'>
                            {/* Title */}
                            <h3 className='text-foreground line-clamp-1 text-sm leading-tight font-semibold'>
                              {row.displayTitle}
                            </h3>

                            {/* Meta row */}
                            <div className='flex flex-wrap items-center gap-1.5'>
                              <Badge
                                variant='outline'
                                className='border-primary/40 bg-primary/5 text-primary gap-1 text-[10px] font-medium'
                              >
                                {row.typeLabel}
                              </Badge>
                              {row.isActive && (
                                <Badge className='gap-1 text-[10px]' variant='default'>
                                  <CheckCircle2 className='h-2.5 w-2.5' />
                                  Active
                                </Badge>
                              )}
                              {row.isPublic && (
                                <Badge className='gap-1 text-[10px]' variant='secondary'>
                                  <Eye className='h-2.5 w-2.5' />
                                  Public
                                </Badge>
                              )}
                              {!row.isActive && (
                                <Badge className='gap-1 text-[10px]' variant='outline'>
                                  <XCircle className='h-2.5 w-2.5' />
                                  Inactive
                                </Badge>
                              )}
                              {!row.isPublic && (
                                <Badge className='gap-1 text-[10px]' variant='outline'>
                                  <EyeOff className='h-2.5 w-2.5' />
                                  Private
                                </Badge>
                              )}
                              <div className='border-primary/30 bg-primary/5 text-primary ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold'>
                                <DollarSign className='h-3 w-3' />
                                <span className='text-[11px]'>
                                  {formatMoney(row.unitAmount, row.currency ?? undefined)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {hasMore && (
                    <Button variant='outline' className='w-full' onClick={handleLoadMore}>
                      Load {remaining > 20 ? '20' : remaining} more ({remaining} remaining)
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Desktop Details Panel */}
      <Card className='hidden min-h-0 flex-1 flex-col lg:flex'>
        <CatalogueDetailsContent
          catalogueQuery={catalogueQuery}
          selectedRow={selectedRow}
          titleMaps={titleMaps}
          handleCopy={handleCopy}
        />
      </Card>

      {/* Mobile Details Sheet */}
      <CatalogueDetailsSheet
        open={isSheetOpen && Boolean(selectedRow)}
        onOpenChange={setIsSheetOpen}
        catalogueQuery={catalogueQuery}
        selectedRow={selectedRow}
        titleMaps={titleMaps}
        handleCopy={handleCopy}
      />
    </div>
  );
}

function CatalogueDetailsSheet({
  open,
  onOpenChange,
  catalogueQuery,
  selectedRow,
  titleMaps,
  handleCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogueQuery: CatalogueDetailsQueryState;
  selectedRow: CatalogueRow | null;
  titleMaps: TitleMaps;
  handleCopy: (value?: string | null) => Promise<void>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full max-w-xl flex-col border-l p-0'>
        <SheetHeader className='flex-shrink-0 border-b px-6 py-5'>
          <div className='flex items-center gap-2'>
            {selectedRow && (
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-[10px]'>
                {selectedRow.typeLabel === 'Course' && (
                  <BookOpen className='text-primary h-4 w-4' />
                )}
                {selectedRow.typeLabel === 'Class' && (
                  <GraduationCap className='text-primary h-4 w-4' />
                )}
                {selectedRow.typeLabel === 'Item' && <Package className='text-primary h-4 w-4' />}
              </div>
            )}
            <SheetTitle className='text-foreground text-lg font-semibold'>
              {selectedRow ? selectedRow.displayTitle : 'Catalogue Details'}
            </SheetTitle>
          </div>
          <SheetDescription className='text-sm'>
            {selectedRow
              ? 'Review pricing, visibility, and linked metadata'
              : 'Choose an item to see its details'}
          </SheetDescription>
          {selectedRow && (
            <div className='flex flex-wrap items-center gap-2 pt-2'>
              <div className='border-primary/30 bg-primary/5 text-foreground flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold'>
                <DollarSign className='text-primary h-4 w-4' />
                <span>
                  {selectedRow.unitAmount !== null && selectedRow.unitAmount !== undefined
                    ? formatMoney(selectedRow.unitAmount, selectedRow.currency ?? undefined)
                    : 'No price set'}
                </span>
                {selectedRow.currency && (
                  <span className='text-muted-foreground text-xs font-medium'>
                    ({selectedRow.currency})
                  </span>
                )}
              </div>
              {selectedRow?.detailsHref && (
                <Button variant='default' size='sm' asChild className='shrink-0'>
                  <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                    <ExternalLink className='h-4 w-4' />
                    Open
                  </Link>
                </Button>
              )}
            </div>
          )}
        </SheetHeader>
        <ScrollArea className='h-0 flex-1 pr-3'>
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
  );
}

function CatalogueDetailsContent({
  catalogueQuery,
  selectedRow,
  titleMaps,
  handleCopy,
}: {
  catalogueQuery: CatalogueDetailsQueryState;
  selectedRow: CatalogueRow | null;
  titleMaps: TitleMaps;
  handleCopy: (value?: string | null) => Promise<void>;
}) {
  return (
    <>
      <CardHeader className='border-border/60 flex flex-col gap-3 border-b lg:flex-col lg:items-start lg:justify-between'>
        <div className='flex-1 space-y-1.5'>
          <div className='flex items-center gap-2'>
            {selectedRow && (
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-[10px]'>
                {selectedRow.typeLabel === 'Course' && (
                  <BookOpen className='text-primary h-4 w-4' />
                )}
                {selectedRow.typeLabel === 'Class' && (
                  <GraduationCap className='text-primary h-4 w-4' />
                )}
                {selectedRow.typeLabel === 'Item' && <Package className='text-primary h-4 w-4' />}
              </div>
            )}
            <CardTitle className='text-foreground text-lg font-semibold'>
              {selectedRow ? selectedRow.displayTitle : 'Select a catalogue item'}
            </CardTitle>
          </div>
          <CardDescription className='text-sm'>
            {selectedRow
              ? 'Review pricing, visibility, and linked metadata'
              : 'Choose an item from the list to see its details'}
          </CardDescription>
        </div>
        <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
          {selectedRow ? (
            <div className='border-primary/30 bg-primary/5 text-foreground flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold'>
              <DollarSign className='text-primary h-4 w-4' />
              <span>
                {selectedRow.unitAmount !== null && selectedRow.unitAmount !== undefined
                  ? formatMoney(selectedRow.unitAmount, selectedRow.currency ?? undefined)
                  : 'No price set'}
              </span>
              {selectedRow.currency && (
                <span className='text-muted-foreground text-xs font-medium'>
                  ({selectedRow.currency})
                </span>
              )}
            </div>
          ) : null}
          {selectedRow?.detailsHref ? (
            <Button variant='default' size='sm' asChild className='shrink-0'>
              <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
                <ExternalLink className='h-4 w-4' />
                Open
              </Link>
            </Button>
          ) : null}
        </div>
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
            <CatalogueDetailsBody
              selectedRow={selectedRow}
              titleMaps={titleMaps}
              handleCopy={handleCopy}
            />
          </ScrollArea>
        ) : (
          <div className='text-muted-foreground flex h-full items-center justify-center px-6 text-sm'>
            Select a catalogue item on the left to load its details.
          </div>
        )}
      </CardContent>
    </>
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

      {/* Description (if available) */}
      {(() => {
        const description = selectedRow.courseId
          ? (titleMaps.courseMap.get(selectedRow.courseId)?.description ??
            selectedRow.raw.course?.description)
          : selectedRow.classId
            ? titleMaps.classMap.get(selectedRow.classId)?.description
            : undefined;

        return description ? (
          <div className='border-border/60 bg-muted/30 rounded-[16px] border p-5'>
            <p className='text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
              <BookOpen className='h-3.5 w-3.5' />
              Description
            </p>
            <div
              className='prose prose-sm text-foreground max-w-none'
              dangerouslySetInnerHTML={{
                __html:
                  description.replace(/<[^>]*>/g, '').substring(0, 300) +
                  (description.length > 300 ? '...' : ''),
              }}
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
        key={selectedRow.id}
        selectedRow={selectedRow}
        courseMap={titleMaps.courseMap}
      />

      {/* Key Information */}
      <div className='space-y-3'>
        <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
          <Calendar className='h-3.5 w-3.5' />
          Timeline
        </p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <DetailTile label='Created' value={formatDate(selectedRow.createdAt)} />
          <DetailTile label='Updated' value={formatDate(selectedRow.updatedAt)} />
        </div>
      </div>

      {/* Technical Details - Collapsed by default look */}
      <details className='group border-border/60 bg-card/50 rounded-[16px] border' open>
        <summary className='text-foreground hover:bg-muted/30 flex cursor-pointer items-center justify-between p-4 text-sm font-semibold transition'>
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
        {/* {selectedRow.detailsHref ? (
          <Button variant='default' size='sm' asChild>
            <Link href={selectedRow.detailsHref} className='inline-flex items-center gap-2'>
              <ExternalLink className='h-4 w-4' />
              View full details
            </Link>
          </Button>
        ) : null} */}
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

  const courseCreatorUuid = selectedRow.courseCreatorUuid ?? course?.course_creator_uuid;
  const instructorUuid = classDef?.default_instructor_uuid;
  const snapshotCreatorName = selectedRow.creatorName;

  // The snapshot already names the creator; fetch the profile only for rows without one.
  const { data: creatorData } = useQuery({
    ...getCourseCreatorByUuidOptions({
      path: { uuid: courseCreatorUuid ?? '' },
    }),
    enabled: Boolean(courseCreatorUuid) && !snapshotCreatorName,
    staleTime: STALE_TIMES.entity,
  });

  const { data: instructorData } = useQuery({
    ...getInstructorByUuidOptions({
      path: { uuid: instructorUuid ?? '' },
    }),
    enabled: Boolean(instructorUuid),
  });

  const creator = snapshotCreatorName ? null : extractEntity<CourseCreator>(creatorData);
  const creatorName = snapshotCreatorName ?? creator?.full_name;
  const instructor = extractEntity<Instructor>(instructorData);

  if (!creatorName && !instructor) return null;

  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
        <UserCheck className='h-3.5 w-3.5' />
        People
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        {creatorName && (
          <div className='border-border/60 bg-card/80 rounded-[12px] border p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                <User className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                  Course Creator
                </p>
                <p className='text-foreground mt-1 truncate text-sm font-semibold'>
                  {creatorName}
                </p>
                {creator?.website && (
                  <p className='text-muted-foreground truncate text-xs'>{creator.website}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {instructor && (
          <div className='border-border/60 bg-card/80 rounded-[12px] border p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
                <GraduationCap className='text-primary h-5 w-5' />
              </div>
              <div className='flex-1 overflow-hidden'>
                <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
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
  const [showShare, setShowShare] = useState(false);

  return (
    <div className='space-y-3'>
      <div className='border-primary/20 bg-primary/5 rounded-[16px] border p-5'>
        <p className='text-primary mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
          <DollarSign className='h-3.5 w-3.5' />
          Pricing & Revenue
        </p>
        <p className='text-foreground mt-2 text-2xl font-bold'>
          {selectedRow.unitAmount !== null && selectedRow.unitAmount !== undefined
            ? formatMoney(selectedRow.unitAmount, selectedRow.currency ?? undefined)
            : 'No price set'}
        </p>
        <p className='text-muted-foreground mt-1 text-xs'>
          {selectedRow.currency ? `Currency: ${selectedRow.currency}` : 'Default currency applied'}
        </p>

        {/* Revenue Share Information */}
        {course ? (
          <RevenueShareTiles course={course} />
        ) : selectedRow.courseId ? (
          showShare ? (
            <LazyRevenueShare courseId={selectedRow.courseId} />
          ) : (
            <Button
              variant='link'
              size='sm'
              className='mt-3 h-auto px-0'
              onClick={() => setShowShare(true)}
            >
              Show revenue share
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

/** Commercial terms are not in the catalogue snapshot, so they load only when asked for. */
function LazyRevenueShare({ courseId }: { courseId: string }) {
  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
    staleTime: STALE_TIMES.entity,
  });
  const course = extractEntity<Course>(courseQuery.data);

  return (
    <AsyncSection
      name='catalogue-revenue-share'
      loading={courseQuery.isLoading && !courseQuery.data}
      error={courseQuery.error}
      empty={!course}
      emptyTitle='No revenue share set'
      onRetry={() => courseQuery.refetch()}
      skeleton={<Skeleton className='mt-4 h-16 w-full' />}
      className='mt-4'
    >
      {course ? <RevenueShareTiles course={course} /> : null}
    </AsyncSection>
  );
}

function RevenueShareTiles({ course }: { course: Course }) {
  if (
    course.creator_share_percentage === undefined ||
    course.instructor_share_percentage === undefined
  ) {
    return null;
  }

  return (
    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
      <div className='border-border/60 bg-card/60 rounded-[10px] border p-3'>
        <div className='flex items-center gap-2'>
          <Percent className='text-primary h-3.5 w-3.5' />
          <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
            Creator Share
          </p>
        </div>
        <p className='text-foreground mt-1.5 text-lg font-bold'>
          {course.creator_share_percentage}%
        </p>
      </div>
      <div className='border-border/60 bg-card/60 rounded-[10px] border p-3'>
        <div className='flex items-center gap-2'>
          <TrendingUp className='text-primary h-3.5 w-3.5' />
          <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
            Instructor Share
          </p>
        </div>
        <p className='text-foreground mt-1.5 text-lg font-bold'>
          {course.instructor_share_percentage}%
        </p>
      </div>
    </div>
  );
}

function StatPill({
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
    <div
      className={`rounded-[12px] border px-3 py-2.5 text-center transition-all hover:shadow-sm ${variantClasses[variant]}`}
    >
      <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold ${textClasses[variant]}`}>{value}</p>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-border/60 bg-muted/30 hover:bg-muted/50 rounded-[12px] border p-3.5 transition-all'>
      <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
        {label}
      </p>
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
