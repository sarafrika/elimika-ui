'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Briefcase, GraduationCap, Loader2, ShieldCheck, UserCog } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { AsyncSection } from '@/components/data/async-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import type { DomainNameEnum, User } from '@/services/client';
import {
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationAndDomainQueryKey,
  setOrganisationUserDomainMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  AdminPageHeader,
  adminTheme,
  SectionCard,
  StatCard,
  StatCardSkeleton,
} from '../_components/ui';

/** The org-scoped roles an organisation can assign to its members. */
const ROLES: Array<{ value: string; label: string; hint: string }> = [
  { value: 'organisation_user', label: 'Control user', hint: 'Manages the organisation' },
  { value: 'admin', label: 'Admin', hint: 'Full administrative access' },
  { value: 'instructor', label: 'Instructor', hint: 'Delivers training' },
  { value: 'student', label: 'Student', hint: 'Enrolled learner' },
];

const roleLabel = (value?: string) => ROLES.find(r => r.value === value)?.label ?? value ?? '—';

const fullName = (user?: User): string =>
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || (user?.email ?? '—');

type MemberRow = { user: User; role: string };

export default function OrganisationUsersPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);
  const qc = useQueryClient();

  const roleQueries = useQueries({
    queries: ROLES.map(role => ({
      ...getUsersByOrganisationAndDomainOptions({
        path: { uuid: organisationUuid, domainName: role.value },
      }),
      enabled,
    })),
  });

  const isLoading = roleQueries.some(q => q.isLoading);
  const isError = roleQueries.some(q => q.isError);
  const firstError = roleQueries.find(q => q.error)?.error;

  const { members, counts } = useMemo(() => {
    const byUser = new Map<string, MemberRow>();
    const tally: Record<string, number> = {};
    roleQueries.forEach((query, index) => {
      const roleDef = ROLES[index];
      if (!roleDef) return;
      const role = roleDef.value;
      const list = ((query.data as { data?: User[] } | undefined)?.data ?? []) as User[];
      tally[role] = list.length;
      for (const user of list) {
        if (user.uuid && !byUser.has(user.uuid)) {
          byUser.set(user.uuid, { user, role });
        }
      }
    });
    return { members: Array.from(byUser.values()), counts: tally };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleQueries.map(q => q.dataUpdatedAt).join(',')]);

  const refetchAll = () => {
    for (const role of ROLES) {
      qc.invalidateQueries({
        queryKey: getUsersByOrganisationAndDomainQueryKey({
          path: { uuid: organisationUuid, domainName: role.value },
        }),
      });
    }
  };

  const setDomain = useMutation({
    ...setOrganisationUserDomainMutation(),
    onSuccess: (_data, variables) => {
      toast.success(`Role updated to ${roleLabel(variables.body.domain_name)}`);
      refetchAll();
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : 'Could not update the member role'),
  });

  const changeRole = (userUuid: string, domain: string) => {
    setDomain.mutate({
      path: { uuid: organisationUuid, userUuid },
      body: { domain_name: domain as DomainNameEnum },
    });
  };

  return (
    <div className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Users'
          description='Define who does what in your organisation — control users, admins, instructors and students.'
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {isLoading ? (
            ROLES.map(r => <StatCardSkeleton key={r.value} />)
          ) : (
            <>
              <StatCard label='Control users' value={counts.organisation_user ?? 0} icon={UserCog} tone='info' />
              <StatCard label='Admins' value={counts.admin ?? 0} icon={ShieldCheck} tone='neutral' />
              <StatCard label='Instructors' value={counts.instructor ?? 0} icon={Briefcase} tone='success' />
              <StatCard label='Students' value={counts.student ?? 0} icon={GraduationCap} tone='warning' />
            </>
          )}
        </div>

        <SectionCard title='Members' description='Set each member’s role in the organisation'>
          <AsyncSection
            loading={isLoading && members.length === 0}
            error={isError ? firstError : undefined}
            empty={members.length === 0}
            onRetry={refetchAll}
            emptyTitle='No members yet'
            emptyDescription='Members added to your organisation will appear here.'
            skeleton={
              <div className='space-y-2'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='flex items-center justify-between gap-3 py-2'>
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='h-3 w-56' />
                    </div>
                    <Skeleton className='h-9 w-44' />
                  </div>
                ))}
              </div>
            }
          >
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground'>
                    <th className='py-2 pr-3 font-medium'>Member</th>
                    <th className='py-2 pr-3 font-medium'>Email</th>
                    <th className='py-2 pr-3 font-medium'>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(({ user, role }) => (
                    <tr key={user.uuid} className='border-b border-border/40'>
                      <td className='py-2.5 pr-3 font-medium text-foreground'>{fullName(user)}</td>
                      <td className='py-2.5 pr-3 text-muted-foreground'>{user.email ?? '—'}</td>
                      <td className='py-2.5 pr-3'>
                        <div className='flex items-center gap-2'>
                          <Select
                            value={role}
                            onValueChange={value => user.uuid && changeRole(user.uuid, value)}
                            disabled={setDomain.isPending}
                          >
                            <SelectTrigger className='w-44'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {setDomain.isPending &&
                          setDomain.variables?.path?.userUuid === user.uuid ? (
                            <Loader2 className='size-4 animate-spin text-muted-foreground' />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncSection>
        </SectionCard>
      </div>
    </div>
  );
}
