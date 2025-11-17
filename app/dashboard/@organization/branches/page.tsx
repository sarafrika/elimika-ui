"use client";

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import { AdminDataTableColumn } from '@/components/admin/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTrainingCenter } from '@/context/training-center-provide';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  assignUserToBranchMutation,
  createTrainingBranch1Mutation,
  deleteTrainingBranchMutation,
  getBranchUsersByDomainOptions,
  getBranchUsersOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationOptions,
  removeUserFromBranchMutation,
  updateTrainingBranchMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { TrainingBranch, User } from '@/services/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { GitBranch, Loader2, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

const branchSchema = z.object({
  branch_name: z.string().min(1, 'Branch name is required'),
  address: z.string().optional(),
  poc_name: z.string().min(1, 'POC name is required'),
  poc_email: z.string().email('Valid email required'),
  poc_telephone: z.string().min(1, 'POC telephone is required'),
  active: z.boolean().default(true),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const domainOptions = [
  { value: 'organisation_user', label: 'Organisation user' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

export default function BranchesPage() {
  const trainingCenter = useTrainingCenter();
  const qc = useQueryClient();

  const organisationUuid = trainingCenter?.uuid ?? '';
  const [page, setPage] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<TrainingBranch | null>(null);
  const [branchUserDomain, setBranchUserDomain] = useState('');

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page, size: 10 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const branchesPage = extractPage<TrainingBranch>(branchesQuery.data);
  const branches = branchesPage.items;
  const totalBranches = getTotalFromMetadata(branchesPage.metadata);
  const totalPages =
    (branchesPage.metadata.totalPages as number | undefined) ??
    (totalBranches > 0 ? Math.ceil(totalBranches / 10) : 1);

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0]?.uuid ?? null);
    }
  }, [branches, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find(branch => branch.uuid === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const branchUsersQuery = useQuery({
    ...(branchUserDomain
      ? getBranchUsersByDomainOptions({
          path: { uuid: organisationUuid, branchUuid: selectedBranchId ?? '', domainName: branchUserDomain },
        })
      : getBranchUsersOptions({
          path: { uuid: organisationUuid, branchUuid: selectedBranchId ?? '' },
        })),
    enabled: Boolean(organisationUuid && selectedBranchId),
  });

  const branchUsers = extractPage<User>(branchUsersQuery.data).items;

  const organisationUsersQuery = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const organisationUsers = extractPage<User>(organisationUsersQuery.data).items;

  const createBranch = useMutation(createTrainingBranch1Mutation());
  const updateBranch = useMutation(updateTrainingBranchMutation());
  const deleteBranch = useMutation(deleteTrainingBranchMutation());
  const assignUser = useMutation(assignUserToBranchMutation());
  const removeUser = useMutation(removeUserFromBranchMutation());

  const branchColumns: AdminDataTableColumn<TrainingBranch>[] = [
    {
      id: 'name',
      header: 'Branch',
      cell: branch => (
        <div className='flex flex-col'>
          <span className='font-medium'>{branch.branch_name}</span>
          <span className='text-muted-foreground text-xs'>{branch.address || 'Address not set'}</span>
        </div>
      ),
    },
    {
      id: 'poc',
      header: 'Point of contact',
      cell: branch => (
        <div className='flex flex-col text-sm'>
          <span className='font-medium'>{branch.poc_name}</span>
          <span className='text-muted-foreground text-xs'>{branch.poc_email}</span>
          <span className='text-muted-foreground text-xs'>{branch.poc_telephone}</span>
        </div>
      ),
    },
    {
      id: 'active',
      header: 'Status',
      cell: branch => <Badge variant={branch.active ? 'secondary' : 'outline'}>{branch.active ? 'Active' : 'Inactive'}</Badge>,
      className: 'text-right',
    },
  ];

  const handleSaveBranch = (values: BranchFormValues) => {
    if (!organisationUuid) return;
    const payload = { ...values, organisation_uuid: organisationUuid };

    if (editingBranch?.uuid) {
      updateBranch.mutate(
        { path: { uuid: editingBranch.uuid }, body: payload },
        {
          onSuccess: () => {
            toast.success('Branch updated');
            qc.invalidateQueries({ queryKey: getTrainingBranchesByOrganisationOptions({ path: { uuid: organisationUuid }, query: { pageable: { page, size: 10 } } }).queryKey });
            setIsDialogOpen(false);
            setEditingBranch(null);
          },
          onError: () => toast.error('Unable to update branch'),
        }
      );
    } else {
      createBranch.mutate(
        { path: { uuid: organisationUuid }, body: payload },
        {
          onSuccess: () => {
            toast.success('Branch created');
            qc.invalidateQueries({ queryKey: getTrainingBranchesByOrganisationOptions({ path: { uuid: organisationUuid }, query: { pageable: { page, size: 10 } } }).queryKey });
            setIsDialogOpen(false);
          },
          onError: () => toast.error('Unable to create branch'),
        }
      );
    }
  };

  const handleDeleteBranch = () => {
    if (!selectedBranchId) return;
    deleteBranch.mutate(
      { path: { uuid: selectedBranchId } },
      {
        onSuccess: () => {
          toast.success('Branch deleted');
          qc.invalidateQueries({ queryKey: getTrainingBranchesByOrganisationOptions({ path: { uuid: organisationUuid }, query: { pageable: { page, size: 10 } } }).queryKey });
          setSelectedBranchId(null);
        },
        onError: () => toast.error('Unable to delete branch'),
      }
    );
  };

  const handleAssignUser = (userUuid: string, domain: string) => {
    if (!selectedBranchId || !organisationUuid) return;
    const branchUsersKey = branchUserDomain
      ? getBranchUsersByDomainOptions({
          path: { uuid: organisationUuid, branchUuid: selectedBranchId, domainName: branchUserDomain },
        }).queryKey
      : getBranchUsersOptions({ path: { uuid: organisationUuid, branchUuid: selectedBranchId } }).queryKey;

    assignUser.mutate(
      {
        path: { uuid: organisationUuid, branchUuid: selectedBranchId, userUuid },
        query: { domain_name: domain },
      },
      {
        onSuccess: () => {
          toast.success('User assigned to branch');
          qc.invalidateQueries({ queryKey: branchUsersKey });
        },
        onError: () => toast.error('Unable to assign user'),
      }
    );
  };

  const handleRemoveUser = (userUuid: string) => {
    if (!selectedBranchId || !organisationUuid) return;
    const branchUsersKey = branchUserDomain
      ? getBranchUsersByDomainOptions({
          path: { uuid: organisationUuid, branchUuid: selectedBranchId, domainName: branchUserDomain },
        }).queryKey
      : getBranchUsersOptions({ path: { uuid: organisationUuid, branchUuid: selectedBranchId } }).queryKey;

    removeUser.mutate(
      { path: { uuid: organisationUuid, branchUuid: selectedBranchId, userUuid } },
      {
        onSuccess: () => {
          toast.success('User removed from branch');
          qc.invalidateQueries({ queryKey: branchUsersKey });
        },
        onError: () => toast.error('Unable to remove user'),
      }
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Training branches</h1>
          <p className='text-muted-foreground text-sm'>
            CRUD backed by /api/v1/organisations/{organisationUuid}/training-branches. Branch pickers stay scoped to this organisation.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button size='sm' variant='outline' onClick={handleDeleteBranch} disabled={!selectedBranchId || deleteBranch.isPending}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </Button>
          <Button
            size='sm'
            className='gap-2'
            onClick={() => {
              setEditingBranch(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className='h-4 w-4' />
            New branch
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'>
        <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
          <AdminDataTable
            title='Branches'
            description='Displays POC details and active flag from TrainingBranchDTO.'
            columns={branchColumns}
            data={branches}
            isLoading={branchesQuery.isLoading}
            onRowClick={branch => setSelectedBranchId(branch.uuid ?? null)}
            selectedId={selectedBranchId}
            pagination={{
              page,
              pageSize: 10,
              totalItems: totalBranches,
              totalPages: totalPages || 1,
              onPageChange: setPage,
            }}
            emptyState={{
              title: 'No branches yet',
              description: 'Create your first training branch to assign teams.',
            }}
            headerActions={
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setEditingBranch(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className='mr-2 h-4 w-4' />
                Add branch
              </Button>
            }
          />
        </div>

        <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
          <div className='flex items-center justify-between gap-2'>
            <div>
              <p className='text-sm font-semibold'>Branch details</p>
              <p className='text-muted-foreground text-xs'>Assign/remove users and review POC.</p>
            </div>
            {selectedBranch ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setEditingBranch(selectedBranch);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className='mr-2 h-4 w-4' />
                Edit
              </Button>
            ) : null}
          </div>
          <Separator className='my-4' />

          {selectedBranch ? (
            <div className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <DetailTile
                  label='Branch'
                  value={selectedBranch.branch_name}
                  icon={<GitBranch className='h-4 w-4 text-muted-foreground' />}
                />
                <DetailTile
                  label='POC'
                  value={selectedBranch.poc_name}
                  icon={<Users className='h-4 w-4 text-muted-foreground' />}
                  helper={`${selectedBranch.poc_email} · ${selectedBranch.poc_telephone}`}
                />
                <DetailTile
                  label='Address'
                  value={selectedBranch.address ?? 'Not provided'}
                  icon={<MapPin className='h-4 w-4 text-muted-foreground' />}
                />
                <DetailTile
                  label='Status'
                  value={selectedBranch.active ? 'Active' : 'Inactive'}
                  badgeVariant={selectedBranch.active ? 'secondary' : 'outline'}
                />
              </div>

              <div className='rounded-xl border border-border/60 bg-muted/40 p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm font-semibold'>Branch users</p>
                    <p className='text-muted-foreground text-xs'>
                      Domain filter uses GET /users/domain/{'{domainName}'}.
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <select
                      className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
                      value={branchUserDomain}
                      onChange={event => setBranchUserDomain(event.target.value)}
                    >
                      <option value=''>All domains</option>
                      {domainOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <AssignUserSelect
                      users={organisationUsers}
                      onAssign={(userUuid, domain) => handleAssignUser(userUuid, domain)}
                      isLoading={assignUser.isPending}
                    />
                  </div>
                </div>
                <div className='mt-3 space-y-2'>
                  {branchUsers.map(user => (
                    <div
                      key={user.uuid}
                      className='flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-sm'
                    >
                      <div>
                        <p className='font-medium'>
                          {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                        </p>
                        <p className='text-muted-foreground text-xs'>{user.user_domain?.join(', ')}</p>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveUser(user.uuid!)}
                        disabled={removeUser.isPending}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  ))}
                  {branchUsers.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>No users assigned.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>Select a branch to view details.</p>
          )}
        </div>
      </div>

      <BranchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSaveBranch}
        defaultValues={editingBranch ?? undefined}
        isSubmitting={createBranch.isPending || updateBranch.isPending}
      />
    </div>
  );
}

function BranchDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BranchFormValues) => void;
  defaultValues?: TrainingBranch;
  isSubmitting: boolean;
}) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branch_name: defaultValues?.branch_name ?? '',
      address: defaultValues?.address ?? '',
      poc_name: defaultValues?.poc_name ?? '',
      poc_email: defaultValues?.poc_email ?? '',
      poc_telephone: defaultValues?.poc_telephone ?? '',
      active: defaultValues?.active ?? true,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        branch_name: defaultValues.branch_name,
        address: defaultValues.address ?? '',
        poc_name: defaultValues.poc_name,
        poc_email: defaultValues.poc_email,
        poc_telephone: defaultValues.poc_telephone,
        active: defaultValues.active,
      });
    } else {
      form.reset({
        branch_name: '',
        address: '',
        poc_name: '',
        poc_email: '',
        poc_telephone: '',
        active: true,
      });
    }
  }, [defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Edit branch' : 'Create branch'}</DialogTitle>
          <DialogDescription>
            CRUD flows map to POST/PUT /api/v1/organisations/{'{uuid}'}/training-branches and DELETE /api/v1/training-branches/{'{uuid}'}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid gap-3 md:grid-cols-2'>
            <FormField label='Branch name' name='branch_name' form={form} />
            <FormField label='Address' name='address' form={form} />
            <FormField label='POC name' name='poc_name' form={form} />
            <FormField label='POC email' name='poc_email' form={form} type='email' />
            <FormField label='POC telephone' name='poc_telephone' form={form} />
          </div>
          <div className='flex items-center gap-2'>
            <Switch checked={form.watch('active')} onCheckedChange={checked => form.setValue('active', checked)} />
            <span className='text-sm'>Active</span>
          </div>
          <DialogFooter>
            <Button variant='outline' type='button' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              Save branch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  name,
  form,
  type = 'text',
}: {
  label: string;
  name: keyof BranchFormValues;
  form: ReturnType<typeof useForm<BranchFormValues>>;
  type?: string;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <div className='space-y-1.5'>
      <Label className='text-sm'>{label}</Label>
      <Input type={type} {...form.register(name)} />
      {error ? <p className='text-destructive text-xs'>{String(error)}</p> : null}
    </div>
  );
}

