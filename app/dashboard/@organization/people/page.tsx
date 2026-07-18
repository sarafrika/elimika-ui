'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { elimikaDesignSystem } from '@/lib/design-system';
import { STALE_TIMES } from '@/lib/query-client';
import type { DomainDto, DomainNameEnum, TrainingBranch, User, Wallet } from '@/services/client';
import {
  createOrganisationUserMutation,
  getOrganisationSupportedDomainsOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
  getWalletOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  Loader2,
  Mail,
  MoreVertical,
  Plus,
  UserCog,
  Users,
  Wallet as WalletIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader, StatCard } from '../_components/ui';

const domainOptions: Array<{ value: DomainNameEnum | ''; label: string }> = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Organisation admin' },
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
  { value: 'course_creator', label: 'Course creator' },
];

const fallbackRoleOptions: Array<{ value: DomainNameEnum; label: string }> = [
  { value: 'admin', label: 'Organisation admin' },
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
  { value: 'course_creator', label: 'Course creator' },
];

const validOrganisationRoles = new Set(fallbackRoleOptions.map(option => option.value));
const noBranchValue = 'none';

type MemberFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: DomainNameEnum;
  branchUuid: string;
};

const initialMemberFormState = (): MemberFormState => ({
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  role: 'organisation_user',
  branchUuid: '',
});

function getOrganisationRole(user: User, organisationUuid: string) {
  const affiliation =
    user.organisation_affiliations?.find(
      item => item.organisation_uuid === organisationUuid && item.active !== false
    ) ?? user.organisation_affiliations?.find(item => item.organisation_uuid === organisationUuid);

  return affiliation?.domain_in_organisation;
}

