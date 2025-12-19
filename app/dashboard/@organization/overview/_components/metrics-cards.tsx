'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganisation } from '@/context/organisation-context';
import { elimikaDesignSystem } from '@/lib/design-system';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getUsersByOrganisationOptions,
  getTrainingBranchesByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { Users, GitBranch, GraduationCap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function OrganizationMetricsCards() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const usersQuery = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const usersPage = extractPage(usersQuery.data);
  const branchesPage = extractPage(branchesQuery.data);
  const totalUsers = getTotalFromMetadata(usersPage.metadata);
  const totalBranches = getTotalFromMetadata(branchesPage.metadata);

  const isLoading = usersQuery.isLoading || branchesQuery.isLoading;

  const metrics = [
    {
      label: 'Total Members',
      value: totalUsers,
      icon: Users,
      description: 'Active organization members',
      href: '/dashboard/people',
      color: 'blue' as const,
    },
    {
      label: 'Training Branches',
      value: totalBranches,
      icon: GitBranch,
      description: 'Locations and facilities',
      href: '/dashboard/branches',
      color: 'green' as const,
    },
    {
      label: 'Active Students',
      value: '--',
      icon: GraduationCap,
      description: 'Currently enrolled learners',
      href: '/dashboard/students',
      color: 'purple' as const,
    },
    {
      label: 'Growth Rate',
      value: '--',
      icon: TrendingUp,
      description: 'Month over month',
      href: '/dashboard/audit',
      color: 'orange' as const,
    },
  ];

  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
      {metrics.map(metric => {
        const Icon = metric.icon;
        const colorStyles = getColorStyles(metric.color);

        return (
          <Link
            key={metric.label}
            href={metric.href}
            className={`${elimikaDesignSystem.components.statCard.base} group transition-all hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <p className={elimikaDesignSystem.components.statCard.label}>{metric.label}</p>
                {isLoading && metric.value !== '--' ? (
                  <Skeleton className='mt-2 h-10 w-24' />
                ) : (
                  <p
                    className={`${elimikaDesignSystem.components.statCard.value} ${colorStyles.text}`}
                  >
                    {metric.value}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>{metric.description}</p>
              </div>
              <div className={`${colorStyles.bg} rounded-xl p-3`}>
                <Icon className={`h-6 w-6 ${colorStyles.icon}`} />
              </div>
            </div>

            <div className='text-primary mt-4 flex items-center gap-2 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100'>
              View Details
              <svg
                className='h-4 w-4 transition-transform group-hover:translate-x-1'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getColorStyles(color: 'blue' | 'green' | 'purple' | 'orange') {
  const styles = {
    blue: {
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    green: {
      text: 'text-green-700 dark:text-green-300',
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    purple: {
      text: 'text-purple-700 dark:text-purple-300',
      icon: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    orange: {
      text: 'text-orange-700 dark:text-orange-300',
      icon: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  };

  return styles[color];
}
