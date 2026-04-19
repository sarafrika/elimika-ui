'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CoursesFilterSection } from './courses-data';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type CoursesCategoryFiltersProps = {
  sections: CoursesFilterSection[];
  selectedValues: Record<CoursesFilterSection['key'], string>;
  onSelect: (key: CoursesFilterSection['key'], value: string) => void;
  onClear: () => void;
  className?: string;
};

export function CoursesCategoryFilters({
  sections,
  selectedValues,
  onSelect,
  onClear,
  className,
}: CoursesCategoryFiltersProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const visibleState = useMemo(
    () =>
      sections.reduce<Record<string, boolean>>((accumulator, section) => {
        accumulator[section.key] = collapsedSections[section.key] ?? false;
        return accumulator;
      }, {}),
    [collapsedSections, sections]
  );

  const toggleSection = (key: CoursesFilterSection['key']) => {
    setCollapsedSections(current => ({
      ...current,
      [key]: !(current[key] ?? false),
    }));
  };

  return (
    <aside className={cn('border-border bg-card rounded-2xl border', className)}>
      {sections.map(section => {
        const isCollapsed = visibleState[section.key];

        return (
          <section
            key={section.key}
            className='border-border border-b px-4 py-3.5 last:border-b-0'
          >
            <button
              type='button'
              onClick={() => toggleSection(section.key)}
              className='flex w-full items-center justify-between gap-3 text-left'
              aria-expanded={!isCollapsed}
            >
              <h3 className='text-foreground text-sm font-semibold'>{section.title}</h3>
              <ChevronDown
                className={cn(
                  'text-muted-foreground size-4 transition-transform duration-200',
                  !isCollapsed && 'rotate-180'
                )}
              />
            </button>

            {!isCollapsed ? (
              <div className='mt-3 space-y-2'>
                {section.options.map(option => {
                  const isActive = selectedValues[section.key] === option.value;

                  return (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() => onSelect(section.key, option.value)}
                      className={cn(
                        'hover:bg-secondary flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                        isActive && 'bg-primary/8'
                      )}
                    >
                      <span
                        className={cn(
                          'border-border inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                          isActive && 'border-primary bg-primary text-primary-foreground'
                        )}
                      >
                        {isActive && <Check className='size-3' />}
                      </span>
                      <span
                        className={cn(
                          'text-muted-foreground text-sm',
                          isActive && 'text-foreground font-medium'
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}

      <div className='px-4 py-3.5'>
        <Button
          type='button'
          variant='ghost'
          onClick={onClear}
          className='text-primary hover:text-primary h-auto rounded-lg px-0 py-0 text-sm font-semibold shadow-none'
        >
          Clear All
        </Button>
      </div>
    </aside>
  );
}
