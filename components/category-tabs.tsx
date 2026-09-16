import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { buildCategoryTabOptions } from '@/lib/category-filters';
import type { Category } from '@/services/client';

export const ALL_CATEGORIES = 'All';

export type CategoryTabsProps = {
  /** Full source data used to derive the list of categories/subjects/program types. */
  items?: ReadonlyArray<{
    category: string;
    subject?: string | null;
    programType?: string | null;
  }>;
  /** When provided, root categories become tabs and descendants become subjects. */
  categories?: readonly Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  /** Selected subject per category (only one active at a time in practice). */
  subjectByCategory: Record<string, string>;
  onSubjectChange: (next: Record<string, string>) => void;
  /** Optional label to display in the subject dropdown header, e.g. "Filter by subject". */
  subjectLabel?: string;
  /** Program type options shown in the "All" dropdown. */
  allProgramTypes?: string[];
  activeProgramType?: string | null;
  onProgramTypeChange?: (type: string | null) => void;
  /** Optional label to display in the program type dropdown header. */
  programTypeLabel?: string;
  className?: string;
};

const EMPTY_ITEMS: NonNullable<CategoryTabsProps['items']> = [];

/**
 * Sticky, scrollable, arrow-navigable category tabs with a subject
 * dropdown per category and a program type dropdown on the "All" pill.
 * Shared by Students, Instructors, Classes, Venues, Courses and
 * Apply-to-Train pages.
 */
