'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseCreator } from '@/context/course-creator-context';
import {
  CourseCreatorAnalyticsSummary,
  CourseCreatorMonetizationSummary,
  CourseCreatorTrainingRequirementSummary,
  CourseCreatorVerificationStatus,
} from '@/lib/types/course-creator';
import { format } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ListCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function CourseCreatorOverviewContent() {
  const { data, profile } = useCourseCreator();

  const analytics = data.analytics;
  const monetization = data.monetization;
  const trainingRequirements = data.trainingRequirements;
  const verification = data.verification;
  const assignments = data.assignments;

  const headline =
    profile?.professional_headline ??
    'Design and manage your learning products with platform-wide tooling.';

  const metrics = buildMetricCards(analytics);

  return (
    <div className='mx-auto w-full max-w-6xl space-y-8 px-4 py-10'>
      <header className='rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 p-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-sm uppercase tracking-widest text-purple-600 dark:text-purple-300'>
              Course Creator
            </p>
            <h1 className='mt-1 text-3xl font-bold tracking-tight text-foreground'>
              {profile?.full_name ?? 'Welcome back'}
            </h1>
            <p className='text-muted-foreground mt-2 max-w-3xl text-base'>{headline}</p>
          </div>
          <Badge
            variant={verification.adminVerified ? 'default' : 'secondary'}
            className={`h-fit px-4 py-2 text-sm font-semibold ${verification.adminVerified ? 'bg-emerald-500 text-white' : 'bg-amber-500/10 text-amber-700 dark:text-amber-200'}`}
          >
            {verification.adminVerified ? 'Verified Creator' : 'Verification Pending'}
          </Badge>
        </div>
      </header>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {metrics.map(metric => (
          <Card key={metric.title} className='border-border/60'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metric.value}</div>
              <p className='text-muted-foreground text-sm'>{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <MonetizationCard monetization={monetization} />
        <TrainingRequirementsCard trainingRequirements={trainingRequirements} />
        <AssignmentsCard assignmentsCount={assignments.organisations.length} hasGlobal={assignments.hasGlobalAccess} />
        <VerificationCard verification={verification} />
      </section>

      <QuickActionsCard />
    </div>
  );
}

function buildMetricCards(analytics: CourseCreatorAnalyticsSummary) {
  return [
    {
      title: 'Total Courses',
      value: analytics.totalCourses,
      description: 'Across every status',
      icon: <Layers className='text-purple-500 h-5 w-5' />,
    },
    {
      title: 'Published',
      value: analytics.publishedCourses,
      description: 'Live in marketplace',
      icon: <CheckCircle2 className='text-emerald-500 h-5 w-5' />,
    },
    {
      title: 'In Review',
      value: analytics.inReviewCourses,
      description: 'Awaiting quality checks',
      icon: <Clock className='text-amber-500 h-5 w-5' />,
    },
    {
      title: 'Drafts',
      value: analytics.draftCourses,
      description: 'Ready for your next edit',
      icon: <Sparkles className='text-sky-500 h-5 w-5' />,
    },
  ];
}

function MonetizationCard({
  monetization,
}: {
  monetization: CourseCreatorMonetizationSummary;
}) {
  return (
    <Card className='border-border/60'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <DollarSign className='text-purple-500 h-5 w-5' />
          Monetization Snapshot
        </CardTitle>
        <CardDescription>
          Revenue expectations and minimum training fees configured across your courses.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground'>Courses with fee floor</p>
            <p className='text-lg font-semibold'>{monetization.coursesWithMinimumFee}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Average minimum fee</p>
            <p className='text-lg font-semibold'>
              {formatCurrency(monetization.minimumFeeAverage) ?? 'Not set'}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Fee range</p>
            <p className='text-lg font-semibold'>
              {formatFeeRange(monetization.minimumFeeFloor, monetization.minimumFeeCeiling)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground'>Revenue split</p>
            <p className='text-lg font-semibold'>
              {formatShareRange(monetization.creatorShareRange, monetization.instructorShareRange)}
            </p>
            {!monetization.consistentRevenueSplit && (
              <p className='text-muted-foreground mt-1 text-xs'>
                Splits vary per course; align them before publishing a new class.
              </p>
            )}
          </div>
        </div>
        <Button variant='outline' size='sm' asChild>
          <Link prefetch href='/dashboard/course-management'>
            Update pricing controls
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TrainingRequirementsCard({
  trainingRequirements,
}: {
  trainingRequirements: CourseCreatorTrainingRequirementSummary;
}) {
  return (
    <Card className='border-border/60'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <ListCheck className='text-purple-500 h-5 w-5' />
          Training Requirements
        </CardTitle>
        <CardDescription>
          Ensure instructors and organisations have what they need to deliver your curriculum.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-3 gap-3 text-center'>
          <RequirementStat label='Total' value={trainingRequirements.totalRequirements} />
          <RequirementStat label='Mandatory' value={trainingRequirements.mandatoryRequirements} />
          <RequirementStat label='Optional' value={trainingRequirements.optionalRequirements} />
        </div>
        <Button variant='outline' size='sm' asChild>
          <Link prefetch href='/dashboard/course-management'>
            Manage delivery requirements
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RequirementStat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-4'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <p className='text-xl font-semibold'>{value}</p>
    </div>
  );
}

function AssignmentsCard({ assignmentsCount, hasGlobal }: { assignmentsCount: number; hasGlobal: boolean }) {
  return (
    <Card className='border-border/60'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <ShieldCheck className='text-purple-500 h-5 w-5' />
          Domain Assignments
        </CardTitle>
        <CardDescription>
          Track where you operate as a course creator across the Elimika ecosystem.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <p className='flex items-center gap-2 text-sm'>
            <Badge variant={hasGlobal ? 'default' : 'secondary'}>
              {hasGlobal ? 'Global publishing rights' : 'Global access pending'}
            </Badge>
            <span className='text-muted-foreground'>
              {hasGlobal
                ? 'You can publish to the marketplace.'
                : 'Invite an admin to grant marketplace access.'}
            </span>
          </p>
          <p className='text-sm text-muted-foreground'>
            {assignmentsCount > 0
              ? `Affiliated with ${assignmentsCount} organisation${assignmentsCount > 1 ? 's' : ''} for institutional development.`
              : 'No organisational assignments linked yet.'}
          </p>
        </div>
        <Button variant='outline' size='sm' asChild>
          <Link prefetch href='/dashboard/verification'>
            Review assignments
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ verification }: { verification: CourseCreatorVerificationStatus }) {
  const statusIcon = verification.adminVerified ? (
    <CheckCircle2 className='text-emerald-500 h-5 w-5' />
  ) : (
    <ShieldAlert className='text-amber-500 h-5 w-5' />
  );

  const statusCopy = verification.adminVerified
    ? 'Your credentials are verified. Publish freely across the platform.'
    : 'Submit verification evidence so marketplace publishing can be enabled.';

  const lastUpdated = verification.lastUpdated
    ? format(verification.lastUpdated, 'dd MMM yyyy')
    : 'Not recorded';

  return (
    <Card className='border-border/60'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            {statusIcon}
            Verification Status
          </CardTitle>
          <CardDescription>{statusCopy}</CardDescription>
        </div>
        <Badge
          variant={verification.adminVerified ? 'default' : 'secondary'}
          className={verification.adminVerified ? 'bg-emerald-500 text-white' : undefined}
        >
          {verification.adminVerified ? 'Verified' : 'Action needed'}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-xs text-muted-foreground'>Last updated {lastUpdated}</p>
        <Button size='sm' asChild>
          <Link prefetch href='/dashboard/verification'>
            Manage verification
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    {
      title: 'Create a course',
      description: 'Spin up a new curriculum with lessons, assessments, and pricing.',
      href: '/dashboard/course-management',
    },
    {
      title: 'Review analytics',
      description: 'Track enrolments, completions, and revenue performance.',
      href: '/dashboard/analytics',
    },
    {
      title: 'Update profile',
      description: 'Strengthen your creator profile with a compelling story and links.',
      href: '/dashboard/profile',
    },
  ];

  return (
    <Card className='border-border/60'>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>Quick actions</CardTitle>
        <CardDescription>Keep momentum by maintaining course quality and visibility.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 md:grid-cols-3'>
        {actions.map(action => (
          <div
            key={action.title}
            className='flex h-full flex-col justify-between rounded-lg border border-dashed border-border/60 p-4'
          >
            <div>
              <h3 className='text-sm font-semibold'>{action.title}</h3>
              <p className='text-muted-foreground mt-2 text-sm'>{action.description}</p>
            </div>
            <Button variant='link' className='px-0 text-sm' asChild>
              <Link prefetch href={action.href}>
                Go
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFeeRange(
  floor: number | null,
  ceiling: number | null
) {
  if (floor === null && ceiling === null) return 'Not set';
  if (floor !== null && ceiling !== null) {
    if (floor === ceiling) {
      return formatCurrency(floor) ?? 'Not set';
    }
    return `${formatCurrency(floor)} – ${formatCurrency(ceiling)}`;
  }
  return formatCurrency(floor ?? ceiling) ?? 'Not set';
}

function formatShareRange(
  creatorRange: [number, number] | null,
  instructorRange: [number, number] | null
) {
  if (!creatorRange || !instructorRange) return 'Not configured';
  if (creatorRange[0] === creatorRange[1] && instructorRange[0] === instructorRange[1]) {
    return `${creatorRange[0]}% / ${instructorRange[0]}%`;
  }
  return `${creatorRange[0]}–${creatorRange[1]}% / ${instructorRange[0]}–${instructorRange[1]}%`;
}
