import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import Link from 'next/link';
import { Fragment } from 'react';

interface AppBreadcrumbProps {
  className?: string;
  showHome?: boolean;
}

export function AppBreadcrumb({ className, showHome = true }: AppBreadcrumbProps) {
  const { breadcrumbs } = useBreadcrumb();
  const { activeDomain, domains } = useUserDomain();
  const resolvedDomain = activeDomain ?? domains[0] ?? null;

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbLink href={buildWorkspaceAliasPath(resolvedDomain, '/dashboard/overview')}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && <BreadcrumbSeparator className='hidden md:block' />}
          </>
        )}

        {breadcrumbs.map(crumb => (
          <Fragment key={crumb.id}>
            <BreadcrumbItem className='hidden md:block'>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : crumb.url ? (
                <BreadcrumbLink href={crumb.url} asChild>
                  <Link href={crumb.url}>{crumb.title}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator className='hidden md:block' />}
          </Fragment>
        ))}

        {breadcrumbs.length > 0 && (
          <BreadcrumbItem className='md:hidden'>
            <BreadcrumbPage>{breadcrumbs?.[breadcrumbs.length - 1]?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
