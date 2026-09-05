'use client';

import { ArrowLeft, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { CourseHero, type CourseHeroProps } from './blocks/CourseHero';
import {
  COURSE_RECORD_TAB_LABELS,
  type CourseAccess,
  type CourseRecordTabId,
  courseCapability,
  fillCourseCopy,
} from './types';

/**
 * The course-record shell.
 *
 * Back bar → hero → KPI band → gate banner → pill tabs → body + rail. Which of
 * those appear, and what the chrome around them says, comes from the capability
 * map for the viewer's `access`; the shell never inspects the user's domain.
 *
 * It renders the hero block by name and takes every other region as a slot, so
 * the tab bodies and the rail cards live in their own block files and this file
 * stays the layout it is drawn as. Give it only the tabs you have panels for —
 * a tab the capability map allows but you pass no panel for is dropped, so the
 * row never advertises an empty page.
 */

export interface CourseRecordViewProps {
  /** From the API. See `use-course-access.ts`. */
  access: CourseAccess;
  /** Props for the hero block; the shell renders `<CourseHero>` itself. */
  hero: CourseHeroProps;

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
  /** `<KpiBand>`. Rendered above the tabs for every viewer but the learner. */
  kpiBand?: ReactNode;
  /** The learner's progress strip, which replaces the KPI band. */
  progressStrip?: ReactNode;
  /** The lock banner for the three gated viewers. */
  gateBanner?: ReactNode;
  /** The right rail's stack of cards. */
  rail?: ReactNode;
  /** Tab bodies, keyed by tab id. Missing keys drop their tab from the row. */
  tabPanels?: Partial<Record<CourseRecordTabId, ReactNode>>;
  /** Counts appended to the tab labels: `Curriculum · 12`. */
  tabCounts?: Partial<Record<CourseRecordTabId, number>>;

  /* — tab state — */
  activeTab?: CourseRecordTabId;
  defaultTab?: CourseRecordTabId;
  onTabChange?: (tab: CourseRecordTabId) => void;

  className?: string;
}

export function CourseRecordView({
  access,
  hero,
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
  className,
}: CourseRecordViewProps) {
  const capability = courseCapability(access);

  const tabs = capability.tabs.filter(tab => Boolean(tabPanels?.[tab]));
  const firstTab = tabs[0];

  const [uncontrolled, setUncontrolled] = useState<CourseRecordTabId | undefined>(defaultTab);
  const requested = activeTab ?? uncontrolled;
  const current = requested && tabs.includes(requested) ? requested : firstTab;

  const selectTab = (value: string) => {
    const tab = value as CourseRecordTabId;
    if (activeTab === undefined) setUncontrolled(tab);
    onTabChange?.(tab);
  };

  const crumb = [capability.breadcrumbRoot, courseName].filter(Boolean).join(' · ');
  const primaryLabel = fillCourseCopy(capability.primaryAction, { price: priceLabel });
  // Only the pending applicant's access pill is amber; every other state is
  // brand-hued. The gate tone is what distinguishes it in the capability map.
  const warnTone = capability.gate?.tone === 'warning';

  return (
    <div className={cn('min-w-0', className)}>
      {/* ── back bar ─────────────────────────────────────────────────── */}
      <div className='mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
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

        <div className='flex flex-wrap items-center gap-2'>
          <span
            className={cn(
              'inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border px-2.5 text-xs font-semibold',
              warnTone
                ? 'border-warning/35 bg-warning/10 text-warning'
                : 'border-primary/30 bg-primary/10 text-primary'
            )}
          >
            <span className='size-1.5 rounded-full bg-current' />
            {capability.accessLabel}
          </span>

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

          {primaryAction ??
            (onPrimaryAction ? (
              <Button size='sm' className='h-8 rounded-[10px]' onClick={onPrimaryAction}>
                {primaryLabel}
              </Button>
            ) : null)}
        </div>
      </div>

      {/* ── hero + stat strip ────────────────────────────────────────── */}
      <CourseHero {...hero} className={cn('mb-5', hero.className)} />

      {/* ── KPI band / progress strip ────────────────────────────────── */}
      {capability.showProgressStrip
        ? progressStrip && <div className='mb-[22px]'>{progressStrip}</div>
        : kpiBand && <div className='mb-[22px]'>{kpiBand}</div>}

      {/* ── gate banner ──────────────────────────────────────────────── */}
      {capability.gate && gateBanner ? <div className='mb-[22px]'>{gateBanner}</div> : null}

      {/* ── body + rail ──────────────────────────────────────────────── */}
      <div className='grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='min-w-0'>
          {current ? (
            <Tabs value={current} onValueChange={selectTab} className='gap-0'>
              <TabsList className='bg-muted mb-[18px] flex h-auto w-full flex-nowrap justify-start gap-1.5 overflow-x-auto rounded-full p-1.5 md:flex-wrap md:overflow-visible'>
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className='data-[state=active]:bg-card data-[state=active]:text-primary h-11 flex-none rounded-full px-4 text-sm font-medium whitespace-nowrap data-[state=active]:font-bold md:h-[34px]'
                  >
                    {labelFor(tab, tabCounts?.[tab])}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map(tab => (
                <TabsContent key={tab} value={tab}>
                  {tabPanels?.[tab]}
                </TabsContent>
              ))}
            </Tabs>
          ) : null}
        </div>

        {rail ? <aside className='flex min-w-0 flex-col gap-4'>{rail}</aside> : null}
      </div>
    </div>
  );
}

function labelFor(tab: CourseRecordTabId, count: number | undefined): string {
  const label = COURSE_RECORD_TAB_LABELS[tab];
  return count === undefined ? label : `${label} · ${count}`;
}
