'use client';

import {
  ArrowLeft,
  BookOpen,
  Download,
  GraduationCap,
  Layers,
  type LucideIcon,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { type EntityFact, EntityHeaderCard } from '@/components/data-display/entity-header-card';
import { surfaceTheme } from '@/components/data-display/page-shell';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { CourseHeroProps } from './blocks/CourseHero';
import {
  type CourseHeaderFactKey,
  courseHeaderFacts,
  resolveCourseRecordTab,
  visibleCourseRecordTabs,
} from './record-tabs';
import {
  COURSE_RECORD_TAB_LABELS,
  COURSE_RECORD_TABS,
  type CourseAccess,
  courseCapability,
  type CourseRecordTabId,
  fillCourseCopy,
} from './types';

/**
 * The course-record shell.
 *
 * Back bar → compact header card → gate banner → sticky section tabs, with the
 * rail beside the panels. Which of those appear, and what the chrome around them
 * says, comes from the capability map for the viewer's `access`; the shell never
 * inspects the user's domain.
 *
 * The header card is drawn from the `hero` props (the tall `CourseHero` band is
 * no longer rendered here) and carries the access state and the primary action.
 * The KPI band, or the learner's progress strip, opens the Overview tab. The open
 * tab is kept in the URL (`?tab=`) so a reload or a shared link reopens it.
 *
 * Give it only the tabs you have panels for — a tab the capability map allows but
 * you pass no panel for is dropped, so the row never advertises an empty page.
 */

interface CourseRecordViewProps {
  /** From the API. See `use-course-access.ts`. */
  access: CourseAccess;
  /** The record's identity, drawn as the compact header card. */
  hero: CourseHeroProps;
  /** Small caps line above the title. Defaults to "Course". */
  eyebrow?: string;

  /* — back bar — */
  /** Appended to the capability map's breadcrumb root after " · ". */
  courseName?: string;
  backHref?: string;
  backLabel?: string;
  /** Fills `{price}` in the prospect's "Enroll — {price}" action. */
  priceLabel?: string;
  onPrimaryAction?: () => void;
  /** Replaces the capability map's primary button outright. */
  primaryAction?: ReactNode;
  onShare?: () => void;
  onExport?: () => void;

  /* — slots — */
  /** `<KpiBand>`. Opens the Overview tab for every viewer but the learner. */
  kpiBand?: ReactNode;
  /** The learner's progress strip, which replaces the KPI band. */
  progressStrip?: ReactNode;
  /** The lock banner for the three gated viewers. Stays above the tabs. */
  gateBanner?: ReactNode;
  /** The right rail's stack of cards, beside the panels. */
  rail?: ReactNode;
  /** Tab bodies, keyed by tab id. Missing keys drop their tab from the row. */
  tabPanels?: Partial<Record<CourseRecordTabId, ReactNode>>;
  /** Count chips on the tabs. */
  tabCounts?: Partial<Record<CourseRecordTabId, number>>;

  /* — tab state — */
  /** Controls the open tab. Omitted, the open tab lives in the URL's `?tab=`. */
  activeTab?: CourseRecordTabId;
  /** The tab a plain address opens. Defaults to the first tab shown. */
  defaultTab?: CourseRecordTabId;
  onTabChange?: (tab: CourseRecordTabId) => void;
  /**
   * The sticky tab bar's offset from the top of its scroll container. A dashboard
   * page scrolls inside a container that already sits under the top bar, so the
   * default `0` is right there.
   */
  stickyTop?: number | string;

  className?: string;
}

const FACT_ICONS: Record<CourseHeaderFactKey, LucideIcon> = {
  lessons: BookOpen,
  content: Layers,
  level: GraduationCap,
  enrolled: Users,
  rating: Star,
};

export function CourseRecordView({
  access,
  hero,
  eyebrow = 'Course',
  courseName,
  backHref,
  backLabel = 'Back to courses',
  priceLabel,
  onPrimaryAction,
  primaryAction,
  onShare,
  onExport,
  kpiBand,
  progressStrip,
  gateBanner,
  rail,
  tabPanels,
  tabCounts,
  activeTab,
  defaultTab,
  onTabChange,
  stickyTop = 0,
  className,
}: CourseRecordViewProps) {
  const capability = courseCapability(access);

  const visible = visibleCourseRecordTabs(capability.tabs, tabPanels);
  const urlTab = useSectionTab(COURSE_RECORD_TABS, defaultTab ?? visible[0] ?? 'overview');
  const current = resolveCourseRecordTab(activeTab ?? urlTab.value, visible);

  const selectTab = (tab: CourseRecordTabId) => {
    if (activeTab === undefined) urlTab.setValue(tab);
    onTabChange?.(tab);
  };

  const crumb = [capability.breadcrumbRoot, courseName].filter(Boolean).join(' · ');
  const primaryLabel = fillCourseCopy(capability.primaryAction, { price: priceLabel });
  // Only the pending applicant's access pill is amber; every other state is
  // brand-hued. The gate tone is what distinguishes it in the capability map.
  const warnTone = capability.gate?.tone === 'warning';

  const primary =
    primaryAction ??
    (onPrimaryAction ? (
      <Button className='h-10 w-full rounded-[10px]' onClick={onPrimaryAction}>
        {primaryLabel}
      </Button>
    ) : null);

  // The band (or the learner's strip) opens the Overview tab; a viewer without
  // an Overview tab keeps it above the tabs instead.
  const band = capability.showProgressStrip ? progressStrip : kpiBand;
  const bandInOverview = Boolean(band) && visible.includes('overview');

  const tabs: SectionTab<CourseRecordTabId>[] = visible.map(id => ({
    id,
    label: COURSE_RECORD_TAB_LABELS[id],
    count: tabCounts?.[id],
  }));

  const facts: EntityFact[] = courseHeaderFacts(hero).map(fact => ({
    ...fact,
    icon: FACT_ICONS[fact.key],
  }));
  const [leadCategory, ...otherCategories] = hero.categories ?? [];

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-[18px]', className)}>
      {/* ── back bar ─────────────────────────────────────────────────── */}
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3 print:hidden'>
        <div className='flex min-w-0 items-center gap-2.5'>
          {backHref ? (
            <Link
              href={backHref}
              className='text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-2 rounded-[10px] px-2.5 text-sm font-medium transition-colors'
            >
              <ArrowLeft className='size-4' />
              {backLabel}
            </Link>
          ) : null}
          <span className='text-border hidden sm:inline'>/</span>
          <span className='text-muted-foreground truncate text-sm'>{crumb}</span>
        </div>

        {onShare || onExport ? (
          <div className='flex flex-wrap items-center gap-2'>
            {onShare ? (
              <Button variant='outline' size='sm' className='h-8 rounded-[10px]' onClick={onShare}>
                <Share2 className='size-4' />
                Share
              </Button>
            ) : null}
            {onExport ? (
              <Button variant='outline' size='sm' className='h-8 rounded-[10px]' onClick={onExport}>
                <Download className='size-4' />
                Export record
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── header card: identity, key facts, access and primary action ─ */}
      <AsyncSection
        loading={hero.loading}
        error={hero.error}
        onRetry={hero.onRetry}
        skeleton={<HeaderSkeleton />}
        errorTitle='Couldn’t load this course'
      >
        <EntityHeaderCard
          className={hero.className}
          title={hero.title ?? '—'}
          eyebrow={eyebrow}
          badges={
            <>
              {leadCategory ? <Chip strong>{leadCategory}</Chip> : null}
              {otherCategories.map(category => (
                <Chip key={category}>{category}</Chip>
              ))}
              {hero.status ? <Chip className='capitalize'>{hero.status}</Chip> : null}
            </>
          }
          description={
            hero.summary ? <p className='line-clamp-3 sm:line-clamp-2'>{hero.summary}</p> : null
          }
          context={
            hero.creatorName ? (
              <div className='flex items-center gap-2.5'>
                <span className='bg-primary/10 text-primary inline-flex size-[30px] shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                  {initialsOf(hero.creatorName)}
                </span>
                <span>
                  <b className='font-semibold'>{hero.creatorName}</b>{' '}
                  <span className='text-muted-foreground'>
                    · {hero.creatorRole ?? 'Course creator'}
                  </span>
                </span>
              </div>
            ) : null
          }
          facts={facts}
          media={<HeaderMedia imageUrl={hero.imageUrl} />}
          aside={
            <div className='bg-muted/40 flex h-full flex-col gap-3 rounded-[14px] border p-[18px]'>
              <span className={surfaceTheme.sectionLabel}>Your access</span>
              <span
                className={cn(
                  'inline-flex min-h-[26px] w-fit items-center gap-1.5 rounded-[10px] border px-2.5 py-1 text-xs font-semibold',
                  warnTone
                    ? 'border-warning/35 bg-warning/10 text-warning'
                    : 'border-primary/30 bg-primary/10 text-primary'
                )}
              >
                <span className='size-1.5 shrink-0 rounded-full bg-current' />
                {capability.accessLabel}
              </span>
              {primary ? (
                <>
                  <div className='grow' />
                  <div className='flex flex-col gap-2 print:hidden'>{primary}</div>
                </>
              ) : null}
            </div>
          }
        />
      </AsyncSection>

      {/* ── gate banner: outside the tabs, so it stays in view ────────── */}
      {/* {capability.gate && gateBanner ? gateBanner : null} */}

      {band && !bandInOverview ? band : null}

      {/* ── sticky tabs, panels and rail ─────────────────────────────── */}
      {current ? (
        <SectionTabs
          tabs={tabs}
          value={current}
          onValueChange={selectTab}
          hrefFor={activeTab === undefined ? urlTab.hrefFor : undefined}
          label='Course sections'
          variant='pill'
          sticky={{ top: stickyTop }}
        >
          <div
            className={cn(
              'grid items-start gap-[22px]',
              rail && 'lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]'
            )}
          >
            <div className='min-w-0'>
              {visible.map(tab => (
                <SectionTabPanel
                  key={tab}
                  value={tab}
                  // Hidden panels still print: the whole record goes to paper.
                  className='print:data-[state=inactive]:block!'
                >
                  {tab === 'overview' && bandInOverview ? (
                    <div className='mb-[22px]'>{band}</div>
                  ) : null}
                  {tabPanels?.[tab]}
                </SectionTabPanel>
              ))}
            </div>

            {rail ? <aside className='flex min-w-0 flex-col gap-4'>{rail}</aside> : null}
          </div>
        </SectionTabs>
      ) : rail ? (
        <aside className='flex min-w-0 flex-col gap-4'>{rail}</aside>
      ) : null}
    </div>
  );
}

function Chip({
  children,
  strong,
  className,
}: {
  children: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium',
        strong ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted text-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}

function HeaderMedia({ imageUrl }: { imageUrl?: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? undefined : imageUrl;
  return (
    <div className='from-primary/15 via-primary/5 to-muted relative flex h-[140px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br md:h-full md:min-h-[160px]'>
      {src ? (
        <img
          src={src}
          alt=''
          onError={() => setFailed(true)}
          className='absolute inset-0 size-full object-cover'
        />
      ) : (
        <BookOpen className='text-primary/60 size-10' aria-hidden />
      )}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className='bg-card grid gap-5 rounded-2xl border p-4 sm:p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px]'>
      <Skeleton className='h-[140px] rounded-xl md:h-[160px]' />
      <div className='flex flex-col gap-3'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-8 w-3/4' />
        <Skeleton className='h-4 w-full max-w-prose' />
        <Skeleton className='h-4 w-1/2' />
      </div>
      <Skeleton className='hidden h-[140px] rounded-[14px] lg:block' />
    </div>
  );
}

/** "Rift Technical Studio" → "RT". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
