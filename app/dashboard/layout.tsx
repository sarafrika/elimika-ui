'use client';
import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { redirect, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import CustomLoader from '../../components/custom-loader';
import { DomainSelection } from '../../components/domain-selection';
import TrainingCenterProvider from '../../context/training-center-provide';

type OrgDomainType = DashboardView | 'organisation_user';
export default function DashboardLayout(dashboardProps: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const router = useRouter();

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

  // Show loading if profile exists but domains are not loaded yet
  // This handles the rehydration period when TanStack Query is loading persisted data
  if (
    profile?.isLoading ||
    !profile ||
    (!profile.isLoading && (!profile.user_domain || profile.user_domain.length === 0))
  ) {
    return <CustomLoader />;
  }

  const userDomains = (profile.user_domain as DashboardView[]) || [];
  const organizationDomains = userDomains as OrgDomainType[];
  const activeDomain = profile.activeDomain;

  if (
    activeDomain === 'organisation_user' &&
    (!profile.organisation_affiliations || profile.organisation_affiliations.length === 0)
  ) {
    redirect('/onboarding/organisation');
  }

  if (!activeDomain) {
    return (
      <DomainSelection
        domains={userDomains as UserDomain[]}
        onDomainSelect={domain => profile.setActiveDomain(domain)}
        userName={profile.first_name}
      />
    );
  }

  // Filter only dashboards that are accessible to the logged in user
  const dashboards = Object.keys(dashboardProps).reduce(
    (a: { [key: string]: ReactNode }, b: OrgDomainType) =>
      organizationDomains.includes(b) ? { ...a, [b]: dashboardProps[b] } : a,
    {}
  );

  // Include organisation_user dashboard since the @organization_user page is not available
  if (userDomains.includes('organisation_user')) {
    dashboards['organisation_user'] = dashboardProps['organization'];
  }

  const defaultSlot = dashboardProps.children;
  const domainSlot =
    activeDomain && dashboards[activeDomain] !== undefined ? dashboards[activeDomain] : undefined;
  const currentDashboard =
    domainSlot !== undefined
      ? domainSlot
      : defaultSlot !== undefined
        ? defaultSlot
        : null;
  return (
    <TrainingCenterProvider>
      <SidebarProvider>
        <DashboardViewProvider
          initialView={activeDomain as DashboardView}
          availableViews={userDomains}
        >
          <BreadcrumbProvider>
            <div className='flex min-h-screen w-full'>
              {/* Sidebar */}
              <AppSidebar activeDomain={activeDomain as UserDomain} />
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
