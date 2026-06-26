'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  FileCheck,
  Layers,
  ShieldAlert,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import {
  type CredentialDocument,
  type DomainVerification,
  fetchUserVerification,
  resolveUserProfiles,
} from '@/services/admin/credential-review';
import type { User } from '@/services/client';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { adminTheme, type StatusTone, statusToneClass } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { ClassesTab } from './ClassesTab';
import { ContentApprovalsTab } from './ContentApprovalsTab';
import { DomainVerificationSection } from './DomainVerificationSection';
import { ReviewsRatingsTab } from './ReviewsRatingsTab';
import { StudentActivityTab } from './StudentActivityTab';
import { UserIdentityForm } from './UserIdentityForm';

const tabListClass =
  'h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0';
const tabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-1 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

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

/** All documents for a domain, including supporting certificates nested under education. */
function domainDocuments(domain: DomainVerification): CredentialDocument[] {
  return [...domain.documents, ...domain.education.flatMap(record => record.documents ?? [])];
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
    <div className='flex items-center gap-3 rounded-md border border-border/70 bg-card p-4 shadow-sm'>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          statusToneClass[tone]
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          {label}
        </p>
        <div className='truncate text-lg font-semibold text-foreground'>{value}</div>
        {hint ? <p className='truncate text-xs text-muted-foreground'>{hint}</p> : null}
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
  const user = userQuery.data?.data as User | undefined;

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

  // Heavy credential assembly powers the Credentials / Content / Reviews tabs + KPI tiles.
  const verificationQuery = useQuery({
    queryKey: ['user-verification', uuid],
    queryFn: () => fetchUserVerification(uuid),
  });
  const domains = verificationQuery.data ?? [];
  const instructorDomain = domains.find(d => d.role === 'instructor');
  const contentItems = domains.flatMap(d => d.contentItems);
  const courseItems = contentItems.filter(c => c.type === 'course');
  const pendingCount = domains.reduce((sum, d) => sum + d.pendingCount, 0);

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
          <ShieldAlert className='size-10 text-muted-foreground' />
          <p className='text-lg font-semibold'>User not found</p>
          <Button variant='outline' asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </main>
    );
  }

  const userDomains = domainList(user);
  const allDocs = domains.flatMap(domainDocuments);
  const totalDocs = allDocs.length;
  const verifiedDocs = allDocs.filter(doc => doc.isVerified).length;

  // Third KPI tile adapts to the user's primary domain.
  const thirdTile = hasCreator ? (
    <MetricTile
      label='Pending approvals'
      value={verificationQuery.isLoading ? '—' : pendingCount}
      hint='courses & programs'
      icon={ClipboardCheck}
      tone={pendingCount > 0 ? 'warning' : 'success'}
    />
  ) : instructorDomain ? (
    <MetricTile
      label='Rating'
      value={
        verificationQuery.isLoading
          ? '—'
          : instructorDomain.averageRating != null
            ? `${Math.round(instructorDomain.averageRating * 10) / 10}`
            : '—'
      }
      hint={`${instructorDomain.reviewCount} reviews`}
      icon={Star}
      tone='info'
    />
  ) : (
    <MetricTile
      label='Documents'
      value={verificationQuery.isLoading ? '—' : `${verifiedDocs}/${totalDocs}`}
      hint='verified'
      icon={FileCheck}
      tone={totalDocs > 0 && verifiedDocs === totalDocs ? 'success' : 'warning'}
    />
  );

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div>
          <Button variant='ghost' size='sm' asChild className='-ml-2 mb-2 text-muted-foreground'>
            <Link href={backHref}>
              <ArrowLeft className='size-4' />
              {backLabel}
            </Link>
          </Button>

          {/* Identity header */}
          <header className='flex flex-col gap-4 rounded-md border border-border/70 bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <Avatar className='size-14'>
                {user.profile_image_url ? <AvatarImage src={user.profile_image_url} alt='' /> : null}
                <AvatarFallback className='text-lg font-semibold'>{initials(user)}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <h1 className='truncate text-2xl font-semibold tracking-tight text-foreground'>
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </h1>
                <p className='truncate text-sm text-muted-foreground'>{user.email}</p>
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
            hint={[hasInstructor && 'instructor', hasCreator && 'creator', hasStudent && 'student']
              .filter(Boolean)
              .join(' · ') || 'No domains'}
            icon={Layers}
          />
          {thirdTile}
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
                {domains.length ? (
                  <Badge variant='secondary' className='ml-1.5 rounded px-1.5 text-[10px]'>
                    {domains.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ) : null}
            {hasCredentials ? (
              <TabsTrigger value='content' className={tabTriggerClass}>
                Content & approvals
                {pendingCount ? (
                  <Badge className='ml-1.5 rounded bg-warning/15 px-1.5 text-[10px] text-warning'>
                    {pendingCount}
                  </Badge>
                ) : null}
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
          </TabsList>

          {/* Overview */}
          <TabsContent value='overview' className='mt-4'>
            <div className='grid gap-4 xl:grid-cols-2'>
              <SectionCard title='Identity & contact' description='Edit profile details and toggle access.'>
                <UserIdentityForm user={user} />
              </SectionCard>

              <SectionCard title='Roles & access' description='Domains and organisation affiliations.'>
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
                        <span className='text-sm text-muted-foreground'>No domains assigned</span>
                      )}
                    </div>
                  </div>

                  {user.organisation_affiliations?.length ? (
                    <div className='space-y-2'>
                      <p className={adminTheme.sectionLabel}>Organisation affiliations</p>
                      {user.organisation_affiliations.map((affiliation, index) => (
                        <div
                          key={`${affiliation.organisation_uuid}-${index}`}
                          className='flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm'
                        >
                          <div>
                            <p className='font-medium text-foreground'>
                              {affiliation.organisation_name ?? 'Organisation'}
                            </p>
                            <p className='text-xs text-muted-foreground'>
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
                      { label: 'User no.', value: <span className='font-mono'>{user.user_no ?? '—'}</span> },
                      { label: 'Joined', value: formatDate(user.created_date) },
                      { label: 'Last updated', value: formatDate(user.updated_date) },
                      { label: 'UUID', value: <span className='break-all font-mono text-xs'>{user.uuid}</span> },
                    ]}
                  />
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* Credentials */}
          {hasCredentials ? (
            <TabsContent value='credentials' className='mt-4'>
              <div className='flex flex-col gap-4'>
                {verificationQuery.isLoading ? (
                  <SectionCardSkeleton rows={5} />
                ) : domains.length ? (
                  domains.map(domain => (
                    <DomainVerificationSection
                      key={domain.role}
                      domain={domain}
                      verifierIdentity={verifier}
                      onChanged={() => verificationQuery.refetch()}
                    />
                  ))
                ) : (
                  <SectionCard title='Credentials' description='Credentials requiring review.'>
                    <p className='flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground'>
                      <ShieldAlert className='size-4' />
                      No verifiable credentials found for this user.
                    </p>
                  </SectionCard>
                )}
              </div>
            </TabsContent>
          ) : null}

          {/* Content & approvals */}
          {hasCredentials ? (
            <TabsContent value='content' className='mt-4'>
              <ContentApprovalsTab
                items={contentItems}
                pendingCount={pendingCount}
                isLoading={verificationQuery.isLoading}
                onModerated={() => verificationQuery.refetch()}
              />
            </TabsContent>
          ) : null}

          {/* Reviews & ratings */}
          {hasCredentials ? (
            <TabsContent value='reviews' className='mt-4'>
              <ReviewsRatingsTab
                instructorDomain={instructorDomain}
                courses={courseItems}
                instructorUuid={profiles?.instructorUuid}
                active={tab === 'reviews'}
              />
            </TabsContent>
          ) : null}

          {/* Classes */}
          {hasInstructor && profiles?.instructorUuid ? (
            <TabsContent value='classes' className='mt-4'>
              <ClassesTab instructorUuid={profiles.instructorUuid} active={tab === 'classes'} />
            </TabsContent>
          ) : null}

          {/* Enrollments & certificates */}
          {hasStudent && profiles?.studentUuid ? (
            <TabsContent value='learning' className='mt-4'>
              <StudentActivityTab studentUuid={profiles.studentUuid} active={tab === 'learning'} />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </main>
  );
}
