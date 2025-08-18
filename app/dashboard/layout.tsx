import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import DashboardTopBar from '@/components/dashboard-top-bar';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { TrainingCenterProvider } from '@/context/training-center-provider';
import { DashboardChildrenTypes, UserDomain } from '@/lib/types';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { auth } from '@/services/auth';
import { search } from '@/services/client';

type OrgDomainType = DashboardView | 'organisation_user';

export default async function DashboardLayout(props: DashboardChildrenTypes) {
  try {
    const session = await auth();

    if (!session) {
      return redirect('/');
    }

    const { data, error } = await search({
      query: {
        searchParams: {
          email_eq: session.user.email,
        },
        pageable: {
          page: 0,
          size: 20,
        },
      },
    });

    if (error || !data.data || !data.data.content || data.data.content.length === 0) {
      return redirect('/');
    }

    const user = data.data.content[0];

    const userDomains = user?.user_domain as DashboardView[] || [];

    const orgAdminDomains = userDomains as OrgDomainType[];
    const activeDomain = orgAdminDomains[0];
    const userDashboards = Object.keys(props).reduce(
      (a: { [key: string]: ReactNode }, b: string) =>
        orgAdminDomains.includes(b as OrgDomainType) ? { ...a, [b]: props[b] } : a,
      {}
    );
    const currentDashboard = activeDomain ? userDashboards[activeDomain] : props.children;

    if (orgAdminDomains.includes('organisation_user')) {
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
  } catch (e) {
    // Revisit this error
    redirect('/onboarding');
  }
}