function DetailTile({
  label,
  value,
  icon,
  helper,
  badgeVariant,
}: {
  label: string;
  value?: string | null;
  icon?: ReactNode;
  helper?: string;
  badgeVariant?: 'secondary' | 'outline';
}) {
  return (
    <div className='rounded-xl border border-border/60 bg-muted/40 p-3'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <div className='mt-1 flex items-center gap-2 text-sm font-medium'>
        {icon}
        {badgeVariant ? <Badge variant={badgeVariant}>{value}</Badge> : <span>{value ?? '—'}</span>}
      </div>
      {helper ? <p className='text-muted-foreground text-xs'>{helper}</p> : null}
    </div>
  );
}

function AssignUserSelect({
  users,
  onAssign,
  isLoading,
}: {
  users: User[];
  onAssign: (userUuid: string, domain: string) => void;
  isLoading: boolean;
}) {
  const [userUuid, setUserUuid] = useState('');
  const [domain, setDomain] = useState(domainOptions[0]?.value ?? '');

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <select
        className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
        value={userUuid}
        onChange={event => setUserUuid(event.target.value)}
      >
        <option value=''>Select user</option>
        {users.map(user => (
          <option key={user.uuid} value={user.uuid ?? ''}>
            {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
          </option>
        ))}
      </select>
      <select
        className='rounded-md border border-border/60 bg-background px-3 py-2 text-sm'
        value={domain}
        onChange={event => setDomain(event.target.value)}
      >
        {domainOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        variant='outline'
        size='sm'
        disabled={!userUuid || isLoading}
        onClick={() => onAssign(userUuid, domain)}
      >
        Assign
      </Button>
    </div>
  );
}
