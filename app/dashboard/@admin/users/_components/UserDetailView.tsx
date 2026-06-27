'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, CalendarDays, FileCheck, Layers, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import { resolveUserProfiles } from '@/services/admin/credential-review';
import type { User } from '@/services/client';
import {
  getUserByUuidOptions,
  isUserAdminOptions,
  isUserSystemAdminOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { adminTheme, type StatusTone, statusToneClass } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { UserIdentityForm } from './UserIdentityForm';

const tabListClass =
  'h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0';
const tabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-1 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

const CredentialsAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.CredentialsAsyncTab };
});
const ProfessionalProfileAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.ProfessionalProfileAsyncTab };
});
const ContentAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.ContentAsyncTab };
});
const TrainingAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.TrainingAsyncTab };
});
const ReviewsAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.ReviewsAsyncTab };
});
const PendingApprovalsAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.PendingApprovalsAsyncTab };
});
const CommerceAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.CommerceAsyncTab };
});
const AuditTrailAsyncTab = lazy(async () => {
  const module = await import('./DossierAsyncTabs');
  return { default: module.AuditTrailAsyncTab };
});
const ClassesTab = lazy(async () => {
  const module = await import('./ClassesTab');
  return { default: module.ClassesTab };
});
const StudentActivityTab = lazy(async () => {
  const module = await import('./StudentActivityTab');
  return { default: module.StudentActivityTab };
});

function domainList(user: User): string[] {
  const raw = user.user_domain;
  const domains = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return domains.map(String);
}

function initials(user: User): string {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Compact metric tile borrowed from the loan-detail KPI row. */
function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'info',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: StatusTone;
}) {
  return (
    <div className='border-border/70 bg-card flex items-center gap-3 rounded-md border p-4 shadow-sm'>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          statusToneClass[tone]
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <p className='text-muted-foreground truncate text-xs font-medium uppercase'>{label}</p>
        <div className='text-foreground truncate text-lg font-semibold'>{value}</div>
        {hint ? <p className='text-muted-foreground truncate text-xs'>{hint}</p> : null}
      </div>
    </div>
  );
}

