import { Building, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminPageHeader, adminTheme, SectionCard } from '../_components/ui';
import { OrganizationProfile } from './_components/organization-profile';
import { OverviewAlerts } from './_components/overview-alerts';
import { OverviewKpis } from './_components/overview-kpis';
import { QuickActions } from './_components/quick-actions';
import { RecentActivity } from './_components/recent-activity';

export default function OrganizationOverviewPage() {
  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Organisation dashboard'
          description='Oversight of your people, courses and operations at a glance.'
          actions={
            <>
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/people'>
                  <Users className='mr-2 size-4' />
                  Manage people
                </Link>
              </Button>
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/branches'>
                  <Building className='mr-2 size-4' />
                  Branches
                </Link>
              </Button>
            </>
          }
        />

        <OverviewKpis />

        <div className='grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
          <div className='flex flex-col gap-4'>
            <OverviewAlerts />
            <OrganizationProfile />
          </div>
          <div className='flex flex-col gap-4'>
            <SectionCard title='Quick actions'>
              <QuickActions />
            </SectionCard>
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
