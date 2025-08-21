'use client';

import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import DashboardTopBar from '@/components/dashboard-top-bar';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { TrainingCenterProvider } from '@/context/training-center-provider';
import { useUserProfile } from '@/context/profile-context';
import { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

type OrgDomainType = DashboardView | 'organisation_user';

export default function DashboardLayout(props: DashboardChildrenTypes) {
  const profile = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!profile?.isLoading && profile) {
      // Redirect to onboarding if no domains
      if (!profile.user_domain || profile.user_domain.length === 0) {
        router.push('/onboarding');
        return;
      }
      
      // Redirect to domain selection if multiple domains and no active domain selected
      if (profile.hasMultipleDomains && !profile.activeDomain) {
        router.push('/domain-selection?redirectTo=/dashboard/overview');
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
  if (!profile.user_domain) {
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
  const orgAdminDomains = userDomains as OrgDomainType[];
  // Use the actively selected domain from profile context
  const activeDomain = profile.activeDomain || orgAdminDomains[0];
  const userDashboards = Object.keys(props).reduce(
    (a: { [key: string]: ReactNode }, b: string) =>
      orgAdminDomains.includes(b as OrgDomainType) ? { ...a, [b]: props[b] } : a,
    {}
  );
  const currentDashboard = activeDomain ? userDashboards[activeDomain] : props.children;

  if (activeDomain === 'organisation_user' || orgAdminDomains.includes('organisation_user')) {
    return (
      <TrainingCenterProvider>
        <SidebarProvider>
          <BreadcrumbProvider>
            <div className='flex min-h-screen w-full'>
              {/* Sidebar */}
              <AppSidebar activeDomain='organisation_user' />
              {/* Main content area */}
              <div className='flex w-full flex-1 flex-col'>
                <DashboardTopBar showToggle={false} />
                {props.organization}
              </div>
            </div>
          </BreadcrumbProvider>
        </SidebarProvider>
      </TrainingCenterProvider>
    );
  }

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
