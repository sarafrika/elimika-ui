'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import menu, { type MenuItem } from '@/lib/menu';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import {
  buildWorkspaceAliasPath,
  normalizeRequestedDashboardPath,
} from '@/src/features/dashboard/lib/active-domain-storage';
import Link from 'next/link';
import { Fragment } from 'react';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';

interface AppBreadcrumbProps {
  className?: string;
  showHome?: boolean;
}

const findMenuPathByUrl = (
  menuItems: MenuItem[],
  url: string,
  path: MenuItem[] = []
): MenuItem[] | null => {
  for (const item of menuItems) {
    const currentPath = [...path, item];
    if (item.url === url) return currentPath;

    if (item.items && item.items.length > 0) {
      const foundPath = findMenuPathByUrl(item.items, url, currentPath);
      if (foundPath) return foundPath;
    }
  }

  return null;
};

const findMenuPathByUrlInSources = (
  sources: Record<string, MenuItem[]>,
  url: string
): MenuItem[] | null => {
  for (const key in sources) {
    const result = findMenuPathByUrl(sources[key] || [], url);
    if (result) return result;
  }

  return null;
};

const convertMenuToBreadcrumbs = (menuItems: MenuItem[]) =>
  menuItems.map((item, index) => ({
    id: `${item.title}-${index}`,
    title: item.title,
    url: item.url || null,
    isLast: index === menuItems.length - 1,
  }));

export function AppBreadcrumb({ className, showHome = true }: AppBreadcrumbProps) {
  const { breadcrumbs } = useBreadcrumb();
  const { activeDomain, domains } = useUserDomain();
  const pathname = usePathname();
  const resolvedDomain = activeDomain ?? domains[0] ?? null;
  const normalizedPathname = normalizeRequestedDashboardPath(pathname);
  const routeBreadcrumbs = useMemo(() => {
    const menuPath = findMenuPathByUrlInSources(menu, normalizedPathname);
    return menuPath ? convertMenuToBreadcrumbs(menuPath) : [];
  }, [normalizedPathname]);

  const displayBreadcrumbs = useMemo(() => {
    const currentPathMatches = breadcrumbs.some(
      crumb => crumb.url && normalizeRequestedDashboardPath(crumb.url) === normalizedPathname
    );

    return currentPathMatches || breadcrumbs.length === 0 ? breadcrumbs : routeBreadcrumbs;
  }, [breadcrumbs, normalizedPathname, routeBreadcrumbs]);

  if (displayBreadcrumbs.length === 0 && !showHome) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem className='hidden md:block'>
              <BreadcrumbLink href={buildWorkspaceAliasPath(resolvedDomain, '/dashboard/overview')}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            {displayBreadcrumbs.length > 0 && <BreadcrumbSeparator className='hidden md:block' />}
          </>
        )}

        {displayBreadcrumbs.map(crumb => (
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

        {displayBreadcrumbs.length > 0 && (
          <BreadcrumbItem className='md:hidden'>
            <BreadcrumbPage>{displayBreadcrumbs?.[displayBreadcrumbs.length - 1]?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