export function UserDetailView({
  uuid,
  backHref = '/dashboard/users',
  backLabel = 'Back to users',
}: {
  uuid: string;
  backHref?: string;
  backLabel?: string;
}) {
  const admin = useUserProfile();
  const verifier = admin?.email || admin?.full_name || 'admin';
  const [tab, setTab] = useState('overview');

  const userQuery = useQuery(getUserByUuidOptions({ path: { uuid } }));
  const user = userQuery.data?.data;
  const userImageUrl = toAuthenticatedMediaUrl(user?.profile_image_url);

  // Lightweight resolution drives which tabs appear + profile uuids for the lazy tabs.
  const profilesQuery = useQuery({
    queryKey: ['user-profiles', uuid],
    queryFn: () => resolveUserProfiles(uuid),
  });
  const profiles = profilesQuery.data;
  const hasInstructor = Boolean(profiles?.instructorUuid);
  const hasCreator = Boolean(profiles?.courseCreatorUuid);
  const hasStudent = Boolean(profiles?.studentUuid);
  const hasCredentials = hasInstructor || hasCreator;
  const profileCount = [hasInstructor, hasCreator, hasStudent].filter(Boolean).length;

  const adminStatusQuery = useQuery({
    ...isUserAdminOptions({ path: { uuid } }),
    enabled: Boolean(user),
  });
  const systemAdminStatusQuery = useQuery({
    ...isUserSystemAdminOptions({ path: { uuid } }),
    enabled: Boolean(user),
  });
  const userDomains = useMemo(() => (user ? domainList(user) : []), [user]);
  const targetUuids = useMemo(
    () =>
      [
        profiles?.instructorUuid,
        profiles?.courseCreatorUuid,
        profiles?.studentUuid,
        ...(user?.organisation_affiliations ?? []).flatMap(affiliation => [
          affiliation.organisation_uuid,
          affiliation.branch_uuid,
        ]),
      ].filter((value): value is string => Boolean(value)),
    [
      profiles?.courseCreatorUuid,
      profiles?.instructorUuid,
      profiles?.studentUuid,
      user?.organisation_affiliations,
    ]
  );

  if (userQuery.isLoading) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <Skeleton className='h-28 w-full rounded-md' />
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-[72px] rounded-md' />
            ))}
          </div>
          <SectionCardSkeleton rows={6} />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <ShieldAlert className='text-muted-foreground size-10' />
          <p className='text-lg font-semibold'>User not found</p>
          <Button variant='outline' asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div>
          <Button variant='ghost' size='sm' asChild className='text-muted-foreground mb-2 -ml-2'>
            <Link href={backHref}>
              <ArrowLeft className='size-4' />
              {backLabel}
            </Link>
          </Button>

          {/* Identity header */}
          <header className='border-border/70 bg-card flex flex-col gap-4 rounded-md border px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='size-14'>
                {userImageUrl ? <AvatarImage src={userImageUrl} alt='' /> : null}
                <AvatarFallback className='text-lg font-semibold'>{initials(user)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <h1 className='text-foreground truncate text-2xl font-semibold tracking-tight'>
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </h1>
                <p className='text-muted-foreground truncate text-sm'>{user.email}</p>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <StatusBadge status={user.active ? 'active' : 'inactive'} />
                  {userDomains.map(domain => (
                    <Badge key={domain} variant='outline' className='text-[10px] uppercase'>
                      {domain.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Metric tiles */}
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <MetricTile
            label='Account'
            value={user.active ? 'Active' : 'Inactive'}
            icon={BadgeCheck}
            tone={user.active ? 'success' : 'destructive'}
          />
          <MetricTile
            label='Roles'
            value={userDomains.length}
            hint={
              [hasInstructor && 'instructor', hasCreator && 'creator', hasStudent && 'student']
                .filter(Boolean)
                .join(' · ') || 'No domains'
            }
            icon={Layers}
          />
          <MetricTile
            label='Linked profiles'
            value={profilesQuery.isLoading ? '—' : profileCount}
            hint='domain records'
            icon={FileCheck}
            tone={profileCount > 0 ? 'info' : 'neutral'}
          />
          <MetricTile
            label='Member since'
            value={formatDate(user.created_date)}
            icon={CalendarDays}
            tone='neutral'
          />
        </div>

        {/* Tabbed sections */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className={tabListClass}>
            <TabsTrigger value='overview' className={tabTriggerClass}>
              Overview
            </TabsTrigger>
            {hasCredentials ? (
              <TabsTrigger value='credentials' className={tabTriggerClass}>
                Credentials
              </TabsTrigger>
            ) : null}
            {hasCredentials ? (
              <TabsTrigger value='professional-profile' className={tabTriggerClass}>
                Professional profile
              </TabsTrigger>
            ) : null}
            {hasCredentials ? (
              <TabsTrigger value='content' className={tabTriggerClass}>
                Content & approvals
              </TabsTrigger>
            ) : null}
            {hasInstructor ? (
              <TabsTrigger value='training' className={tabTriggerClass}>
                Training network
              </TabsTrigger>
            ) : null}
            {hasCredentials ? (
              <TabsTrigger value='reviews' className={tabTriggerClass}>
                Reviews & ratings
              </TabsTrigger>
            ) : null}
            {hasInstructor ? (
              <TabsTrigger value='classes' className={tabTriggerClass}>
                Classes
              </TabsTrigger>
            ) : null}
            {hasStudent ? (
              <TabsTrigger value='learning' className={tabTriggerClass}>
                Enrollments & certificates
              </TabsTrigger>
            ) : null}
            <TabsTrigger value='pending' className={tabTriggerClass}>
              Pending approvals
            </TabsTrigger>
            <TabsTrigger value='commerce' className={tabTriggerClass}>
              Commerce
            </TabsTrigger>
            <TabsTrigger value='audit' className={tabTriggerClass}>
              Audit trail
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value='overview' className='mt-4'>
            <div className='grid gap-4 xl:grid-cols-2'>
              <SectionCard
                title='Identity & contact'
                description='Edit profile details and toggle access.'
              >
                <UserIdentityForm user={user} />
              </SectionCard>

              <SectionCard
                title='Roles & access'
                description='Domains and organisation affiliations.'
              >
                <div className='space-y-4'>
                  <div>
                    <p className={adminTheme.sectionLabel}>Platform domains</p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {userDomains.length ? (
                        userDomains.map(domain => (
                          <Badge key={domain} variant='secondary' className='uppercase'>
                            {domain.replace(/_/g, ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className='text-muted-foreground text-sm'>No domains assigned</span>
                      )}
                    </div>
                  </div>

                  {user.organisation_affiliations?.length ? (
                    <div className='space-y-2'>
                      <p className={adminTheme.sectionLabel}>Organisation affiliations</p>
                      {user.organisation_affiliations.map((affiliation, index) => (
                        <div
                          key={`${affiliation.organisation_uuid}-${index}`}
                          className='border-border/60 bg-muted/20 flex items-center justify-between rounded-md border px-3 py-2 text-sm'
                        >
                          <div>
                            <p className='text-foreground font-medium'>
                              {affiliation.organisation_name ?? 'Organisation'}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {affiliation.domain_in_organisation?.replace(/_/g, ' ') ?? 'Member'}
                              {affiliation.branch_name ? ` · ${affiliation.branch_name}` : ''}
                            </p>
                          </div>
                          <StatusBadge status={affiliation.active ? 'active' : 'inactive'} />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <DetailGrid
                    items={[
                      {
                        label: 'User no.',
                        value: <span className='font-mono'>{user.user_no ?? '—'}</span>,
                      },
                      {
                        label: 'Admin',
                        value: adminStatusQuery.isLoading
                          ? '—'
                          : adminStatusQuery.data?.data
                            ? 'Yes'
                            : 'No',
                      },
                      {
                        label: 'System admin',
                        value: systemAdminStatusQuery.isLoading
                          ? '—'
                          : systemAdminStatusQuery.data?.data
                            ? 'Yes'
                            : 'No',
                      },
                      { label: 'Joined', value: formatDate(user.created_date) },
                      { label: 'Last updated', value: formatDate(user.updated_date) },
                      {
                        label: 'UUID',
                        value: <span className='font-mono text-xs break-all'>{user.uuid}</span>,
                      },
                    ]}
                    columns={3}
                  />
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* Credentials */}
          {hasCredentials ? (
            <TabsContent value='credentials' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={6} />}>
                <CredentialsAsyncTab
                  active={tab === 'credentials'}
                  userUuid={uuid}
                  verifierIdentity={verifier}
                />
              </Suspense>
            </TabsContent>
          ) : null}

          {/* Professional profile */}
          {hasCredentials ? (
            <TabsContent value='professional-profile' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={6} />}>
                <ProfessionalProfileAsyncTab
                  active={tab === 'professional-profile'}
                  userUuid={uuid}
                  verifierIdentity={verifier}
                />
              </Suspense>
            </TabsContent>
          ) : null}

          {/* Content & approvals */}
          {hasCredentials ? (
            <TabsContent value='content' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={5} />}>
                <ContentAsyncTab active={tab === 'content'} userUuid={uuid} />
              </Suspense>
            </TabsContent>
          ) : null}

          {hasInstructor ? (
            <TabsContent value='training' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={5} />}>
                <TrainingAsyncTab
                  active={tab === 'training'}
                  instructorUuid={profiles?.instructorUuid}
                />
              </Suspense>
            </TabsContent>
          ) : null}

          {/* Reviews & ratings */}
          {hasCredentials ? (
            <TabsContent value='reviews' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={5} />}>
                <ReviewsAsyncTab
                  active={tab === 'reviews'}
                  userUuid={uuid}
                  instructorUuid={profiles?.instructorUuid}
                />
              </Suspense>
            </TabsContent>
          ) : null}

          {/* Classes */}
          {hasInstructor && profiles?.instructorUuid ? (
            <TabsContent value='classes' className='mt-4'>
              <Suspense fallback={<SectionCardSkeleton rows={5} />}>
                <ClassesTab instructorUuid={profiles.instructorUuid} active={tab === 'classes'} />
              </Suspense>
            </TabsContent>
          ) : null}

          {/* Enrollments & certificates */}
          {hasStudent && profiles?.studentUuid ? (
            <TabsContent value='learning' className='mt-4'>
              <Suspense
                fallback={
                  <div className='space-y-4'>
                    <SectionCardSkeleton rows={3} />
                    <SectionCardSkeleton rows={3} />
                  </div>
                }
              >
                <StudentActivityTab
                  studentUuid={profiles.studentUuid}
                  active={tab === 'learning'}
                />
              </Suspense>
            </TabsContent>
          ) : null}

          <TabsContent value='pending' className='mt-4'>
            <Suspense fallback={<SectionCardSkeleton rows={5} />}>
              <PendingApprovalsAsyncTab
                active={tab === 'pending'}
                userUuid={uuid}
                instructorUuid={profiles?.instructorUuid}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value='commerce' className='mt-4'>
            <Suspense fallback={<SectionCardSkeleton rows={5} />}>
              <CommerceAsyncTab active={tab === 'commerce'} userUuid={uuid} />
            </Suspense>
          </TabsContent>

          <TabsContent value='audit' className='mt-4'>
            <Suspense fallback={<SectionCardSkeleton rows={7} />}>
              <AuditTrailAsyncTab
                active={tab === 'audit'}
                userUuid={uuid}
                targetUuids={targetUuids}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
