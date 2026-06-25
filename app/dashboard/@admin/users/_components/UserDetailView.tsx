'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  FileCheck,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserProfile } from '@/context/profile-context';
import { fetchUserVerification } from '@/services/admin/credential-review';
import type { User } from '@/services/client';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';
import { adminTheme, type StatusTone, statusToneClass } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { DomainVerificationSection } from './DomainVerificationSection';
import { UserIdentityForm } from './UserIdentityForm';

const tabListClass =
  'h-auto w-full justify-start gap-2 rounded-none border-b border-border/70 bg-transparent p-0';
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

export function UserDetailView({ uuid }: { uuid: string }) {
  const admin = useUserProfile();
  const verifier = admin?.email || admin?.full_name || 'admin';

  const userQuery = useQuery(getUserByUuidOptions({ path: { uuid } }));
  const user = userQuery.data?.data as User | undefined;

  const verificationQuery = useQuery({
    queryKey: ['user-verification', uuid],
    queryFn: () => fetchUserVerification(uuid),
  });
  const domains = verificationQuery.data ?? [];

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
            <Link href='/dashboard/users'>Back to users</Link>
          </Button>
        </div>
      </main>
    );
  }

  const userDomains = domainList(user);
  const totalDocs = domains.reduce((sum, d) => sum + d.documents.length, 0);
  const verifiedDocs = domains.reduce(
    (sum, d) => sum + d.documents.filter(doc => doc.isVerified).length,
    0
  );
  const verifiedDomains = domains.filter(d => d.adminVerified).length;

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <div>
          <Button variant='ghost' size='sm' asChild className='-ml-2 mb-2 text-muted-foreground'>
            <Link href='/dashboard/users'>
              <ArrowLeft className='size-4' />
              Back to users
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
            label='Domains'
            value={userDomains.length}
            hint={verifiedDomains ? `${verifiedDomains} verified` : 'None verified'}
            icon={Layers}
          />
          <MetricTile
            label='Documents'
            value={verificationQuery.isLoading ? '—' : `${verifiedDocs}/${totalDocs}`}
            hint='verified'
            icon={FileCheck}
            tone={totalDocs > 0 && verifiedDocs === totalDocs ? 'success' : 'warning'}
          />
          <MetricTile
            label='Member since'
            value={formatDate(user.created_date)}
            icon={CalendarDays}
            tone='neutral'
          />
        </div>

        {/* Tabbed sections */}
        <Tabs defaultValue='overview'>
          <TabsList className={tabListClass}>
            <TabsTrigger value='overview' className={tabTriggerClass}>
              Overview
            </TabsTrigger>
            <TabsTrigger value='verification' className={tabTriggerClass}>
              Verification
              {domains.length ? (
                <Badge variant='secondary' className='ml-1.5 rounded px-1.5 text-[10px]'>
                  {domains.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value='verification' className='mt-4'>
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
                <SectionCard title='Verification' description='Credentials requiring review.'>
                  <p className='flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground'>
                    <ShieldAlert className='size-4' />
                    This user has no verifiable domains (instructor or course creator) with documents.
                  </p>
                </SectionCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
