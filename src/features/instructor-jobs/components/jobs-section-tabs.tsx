'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { type JobsSectionCounts, useJobsSectionCounts } from '../hooks/use-jobs-section-counts';
import {
  findWorkHref,
  hiredJobsHref,
  type JobsSection,
  jobsSectionFromPath,
  myApplicationsHref,
} from '../job-routes';

const SECTIONS: readonly {
  id: JobsSection;
  label: string;
  href: () => string;
  count: keyof JobsSectionCounts;
}[] = [
  { id: 'find-work', label: 'Find work', href: findWorkHref, count: 'openJobs' },
  {
    id: 'applications',
    label: 'My applications',
    href: myApplicationsHref,
    count: 'liveApplications',
  },
  { id: 'hired', label: 'Hired', href: hiredJobsHref, count: 'hiredJobs' },
];

/** Underline tabs across the instructor Jobs area; place directly under the page header. */
export function JobsSectionTabs({ className }: { className?: string }) {
  const active = jobsSectionFromPath(usePathname());
  const counts = useJobsSectionCounts();

  return (
    <nav
      aria-label='Jobs sections'
      className={cn('border-border flex gap-1 overflow-x-auto border-b', className)}
    >
      {SECTIONS.map(section => {
        const isActive = section.id === active;
        const count = counts[section.count];
        return (
          <Link
            key={section.id}
            href={section.href()}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3.5 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-primary text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
            )}
          >
            {section.label}
            {count === undefined ? null : (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs leading-5 font-semibold tabular-nums',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
