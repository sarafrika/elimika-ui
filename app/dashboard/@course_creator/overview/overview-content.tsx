"use client";

import DomainOverviewShell from '@/components/domain-overview-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourseCreator } from '@/context/course-creator-context';
import type {
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

  const headline =
    profile?.professional_headline ??
    'Design and manage your learning products with platform-wide tooling.';

  const metrics = buildMetricCards(analytics);

  return (
    <DomainOverviewShell
      domainLabel='Course creator workspace'
      title={profile?.full_name ?? 'Welcome back'}
      subtitle={headline}
      badge={{
        label: verification.adminVerified ? 'Verified creator' : 'Verification pending',
        tone: verification.adminVerified ? 'success' : 'warning',
      }}
      actions={
        <Button asChild>
          <Link prefetch href='/dashboard/course-management/create-new-course'>
            Launch new course
          </Link>
        </Button>
      }
      leftColumn={
        <>
          <VerificationCard verification={verification} />
          <QuickActionsCard />
        </>
      }
      rightColumn={
        <>
          <MetricsGrid metrics={metrics} />
          <MonetizationCard monetization={monetization} />
          <TrainingRequirementsCard trainingRequirements={trainingRequirements} />
        </>
      }
    />
  );
}

function MetricsGrid({ metrics }: { metrics: ReturnType<typeof buildMetricCards> }) {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {metrics.map(metric => (
        <Card key={metric.title} className='border-border/70'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metric.value}</div>
            <p className='text-muted-foreground text-sm'>{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function buildMetricCards(analytics: CourseCreatorAnalyticsSummary) {
  return [
    {
      title: 'Total courses',
      value: analytics.totalCourses,
      description: 'Across every status',
      icon: <Layers className='h-5 w-5 text-primary' />,
    },
    {
      title: 'Published',
      value: analytics.publishedCourses,
      description: 'Live in marketplace',
      icon: <CheckCircle2 className='h-5 w-5 text-primary' />,
    },
    {
      title: 'In review',
      value: analytics.inReviewCourses,
      description: 'Awaiting quality checks',
      icon: <Clock className='h-5 w-5 text-muted-foreground' />,
    },
    {
      title: 'Drafts',
      value: analytics.draftCourses,
      description: 'Ready for your next edit',
      icon: <Sparkles className='h-5 w-5 text-muted-foreground' />,
    },
  ];
}

function MonetizationCard({ monetization }: { monetization: CourseCreatorMonetizationSummary }) {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <DollarSign className='h-5 w-5 text-primary' />
          Monetization snapshot
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
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <ListCheck className='h-5 w-5 text-primary' />
          Training requirements
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
            Manage requirements
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ verification }: { verification: CourseCreatorVerificationStatus }) {
  const statusIcon = verification.adminVerified ? (
    <ShieldCheck className='h-5 w-5 text-primary' />
  ) : (
    <ShieldAlert className='h-5 w-5 text-muted-foreground' />
  );

  const statusCopy = verification.adminVerified
    ? 'You are verified and can publish immediately.'
    : 'Complete the outstanding actions below to unlock publishing.';

  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          {statusIcon}
          Verification status
        </CardTitle>
        <CardDescription>{statusCopy}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        <DetailRow label='Verifier' value={verification.adminVerifier ?? 'Pending assignment'} />
        <DetailRow
          label='Last reviewed'
          value={
            verification.adminReviewDate
              ? format(new Date(verification.adminReviewDate), 'dd MMM yyyy')
              : '—'
          }
        />
        <DetailRow label='Live courses' value={verification.liveCourses ?? 0} />
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>Quick actions</CardTitle>
        <CardDescription>
          Frequently used controls to keep your catalogue and collaborators aligned.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-2'>
        <ActionTile
          title='Provision instructors'
          description='Invite mentors and outline their revenue share.'
          href='/dashboard/instructors'
        />
        <ActionTile
          title='Share assets'
          description='Upload brand kits and curriculum collateral.'
          href='/dashboard/libraries'
        />
        <ActionTile
          title='Create syllabus'
          description='Use guided steps to structure lessons and assessments.'
          href='/dashboard/course-management/create-new-course'
        />
        <ActionTile
          title='Check analytics'
          description='Monitor engagement, throughput, and monetisation.'
          href='/dashboard/analytics'
        />
      </CardContent>
    </Card>
  );
}

function RequirementStat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-2xl border border-border/60 bg-muted/30 p-3'>
      <p className='text-muted-foreground text-xs uppercase'>{label}</p>
      <p className='text-foreground text-xl font-semibold'>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground text-xs uppercase'>{label}</span>
      <span className='text-sm font-semibold text-foreground'>{value}</span>
    </div>
  );
}

function ActionTile({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className='flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm'>
      <div className='space-y-1'>
        <p className='font-semibold text-foreground'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
      <Button asChild variant='ghost' size='sm' className='mt-3 justify-start px-0 text-sm'>
        <Link prefetch href={href}>
          Open
        </Link>
      </Button>
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
}

function formatFeeRange(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Not set';
  if (min && max) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (min) return `From ${formatCurrency(min)}`;
  return `Up to ${formatCurrency(max!)}`;
}

function formatShareRange(
  creatorRange?: { min?: number | null; max?: number | null },
  instructorRange?: { min?: number | null; max?: number | null }
) {
  if (!creatorRange || !instructorRange) return 'Not set';
  const creatorShare =
    creatorRange.min && creatorRange.max
      ? `${creatorRange.min}% – ${creatorRange.max}%`
      : `${creatorRange.min ?? creatorRange.max}%`;
  const instructorShare =
    instructorRange.min && instructorRange.max
      ? `${instructorRange.min}% – ${instructorRange.max}%`
      : `${instructorRange.min ?? instructorRange.max}%`;
  return `${creatorShare} creator • ${instructorShare} instructor`;
}
