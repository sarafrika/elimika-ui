'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

import type { CoursesFilterSection } from '@/src/features/dashboard/courses/shared/_components/courses-data';

type CoursesCategoryTabsProps = {
  sections: CoursesFilterSection[];
  selectedValues: Record<CoursesFilterSection['key'], string>;
  activeFilter: CoursesFilterSection['key'] | null;
  onActiveChange: (key: CoursesFilterSection['key']) => void;
  onSelect: (key: CoursesFilterSection['key'], value: string) => void;
  className?: string;
};

export function CoursesCategoryTabs({
  sections,
  selectedValues,
  activeFilter,
  onActiveChange,
  onSelect,
  className,
}: CoursesCategoryTabsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {sections.map(section => {
        const selectedValue = selectedValues[section.key];

        const selectedOption = section.options.find(option => option.value === selectedValue);

        const isActive = activeFilter === section.key;

        return (
          <DropdownMenu
            key={section.key}
            onOpenChange={open => {
              if (open) {
                onActiveChange(section.key);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className={cn(
                  'flex items-center rounded-full border transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border text-foreground hover:bg-muted bg-background'
                )}
              >
                <span className='px-4 py-1.5 text-sm font-medium whitespace-nowrap'>
                  {selectedOption?.label ?? 'All'}
                </span>

                <span
                  className={cn(
                    'flex cursor-pointer items-center rounded-r-full border-l px-2',
                    isActive ? 'border-primary-foreground/20' : 'border-border hover:bg-muted'
                  )}
                >
                  <ChevronDown className='h-4 w-4' />
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='start' className='w-56'>
              <DropdownMenuLabel>{section.title}</DropdownMenuLabel>

              <DropdownMenuSeparator />

              {section.options.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => {
                    onActiveChange(section.key);
                    onSelect(section.key, option.value);
                  }}
                >
                  <span className='flex-1'>{option.label}</span>

                  {selectedValue === option.value && <Check className='h-4 w-4' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
