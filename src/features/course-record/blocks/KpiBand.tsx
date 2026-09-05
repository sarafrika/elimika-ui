import { BarChart3, Calendar, CreditCard, Star, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { KpiCard, KpiCardSkeleton, type KpiCardVariant } from '@/components/dashboard/kpi-card';
import { AsyncSection } from '@/components/data/async-section';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import {
  type CourseAccess,
  type CourseBlockAsyncProps,
  type CourseKpiSetId,
  type CourseStats,
  courseCapability,
} from '../types';

/**
 * The five-card KPI band.
 *
 * Which five cards, what they are called and where their numbers come from is
 * decided by the capability map, not by an `access` switch in here — this block
 * only formats and lays out. A card whose figure is absent from the response is
 * **not rendered**: an approved trainer has no `owner` block, and a zero in its
 * place would be a lie about the course's sales.
 *
 * Tiles are the shared `<KpiCard>`, so the 4px left accent, the icon chip and
 * the hover lift stay identical to every other dashboard.
 */

export interface KpiBandProps extends CourseBlockAsyncProps {
  access: CourseAccess;
  stats?: CourseStats;
  /**
   * Replaces the capability map's scope line once the name is known —
   * "Scoped to Nairobi Skills Institute" rather than "Scoped to your organisation".
   */
  scopeLabel?: string;
  /** ISO currency for the money card. */
  currency?: string;
  /** Prospect only — the cheapest class price for this course. */
  priceFrom?: number;
  /** Prospect only — classes accepting enrolment right now. */
  classesOpenNow?: number;
  /** Prospect only — when the next class starts, pre-formatted, e.g. "6 Oct". */
  nextClassStarts?: string;
  className?: string;
}

interface Tile {
  key: string;
  title: string;
  value: ReactNode;
  icon: ReactNode;
  variant: KpiCardVariant;
  hint?: string;
  className?: string;
}

/** The band's grid. Exported so a page-level skeleton can match it exactly. */
export const KPI_BAND_GRID = 'grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5';

export function KpiBand({
  access,
  stats,
  scopeLabel,
  currency = 'KES',
  priceFrom,
  classesOpenNow,
  nextClassStarts,
  loading,
  error,
  onRetry,
  className,
}: KpiBandProps) {
  const kpi = courseCapability(access).kpi;

  // The enrolled learner gets the progress strip instead of a KPI band.
  if (!kpi) return null;

  const money = (amount: number | undefined) => formatMoney(amount, currency);
  const tiles: Tile[] = [];

  /* — 1 · people ─────────────────────────────────────────────────────── */
  const learners =
    kpi.set === 'course'
      ? stats?.owner?.total_enrollments
      : kpi.set === 'scoped'
        ? stats?.scoped?.your_learners
        : stats?.public.learners_trained;

  if (learners !== undefined) {
    tiles.push({
      key: 'learners',
      title: kpi.learnersLabel,
      value: formatCount(learners),
      icon: <Users className='size-4' />,
      variant: 'primary',
    });
  }

  /* — 2 · money, fill, or price ──────────────────────────────────────── */
  const moneyValue =
    kpi.set === 'course'
      ? money(stats?.owner?.gross_sales)
      : kpi.set === 'scoped'
        ? money(stats?.scoped?.your_earnings)
        : kpi.set === 'trainer-case'
          ? formatPercent(stats?.public.average_class_fill)
          : money(priceFrom);

  if (moneyValue !== undefined) {
    tiles.push({
      key: 'money',
      title: kpi.moneyLabel,
      value: moneyValue,
      icon: kpi.moneyIcon === 'bar-chart' ? <BarChart3 className='size-4' /> : <CreditCard className='size-4' />,
      variant: 'green',
      hint: moneyHintFor(kpi.set, kpi.moneyHint, stats, currency),
    });
  }

  /* — 3 · classes ────────────────────────────────────────────────────── */
  const classesValue =
    kpi.set === 'scoped'
      ? stats?.scoped?.your_classes
      : kpi.set === 'learner-case'
        ? classesOpenNow
        : stats?.public.classes_running;

  if (classesValue !== undefined) {
    tiles.push({
      key: 'classes',
      title: kpi.classesLabel,
      value: formatCount(classesValue),
      icon: <Calendar className='size-4' />,
      variant: 'coral',
      hint: classesHintFor(kpi.set, stats, nextClassStarts),
    });
  }

  /* — 4 · completion ─────────────────────────────────────────────────── */
  const completion = stats?.public.completion_rate;
  if (completion !== undefined) {
    tiles.push({
      key: 'completion',
      title: 'Completion rate',
      value: (
        <>
          {formatPercent(completion)}
          <Progress
            value={clampPercent(completion)}
            className='bg-muted mt-[9px] h-1.5'
            aria-label='Completion rate'
          />
        </>
      ),
      icon: <TrendingUp className='size-4' />,
      variant: 'primary',
    });
  }

  /* — 5 · rating ─────────────────────────────────────────────────────── */
  const rating = stats?.public.average_rating;
  if (rating !== undefined) {
    const reviews = stats?.public.total_reviews;
    tiles.push({
      key: 'rating',
      title: 'Average rating',
      value: (
        <>
          {rating.toFixed(1)}{' '}
          <span className='text-muted-foreground text-sm font-medium'>/ 5</span>
        </>
      ),
      icon: <Star className='fill-chart-3 text-chart-3 size-4' />,
      variant: 'amber',
      // The gold star accent is `chart-3`; KpiCard's amber variant is the
      // orange warning step, so the left rail is retinted here.
      className: 'border-l-chart-3',
      hint:
        reviews === undefined
          ? undefined
          : `${formatCount(reviews)} review${reviews === 1 ? '' : 's'}`,
    });
  }

  return (
    <section className={className}>
      <div className='mb-2.5 flex items-baseline justify-between gap-4'>
        <h2 className='text-[15px] font-bold tracking-tight'>{kpi.title}</h2>
        <span className='text-muted-foreground text-right text-xs'>
          {scopeLabel ?? kpi.scope}
        </span>
      </div>

      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!stats || tiles.length === 0}
        skeleton={<KpiBandSkeleton />}
        errorTitle='Couldn’t load course performance'
        emptyTitle='No performance figures yet'
        emptyDescription='Figures appear once this course has classes, enrolments and reviews.'
      >
        <div className={KPI_BAND_GRID}>
          {tiles.map(tile => (
            <KpiCard
              key={tile.key}
              title={tile.title}
              value={tile.value}
              icon={tile.icon}
              variant={tile.variant}
              hint={tile.hint}
              className={tile.className}
            />
          ))}
        </div>
      </AsyncSection>
    </section>
  );
}

