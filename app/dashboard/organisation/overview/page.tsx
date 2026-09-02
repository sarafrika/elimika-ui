import { ActivityFeed } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgPage, orgStack } from '../_components/org-page';
import { OverviewFundUtilisation } from './_components/overview-fund-utilisation';
import { OverviewAlerts } from './_components/overview-alerts';
import { OverviewCourseRail } from './_components/overview-course-rail';
import { OverviewEnrolmentTrends } from './_components/overview-enrolment-trends';
import { OverviewWeeklyGrowth } from './_components/overview-weekly-growth';
import { OverviewGettingStarted } from './_components/overview-getting-started';
import { OverviewKpis } from './_components/overview-kpis';
import { OverviewWelcome } from './_components/overview-welcome';

export default function OrganizationOverviewPage() {
  return (
    <OrgPage>
      <div className={orgStack}>
        <OverviewWelcome />

        <OverviewKpis />

        <OverviewCourseRail />

        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Fund Utilisation</CardTitle>
            </CardHeader>
            <CardContent>
              <OverviewFundUtilisation />
            </CardContent>
          </Card>

          <div className='lg:col-span-1'>
            <OverviewGettingStarted />
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-1'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Enrolment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <OverviewEnrolmentTrends />
            </CardContent>
          </Card>

          <Card className='lg:col-span-2'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Weekly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <OverviewWeeklyGrowth />
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 lg:grid-cols-2'>
          <OverviewAlerts />
          <ActivityFeed items={[]} />
        </div>
      </div>
    </OrgPage>
  );
}
