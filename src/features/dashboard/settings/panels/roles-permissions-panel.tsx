'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { extractList, extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { DomainNameEnum, TrainingBranch, User } from '@/services/client';
import {
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationAndDomainQueryKey,
  sendOrganisationInvitationsMutation,
  setOrganisationUserDomainMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';

const ORGANISATION_WIDE = '__organisation_wide__';

/**
 * The four org-scoped domains the backend actually recognises
 * (`ORG_SCOPED_DOMAINS`). Descriptions describe *who holds the role*, not what it
 * unlocks: there is no permission concept finer than a domain anywhere in the
 * platform, so any capability copy here would be fiction.
 */
const ORG_ROLES: Array<{ domain: DomainNameEnum; label: string; description: string }> = [
  {
    domain: 'admin',
    label: 'Default Admin',
    description: 'Members who administer this organisation’s workspace.',
  },
  {
    domain: 'organisation_user',
    label: 'Staff',
    description: 'Members who run day-to-day operations for this organisation.',
  },
  {
    domain: 'instructor',
    label: 'Instructor',
    description: 'Members who teach this organisation’s classes.',
  },
  {
    domain: 'student',
    label: 'Student',
    description: 'Learners affiliated with this organisation.',
  },
];

const fullName = (user?: User) =>
  user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || 'Member' : '—';

const initials = (user?: User) =>
  user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
      (user.email?.[0] ?? '?').toUpperCase()
    : '?';

export function RolesPermissionsPanel() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const enabled = Boolean(organisationUuid);

  const [manageDomain, setManageDomain] = useState<DomainNameEnum | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Four parallel calls, one per domain. `GET /{uuid}/statistics` is deliberately
  // not used: its `total_admins` actually counts `organisation_user`. Deriving
  // counts from `UserDTO.user_domain` is wrong too — it reports an org-scoped
  // admin as `organisation_user`, never `admin`.
  const adminQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'admin' },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const staffQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'organisation_user' },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const instructorQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });
  const studentQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled,
    staleTime: STALE_TIMES.entity,
  });

  const byDomain: Record<DomainNameEnum, { users: User[]; isLoading: boolean }> = {
    admin: { users: extractList<User>(adminQuery.data), isLoading: adminQuery.isLoading },
    organisation_user: {
      users: extractList<User>(staffQuery.data),
      isLoading: staffQuery.isLoading,
    },
    instructor: {
      users: extractList<User>(instructorQuery.data),
      isLoading: instructorQuery.isLoading,
    },
    student: { users: extractList<User>(studentQuery.data), isLoading: studentQuery.isLoading },
  };

  const activeRole = ORG_ROLES.find(role => role.domain === manageDomain) ?? null;

  return (
    <>
      <Card className='border-border/70 rounded-md p-0 shadow-sm'>
        <CardHeader className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5'>
          <div className='min-w-0'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
              <ShieldCheck className='text-primary size-4 sm:size-5' />
              Roles &amp; Permissions
            </CardTitle>
            <CardDescription>Manage who holds which role in your institution.</CardDescription>
          </div>
          <Button size='sm' disabled={!enabled} onClick={() => setInviteOpen(true)}>
            <UserPlus className='mr-1 h-4 w-4' /> Invite a member
          </Button>
        </CardHeader>

        <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
          <div className='border-border/70 bg-muted/30 text-muted-foreground flex items-start gap-2.5 rounded-[16px] border px-4 py-3 text-xs sm:text-sm'>
            <Info className='mt-0.5 h-4 w-4 shrink-0' />
            <p>
              Elimika has no permission setting finer than a role, and a member holds exactly one
              role per organisation. Managing a role changes membership, not capabilities.
            </p>
          </div>

          {ORG_ROLES.map(role => {
            const { users, isLoading } = byDomain[role.domain];
            return (
              <div
                key={role.domain}
                className='border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border p-4'
              >
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-medium'>{role.label}</p>
                    {isLoading ? (
                      <Skeleton className='h-5 w-16 rounded-full' />
                    ) : (
                      <Badge variant='secondary'>
                        {users.length} {users.length === 1 ? 'member' : 'members'}
                      </Badge>
                    )}
                  </div>
                  <p className='text-muted-foreground text-sm'>{role.description}</p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={!enabled}
                  onClick={() => setManageDomain(role.domain)}
                >
                  Manage
                </Button>
              </div>
            );
          })}

          <div className='border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-dashed p-4'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-muted-foreground font-medium'>Finance Officer</p>
                <Badge variant='outline'>Not available</Badge>
              </div>
              <p className='text-muted-foreground text-sm'>
                No such role exists in the platform — there is no matching domain to assign anyone
                to, so it cannot be managed here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ManageRoleSheet
        open={Boolean(activeRole)}
        onOpenChange={open => {
          if (!open) setManageDomain(null);
        }}
        organisationUuid={organisationUuid}
        roleLabel={activeRole?.label ?? ''}
        domain={activeRole?.domain ?? null}
        members={activeRole ? byDomain[activeRole.domain].users : []}
        isLoading={activeRole ? byDomain[activeRole.domain].isLoading : false}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organisationUuid={organisationUuid}
      />
    </>
  );
}

type ManageRoleSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationUuid: string;
  roleLabel: string;
  domain: DomainNameEnum | null;
  members: User[];
  isLoading: boolean;
};

