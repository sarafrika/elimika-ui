'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo } from 'react';
import CustomLoader from '@/components/custom-loader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { DashboardProviders } from '@/context/profile-providers';
import type { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { AppSidebar } from '@/src/features/dashboard/components/app-sidebar';
import DashboardMainContent from '@/src/features/dashboard/components/dashboard-main-content';
import { DomainSelection } from '@/src/features/dashboard/components/domain-selection';
import {
  domainToDashboardViewMap,
  domainToSlotKeyMap,
  type KnownDomain,
} from '@/src/features/dashboard/config/workspaces';
import {
  type DashboardView,
  DashboardViewProvider,
} from '@/src/features/dashboard/context/dashboard-view-context';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

export function DashboardClientLayout(dashboardProps: DashboardChildrenTypes) {
  return (
    <DashboardProviders>
      <DashboardLayoutContent {...dashboardProps} />
    </DashboardProviders>
  );
}

function DashboardLayoutContent(dashboardProps: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const domain = useUserDomain();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!profile?.isLoading && domain.isReady && !domain.isLoading && profile) {
      if (domain.domains.length === 0 && profile.user_domain !== undefined) {
        router.push('/onboarding');
      }
    }
  }, [profile, profile?.isLoading, domain.isReady, domain.isLoading, domain.domains, router]);

  useEffect(() => {
    if (
      !profile?.isLoading &&
      !domain.isLoading &&
      domain.isReady &&
      profile &&
      domain.activeDomain === 'organisation_user' &&
      (!profile.organisation_affiliations || profile.organisation_affiliations.length === 0)
    ) {
      router.push('/onboarding/organisation');
    }
  }, [
    profile,
    profile?.isLoading,
    domain.isLoading,
    domain.isReady,
    profile?.organisation_affiliations,
    domain.activeDomain,
    router,
  ]);

  const userDomains = useMemo(() => domain.domains as KnownDomain[], [domain.domains]);
  const activeDomain = (domain.activeDomain ?? null) as KnownDomain | null;
  const selectableDomains = useMemo(
    () => Array.from(new Set(userDomains.map(current => current))) as UserDomain[],
    [userDomains]
  );

  const defaultSlot = dashboardProps.children ?? null;
  const shouldUseDefaultSlot = useMemo(() => {
    if (!defaultSlot || !pathname) {
      return false;
    }

    return pathname.startsWith('/dashboard/add-profile');
  }, [defaultSlot, pathname]);

  const domainSlot = useMemo<ReactNode | null>(() => {
    if (!activeDomain) {
      return null;
    }

    const slotKey = domainToSlotKeyMap[activeDomain];
    if (!slotKey) {
      return null;
    }

    const slot = dashboardProps[slotKey];
    return slot !== undefined ? (slot ?? null) : null;
  }, [activeDomain, dashboardProps]);

  const normalizedAvailableViews = useMemo(() => {
    const views = userDomains
      .map(currentDomain => domainToDashboardViewMap[currentDomain])
      .filter((view): view is DashboardView => Boolean(view));

    return Array.from(new Set(views));
  }, [userDomains]);

  const normalizedActiveView =
    (activeDomain ? domainToDashboardViewMap[activeDomain] : undefined) ??
    normalizedAvailableViews[0] ??
    'student';

  const currentDashboard = shouldUseDefaultSlot ? defaultSlot : (domainSlot ?? defaultSlot);
  const sidebarDomain =
    activeDomain === 'organization' ? ('organisation' as UserDomain) : (activeDomain as UserDomain);
  const showLoader = profile?.isLoading || domain.isLoading || !profile;

  if (showLoader) {
    return <CustomLoader />;
  }

  if (!activeDomain) {
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
          <div className='flex min-h-screen w-full overflow-hidden'>
            <AppSidebar activeDomain={sidebarDomain} />
            <div className='flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto'>
              <DashboardMainContent>{currentDashboard}</DashboardMainContent>
            </div>
          </div>
        </BreadcrumbProvider>
      </DashboardViewProvider>
    </SidebarProvider>
  );
}
