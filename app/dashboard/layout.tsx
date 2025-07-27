import { AppSidebar } from '@/components/app-sidebar';
import DashboardMainContent from '@/components/dashboard-main-content';
import DashboardTopBar from '@/components/dashboard-top-bar';
import { DashboardView, DashboardViewProvider } from '@/components/dashboard-view-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/context/breadcrumb-provider';
import { TrainingCenterProvider } from '@/context/training-center-provider';
import { UserDomain } from '@/lib/types';
import { auth } from '@/services/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { getUserByEmail } from '../../services/user/actions';
import { DashboardChildrenTypes } from './_types';

type OrgDomainType = DashboardView | 'organisation_user';

export default async function DashboardLayout(props: DashboardChildrenTypes) {
  try {
    const session = await auth();

    if (!session) {
      return redirect('/');
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return redirect('/');
    }

    if (user.user_domain!.length === 0) {
      return redirect('/onboarding');
    }

    const userDomains = user?.user_domain as DashboardView[];
    const orgAdminDomains = userDomains as OrgDomainType[];
    const defaultDomain = orgAdminDomains[0];
    const userDashboards = Object.keys(props).reduce(
      (a: { [key: string]: ReactNode }, b: string) =>
        orgAdminDomains.includes(b as OrgDomainType) ? { ...a, [b]: props[b] } : a,
      {}
    );
    const currentDashboard = userDashboards[defaultDomain ?? 'student'] ?? props.children;

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
                  {props.organisation}
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
            initialView={defaultDomain as DashboardView}
            availableViews={userDomains}
          >
            <BreadcrumbProvider>
              <div className='flex min-h-screen w-full'>
                {/* Sidebar */}
                <AppSidebar activeDomain={defaultDomain as UserDomain} />
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
