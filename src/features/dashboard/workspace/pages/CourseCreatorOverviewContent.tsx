'use client';

import { KpiCard, type KpiCardVariant } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import DomainOverviewShell from '@/components/domain-overview-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import type { CourseCreatorCoursesStatus } from '@/hooks/course-creator-data';
import type {
  CourseCreatorAnalyticsSummary,
  CourseCreatorMonetizationSummary,
  CourseCreatorTrainingRequirementSummary,
  CourseCreatorVerificationStatus,
} from '@/lib/types/course-creator';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { format } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  ListCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { UserDomain } from '../../../../../lib/types';
import { MonetizationSnapshot } from './MonetizationSnapshot';

export default function CourseCreatorOverviewContent({
  coursesStatus,
}: {
  coursesStatus: CourseCreatorCoursesStatus;
}) {
  const { activeDomain } = useUserDomain();
  const {
    data,
    profile,
    isLoading: profileLoading,
    courseRequirementMap,
    programRequirementMap,
  } = useCourseCreator();

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
      actions={<></>}
      welcomeContent={<></>}
      children={
        <>
          <AsyncSection
            name='creator-overview-verification'
            loading={profileLoading}
            skeleton={<Skeleton className='h-56 w-full rounded-xl' />}
          >
            <VerificationBanner verification={verification} />
          </AsyncSection>
          <CoursesSection name='creator-overview-metrics' status={coursesStatus} height='h-64'>
            <MetricsGrid metrics={metrics} />
          </CoursesSection>

          <CoursesSection name='creator-overview-monetization' status={coursesStatus}>
            <MonetizationCard monetization={monetization} activeDomain={activeDomain} />
          </CoursesSection>

          <CoursesSection name='creator-overview-requirements' status={coursesStatus}>
            <TrainingRequirementsCard
              trainingRequirements={trainingRequirements}
              activeDomain={activeDomain}
              courses={data.courses}
              programs={data.programs}
              courseRequirementMap={courseRequirementMap}
              programRequirementMap={programRequirementMap}
            />
          </CoursesSection>
        </>
      }
      leftColumn={
        <>
          {/* <CoursesSection name='creator-overview-monetization' status={coursesStatus}>
            <MonetizationCard monetization={monetization} activeDomain={activeDomain} />
          </CoursesSection>
          <CoursesSection name='creator-overview-requirements' status={coursesStatus}>
            <TrainingRequirementsCard
              trainingRequirements={trainingRequirements}
              activeDomain={activeDomain}
              courses={data.courses}
              programs={data.programs}
              courseRequirementMap={courseRequirementMap}
              programRequirementMap={programRequirementMap}
            />
          </CoursesSection>
          <PurchasableCatalogue scope='course_creator' />
          <CourseRecommendationsCard
            description='Courses to learn from, picked for you'
            courseHref={uuid => `/dashboard/course-creator/courses/${uuid}`}
          /> */}
        </>
      }
      rightColumn={
        <>
          {/* <AsyncSection
            name='creator-overview-verification'
            loading={profileLoading}
            skeleton={<Skeleton className='h-56 w-full rounded-xl' />}
          >
            <VerificationCard verification={verification} />
          </AsyncSection> */}
          {/* <QuickActionsCard activeDomain={activeDomain} /> */}
        </>
      }
    />
  );
}

function CoursesSection({
  name,
  status,
  height = 'h-72',
  children,
}: {
  name: string;
  status: CourseCreatorCoursesStatus;
  height?: string;
  children: ReactNode;
}) {
  return (
    <AsyncSection
      name={name}
      loading={status.loading}
      error={status.error}
      onRetry={() => status.refetch()}
      skeleton={<Skeleton className={`${height} w-full rounded-xl`} />}
      errorTitle='Couldn’t load your courses'
    >
      {children}
    </AsyncSection>
  );
}