export function CategoryTabs({
  items = EMPTY_ITEMS,
  categories: hierarchy,
  activeCategory,
  onCategoryChange,
  subjectByCategory,
  onSubjectChange,
  subjectLabel = 'Filter by subject',
  allProgramTypes,
  activeProgramType,
  onProgramTypeChange,
  programTypeLabel = 'Filter by program type',
  className,
}: CategoryTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: false });

  const categories = useMemo(() => {
    const options = hierarchy
      ? buildCategoryTabOptions(hierarchy)
      : Array.from(new Set(items.map(item => item.category).filter(Boolean)))
          .sort()
          .map(category => ({
            value: category,
            label: category,
            subjects: Array.from(
              new Set(
                items
                  .filter(item => item.category === category)
                  .flatMap(item => (item.subject ? [item.subject] : []))
              )
            )
              .sort()
              .map(subject => ({ value: subject, label: subject })),
          }));
    return [{ value: ALL_CATEGORIES, label: ALL_CATEGORIES, subjects: [] }, ...options];
  }, [hierarchy, items]);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setScrollState({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length]);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -el.clientWidth * 0.7 : el.clientWidth * 0.7,
      behavior: 'smooth',
    });
  };

  const handleProgramTypeSelect = (type: string | null) => {
    onProgramTypeChange?.(type);
    if (type !== null) {
      onCategoryChange(ALL_CATEGORIES);
    }
  };

  const allHasDropdown = allProgramTypes && allProgramTypes.length > 0;

  return (
    <div
      className={cn(
        'border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-16 z-20 -mx-4 border-b px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6',
        className
      )}
    >
      <div className='relative'>
        <button
          type='button'
          aria-label='Scroll categories left'
          onClick={() => scrollTabs('left')}
          disabled={!scrollState.canLeft}
          className={cn(
            'border-border bg-background absolute top-1/2 left-0 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-opacity md:flex',
            !scrollState.canLeft && 'pointer-events-none opacity-0'
          )}
        >
          <ChevronLeft className='h-4 w-4' />
        </button>

        <div
          aria-hidden
          className={cn(
            'from-background pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r to-transparent transition-opacity',
            !scrollState.canLeft && 'opacity-0'
          )}
        />
        <div
          aria-hidden
          className={cn(
            'from-background pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l to-transparent transition-opacity',
            !scrollState.canRight && 'opacity-0'
          )}
        />

        <div
          ref={scrollerRef}
          className='scrollbar-hide overflow-x-auto scroll-smooth md:px-10'
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className='flex min-w-max items-center gap-2 py-1'>
            {categories.map(option => {
              const cat = option.value;
              const isActive = activeCategory === cat;
              const subjects = option.subjects;
              const selectedSubject = subjectByCategory[cat];
              const selectedSubjectLabel = subjects.find(
                subject => subject.value === selectedSubject
              )?.label;
              const hasDropdown = cat === ALL_CATEGORIES ? allHasDropdown : subjects.length > 0;
              return (
                <div
                  key={cat}
                  className={cn(
                    'flex shrink-0 items-stretch rounded-full border transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                  )}
                >
                  <button
                    type='button'
                    onClick={() => {
                      onCategoryChange(cat);
                      const next = { ...subjectByCategory };
                      delete next[cat];
                      onSubjectChange(next);
                      if (cat !== ALL_CATEGORIES) {
                        handleProgramTypeSelect(null);
                      }
                    }}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium whitespace-nowrap',
                      hasDropdown ? 'rounded-l-full' : 'rounded-full'
                    )}
                    aria-pressed={isActive}
                  >
                    {option.label}
                    {cat === ALL_CATEGORIES && activeProgramType && (
                      <span className='ml-1.5 text-xs opacity-90'>: {activeProgramType}</span>
                    )}
                    {cat !== ALL_CATEGORIES && isActive && selectedSubject && (
                      <span className='ml-1.5 text-xs opacity-90'>: {selectedSubjectLabel}</span>
                    )}
                  </button>
                  {hasDropdown && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type='button'
                          aria-label={
                            cat === ALL_CATEGORIES
                              ? 'Filter by program type'
                              : `Filter ${option.label} by subject`
                          }
                          className={cn(
                            'flex items-center rounded-r-full border-l px-2',
                            isActive
                              ? 'border-primary-foreground/30 hover:bg-primary/90'
                              : 'border-border hover:bg-muted'
                          )}
                        >
                          <ChevronDown className='h-4 w-4' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start' className='w-56'>
                        {cat === ALL_CATEGORIES ? (
                          <>
                            <DropdownMenuLabel>{programTypeLabel}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleProgramTypeSelect(null)}>
                              <span className='flex-1'>All programs</span>
                              {!activeProgramType && <Check className='h-4 w-4' />}
                            </DropdownMenuItem>
                            {allProgramTypes?.map(type => (
                              <DropdownMenuItem
                                key={type}
                                onSelect={() => handleProgramTypeSelect(type)}
                              >
                                <span className='flex-1'>{type}</span>
                                {activeProgramType === type && <Check className='h-4 w-4' />}
                              </DropdownMenuItem>
                            ))}
                          </>
                        ) : (
                          <>
                            <DropdownMenuLabel>{subjectLabel}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                onCategoryChange(cat);
                                const next = { ...subjectByCategory };
                                delete next[cat];
                                onSubjectChange(next);
                              }}
                            >
                              <span className='flex-1'>Any subject in {option.label}</span>
                              {!selectedSubject && activeCategory === cat && (
                                <Check className='h-4 w-4' />
                              )}
                            </DropdownMenuItem>
                            {subjects.map(subj => (
                              <DropdownMenuItem
                                key={subj.value}
                                onSelect={() => {
                                  onCategoryChange(cat);
                                  onSubjectChange({ ...subjectByCategory, [cat]: subj.value });
                                }}
                              >
                                <span className='flex-1'>{subj.label}</span>
                                {selectedSubject === subj.value && <Check className='h-4 w-4' />}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                onCategoryChange(ALL_CATEGORIES);
                                const next = { ...subjectByCategory };
                                delete next[cat];
                                onSubjectChange(next);
                              }}
                            >
                              <span className='flex-1'>All categories</span>
                              {activeCategory === ALL_CATEGORIES && <Check className='h-4 w-4' />}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type='button'
          aria-label='Scroll categories right'
          onClick={() => scrollTabs('right')}
          disabled={!scrollState.canRight}
          className={cn(
            'border-border bg-background absolute top-1/2 right-0 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-opacity md:flex',
            !scrollState.canRight && 'pointer-events-none opacity-0'
          )}
        >
          <ChevronRight className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}

/** Helper for pages: returns filtered items given the tab state. */
export function filterByCategoryTabs<
  T extends { category: string; subject?: string | null; programType?: string | null },
>(
  items: T[],
  activeCategory: string,
  subjectByCategory: Record<string, string>,
  activeProgramType?: string | null
): T[] {
  const subj = subjectByCategory[activeCategory];
  return items.filter(i => {
    if (activeCategory !== ALL_CATEGORIES && i.category !== activeCategory) return false;
    if (subj && i.subject !== subj) return false;
    if (activeProgramType && i.programType !== activeProgramType) return false;
    return true;
  });
}
