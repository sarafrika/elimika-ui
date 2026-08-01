'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  GitBranch,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  fetchOrganisationBranches,
  fetchOrganisationClasses,
  fetchOrganisationMembers,
} from '@/services/admin/organisation-review';
import {
  useUnverifyAdminOrganisation,
  useVerifyAdminOrganisation,
} from '@/services/admin/organizations';
import type { Organisation } from '@/services/client';
import { getOrganisationByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { adminTheme, type StatusTone, statusToneClass } from '../../_components/ui/admin-theme';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

const tabListClass =
  'h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0';
const tabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-1 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

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
        <p className='text-muted-foreground truncate text-xs font-medium tracking-wide uppercase'>
          {label}
        </p>
        <div className='text-foreground truncate text-lg font-semibold'>{value}</div>
        {hint ? <p className='text-muted-foreground truncate text-xs'>{hint}</p> : null}
      </div>
    </div>
  );
}

function BranchesTab({ uuid, active }: { uuid: string; active: boolean }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['org-branches', uuid],
    queryFn: () => fetchOrganisationBranches(uuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });
  const branches = data ?? [];
  return (
    <SectionCard title='Branches' description='Training branches operated by this organisation.'>
      <AsyncSection
        loading={isLoading && !data}
        error={isError ? error : undefined}
        empty={branches.length === 0}
        onRetry={refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={<p className='text-muted-foreground text-sm'>No branches registered.</p>}
      >
        <div className='space-y-3'>
          {branches.map(branch => (
            <div key={branch.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <GitBranch className='text-muted-foreground size-4 shrink-0' />
                  <p className='text-foreground truncate text-sm font-medium'>{branch.name}</p>
                </div>
                <StatusBadge status={branch.active ? 'active' : 'inactive'} />
              </div>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Address', value: branch.address || '—' },
                  { label: 'Contact', value: branch.pocName || '—' },
                  { label: 'Email', value: branch.pocEmail || '—' },
                ]}
              />
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

function MembersTab({ uuid, active }: { uuid: string; active: boolean }) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['org-members', uuid],
    queryFn: () => fetchOrganisationMembers(uuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });
  const members = data ?? [];
  return (
    <SectionCard title='Members' description='People affiliated with this organisation.'>
      <AsyncSection
        loading={isLoading && !data}
        error={isError ? error : undefined}
        empty={members.length === 0}
        onRetry={refetch}
        skeleton={
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={<p className='text-muted-foreground text-sm'>No members affiliated.</p>}
      >
        <div className='space-y-2'>
          {members.map(member => (
            <button
              type='button'
              key={member.userUuid ?? member.email}
              onClick={() =>
                member.userUuid && router.push(`/dashboard/admin/users/${member.userUuid}`)
              }
              className='border-border/60 bg-muted/20 hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors'
            >
              <div className='min-w-0'>
                <p className='text-foreground truncate text-sm font-medium'>{member.name}</p>
                <p className='text-muted-foreground truncate text-xs'>
                  {member.email || '—'}
                  {member.domain ? ` · ${member.domain}` : ''}
                  {member.branch ? ` · ${member.branch}` : ''}
                </p>
              </div>
              <StatusBadge status={member.active ? 'active' : 'inactive'} />
            </button>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

function ClassesTab({ uuid, active }: { uuid: string; active: boolean }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['org-classes', uuid],
    queryFn: () => fetchOrganisationClasses(uuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });
  const classes = data ?? [];
  return (
    <SectionCard title='Classes' description='Classes offered under this organisation.'>
      <AsyncSection
        loading={isLoading && !data}
        error={isError ? error : undefined}
        empty={classes.length === 0}
        onRetry={refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={<p className='text-muted-foreground text-sm'>No classes offered.</p>}
      >
        <div className='space-y-3'>
          {classes.map(klass => (
            <div key={klass.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <CalendarClock className='text-muted-foreground size-4 shrink-0' />
                  <p className='text-foreground truncate text-sm font-medium'>{klass.title}</p>
                </div>
                <StatusBadge status={klass.isActive ? 'active' : 'inactive'} />
              </div>
              <DetailGrid
                columns={3}
                items={[
                  {
                    label: 'Format',
                    value: <span className='capitalize'>{klass.sessionFormat || '—'}</span>,
                  },
                  {
                    label: 'Location',
                    value: <span className='capitalize'>{klass.locationType || '—'}</span>,
                  },
                  {
                    label: 'Capacity',
                    value: klass.maxParticipants != null ? String(klass.maxParticipants) : '—',
                  },
                ]}
              />
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

export function OrganizationDetailView({
  uuid,
  backHref = '/dashboard/admin/organizations',
  backLabel = 'Back to organisations',
}: {
  uuid: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [tab, setTab] = useState('overview');
  const orgQuery = useQuery(getOrganisationByUuidOptions({ path: { uuid } }));
  const org = orgQuery.data?.data as Organisation | undefined;

  const verify = useVerifyAdminOrganisation();
  const unverify = useUnverifyAdminOrganisation();
  const isMutating = verify.isPending || unverify.isPending;

  const runVerification = (action: 'verify' | 'revoke') => {
    const mutation = action === 'verify' ? verify : unverify;
    mutation.mutate(
      { path: { uuid }, query: { action: action === 'verify' ? 'approve' : 'revoke' } },
      {
        onSuccess: () => {
          toast.success(action === 'verify' ? 'Organisation verified' : 'Verification revoked');
          orgQuery.refetch();
        },
        onError: error => toast.error(error instanceof Error ? error.message : 'Action failed'),
      }
    );
  };

  if (orgQuery.isLoading) {
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

  if (!org) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <ShieldAlert className='text-muted-foreground size-10' />
          <p className='text-lg font-semibold'>Organisation not found</p>
          <Button variant='outline' asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </main>
    );
  }

  const verified = Boolean(org.admin_verified);
  const locationLabel = [org.location, org.country].filter(Boolean).join(', ') || '—';

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

          <header className='border-border/70 bg-card flex flex-col gap-4 rounded-md border px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-4'>
              <span className='border-border/60 bg-muted/40 flex size-14 items-center justify-center rounded-md border'>
                <Building2 className='text-muted-foreground size-6' />
              </span>
              <div className='min-w-0'>
                <h1 className='text-foreground truncate text-2xl font-semibold tracking-tight'>
                  {org.name}
                </h1>
                <p className='text-muted-foreground truncate text-sm'>
                  {org.description || org.slug || '—'}
                </p>
                <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                  <StatusBadge status={org.active ? 'active' : 'inactive'} />
                  <StatusBadge
                    status={verified ? 'verified' : 'pending'}
                    label={verified ? 'Verified' : 'Unverified'}
                  />
                </div>
              </div>
            </div>
            <Button
              size='sm'
              variant={verified ? 'outline' : 'default'}
              disabled={isMutating}
              onClick={() => runVerification(verified ? 'revoke' : 'verify')}
            >
              {verified ? (
                <>
                  <ShieldX className='size-4' />
                  Revoke verification
                </>
              ) : (
                <>
                  <ShieldCheck className='size-4' />
                  Verify organisation
                </>
              )}
            </Button>
          </header>
        </div>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <MetricTile
            label='Status'
            value={org.active ? 'Active' : 'Inactive'}
            icon={BadgeCheck}
            tone={org.active ? 'success' : 'destructive'}
          />
          <MetricTile
            label='Verification'
            value={
              verified
                ? 'Verified'
                : org.verification_requested_at
                  ? `Submitted ${formatDate(org.verification_requested_at)}`
                  : 'Not submitted'
            }
            icon={ShieldCheck}
            tone={verified ? 'success' : org.verification_requested_at ? 'info' : 'warning'}
          />
          <MetricTile label='Location' value={locationLabel} icon={MapPin} tone='neutral' />
          <MetricTile
            label='Registered'
            value={formatDate(org.created_date)}
            icon={CalendarDays}
            tone='neutral'
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className={tabListClass}>
            <TabsTrigger value='overview' className={tabTriggerClass}>
              Overview
            </TabsTrigger>
            <TabsTrigger value='branches' className={tabTriggerClass}>
              <GitBranch className='size-4' />
              Branches
            </TabsTrigger>
            <TabsTrigger value='members' className={tabTriggerClass}>
              <Users className='size-4' />
              Members
            </TabsTrigger>
            <TabsTrigger value='classes' className={tabTriggerClass}>
              <CalendarClock className='size-4' />
              Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='mt-4'>
            <SectionCard
              title='Organisation profile'
              description='Registration and contact details.'
            >
              <DetailGrid
                columns={2}
                items={[
                  { label: 'Name', value: org.name },
                  {
                    label: 'Licence no.',
                    value: <span className='font-mono'>{org.licence_no || '—'}</span>,
                  },
                  { label: 'Location', value: locationLabel },
                  { label: 'Country', value: org.country || '—' },
                  {
                    label: 'Slug',
                    value: <span className='font-mono text-xs'>{org.slug || '—'}</span>,
                  },
                  {
                    label: 'Coordinates',
                    value:
                      org.latitude != null && org.longitude != null
                        ? `${org.latitude}, ${org.longitude}`
                        : '—',
                  },
                  { label: 'Registered', value: formatDate(org.created_date) },
                  { label: 'Last updated', value: formatDate(org.updated_date) },
                  {
                    label: 'UUID',
                    value: <span className='font-mono text-xs break-all'>{org.uuid}</span>,
                  },
                ]}
              />
              {org.description ? (
                <div className='mt-4 space-y-1'>
                  <p className={adminTheme.sectionLabel}>Description</p>
                  <p className='text-muted-foreground text-sm'>{org.description}</p>
                </div>
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value='branches' className='mt-4'>
            <BranchesTab uuid={uuid} active={tab === 'branches'} />
          </TabsContent>

          <TabsContent value='members' className='mt-4'>
            <MembersTab uuid={uuid} active={tab === 'members'} />
          </TabsContent>

          <TabsContent value='classes' className='mt-4'>
            <ClassesTab uuid={uuid} active={tab === 'classes'} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