function ManageRoleSheet({
  open,
  onOpenChange,
  organisationUuid,
  roleLabel,
  domain,
  members,
  isLoading,
}: ManageRoleSheetProps) {
  const queryClient = useQueryClient();
  const [pendingUserUuid, setPendingUserUuid] = useState<string | null>(null);

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: open && Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const branches = extractPage<TrainingBranch>(branchesQuery.data).items;

  const setDomain = useMutation(setOrganisationUserDomainMutation());

  const invalidateDomain = (domainName: DomainNameEnum) =>
    queryClient.invalidateQueries({
      queryKey: getUsersByOrganisationAndDomainQueryKey({
        path: { uuid: organisationUuid, domainName },
      }),
    });

  const changeRole = async (user: User, nextDomain: DomainNameEnum, branchUuid?: string) => {
    if (!user.uuid || !domain) return;

    setPendingUserUuid(user.uuid);
    try {
      await setDomain.mutateAsync({
        path: { uuid: organisationUuid, userUuid: user.uuid },
        body: {
          domain_name: nextDomain,
          branch_uuid: branchUuid && branchUuid !== ORGANISATION_WIDE ? branchUuid : null,
        },
      });
      toast.success(`${fullName(user)} updated`);
      // The assignment is an upsert, so the member leaves the old list and joins
      // the new one — both caches have to be dropped.
      await invalidateDomain(domain);
      if (nextDomain !== domain) {
        await invalidateDomain(nextDomain);
      }
    } catch {
      toast.error('Could not update that member’s role.');
    } finally {
      setPendingUserUuid(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full gap-0 sm:max-w-lg'>
        <SheetHeader className='px-6 pt-6'>
          <SheetTitle>{roleLabel}</SheetTitle>
          <SheetDescription>
            Everyone currently holding this role. A member can hold only one role per organisation,
            so changing a role here moves them out of this list.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-3 overflow-y-auto px-6 py-5'>
          {isLoading ? (
            <div className='space-y-2'>
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className='h-16 w-full' />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className='text-muted-foreground border-border/70 rounded-md border border-dashed py-8 text-center text-sm'>
              Nobody holds this role yet.
            </p>
          ) : (
            members.map(member => (
              <MemberRoleRow
                key={member.uuid}
                member={member}
                currentDomain={domain}
                branches={branches}
                isPending={pendingUserUuid === member.uuid}
                onChange={changeRole}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type MemberRoleRowProps = {
  member: User;
  currentDomain: DomainNameEnum | null;
  branches: TrainingBranch[];
  isPending: boolean;
  onChange: (member: User, nextDomain: DomainNameEnum, branchUuid?: string) => Promise<void>;
};

function MemberRoleRow({
  member,
  currentDomain,
  branches,
  isPending,
  onChange,
}: MemberRoleRowProps) {
  const [nextDomain, setNextDomain] = useState<DomainNameEnum>(currentDomain ?? 'organisation_user');
  const [branchUuid, setBranchUuid] = useState<string>(ORGANISATION_WIDE);

  const isChanged = nextDomain !== currentDomain || branchUuid !== ORGANISATION_WIDE;

  return (
    <div className='border-border/70 space-y-3 rounded-[16px] border p-3'>
      <div className='flex items-center gap-3'>
        <Avatar className='h-8 w-8'>
          <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
            {initials(member)}
          </AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{fullName(member)}</p>
          <p className='text-muted-foreground truncate text-xs'>{member.email}</p>
        </div>
      </div>

      <div className='grid gap-2 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label className='text-xs'>Role</Label>
          <Select
            value={nextDomain}
            onValueChange={value => setNextDomain(value as DomainNameEnum)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORG_ROLES.map(role => (
                <SelectItem key={role.domain} value={role.domain}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs'>Branch</Label>
          <Select value={branchUuid} onValueChange={setBranchUuid}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ORGANISATION_WIDE}>Organisation-wide</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.uuid} value={branch.uuid as string}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex justify-end'>
        <Button
          size='sm'
          disabled={!isChanged || isPending}
          onClick={() => void onChange(member, nextDomain, branchUuid)}
        >
          {isPending ? 'Saving…' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationUuid: string;
};

/**
 * Adding a member goes through the invitation flow. The AdminController
 * create-user path is platform-admin-only and 403s for an organisation admin.
 */
function InviteMemberDialog({ open, onOpenChange, organisationUuid }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<DomainNameEnum>('organisation_user');

  const sendInvitations = useMutation(sendOrganisationInvitationsMutation());

  const reset = () => {
    setEmail('');
    setName('');
    setDomain('organisation_user');
  };

  const submit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Enter an email address to invite.');
      return;
    }

    try {
      await sendInvitations.mutateAsync({
        path: { organisationUuid },
        body: {
          recipients: [{ email: trimmedEmail, name: name.trim() || null }],
          domain_name: domain,
        },
      });
      toast.success('Invitation sent', { description: trimmedEmail });
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Could not send that invitation.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            An invitation is emailed to the address below. No account exists until they accept.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='invite-email'>Email</Label>
            <div className='relative'>
              <Mail className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                id='invite-email'
                type='email'
                className='pl-9'
                placeholder='name@example.com'
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='invite-name'>Name (optional)</Label>
            <Input
              id='invite-name'
              placeholder='Jane Doe'
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Role</Label>
            <Select value={domain} onValueChange={value => setDomain(value as DomainNameEnum)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_ROLES.map(role => (
                  <SelectItem key={role.domain} value={role.domain}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={sendInvitations.isPending}>
            {sendInvitations.isPending ? 'Sending…' : 'Send invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