function MetricsGrid({ metrics }: { metrics: ReturnType<typeof buildMetricCards> }) {
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
      {metrics.map(metric => (
        <KpiCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          hint={metric.hint}
          change={metric.change}
          changeType={metric.changeType}
          icon={metric.icon}
          variant={metric.variant}
        />
      ))}
    </div>
  );
}

function buildMetricCards(analytics: CourseCreatorAnalyticsSummary) {
  return [
    {
      title: 'In review',
      value: analytics.inReviewCourses,
      hint: 'Awaiting quality checks',
      change: 'Needs attention',
      changeType: 'down' as const,
      icon: <Clock className='h-4 w-4' />,
      variant: 'amber' as KpiCardVariant,
    },
    {
      title: 'Total courses',
      value: analytics.totalCourses,
      hint: 'Across every status',
      change: 'Portfolio',
      changeType: 'up' as const,
      icon: <ListCheck className='h-4 w-4' />,
      variant: 'primary' as KpiCardVariant,
    },
    {
      title: 'Total Programs',
      value: analytics.totalPrograms,
      hint: 'Across every status',
      change: 'Portfolio',
      changeType: 'up' as const,
      icon: <Layers className='h-4 w-4' />,
      variant: 'indigo' as KpiCardVariant,
    },
    {
      title: 'Published',
      value: analytics.publishedCourses + analytics.publishedPrograms,
      hint: 'Live in marketplace',
      change: `${analytics.publishedPrograms} programs, ${analytics.publishedCourses} courses`,
      changeType: 'up' as const,
      icon: <CheckCircle2 className='h-4 w-4' />,
      variant: 'green' as KpiCardVariant,
    },
    {
      title: 'Drafts',
      value: analytics.draftCourses + analytics.draftPrograms,
      hint: 'Ready for your next edit',
      change: 'In progress',
      changeType: 'up' as const,
      icon: <Sparkles className='h-4 w-4' />,
      variant: 'indigo' as KpiCardVariant,
    },
  ];
}

function MonetizationCard({ monetization, activeDomain }: { monetization: CourseCreatorMonetizationSummary, activeDomain: UserDomain | null }) {
  const feeFloor = monetization.minimumFeeFloor ?? 0;
  const feeCeiling = monetization.minimumFeeCeiling ?? monetization.minimumFeeFloor ?? 0;
  const creatorSplit = monetization.creatorShareRange
    ? { min: monetization.creatorShareRange[0], max: monetization.creatorShareRange[1] }
    : { min: 0, max: 0 };
  const instructorSplit = monetization.instructorShareRange
    ? { min: monetization.instructorShareRange[0], max: monetization.instructorShareRange[1] }
    : { min: 0, max: 0 };

  return (
    <MonetizationSnapshot
      coursesWithFeeFloor={monetization.coursesWithMinimumFee}
      averageMinimumFee={monetization.minimumFeeAverage ?? feeFloor}
      maxFee={feeCeiling}
      creatorSplit={creatorSplit}
      instructorSplit={instructorSplit}
      pricingHref={roleScopedDashboardPath(activeDomain, '/dashboard/course-management')}
    />
  );
}

