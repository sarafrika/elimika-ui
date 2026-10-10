import { LazySection } from '@/components/data/lazy-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrgPage, orgStack } from '../_components/org-page';
import { OverviewActivityFeed } from './_components/overview-activity-feed';
import { OverviewAlerts } from './_components/overview-alerts';
import { OverviewCourseRail } from './_components/overview-course-rail';
import { OverviewEnrolmentTrends } from './_components/overview-enrolment-trends';
import { OverviewFundUtilisation } from './_components/overview-fund-utilisation';
import { OverviewGettingStarted } from './_components/overview-getting-started';
import { OverviewKpis } from './_components/overview-kpis';
import { OverviewWeeklyGrowth } from './_components/overview-weekly-growth';
import { OverviewWelcome } from './_components/overview-welcome';

// Below-the-fold rows mount (and fetch) only when scrolled near.
const LOWER_ROW_MARGIN = '0px 0px 120px 0px';

export default function OrganizationOverviewPage() {
  return (
    <OrgPage width='standard'>
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

        <LazySection rootMargin={LOWER_ROW_MARGIN} minHeight={280}>
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
        </LazySection>

        <LazySection rootMargin={LOWER_ROW_MARGIN} minHeight={280}>
          <div className='grid gap-4 lg:grid-cols-2'>
            <OverviewAlerts />
            <OverviewActivityFeed />
          </div>
        </LazySection>
      </div>
    </OrgPage>
  );
}
