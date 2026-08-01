'use client';

import CustomLoader from '@/components/custom-loader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { DashboardProviders } from '@/context/profile-providers';
import type { UserDomain } from '@/lib/types';
import { AppSidebar } from '@/src/features/dashboard/components/app-sidebar';
import DashboardMainContent from '@/src/features/dashboard/components/dashboard-main-content';
import { DomainSelection } from '@/src/features/dashboard/components/domain-selection';
import {
  domainToDashboardViewMap,
  type KnownDomain,
} from '@/src/features/dashboard/config/workspaces';
import {
  type DashboardView,
  DashboardViewProvider,
} from '@/src/features/dashboard/context/dashboard-view-context';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { domainFromPath } from '@/src/features/dashboard/lib/dashboard-url';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

export function DashboardClientLayout({
  children,
  initialDomain = null,
}: {
  children: ReactNode;
  /** Cookie-derived domain resolved on the server, used for the first paint. */
  initialDomain?: UserDomain | null;
}) {
  const pathname = usePathname();

  // The URL segment is the source of truth once the router is driving, but it is
  // null on the non-role-scoped paths (/dashboard, /dashboard/add-profile); the
  // server-resolved cookie value covers those and the initial render. Kept outside
  // the loading gate below so the attribute — and therefore the brand ramp — is in
  // the server-rendered HTML rather than appearing after the profile query settles.
  const themeDomain = domainFromPath(pathname) ?? initialDomain;

  return (
    // `contents` so this wrapper adds no box; app/globals.css matches it with
    // `:root:has([data-dashboard-domain=...])`, which hoists the ramp override onto
    // <html> so portalled UI (dropdowns, sheets, toasts) is themed too.
    <div className='contents' data-dashboard-domain={themeDomain ?? undefined}>
      <DashboardProviders>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </DashboardProviders>
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const domain = useUserDomain();
  const pathname = usePathname();

  const userDomains = useMemo(() => domain.domains as KnownDomain[], [domain.domains]);
  const activeDomain = (domain.activeDomain ?? null) as KnownDomain | null;
  const selectableDomains = useMemo(
    () => Array.from(new Set(userDomains.map(current => current))) as UserDomain[],
    [userDomains]
  );

  // The role now comes from the URL segment (/dashboard/<segment>/...); the
  // cookie-derived active domain is only a fallback for non-segment paths
  // (/dashboard root, /dashboard/add-profile, ...).
  const urlDomain = useMemo(() => domainFromPath(pathname) as KnownDomain | null, [pathname]);
  const effectiveDomain = urlDomain ?? activeDomain;

  const normalizedAvailableViews = useMemo(() => {
    const views = userDomains
      .map(currentDomain => domainToDashboardViewMap[currentDomain])
      .filter((view): view is DashboardView => Boolean(view));

    return Array.from(new Set(views));
  }, [userDomains]);

  const normalizedActiveView =
    (effectiveDomain ? domainToDashboardViewMap[effectiveDomain] : undefined) ??
    normalizedAvailableViews[0] ??
    'student';

  const sidebarDomain =
    effectiveDomain === 'organization'
      ? ('organisation' as UserDomain)
      : (effectiveDomain as UserDomain);
  const showLoader = profile?.isLoading || domain.isLoading || !profile;

  if (showLoader) {
    return <CustomLoader />;
  }

  if (!effectiveDomain) {
    return (
      <DomainSelection
        domains={selectableDomains}
        onDomainSelect={nextDomain => domain.setActiveDomain(nextDomain)}
        userName={profile.first_name}
      />
    );
  }

  return (
    <SidebarProvider>
      <DashboardViewProvider
        initialView={normalizedActiveView as DashboardView}
        availableViews={normalizedAvailableViews.length ? normalizedAvailableViews : undefined}
      >
        <BreadcrumbProvider>
          <div className='flex h-screen w-full'>
            <AppSidebar activeDomain={sidebarDomain} />

            <div className='flex min-w-0 flex-1 flex-col'>
              <DashboardMainContent>{children}</DashboardMainContent>
            </div>
          </div>
        </BreadcrumbProvider>
      </DashboardViewProvider>
    </SidebarProvider>
  );
}
