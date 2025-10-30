'use client';
import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';
import CustomLoader from '../../components/custom-loader';
import { DomainSelection } from '../../components/domain-selection';
import TrainingCenterProvider from '../../context/training-center-provide';

type KnownDomain = UserDomain | 'organization';

const domainToSlotKeyMap: Record<KnownDomain, keyof DashboardChildrenTypes> = {
  student: 'student',
  admin: 'admin',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};

const domainToDashboardViewMap: Record<KnownDomain, DashboardView> = {
  student: 'student',
  admin: 'admin',
  instructor: 'instructor',
  course_creator: 'course_creator',
  organisation: 'organization',
  organisation_user: 'organization',
  organization: 'organization',
};

export default function DashboardLayout(dashboardProps: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only process redirects when profile is fully loaded
    if (!profile?.isLoading && profile && profile.user_domain !== undefined) {
      // Redirect to onboarding if no domains
      if (!profile.user_domain || profile.user_domain.length === 0) {
        router.push('/onboarding');
        return;
      }
    }
  }, [profile, router]);

  useEffect(() => {
    if (
      !profile?.isLoading &&
      profile?.activeDomain === 'organisation_user' &&
      (!profile.organisation_affiliations || profile.organisation_affiliations.length === 0)
    ) {
      router.push('/onboarding/organisation');
    }
  }, [profile, router]);

  const userDomains = useMemo(
    () => (profile?.user_domain ?? []) as KnownDomain[],
    [profile?.user_domain]
  );
  const activeDomain = (profile?.activeDomain ?? null) as KnownDomain | null;
  const selectableDomains = useMemo(
    () =>
      Array.from(
        new Set(userDomains.map(domain => (domain === 'organization' ? 'organisation' : domain)))
      ) as UserDomain[],
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
      // eslint-disable-next-line no-console
      console.debug('DashboardLayout render state', {
        activeDomain,
        selectableDomains,
        normalizedAvailableViews,
        hasDomainSlot: Boolean(domainSlot),
        hasDefaultSlot: Boolean(defaultSlot),
        userDomains,
        pathname,
        shouldUseDefaultSlot,
      });
    }
  }, [
    activeDomain,
    selectableDomains,
    normalizedAvailableViews,
    domainSlot,
    defaultSlot,
    userDomains,
    pathname,
    shouldUseDefaultSlot,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !domainSlot && !shouldUseDefaultSlot) {
      // eslint-disable-next-line no-console
      console.warn('DashboardLayout missing domain slot; falling back to default slot', {
        activeDomain,
        availableSlotKeys: Object.keys(dashboardProps),
      });
    }
  }, [activeDomain, domainSlot, dashboardProps, shouldUseDefaultSlot]);

  const currentDashboard = shouldUseDefaultSlot ? defaultSlot : (domainSlot ?? defaultSlot);
  const sidebarDomain =
    activeDomain === 'organization' ? ('organisation' as UserDomain) : (activeDomain as UserDomain);
  // Show loading if profile exists but domains are not loaded yet
  // This handles the rehydration period when TanStack Query is loading persisted data
  const showLoader =
    profile?.isLoading ||
    !profile ||
    (!profile?.isLoading && (!profile?.user_domain || profile.user_domain.length === 0));

  if (showLoader) {
    return <CustomLoader />;
  }

  if (!activeDomain) {
    return (
      <DomainSelection
        domains={selectableDomains}
        onDomainSelect={domain => profile.setActiveDomain(domain)}
        userName={profile.first_name}
      />
    );
  }

  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <DashboardViewProvider
          initialView={normalizedActiveView as DashboardView}
          availableViews={normalizedAvailableViews.length ? normalizedAvailableViews : undefined}
        >
          <BreadcrumbProvider>
            <div className='flex min-h-screen w-full'>
              {/* Sidebar */}
              <AppSidebar activeDomain={sidebarDomain} />
              {/* Main content area */}
              <div className='flex w-full flex-1 flex-col'>
                <DashboardMainContent>{currentDashboard}</DashboardMainContent>
              </div>
            </div>
          </BreadcrumbProvider>
        </DashboardViewProvider>
      </SidebarProvider>
    </TrainingCenterProvider>
  );
}
