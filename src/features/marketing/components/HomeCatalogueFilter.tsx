'use client';

import { cn } from '@/lib/utils';
import {
  BRAND_TONE,
  TONE_FILL,
  TONE_ON_FILL,
  toneFor,
} from '@/src/features/marketing/components/discipline-tone';
import { DISPLAY } from '@/src/features/marketing/components/display-font';
import { HomeCourseCard } from '@/src/features/marketing/components/HomeCourseCard';
import type { HomeCourseCard as HomeCourseCardModel } from '@/src/features/marketing/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

const ALL_CATEGORIES = 'All courses';

type CatalogueFilterValue = {
  active: string;
  categories: string[];
  select: (category: string) => void;
};

const CatalogueFilterContext = createContext<CatalogueFilterValue | null>(null);

const useCatalogueFilter = () => {
  const value = useContext(CatalogueFilterContext);

  if (!value) {
    throw new Error('Catalogue filter components must render inside HomeCatalogueFilterProvider');
  }

  return value;
};

// Holds the selected category for the two leaves that share it: the chip row
// inside the hero band and the grid below it. Only those leaves are client
// components; everything passed as `children` stays a server component.
export function HomeCatalogueFilterProvider({
  categories,
  children,
}: {
  categories: string[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(ALL_CATEGORIES);

  const value = useMemo<CatalogueFilterValue>(
    () => ({ active, categories, select: setActive }),
    [active, categories]
  );

  return (
    <CatalogueFilterContext.Provider value={value}>{children}</CatalogueFilterContext.Provider>
  );
}

export function HomeCategoryChips() {
  const { active, categories, select } = useCatalogueFilter();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div role='group' aria-label='Filter courses by category' className='flex flex-wrap gap-2'>
      {[ALL_CATEGORIES, ...categories].map(category => {
        const isActive = category === active;
        const tone = category === ALL_CATEGORIES ? BRAND_TONE : toneFor(category);

        return (
          <button
            key={category}
            type='button'
            aria-pressed={isActive}
            onClick={() => select(category)}
            className={cn(
              tone,
              'focus-visible:ring-ring/50 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-semibold transition focus-visible:ring-[3px] focus-visible:outline-none',
              isActive
                ? cn(TONE_FILL, TONE_ON_FILL, 'border-[var(--tone)]')
                : 'border-border bg-card text-foreground hover:border-[var(--tone)]'
            )}
          >
            <span
              className={cn(
                'size-[7px] shrink-0 rounded-full',
                isActive ? 'bg-current' : TONE_FILL
              )}
              aria-hidden='true'
            />
            {category}
          </button>
        );
      })}
    </div>
  );
}

export function HomeCourseGrid({
  courses,
  gridSize,
}: {
  courses: HomeCourseCardModel[];
  gridSize: number;
}) {
  const { active } = useCatalogueFilter();

  const visible = useMemo(() => {
    const matching =
      active === ALL_CATEGORIES
        ? courses
        : courses.filter(course => course.categories.includes(active));

    return matching.slice(0, gridSize);
  }, [active, courses, gridSize]);

  return (
    <>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h2
            className={cn(
              DISPLAY,
              'text-foreground text-xl font-bold tracking-tight sm:text-[27px]'
            )}
          >
            {active === ALL_CATEGORIES ? 'In the catalogue right now' : `${active} courses`}
          </h2>
          <p className='text-muted-foreground mt-1.5 text-sm'>
            Open a course to see its lessons, the trainer who runs it and the fee, before you enrol.
          </p>
        </div>
        <Link
          href='/courses'
          className='border-border text-foreground hover:border-primary hover:text-primary inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition'
        >
          Browse all courses
          <ArrowRight className='size-4' aria-hidden='true' />
        </Link>
      </div>

      <div className='grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3'>
        {visible.map(course => (
          <HomeCourseCard key={course.uuid} course={course} />
        ))}
      </div>
    </>
  );
}