export function KpiBandSkeleton() {
  return (
    <div className={KPI_BAND_GRID}>
      {[0, 1, 2, 3, 4].map(cell => (
        <KpiCardSkeleton key={cell} />
      ))}
    </div>
  );
}

/** Header + tiles, for callers that skeleton the whole band including its title. */
export function KpiBandHeaderSkeleton() {
  return (
    <section>
      <div className='mb-2.5 flex items-baseline justify-between gap-4'>
        <Skeleton className='h-4 w-44' />
        <Skeleton className='h-3 w-56' />
      </div>
      <KpiBandSkeleton />
    </section>
  );
}

/* ── hints ─────────────────────────────────────────────────────────────── */

function moneyHintFor(
  set: CourseKpiSetId,
  moneyHint: 'orders' | 'platform-fee' | undefined,
  stats: CourseStats | undefined,
  currency: string
): string | undefined {
  if (set === 'course') {
    if (moneyHint === 'platform-fee') {
      const fee = stats?.owner?.platform_fee;
      return fee === undefined ? undefined : `${formatMoney(fee, currency)} platform fee`;
    }
    const paid = stats?.owner?.paid_orders;
    const refunded = stats?.owner?.refunded_orders;
    if (paid === undefined || refunded === undefined) return undefined;
    return `${formatCount(paid)} paid orders · ${formatCount(refunded)} refunded`;
  }
  if (set === 'scoped') return 'your classes only — private to you';
  if (set === 'trainer-case') {
    const running = stats?.public.classes_running;
    return running === undefined
      ? undefined
      : `across the ${formatCount(running)} classes already running`;
  }
  return 'depending on the class you choose';
}

function classesHintFor(
  set: CourseKpiSetId,
  stats: CourseStats | undefined,
  nextClassStarts: string | undefined
): string | undefined {
  const trainers = stats?.public.approved_trainer_count;

  if (set === 'course') {
    return trainers === undefined
      ? undefined
      : `across ${formatCount(trainers)} approved trainer${trainers === 1 ? '' : 's'}`;
  }
  if (set === 'trainer-case') {
    const fill = stats?.public.average_class_fill;
    if (trainers === undefined) return undefined;
    const base = `across ${formatCount(trainers)} approved trainer${trainers === 1 ? '' : 's'}`;
    return fill === undefined ? base : `${base} · ${formatPercent(fill)} average fill`;
  }
  if (set === 'learner-case') {
    const running = stats?.public.classes_running;
    const base = running === undefined ? undefined : `of ${formatCount(running)} running`;
    if (!nextClassStarts) return base;
    return base ? `${base} · next starts ${nextClassStarts}` : `next starts ${nextClassStarts}`;
  }
  // `scoped`: the artboard shows "2 accepting enrolment", which no scoped field
  // carries. Ship nothing rather than a figure the response does not contain.
  return undefined;
}

/* ── formatting ────────────────────────────────────────────────────────── */

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-KE').format(value);
}

function formatMoney(amount: number | undefined, currency: string): string | undefined {
  if (amount === undefined) return undefined;
  if (Math.abs(amount) >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `${currency} ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;
}

function formatPercent(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${Math.round(value)}%`;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
