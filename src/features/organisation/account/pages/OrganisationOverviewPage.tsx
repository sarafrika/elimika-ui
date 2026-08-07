'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Building, GraduationCap, Loader2, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { OrgPage } from '@/app/dashboard/organisation/_components/org-page';
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import { dayjs } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ClassDefinition, Organisation, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getOrganisationByUuidOptions,
  getOrganisationByUuidQueryKey,
  getOrganisationStatisticsOptions,
  getUsersByOrganisationAndDomainOptions,
  requestOrganisationVerificationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';

const num = (value?: bigint | number | null): string =>
  value === undefined || value === null ? '—' : Number(value).toLocaleString();

const money = (value?: number | null): string =>
  value === undefined || value === null
    ? '—'
    : Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

const fullName = (user?: User): string =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || (user?.email ?? '—');

/** Labelled figure inside a section card. */
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='bg-muted/20 rounded-lg border px-3 py-2.5'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
      <div className='text-foreground mt-1 text-sm font-medium'>{value ?? '—'}</div>
    </div>
  );
}

/** Titled card section with optional header action. */
function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className='space-y-4 p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <h2 className='text-foreground text-base font-semibold'>{title}</h2>
            <p className='text-muted-foreground text-sm'>{description}</p>
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Single, accurate overview of the organisation: profile, membership, branches,
 * training-fee posture and administrators — the read view for the account hub.
 */
