'use client';
import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import { type DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { useUserDomain } from '@/context/user-domain-context';
import type { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo } from 'react';
import CustomLoader from '../../components/custom-loader';
import { DomainSelection } from '../../components/domain-selection';

type KnownDomain = UserDomain | 'organization';

const domainToSlotKeyMap: Record<KnownDomain, keyof DashboardChildrenTypes> = {
  student: 'student',
  admin: 'admin',
  parent: 'parent',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};

const domainToDashboardViewMap: Record<KnownDomain, DashboardView> = {
  student: 'student',
  admin: 'admin',
  parent: 'parent',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};

export default function DashboardLayout(dashboardProps: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const domain = useUserDomain();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only process redirects when profile is fully loaded and domain is ready
    // Important: Check !domain.isLoading to prevent redirect during rehydration
    if (!profile?.isLoading && domain.isReady && !domain.isLoading) {
      // Redirect to onboarding if no domains
      if (domain.domains.length === 0) {
        router.push('/onboarding');
        return;
      }
    }
  }, [profile?.isLoading, domain.isReady, domain.isLoading, domain.domains, router]);

  useEffect(() => {
    // Only redirect to organization onboarding when fully loaded
    if (
      !profile?.isLoading &&
      !domain.isLoading &&
      domain.activeDomain === 'organisation_user' &&
      (!profile.organisation_affiliations || profile.organisation_affiliations.length === 0)
    ) {
      router.push('/onboarding/organisation');
    }
  }, [profile?.isLoading, domain.isLoading, profile?.organisation_affiliations, domain.activeDomain, router]);

  const userDomains = useMemo(() => domain.domains as KnownDomain[], [domain.domains]);
  const activeDomain = (domain.activeDomain ?? null) as KnownDomain | null;
  const selectableDomains = useMemo(
    () => Array.from(new Set(userDomains.map(current => current))) as UserDomain[],
    [userDomains]
  );

  const defaultSlot = dashboardProps.children ?? null;
  const shouldUseDefaultSlot = useMemo(() => {
    if (!defaultSlot) {
      return false;
    }

    if (!pathname) {
      return false;
    }

    if (pathname.startsWith('/dashboard/add-profile')) {
      return true;
    }

    return false;
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
      .map(domain => domainToDashboardViewMap[domain])
      .filter((view): view is DashboardView => Boolean(view));
    return Array.from(new Set(views));
  }, [userDomains]);

  const normalizedActiveView =
    (activeDomain ? domainToDashboardViewMap[activeDomain] : undefined) ??
    normalizedAvailableViews[0] ??
    'student';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
    }
  }, [
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !domainSlot && !shouldUseDefaultSlot) {
    }
  }, [domainSlot, shouldUseDefaultSlot]);

  const currentDashboard = shouldUseDefaultSlot ? defaultSlot : (domainSlot ?? defaultSlot);
  const sidebarDomain =
    activeDomain === 'organization' ? ('organisation' as UserDomain) : (activeDomain as UserDomain);
  // Show loading if profile exists but domains are not loaded yet
  // This handles the rehydration period when TanStack Query is loading persisted data
  const showLoader =
    profile?.isLoading || domain.isLoading || !profile;

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
              {/* Sidebar */}
              <AppSidebar activeDomain={sidebarDomain} />
              {/* Main content area */}
              <div className='flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden'>
                <DashboardMainContent>{currentDashboard}</DashboardMainContent>
              </div>
            </div>
          </BreadcrumbProvider>
        </DashboardViewProvider>
      </SidebarProvider>
  );
}
