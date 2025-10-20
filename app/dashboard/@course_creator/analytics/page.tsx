'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCourseCreator } from '@/context/course-creator-context';
import { format } from 'date-fns';
import { CourseCreatorEmptyState, CourseCreatorLoadingState } from '../_components/loading-state';

export default function CourseCreatorAnalyticsPage() {
  const { data, isLoading, profile } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState headline='Loading course creator analytics…' />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  const { analytics, monetization, trainingRequirements, verification } = data;

  const totalCourses = analytics.totalCourses || 1; // avoid divide by zero
  const statusBreakdown = [
    { label: 'Published', count: analytics.publishedCourses },
    { label: 'In review', count: analytics.inReviewCourses },
    { label: 'Draft', count: analytics.draftCourses },
    { label: 'Archived', count: analytics.archivedCourses },
  ];

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 px-4 py-10'>
      <header>
        <h1 className='text-3xl font-semibold tracking-tight'>Analytics</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          High-level indicators that highlight catalogue health, monetization readiness, and
          operational compliance.
        </p>
      </header>

      <section className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Courses by status</CardTitle>
            <CardDescription>
              {analytics.totalCourses} course{analytics.totalCourses === 1 ? '' : 's'} managed by
              this profile.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {statusBreakdown.map(status => {
              const percent = Math.round((status.count / totalCourses) * 100);
              return (
                <div key={status.label} className='space-y-2'>
                  <div className='flex items-center justify-between text-sm font-medium'>
                    <span>{status.label}</span>
                    <span className='text-muted-foreground'>{status.count}</span>
                  </div>
                  <Progress value={percent} className='h-2' />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Minimum training fee summary</CardTitle>
            <CardDescription>
              Controls how instructor-led classes price your courses in the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid grid-cols-3 gap-3 text-center text-sm'>
            <FeeStat heading='Courses with fee floor' value={monetization.coursesWithMinimumFee} />
            <FeeStat heading='Average fee' value={monetization.minimumFeeAverage} isCurrency />
            <FeeStat
              heading='Fee range'
              value={
                monetization.minimumFeeFloor !== null || monetization.minimumFeeCeiling !== null
                  ? `${formatCurrency(monetization.minimumFeeFloor)} – ${formatCurrency(monetization.minimumFeeCeiling)}`
                  : 'Not set'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Training requirements</CardTitle>
            <CardDescription>
              Make sure delivery partners acknowledge mandatory items before scheduling classes.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between rounded-lg border border-blue-200/40 bg-blue-50/60 px-4 py-3'>
              <span>Total configured items</span>
              <span className='font-semibold'>{trainingRequirements.totalRequirements}</span>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-lg border border-blue-200/40 bg-blue-50/60 p-3 text-center'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Mandatory</p>
                <p className='text-lg font-semibold'>
                  {trainingRequirements.mandatoryRequirements}
                </p>
              </div>
              <div className='rounded-lg border border-blue-200/40 bg-blue-50/60 p-3 text-center'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Optional</p>
                <p className='text-lg font-semibold'>
                  {trainingRequirements.optionalRequirements}
                </p>
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>
              Mandatory items act as blockers during scheduling workflows. Optional resources are
              surfaced in onboarding tooltips.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>Verification timeline</CardTitle>
            <CardDescription>
              Track when credentials were last reviewed and whether marketplace rights are active.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
             <div className='flex items-center justify-between rounded-lg border border-blue-200/40 bg-blue-50/60 px-4 py-3'>
              <span>Status</span>
              <span className='font-semibold'>
                {verification.adminVerified ? 'Verified' : 'Pending review'}
              </span>
            </div>
            <div className='flex items-center justify-between rounded-lg border border-blue-200/40 bg-blue-50/60 px-4 py-3'>
              <span>Last updated</span>
              <span className='font-semibold'>
                {verification.lastUpdated
                  ? format(verification.lastUpdated, 'dd MMM yyyy')
                  : 'Not recorded'}
              </span>
            </div>
            <div className='flex items-center justify-between rounded-lg border border-blue-200/40 bg-blue-50/60 px-4 py-3'>
              <span>Profile completeness</span>
              <span className='font-semibold'>
                {verification.profileComplete ? 'Complete' : 'Needs attention'}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeeStat({
  heading,
  value,
  isCurrency = false,
}: {
  heading: string;
  value: number | string | null;
  isCurrency?: boolean;
}) {
  const displayValue =
    typeof value === 'number' && isCurrency ? formatCurrency(value) : value ?? 'Not set';
  return (
    <div className='rounded-lg border border-blue-200/40 bg-blue-50/60 p-3'>
      <p className='text-xs uppercase tracking-wide text-muted-foreground'>{heading}</p>
      <p className='text-lg font-semibold'>{displayValue}</p>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'Not set';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
}
