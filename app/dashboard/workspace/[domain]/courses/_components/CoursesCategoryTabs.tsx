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

import type { CoursesFilterSection } from './courses-data';

type CoursesCategoryTabsProps = {
    sections: CoursesFilterSection[];
    selectedValues: Record<CoursesFilterSection['key'], string>;
    activeFilter: CoursesFilterSection['key'] | null;
    onActiveChange: (key: CoursesFilterSection['key']) => void;
    onSelect: (key: CoursesFilterSection['key'], value: string) => void;
    onClear: () => void;
    className?: string;
};

export function CoursesCategoryTabs({
    sections,
    selectedValues,
    activeFilter,
    onActiveChange,
    onSelect,
    onClear,
    className,
}: CoursesCategoryTabsProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2',
                className
            )}
        >
            {sections.map(section => {
                const selectedValue = selectedValues[section.key];

                const selectedOption = section.options.find(
                    option => option.value === selectedValue
                );

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
                                type="button"
                                className={cn(
                                    'flex items-center rounded-full border transition-colors',
                                    isActive
                                        ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                                        : 'border-border bg-white text-foreground hover:bg-muted'
                                )}
                            >
                                <span className="whitespace-nowrap px-4 py-1.5 text-sm font-medium">
                                    {selectedOption?.label ?? 'All'}
                                </span>

                                <span
                                    className={cn(
                                        'flex cursor-pointer items-center rounded-r-full border-l px-2',
                                        isActive
                                            ? 'border-white/20'
                                            : 'border-border hover:bg-muted'
                                    )}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </span>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="start"
                            className="w-56"
                        >
                            <DropdownMenuLabel>
                                {section.title}
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onSelect={() => {
                                    onActiveChange(section.key);
                                    onSelect(section.key, '');
                                }}
                            >
                                {!selectedValue && (
                                    <Check className="h-4 w-4" />
                                )}
                            </DropdownMenuItem>

                            {section.options.map(option => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onSelect={() => {
                                        onActiveChange(section.key);
                                        onSelect(
                                            section.key,
                                            option.value
                                        );
                                    }}
                                >
                                    <span className="flex-1">
                                        {option.label}
                                    </span>

                                    {selectedValue === option.value && (
                                        <Check className="h-4 w-4" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            })}
        </div>
    );
}