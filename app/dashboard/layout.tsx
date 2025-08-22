'use client';

import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { useUserProfile } from '@/context/profile-context';
import { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import OrganisactionProvider from '../../context/organization-context';

type OrgDomainType = DashboardView | 'organisation_user';

export default function DashboardLayout(props: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile?.isLoading && profile) {
      // Only redirect to onboarding if profile is loaded but has no domains
      // This prevents redirect during initial load when data is persisted
      if (profile.user_domain && profile.user_domain.length === 0) {
        router.push('/onboarding');
        return;
      }
    }
  }, [profile, router]);

  // Show loading state while profile is loading
  if (profile?.isLoading) {
    return (
      <div className='flex h-screen w-screen items-center justify-center'>
        <div className='flex animate-pulse flex-col items-center'>
          <div className='mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700'></div>
          <div className='h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>
      </div>
    );
  }

  // Show loading if profile exists but domains are not loaded yet
  // This handles the rehydration period when TanStack Query is loading persisted data
  if (!profile || (!profile.isLoading && (!profile.user_domain || profile.user_domain.length === 0))) {
    return null;
  }

  // If profile is still loading or domains are undefined, wait for rehydration
  if (!profile.user_domain || !profile.activeDomain) {
    return (
      <div className='flex h-screen w-screen items-center justify-center'>
        <div className='flex animate-pulse flex-col items-center'>
          <div className='mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700'></div>
          <div className='h-4 w-24 rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>
      </div>
    );
  }

  const userDomains = profile.user_domain as DashboardView[] || [];
  const organizationDomains = userDomains as OrgDomainType[];
  const activeDomain = profile.activeDomain;

  // Filter only dashboards that are accessible to the logged in user
  const dashboards = Object.keys(props).reduce(
    (a: { [key: string]: ReactNode }, b: OrgDomainType) =>
      organizationDomains.includes(b) ? { ...a, [b]: props[b] } : a,
    {}
  );

  // Include organisation_user dashboard since the @organization_user page is not available
  if (userDomains.includes("organisation_user")) {
    dashboards["organisation_user"] = props["organization"]
  }

  const currentDashboard = activeDomain ? dashboards[activeDomain] : props.children;
  return (
    <OrganisactionProvider>
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
    </OrganisactionProvider>
  );
}