function formatRoleLabel(role?: string) {
  if (!role) return 'Member';
  return role
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildRoleOptions(domainData: DomainDto[]) {
  const apiOptions = domainData
    .map(domain => domain.name)
    .filter((name): name is DomainNameEnum =>
      Boolean(name && validOrganisationRoles.has(name as DomainNameEnum))
    )
    .map(value => ({
      value,
      label: formatRoleLabel(value),
    }));

  return apiOptions.length > 0 ? apiOptions : fallbackRoleOptions;
}

/** Lazily fetches a member's Skills Wallet balance. Only ~10 render per table page. */
function WalletBalanceCell({ userUuid }: { userUuid?: string }) {
  const walletQuery = useQuery({
    ...getWalletOptions({ path: { userUuid: userUuid ?? '' } }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.reference,
    retry: false,
  });

  if (!userUuid) return <span className='text-muted-foreground text-sm'>—</span>;
  if (walletQuery.isLoading) return <Skeleton className='h-4 w-16' />;

  const wallet = extractEntity<Wallet>(walletQuery.data);
  if (walletQuery.isError || !wallet || wallet.balance_amount === undefined) {
    return <span className='text-muted-foreground text-sm'>—</span>;
  }

  return (
    <span className='text-foreground flex items-center gap-1.5 text-sm font-medium tabular-nums'>
      <WalletIcon className='text-muted-foreground h-3.5 w-3.5' />
      {`${wallet.currency_code ?? ''} ${Number(wallet.balance_amount).toLocaleString()}`.trim()}
    </span>
  );
}

function createPeopleColumns(organisationUuid: string): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'first_name',
      header: 'Member',
      cell: ({ row }) => (
        <Link
          href={row.original.uuid ? `/dashboard/people/${row.original.uuid}` : '#'}
          className='group flex items-center gap-3'
        >
          <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
            <span className='text-base font-semibold'>
              {(row.original.first_name?.[0] || row.original.email?.[0] || '?').toUpperCase()}
            </span>
          </div>
          <div className='text-foreground font-semibold group-hover:text-primary group-hover:underline'>
            {`${row.original.first_name ?? ''} ${row.original.last_name ?? ''}`.trim() ||
              'Unnamed User'}
          </div>
        </Link>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
          <Mail className='h-3.5 w-3.5' />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      id: 'roles',
      header: 'Organisation role',
      cell: ({ row }) => (
        <Badge variant='secondary' className='text-xs'>
          {formatRoleLabel(getOrganisationRole(row.original, organisationUuid))}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_date',
      header: 'Joined',
      cell: ({ row }) =>
        row.original.created_date ? (
          <div className='text-muted-foreground flex items-center gap-1.5 text-sm'>
            <Calendar className='h-3.5 w-3.5' />
            <span>{format(new Date(row.original.created_date), 'MMM dd, yyyy')}</span>
          </div>
        ) : null,
    },
    {
      id: 'wallet',
      header: 'Skills Wallet',
      cell: ({ row }) => <WalletBalanceCell userUuid={row.original.uuid} />,
    },
    {
      id: 'actions',
      header: () => <div className='text-right'>Actions</div>,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='ghost' onClick={e => e.stopPropagation()}>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem asChild>
                <Link
                  href={row.original.uuid ? `/dashboard/people/${row.original.uuid}` : '#'}
                  onClick={e => e.stopPropagation()}
                >
                  <Users className='h-4 w-4' />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  // Handle manage roles action
                }}
              >
                <UserCog className='h-4 w-4' />
                Manage Roles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

export default function OrganisationPeoplePage() {
  const organisation = useOrganisation();
  const qc = useQueryClient();
  const organisationUuid = organisation?.uuid ?? '';

  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain') ?? '';

  const [domainFilter, setDomainFilter] = useState(domainParam);
  // Keep the role filter in sync when navigating between Students/Instructors nav links.
  useEffect(() => {
    setDomainFilter(domainParam);
  }, [domainParam]);
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberFormState>(() => initialMemberFormState());

  const usersQuery = useQuery({
    ...(domainFilter
      ? getUsersByOrganisationAndDomainOptions({
        path: { uuid: organisationUuid, domainName: domainFilter },
      })
      : getUsersByOrganisationOptions({
        path: { uuid: organisationUuid },
        query: { pageable: { page: 0, size: 100 } },
      })),
    enabled: Boolean(organisationUuid),
  });

  const supportedDomainsQuery = useQuery({
    ...getOrganisationSupportedDomainsOptions(),
    staleTime: STALE_TIMES.reference,
  });

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 20 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const createMember = useMutation(createOrganisationUserMutation());

  const usersPage = extractPage<User>(usersQuery.data);
  const users = usersPage.items;
  const totalItems = getTotalFromMetadata(usersPage.metadata);
  const branchPage = extractPage<TrainingBranch>(branchesQuery.data);
  const branches = branchPage.items;
  const branchesWithUuid = useMemo(
    () =>
      branches.filter((branch): branch is TrainingBranch & { uuid: string } =>
        Boolean(branch.uuid)
      ),
    [branches]
  );
  const roleOptions = useMemo(
    () => buildRoleOptions((supportedDomainsQuery.data?.data ?? []) as DomainDto[]),
    [supportedDomainsQuery.data?.data]
  );
  const peopleColumns = useMemo(() => createPeopleColumns(organisationUuid), [organisationUuid]);

  const resetMemberForm = () => setMemberForm(initialMemberFormState());

  const updateMemberForm = (patch: Partial<MemberFormState>) => {
    setMemberForm(current => ({
      ...current,
      ...patch,
    }));
  };

  const handleCreateMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organisationUuid) {
      toast.error('Organisation is still loading.');
      return;
    }

    const firstName = memberForm.firstName.trim();
    const lastName = memberForm.lastName.trim();
    const email = memberForm.email.trim();
    if (!firstName || !lastName || !email) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    createMember.mutate(
      {
        path: { uuid: organisationUuid },
        body: {
          first_name: firstName,
          middle_name: memberForm.middleName.trim() || undefined,
          last_name: lastName,
          email,
          phone_number: memberForm.phoneNumber.trim() || undefined,
          domain_name: memberForm.role,
          branch_uuid: memberForm.branchUuid || undefined,
        },
      },
      {
        onSuccess: async () => {
          toast.success('Member invitation created.');
          resetMemberForm();
          setIsMemberSheetOpen(false);
          await qc.invalidateQueries({
            queryKey: getUsersByOrganisationOptions({
              path: { uuid: organisationUuid },
              query: { pageable: { page: 0, size: 100 } },
            }).queryKey,
          });
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Unable to create member.');
        },
      }
    );
  };

  const stats = useMemo(() => {
    return {
      total: totalItems,
      orgUsers: users.filter(u => getOrganisationRole(u, organisationUuid) === 'organisation_user')
        .length,
      instructors: users.filter(u => getOrganisationRole(u, organisationUuid) === 'instructor')
        .length,
      students: users.filter(u => getOrganisationRole(u, organisationUuid) === 'student').length,
    };
  }, [users, totalItems, organisationUuid]);

  const pageTitle =
    domainParam === "student" ? "Student" :
      domainParam === "instructor" ? "Instructor" :
        "People"

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <AdminPageHeader
        title={pageTitle}
        description='Manage members and team roles'
        className='mb-6'
        actions={
          <Button onClick={() => setIsMemberSheetOpen(true)}>
            <Plus className='mr-2 size-4' />
            Add member
          </Button>
        }
      />

      {/* Stats */}
      <div className='mb-6 grid gap-3 sm:grid-cols-4'>
        <StatCard label='Total Members' value={stats.total} icon={Users} tone='info' />
        <StatCard label='Org Users' value={stats.orgUsers} icon={Building2} tone='neutral' />
        <StatCard label='Instructors' value={stats.instructors} icon={BookOpen} tone='neutral' />
        <StatCard label='Students' value={stats.students} icon={GraduationCap} tone='success' />
      </div>

      {/* Filters */}
      {/* <section className='mb-6'>
        <div className='flex items-center gap-3'>
          <Filter className='text-muted-foreground h-4 w-4' />
          <select
            className='border-border bg-background rounded-md border px-3 py-2 text-sm'
            value={domainFilter}
            onChange={event => setDomainFilter(event.target.value)}
          >
            {domainOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {domainFilter && (
            <Button variant='ghost' size='sm' onClick={() => setDomainFilter('')}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </section> */}

      {/* People DataTable */}
      <section className={elimikaDesignSystem.spacing.content}>
        {usersQuery.isLoading ? (
          <div className='space-y-2'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <Users className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>No members found</h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              {domainFilter
                ? 'Try adjusting your filter criteria'
                : 'No members have been added yet.'}
            </p>
          </div>
        ) : (
          <DataTable
            columns={peopleColumns}
            data={users}
            searchKey='first_name'
            searchPlaceholder='Search by name or email...'
            pageSize={10}
          />
        )}
      </section>

      <Sheet
        open={isMemberSheetOpen}
        onOpenChange={open => {
          if (createMember.isPending) return;
          setIsMemberSheetOpen(open);
          if (!open) resetMemberForm();
        }}
      >
        <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader>
            <SheetTitle>Add organisation member</SheetTitle>
            <SheetDescription>
              Create a user, assign their organisation role, and optionally place them in a branch.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateMember} className='mt-6 space-y-5'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='member-first-name'>First name</Label>
                <Input
                  id='member-first-name'
                  value={memberForm.firstName}
                  onChange={event => updateMemberForm({ firstName: event.target.value })}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='member-last-name'>Last name</Label>
                <Input
                  id='member-last-name'
                  value={memberForm.lastName}
                  onChange={event => updateMemberForm({ lastName: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='member-middle-name'>Middle name</Label>
              <Input
                id='member-middle-name'
                value={memberForm.middleName}
                onChange={event => updateMemberForm({ middleName: event.target.value })}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='member-email'>Email</Label>
                <Input
                  id='member-email'
                  type='email'
                  value={memberForm.email}
                  onChange={event => updateMemberForm({ email: event.target.value })}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='member-phone'>Phone number</Label>
                <Input
                  id='member-phone'
                  value={memberForm.phoneNumber}
                  onChange={event => updateMemberForm({ phoneNumber: event.target.value })}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Organisation role</Label>
              <Select
                value={memberForm.role}
                onValueChange={value => updateMemberForm({ role: value as DomainNameEnum })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-xs'>
                Role options come from the organisation-supported domains endpoint.
              </p>
            </div>

            {branchesWithUuid.length > 0 ? (
              <div className='space-y-2'>
                <Label>Training branch</Label>
                <Select
                  value={memberForm.branchUuid || noBranchValue}
                  onValueChange={value =>
                    updateMemberForm({ branchUuid: value === noBranchValue ? '' : value })
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a branch' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noBranchValue}>No branch assignment</SelectItem>
                    {branchesWithUuid.map(branch => (
                      <SelectItem key={branch.uuid} value={branch.uuid}>
                        {branch.branch_name ?? 'Unnamed branch'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsMemberSheetOpen(false)}
                disabled={createMember.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createMember.isPending}>
                {createMember.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Plus className='h-4 w-4' />
                )}
                Create member
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
