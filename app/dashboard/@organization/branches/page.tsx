'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useOrganisation } from '@/context/organisation-context';
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
import type { TrainingBranch, User } from '@/services/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  Phone,
  Mail,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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
  const organisation = useOrganisation();
  const qc = useQueryClient();

  const organisationUuid = organisation?.uuid ?? '';
  const [page, setPage] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<TrainingBranch | null>(null);
  const [branchUserDomain, setBranchUserDomain] = useState('');

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page, size: 12 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const branchesPage = extractPage<TrainingBranch>(branchesQuery.data);
  const branches = branchesPage.items;
  const totalBranches = getTotalFromMetadata(branchesPage.metadata);
  const totalPages =
    (branchesPage.metadata.totalPages as number | undefined) ??
    (totalBranches > 0 ? Math.ceil(totalBranches / 12) : 1);

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0]?.uuid ?? null);
    }
  }, [branches, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.uuid === selectedBranchId) ?? null,
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

  const handleSaveBranch = (values: BranchFormValues) => {
    if (!organisationUuid) return;
    const payload = { ...values, organisation_uuid: organisationUuid };

    if (editingBranch?.uuid) {
      updateBranch.mutate(
        { path: { uuid: editingBranch.uuid }, body: payload },
        {
          onSuccess: () => {
            toast.success('Branch updated successfully');
            qc.invalidateQueries({
              queryKey: getTrainingBranchesByOrganisationOptions({
                path: { uuid: organisationUuid },
                query: { pageable: { page, size: 12 } },
              }).queryKey,
            });
            setIsSheetOpen(false);
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
            toast.success('Branch created successfully');
            qc.invalidateQueries({
              queryKey: getTrainingBranchesByOrganisationOptions({
                path: { uuid: organisationUuid },
                query: { pageable: { page, size: 12 } },
              }).queryKey,
            });
            setIsSheetOpen(false);
          },
          onError: () => toast.error('Unable to create branch'),
        }
      );
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    deleteBranch.mutate(
      { path: { uuid: branchId } },
      {
        onSuccess: () => {
          toast.success('Branch deleted successfully');
          qc.invalidateQueries({
            queryKey: getTrainingBranchesByOrganisationOptions({
              path: { uuid: organisationUuid },
              query: { pageable: { page, size: 12 } },
            }).queryKey,
          });
          if (selectedBranchId === branchId) {
            setSelectedBranchId(null);
          }
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
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Header */}
      <section className={elimikaDesignSystem.components.header.base}>
        <Badge className={elimikaDesignSystem.components.header.badge}>
          <GitBranch className='h-3.5 w-3.5' />
          Training Branches
        </Badge>

        <div className='mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex-1'>
            <h1 className={elimikaDesignSystem.components.header.title}>Manage Training Branches</h1>
            <p className={elimikaDesignSystem.components.header.subtitle}>
              Create and manage training locations for your organization. Assign team members and track branch
              activities.
            </p>
          </div>

          <Button
            size='lg'
            className={elimikaDesignSystem.components.button.primary}
            onClick={() => {
              setEditingBranch(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className='mr-2 h-4 w-4' />
            New Branch
          </Button>
        </div>

        {/* Stats */}
        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='rounded-[20px] border border-border bg-card/50 p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-muted p-3'>
                <Building2 className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Branches</p>
                <p className='text-2xl font-bold text-foreground'>{totalBranches}</p>
              </div>
            </div>
          </div>

          <div className='rounded-[20px] border border-border bg-card/50 p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-muted p-3'>
                <Users className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Team Members</p>
                <p className='text-2xl font-bold text-foreground'>{branchUsers.length}</p>
              </div>
            </div>
          </div>

          <div className='rounded-[20px] border border-border bg-card/50 p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-muted p-3'>
                <GitBranch className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Active Branches</p>
                <p className='text-2xl font-bold text-foreground'>
                  {branches.filter((b) => b.active).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branches Grid */}
      <section className={elimikaDesignSystem.spacing.content}>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>All Branches</h2>
            <p className='text-sm text-muted-foreground'>Select a branch to view details and manage team members</p>
          </div>
        </div>

        {branchesQuery.isLoading ? (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-48 w-full' />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <GitBranch className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>No branches yet</h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              Create your first training branch to get started with managing your organization's locations.
            </p>
            <Button
              className='mt-4'
              onClick={() => {
                setEditingBranch(null);
                setIsSheetOpen(true);
              }}
            >
              <Plus className='mr-2 h-4 w-4' />
              Create Branch
            </Button>
          </div>
        ) : (
          <>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {branches.map((branch) => (
                <div
                  key={branch.uuid}
                  className={`${elimikaDesignSystem.components.listCard.base} cursor-pointer ${
                    selectedBranchId === branch.uuid ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  onClick={() => setSelectedBranchId(branch.uuid ?? null)}
                >
                  <div className='mb-4 flex items-start justify-between'>
                    <div className='flex-1'>
                      <h3 className='mb-1 text-lg font-semibold text-foreground'>{branch.branch_name}</h3>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <MapPin className='h-3.5 w-3.5' />
                        <span>{branch.address || 'No address'}</span>
                      </div>
                    </div>
                    <Badge variant={branch.active ? 'secondary' : 'outline'}>
                      {branch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <Separator className='my-4' />

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium text-foreground'>{branch.poc_name}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Mail className='h-4 w-4' />
                      <span>{branch.poc_email}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Phone className='h-4 w-4' />
                      <span>{branch.poc_telephone}</span>
                    </div>
                  </div>

                  <div className='mt-4 flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='flex-1'
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBranch(branch);
                        setIsSheetOpen(true);
                      }}
                    >
                      <Pencil className='mr-2 h-3.5 w-3.5' />
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete branch "${branch.branch_name}"?`)) {
                          handleDeleteBranch(branch.uuid!);
                        }
                      }}
                      disabled={deleteBranch.isPending}
                    >
                      <Trash2 className='h-3.5 w-3.5 text-destructive' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Branch Users Section */}
      {selectedBranch && (
        <section className={elimikaDesignSystem.components.card.base}>
          <div className='mb-5 flex items-center justify-between'>
            <div>
              <h2 className={elimikaDesignSystem.components.card.title}>Branch Team Members</h2>
              <p className={elimikaDesignSystem.components.card.description}>
                Manage users assigned to {selectedBranch.branch_name}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <select
                className='rounded-md border border-border bg-background px-3 py-2 text-sm'
                value={branchUserDomain}
                onChange={(event) => setBranchUserDomain(event.target.value)}
              >
                <option value=''>All roles</option>
                {domainOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator className='mb-5' />

          {/* Assign User */}
          <AssignUserSection
            users={organisationUsers}
            onAssign={handleAssignUser}
            isLoading={assignUser.isPending}
          />

          <Separator className='my-5' />

          {/* Branch Users List */}
          {branchUsersQuery.isLoading ? (
            <div className='space-y-3'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          ) : branchUsers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <AlertCircle className='mb-3 h-10 w-10 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>No team members assigned to this branch yet</p>
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {branchUsers.map((user) => (
                <div
                  key={user.uuid}
                  className='flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-foreground'>
                      {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                    </p>
                    <p className='text-xs text-muted-foreground'>{user.email}</p>
                    <div className='mt-1 flex flex-wrap gap-1'>
                      {user.user_domain?.map((domain) => (
                        <Badge key={domain} variant='outline' className='text-xs'>
                          {domain}
                        </Badge>
                      ))}
                    </div>
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
            </div>
          )}
        </section>
      )}

      {/* Branch Form Drawer */}
      <BranchDrawer
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSubmit={handleSaveBranch}
        defaultValues={editingBranch ?? undefined}
        isSubmitting={createBranch.isPending || updateBranch.isPending}
      />
    </div>
  );
}

function BranchDrawer({
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-xl overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{defaultValues ? 'Edit Branch' : 'Create New Branch'}</SheetTitle>
          <SheetDescription>
            {defaultValues
              ? 'Update the branch details and point of contact information.'
              : 'Add a new training location for your organization.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='mt-6 space-y-6'>
          <div className='space-y-4'>
            <FormField label='Branch Name' name='branch_name' form={form} required />
            <FormField label='Address' name='address' form={form} />
          </div>

          <Separator />

          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>Point of Contact</h3>
            <FormField label='POC Name' name='poc_name' form={form} required />
            <FormField label='POC Email' name='poc_email' form={form} type='email' required />
            <FormField label='POC Telephone' name='poc_telephone' form={form} required />
          </div>

          <Separator />

          <div className='flex items-center gap-3'>
            <Switch checked={form.watch('active')} onCheckedChange={(checked) => form.setValue('active', checked)} />
            <div>
              <Label className='text-sm font-medium'>Active Status</Label>
              <p className='text-xs text-muted-foreground'>Branch is available for assignments</p>
            </div>
          </div>

          <SheetFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' type='button' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {defaultValues ? 'Update Branch' : 'Create Branch'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormField({
  label,
  name,
  form,
  type = 'text',
  required = false,
}: {
  label: string;
  name: keyof BranchFormValues;
  form: ReturnType<typeof useForm<BranchFormValues>>;
  type?: string;
  required?: boolean;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>
        {label} {required && <span className='text-destructive'>*</span>}
      </Label>
      <Input type={type} {...form.register(name)} className={error ? 'border-destructive' : ''} />
      {error && <p className='text-xs text-destructive'>{String(error)}</p>}
    </div>
  );
}

function AssignUserSection({
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
    <div className='rounded-xl border border-border bg-muted/30 p-4'>
      <h3 className='mb-3 text-sm font-semibold text-foreground'>Assign New Member</h3>
      <div className='flex flex-wrap gap-3'>
        <select
          className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm min-w-[200px]'
          value={userUuid}
          onChange={(event) => setUserUuid(event.target.value)}
        >
          <option value=''>Select user...</option>
          {users.map((user) => (
            <option key={user.uuid} value={user.uuid ?? ''}>
              {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
            </option>
          ))}
        </select>
        <select
          className='rounded-md border border-border bg-background px-3 py-2 text-sm'
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        >
          {domainOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant='default' size='default' disabled={!userUuid || isLoading} onClick={() => onAssign(userUuid, domain)}>
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Assign
        </Button>
      </div>
    </div>
  );
}