function TrainingRequirementsCard({
  trainingRequirements,
  activeDomain,
  courses,
  programs,
  courseRequirementMap,
  programRequirementMap,
}: {
  trainingRequirements: CourseCreatorTrainingRequirementSummary;
  activeDomain: UserDomain | null;
  courses: ReturnType<typeof useCourseCreator>['data']['courses'];
  programs: ReturnType<typeof useCourseCreator>['data']['programs'];
  courseRequirementMap: Record<
    string,
    Array<{
      name?: string;
      description?: string;
      is_mandatory?: boolean;
      provided_by?: string;
      requirement_type?: string;
      requirement_text?: string;
    }>
  >;
  programRequirementMap: Record<
    string,
    Array<{
      requirement_text?: string;
      is_mandatory?: boolean;
      provided_by?: string;
      requirement_type?: string;
    }>
  >;
}) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [showRequirements, setShowRequirements] = useState(false);
  const [showAllRequirements, setShowAllRequirements] = useState(false);

  const requirementGroups = useMemo(() => {
    const publishedCourses = courses.filter(
      course => course.status === 'published'
    );

    const publishedPrograms = programs.filter(
      program => program.published || program.status === 'published'
    );

    return [
      ...publishedCourses.map(course => ({
        id: course.uuid ?? `course-${course.name}`,
        name: course.name ?? 'Untitled course',
        type: 'Course' as const,
        items: courseRequirementMap[course.uuid ?? ''] ?? [],
      })),
      ...publishedPrograms.map(program => ({
        id: program.uuid ?? `program-${program.title}`,
        name: program.title ?? 'Untitled program',
        type: 'Program' as const,
        items: programRequirementMap[program.uuid ?? ''] ?? [],
      })),
    ];
  }, [courseRequirementMap, courses, programRequirementMap, programs]);

  const allExpanded =
    requirementGroups.length > 0 &&
    requirementGroups.every(group => Boolean(openItems[group.id]));

  const toggleAllRequirements = () => {
    if (allExpanded) {
      setOpenItems({});
      setShowAllRequirements(false);
      return;
    }

    setOpenItems(
      Object.fromEntries(requirementGroups.map(group => [group.id, true]))
    );
    setShowAllRequirements(true);
  };

  const toggleRequirementsVisibility = () => {
    setShowRequirements(current => {
      if (!current) {
        setOpenItems({});
        setShowAllRequirements(false);
      } else {
        setOpenItems({});
        setShowAllRequirements(false);
      }

      return !current;
    });
  };

  const getProviderLabel = (value: string) => {
    if (!value) return 'Other';

    return value
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const groupRequirementsByProvider = <
    T extends {
      provided_by?: string;
      requirement_type?: string;
    },
  >(
    items: T[]
  ) => {
    return items.reduce<Record<string, T[]>>((groups, item) => {
      const provider =
        item.provided_by?.trim() ||
        item.requirement_type?.trim() ||
        'other';

      (groups[provider] ??= []).push(item);

      return groups;
    }, {});
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='flex items-start gap-3'>
          <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <ListCheck className='size-5' />
          </div>
          <div className='space-y-0.5'>
            <CardTitle className='text-base'>Training requirements</CardTitle>
            <CardDescription>
              Across {trainingRequirements.courseCount} courses and{' '}
              {trainingRequirements.programCount} programs (
              {trainingRequirements.publishedProgramCount} published), ensure
              instructors and organisations have what they need to deliver your
              curriculum.
            </CardDescription>
          </div>
        </div>

        <Button variant='outline' size='sm' asChild className='shrink-0'>
          <Link
            prefetch
            href={roleScopedDashboardPath(
              activeDomain,
              '/dashboard/course-management'
            )}
          >
            Manage requirements
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='grid gap-3 sm:grid-cols-3'>
          <RequirementStat
            label='Total'
            value={trainingRequirements.totalRequirements}
          />
          <RequirementStat
            label='Mandatory'
            value={trainingRequirements.mandatoryRequirements}
          />
          <RequirementStat
            label='Optional'
            value={trainingRequirements.optionalRequirements}
          />
        </div>

        {requirementGroups.length > 0 && (
          <div className='space-y-4 rounded-xl border p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h3 className='text-sm font-semibold'>Requirements overview</h3>
                <p className='text-muted-foreground text-xs'>
                  Review provider requirements across published content.
                </p>
              </div>

              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={toggleRequirementsVisibility}
                aria-expanded={showRequirements}
                aria-label={showRequirements ? 'Hide requirements' : 'Show requirements'}
              >
                {showRequirements ? 'Hide requirements' : 'Show requirements'}
                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform ${showRequirements ? 'rotate-180' : ''}`}
                />
              </Button>
            </div>

            {showRequirements && (
              <div className='space-y-4'>
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={toggleAllRequirements}
                    aria-expanded={allExpanded}
                    aria-label={allExpanded ? 'Collapse all requirements' : 'Expand all requirements'}
                  >
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 transition-transform ${allExpanded ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </div>

                <div className='space-y-3'>
                  {requirementGroups.map(group => {
                    const expanded = Boolean(openItems[group.id]);
                    const mandatoryCount = group.items.filter(item => item.is_mandatory).length;

                    return (
                      <div
                        key={group.id}
                        className='border-border/60 bg-muted/20 rounded-xl border'
                      >
                        <button
                          type='button'
                          className='flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left'
                          onClick={() =>
                            setOpenItems(current => ({
                              ...current,
                              [group.id]: !current[group.id],
                            }))
                          }
                          aria-expanded={expanded}
                        >
                          <div className='min-w-0 flex-1'>
                            <p className='text-foreground truncate text-sm font-semibold'>
                              {group.name}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {group.type} · {group.items.length} requirement
                              {group.items.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          <div className='flex shrink-0 items-center gap-2'>
                            <span className='text-muted-foreground text-xs'>
                              {mandatoryCount} mandatory
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </button>

                        {expanded && (
                          <div className='border-border/60 border-t px-3 py-3'>
                            {group.items.length > 0 ? (
                              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                                {Object.entries(groupRequirementsByProvider(group.items)).map(
                                  ([provider, items]) => (
                                    <section
                                      key={provider}
                                      className='border-border/60 min-w-0 space-y-3 rounded-lg border p-3'
                                    >
                                      <div className='flex items-center justify-between gap-2'>
                                        <h4 className='text-sm font-semibold'>
                                          Provided by {getProviderLabel(provider)}
                                        </h4>
                                        <Badge variant='outline'>{items.length}</Badge>
                                      </div>

                                      <ul className='space-y-2'>
                                        {items.map((item, index) => {
                                          const label =
                                            ('name' in item && item.name) ||
                                            ('requirement_text' in item
                                              ? item.requirement_text?.split('\n')[0]?.replace(/^Name:\s*/i, '')
                                              : undefined) ||
                                            'Untitled requirement';

                                          const detail =
                                            'description' in item && item.description
                                              ? item.description
                                              : 'requirement_text' in item
                                                ? item.requirement_text
                                                  ?.split('\n')
                                                  .filter(
                                                    line =>
                                                      !/^(Name|Type|Quantity|Unit):/i.test(line)
                                                  )
                                                  .join('\n')
                                                  .replace(/^Description:\s*/im, '')
                                                  .trim()
                                                : '';

                                          return (
                                            <li
                                              key={
                                                ('uuid' in item && item.uuid) ||
                                                `${provider}-${index}`
                                              }
                                              className='bg-muted/30 rounded-md p-2.5'
                                            >
                                              <div className='flex items-start justify-between gap-2'>
                                                <p className='text-sm font-medium break-words'>
                                                  {label}
                                                </p>
                                                <Badge
                                                  variant={item.is_mandatory ? 'destructive' : 'secondary'}
                                                  className='shrink-0 text-[10px]'
                                                >
                                                  {item.is_mandatory ? 'Mandatory' : 'Optional'}
                                                </Badge>
                                              </div>

                                              {detail && (
                                                <p className='text-muted-foreground mt-1 text-xs whitespace-pre-line break-words'>
                                                  {detail}
                                                </p>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </section>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className='text-muted-foreground text-sm'>
                                No requirements have been added yet.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerificationBanner({
  verification,
}: {
  verification: CourseCreatorVerificationStatus;
}) {
  const statusIcon = verification.adminVerified ? (
    <ShieldCheck className='h-5 w-5' />
  ) : (
    <ShieldAlert className='h-5 w-5' />
  );

  const statusCopy = verification.adminVerified
    ? 'You are verified and can publish immediately.'
    : 'Complete the outstanding actions below to unlock publishing.';

  return (
    <section className='text-foreground mt-2'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex flex-row items-center gap-2'>
          {statusIcon}
          <h2 className='text-xl font-semibold tracking-tight text-foreground-muted'>
            {statusCopy}
          </h2>
        </div>
      </div>

      <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        <StatusTile
          label='Profile readiness'
          value={verification.profileComplete ? 'Complete' : 'Needs updates'}
          helper='Current state'
        />
        <StatusTile
          label='Last updated'
          value={
            verification.lastUpdated
              ? format(new Date(verification.lastUpdated), 'dd MMM yyyy')
              : '—'
          }
          helper='Latest check-in'
        />
        <StatusTile
          label='Profile created'
          value={
            verification.createdDate
              ? format(new Date(verification.createdDate), 'dd MMM yyyy')
              : '—'
          }
          helper='Account start date'
        />
      </div>
    </section>
  );
}

function StatusTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className='border-border bg-white/15 text-white hover:bg-white/25 flex items-center justify-between gap-3 rounded-lg border px-4 py-3'>
      <div className='min-w-0'>
        <p className='text-foreground text-sm font-semibold'>{label}</p>
        <p className='text-foreground text-[11px] uppercase tracking-wide'>{helper}</p>
      </div>
      <span className='text-foreground text-base font-medium'>{value}</span>
    </div>
  );
}

function QuickActionsCard({ activeDomain }: { activeDomain: UserDomain | null }) {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='text-base font-semibold'>Quick actions</CardTitle>
        <CardDescription>
          Frequently used controls to keep your catalogue and collaborators aligned.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-2'>
        {/* <ActionTile
          title='Provision instructors'
          description='Invite mentors and outline their revenue share.'
          href={roleScopedDashboardPath(activeDomain, '/dashboard/instructors')}
        /> */}
        {/* <ActionTile
          title='Share assets'
          description='Upload brand kits and curriculum collateral.'
          // href={roleScopedDashboardPath(activeDomain, '/dashboard/library')}
          href='#'
        /> */}
        <ActionTile
          title='Create syllabus'
          description='Use guided steps to structure lessons and assessments.'
          href={roleScopedDashboardPath(activeDomain, '/dashboard/courses/create-course')}
        />
        <ActionTile
          title='Check analytics'
          description='Monitor engagement, throughput, and monetisation.'
          href={roleScopedDashboardPath(activeDomain, '/dashboard/analytics')}
        />
      </CardContent>
    </Card>
  );
}

function RequirementStat({ label, value }: { label: string; value: number }) {
  return (
    <div className='border-border/60 bg-muted/30 rounded-2xl border p-3'>
      <p className='text-muted-foreground text-xs uppercase'>{label}</p>
      <p className='text-foreground text-xl font-semibold'>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground text-xs uppercase'>{label}</span>
      <span className='text-foreground text-sm font-semibold'>{value}</span>
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
    <Link
      prefetch
      href={href}
      className='border-border/70 bg-muted/20 flex h-full flex-col justify-between rounded-2xl border p-3 text-sm'
    >
      <div className='space-y-1'>
        <p className='text-foreground font-semibold'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
      <Button asChild variant='ghost' size='sm' className='mt-3 justify-start px-0 text-sm'>
        Open
      </Button>
    </Link>
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
  creatorRange?: [number | null | undefined, number | null | undefined],
  instructorRange?: [number | null | undefined, number | null | undefined]
) {
  if (!creatorRange || !instructorRange) return 'Not set';

  const formatRange = (min?: number | null, max?: number | null) => {
    if (min == null && max == null) return 'Not set';
    if (min != null && max != null && min !== max) {
      return `${min}% – ${max}%`;
    }
    return `${min ?? max}%`;
  };

  const creatorShare = formatRange(creatorRange[0], creatorRange[1]);
  const instructorShare = formatRange(instructorRange[0], instructorRange[1]);

  return `${creatorShare} creator\n${instructorShare} instructor`;
}