export default function OrganisationOverviewPage() {
  const { activeDomain } = useUserDomain();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const profileQuery = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });
  const statsQuery = useQuery({
    ...getOrganisationStatisticsOptions({ path: { uuid: organisationUuid } }),
    enabled,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled,
  });
  const adminsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'organisation_user' },
    }),
    enabled,
  });

  const profile =
    extractEntity<Organisation>(profileQuery.data) ?? (organisation as Organisation | undefined);
  const stats = statsQuery.data?.data;

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );
  const feeSummary = useMemo(() => {
    const fees = classes
      .map(c => (c.training_fee == null ? null : Number(c.training_fee)))
      .filter((f): f is number => f != null && !Number.isNaN(f));
    if (fees.length === 0)
      return {
        count: 0,
        min: null as number | null,
        max: null as number | null,
        avg: null as number | null,
      };
    const min = Math.min(...fees);
    const max = Math.max(...fees);
    const avg = fees.reduce((s, f) => s + f, 0) / fees.length;
    return { count: fees.length, min, max, avg };
  }, [classes]);

  const admins = useMemo(() => {
    const raw = adminsQuery.data as { data?: User[] } | User[] | undefined;
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return list as User[];
  }, [adminsQuery.data]);

  const isVerified = Boolean(profile?.admin_verified);
  const requestedAt = profile?.verification_requested_at;
  const awaitingReview = !isVerified && Boolean(requestedAt);
  const kpiLoading = statsQuery.isLoading;

  const qc = useQueryClient();
  const requestVerification = useMutation({
    ...requestOrganisationVerificationMutation(),
    onSuccess: () => {
      toast.success('Submitted for verification', {
        description: 'An admin will review your organisation shortly.',
      });
      qc.invalidateQueries({
        queryKey: getOrganisationByUuidQueryKey({ path: { uuid: organisationUuid } }),
      });
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : 'Unable to submit for verification.'),
  });

  const verificationLabel = isVerified
    ? 'Verified'
    : awaitingReview
      ? 'Awaiting review'
      : 'Not submitted';

  return (
    <OrgPage className='space-y-6'>
      <PageHeader
        title={profile?.name || 'Organisation'}
        description='A complete view of your organisation — profile, people, branches and fees.'
        action={
          <div className='flex flex-wrap items-center gap-2'>
            <Badge
              variant='outline'
              className={cn(
                'rounded-md px-2.5 py-0.5 text-xs font-medium',
                isVerified
                  ? 'border-success/30 bg-success/10 text-success'
                  : awaitingReview
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-warning/30 bg-warning/10 text-warning'
              )}
            >
              {verificationLabel}
            </Badge>
            {!isVerified ? (
              <Button
                size='sm'
                variant={awaitingReview ? 'outline' : 'default'}
                disabled={requestVerification.isPending || !organisationUuid}
                onClick={() => requestVerification.mutate({ path: { uuid: organisationUuid } })}
              >
                {requestVerification.isPending ? (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                ) : null}
                {awaitingReview ? 'Resubmit for verification' : 'Submit for verification'}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title='Students'
              value={num(stats?.total_students)}
              icon={<GraduationCap className='h-5 w-5' />}
              variant='green'
            />
            <KpiCard
              title='Instructors'
              value={num(stats?.total_instructors)}
              icon={<Briefcase className='h-5 w-5' />}
              variant='primary'
            />
            <KpiCard
              title='Administrators'
              value={num(stats?.total_admins)}
              icon={<Users className='h-5 w-5' />}
              variant='indigo'
            />
            <KpiCard
              title='Branches'
              value={num(stats?.total_branches)}
              icon={<Building className='h-5 w-5' />}
              variant='amber'
            />
          </>
        )}
      </div>

      <div className='grid gap-4 xl:grid-cols-2'>
        <Section
          title='Profile'
          description='Registered organisation details'
          action={
            <Button asChild size='sm' variant='outline'>
              <Link href={buildWorkspaceAliasPath(activeDomain, '/dashboard/account/training-center')}>Edit</Link>
            </Button>
          }
        >
          <div className='grid gap-3 sm:grid-cols-2'>
            <Detail label='Name' value={profile?.name ?? '—'} />
            <Detail label='Licence no.' value={profile?.licence_no ?? '—'} />
            <Detail label='Location' value={profile?.location ?? '—'} />
            <Detail label='Country' value={profile?.country ?? '—'} />
            <Detail label='Status' value={profile?.active ? 'Active' : 'Inactive'} />
            <Detail
              label='Verification'
              value={
                isVerified
                  ? 'Verified'
                  : awaitingReview
                    ? `Submitted ${dayjs.utc(requestedAt).format('DD MMM YYYY')}`
                    : 'Not submitted'
              }
            />
          </div>
        </Section>

        <Section
          title='Training fees'
          description='Per-session fees across your classes'
          action={
            <Button asChild size='sm' variant='outline'>
              <Link href={buildWorkspaceAliasPath(activeDomain, '/dashboard/account/fees-scheduling')}>Manage</Link>
            </Button>
          }
        >
          <div className='grid gap-3 sm:grid-cols-2'>
            <Detail label='Classes with a fee' value={num(feeSummary.count)} />
            <Detail label='Average fee / session' value={money(feeSummary.avg)} />
            <Detail label='Lowest fee' value={money(feeSummary.min)} />
            <Detail label='Highest fee' value={money(feeSummary.max)} />
          </div>
        </Section>
      </div>

      <Section
        title='Administrators'
        description='People who manage this organisation'
        action={
          <Button asChild size='sm' variant='outline'>
            <Link href={buildWorkspaceAliasPath(activeDomain, '/dashboard/account/admin')}>Manage</Link>
          </Button>
        }
      >
        {adminsQuery.isLoading ? (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No administrators found.</p>
        ) : (
          <ul className='divide-y'>
            {admins.map(admin => (
              <li
                key={admin.uuid ?? admin.email}
                className='flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0'
              >
                <span className='inline-flex min-w-0 items-center gap-2'>
                  <ShieldCheck className='text-primary size-4 shrink-0' />
                  <span className='text-foreground truncate text-sm font-medium'>
                    {fullName(admin)}
                  </span>
                </span>
                <span className='text-muted-foreground truncate text-xs'>{admin.email ?? ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </OrgPage>
  );
}
