// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { elimikaDesignSystem } from '@/lib/design-system';
import type { TrainingBranch, User } from '@/services/client';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  Calendar,
  GitBranch,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { KpiCard } from '@/components/dashboard';
import { PageHeader } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { OrgPage, orgStack } from '../_components/org-page';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const branchSchema = z.object({
  branch_name: z.string().min(1, 'Branch name is required'),
  address: z.string().optional(),
  poc_name: z.string().min(1, 'POC name is required'),
  poc_email: z.string().email('Valid email required'),
  poc_telephone: z.string().min(1, 'POC telephone is required'),
  capacity: z.coerce.number().int().positive().optional(),
  venue_type: z.string().max(50).optional(),
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<TrainingBranch | null>(null);
  const [branchUserDomain, setBranchUserDomain] = useState('');

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });


  const branchesPage = extractPage<TrainingBranch>(branchesQuery.data);
  const branches = branchesPage.items;
  const totalBranches = getTotalFromMetadata(branchesPage.metadata);

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
        path: {
          uuid: organisationUuid,
          branchUuid: selectedBranchId ?? '',
          domainName: branchUserDomain,
        },
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
                query: { pageable: { page: 0, size: 100 } },
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
                query: { pageable: { page: 0, size: 100 } },
              }).queryKey,
            });
            setIsSheetOpen(false);
          },
          onError: () => toast.error('Unable to create branch'),
        }
      );
    }
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    deleteBranch.mutate(
      { path: { uuid: branchId } },
      {
        onSuccess: () => {
          toast.success('Branch deleted successfully');
          qc.invalidateQueries({
            queryKey: getTrainingBranchesByOrganisationOptions({
              path: { uuid: organisationUuid },
              query: { pageable: { page: 0, size: 100 } },
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

  const handleEditBranch = (branch: TrainingBranch) => {
    setEditingBranch(branch);
    setIsSheetOpen(true);
  };

  const handleAssignUser = (userUuid: string, domain: string) => {
    if (!selectedBranchId || !organisationUuid) return;
    const branchUsersKey = branchUserDomain
      ? getBranchUsersByDomainOptions({
        path: {
          uuid: organisationUuid,
          branchUuid: selectedBranchId,
          domainName: branchUserDomain,
        },
      }).queryKey
      : getBranchUsersOptions({ path: { uuid: organisationUuid, branchUuid: selectedBranchId } })
        .queryKey;

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
        path: {
          uuid: organisationUuid,
          branchUuid: selectedBranchId,
          domainName: branchUserDomain,
        },
      }).queryKey
      : getBranchUsersOptions({ path: { uuid: organisationUuid, branchUuid: selectedBranchId } })
        .queryKey;

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
    <OrgPage>
      <div className={orgStack}>
        <PageHeader
          title='Venues'
          description='Training branches and locations — manage details and assign team members.'
          actions={
            <Button
              size='sm'
              onClick={() => {
                setEditingBranch(null);
                setIsSheetOpen(true);
              }}
            >
              <Plus className='mr-2 h-4 w-4' />
              New Venue
            </Button>
          }
        />

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-5'>
          <KpiCard title='Total Venues' value={totalBranches} icon={<Building2 className='h-5 w-5' />} variant='primary' />
          <KpiCard title='Active' value={branches.filter(b => b.active).length} icon={<GitBranch className='h-5 w-5' />} variant='green' />
          <KpiCard title='Inactive' value={branches.filter(b => !b.active).length} icon={<MapPin className='h-5 w-5' />} variant='amber' />
          <KpiCard title='Members' value={organisationUsers.length} icon={<Users className='h-5 w-5' />} variant='indigo' />
        </div>

        {/* Venue card grid */}
        {branchesQuery.isLoading ? (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-56 w-full rounded-xl' />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className={elimikaDesignSystem.components.emptyState.container}>
            <GitBranch className={elimikaDesignSystem.components.emptyState.icon} />
            <h3 className={elimikaDesignSystem.components.emptyState.title}>No venues yet</h3>
            <p className={elimikaDesignSystem.components.emptyState.description}>
              Create your first training venue to start managing your organisation&apos;s locations.
            </p>
            <Button
              className='mt-4'
              onClick={() => {
                setEditingBranch(null);
                setIsSheetOpen(true);
              }}
            >
              <Plus className='mr-2 h-4 w-4' />
              Create Venue
            </Button>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {branches.map(branch => {
              const isSelected = branch.uuid === selectedBranchId;
              return (
                <Card
                  key={branch.uuid}
                  onClick={() => setSelectedBranchId(branch.uuid ?? null)}
                  className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className='relative flex h-28 items-center justify-center bg-gradient-to-br from-teal-600 via-teal-600 to-primary'>
                    <Building2 className='h-10 w-10 text-white/90' />
                    <Badge
                      variant={branch.active ? 'default' : 'secondary'}
                      className='absolute right-2 top-2'
                    >
                      {branch.active ? 'Available' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardContent className='space-y-3 p-4'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <h3 className='truncate font-semibold'>{branch.branch_name}</h3>
                        <p className='flex items-center gap-1 truncate text-xs text-muted-foreground'>
                          <MapPin className='h-3.5 w-3.5 shrink-0' />
                          {branch.address || 'No address'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size='icon' variant='ghost' className='h-8 w-8 shrink-0' onClick={e => e.stopPropagation()}>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleEditBranch(branch); }}>
                            <Pencil className='h-4 w-4' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant='destructive'
                            disabled={deleteBranch.isPending}
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm(`Delete venue "${branch.branch_name}"?`)) {
                                handleDeleteBranch(branch.uuid!, branch.branch_name ?? '');
                              }
                            }}
                          >
                            <Trash2 className='h-4 w-4' /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1' title='Point of contact'>
                        <Users className='h-3.5 w-3.5' />
                        {branch.poc_name || '—'}
                      </span>
                      <span className='flex items-center gap-1' title='Capacity'>
                        <Wrench className='h-3.5 w-3.5' />
                        {branch.capacity != null ? `${branch.capacity} seats` : '—'}
                      </span>
                      {branch.venue_type ? (
                        <Badge variant='outline' className='text-[10px]'>
                          {branch.venue_type}
                        </Badge>
                      ) : null}
                    </div>

                    <div className='flex gap-2 pt-1'>
                      <Button asChild variant='outline' size='sm' className='flex-1' onClick={e => e.stopPropagation()}>
                        <Link href={`/dashboard/organisation/branches/${branch.uuid}`}>Manage</Link>
                      </Button>
                      <Button size='sm' className='flex-1' disabled onClick={e => e.stopPropagation()}>
                        <Calendar className='mr-1 h-3.5 w-3.5' />
                        Book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
                className='border-border bg-background rounded-md border px-3 py-2 text-sm'
                value={branchUserDomain}
                onChange={event => setBranchUserDomain(event.target.value)}
              >
                <option value=''>All roles</option>
                {domainOptions.map(option => (
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
              <AlertCircle className='text-muted-foreground mb-3 h-10 w-10' />
              <p className='text-muted-foreground text-sm'>
                No team members assigned to this branch yet
              </p>
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {branchUsers.map(user => (
                <div
                  key={user.uuid}
                  className='border-border bg-muted/30 flex items-center justify-between rounded-xl border p-4'
                >
                  <div className='flex-1'>
                    <p className='text-foreground font-medium'>
                      {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                    </p>
                    <p className='text-muted-foreground text-xs'>{user.email}</p>
                    <div className='mt-1 flex flex-wrap gap-1'>
                      {user.user_domain?.map(domain => (
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
                    <Trash2 className='text-destructive h-4 w-4' />
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
    </OrgPage>
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
      capacity: defaultValues?.capacity ?? undefined,
      venue_type: defaultValues?.venue_type ?? '',
      active: defaultValues?.active ?? true,
    },
  });

  const active = useWatch({
    control: form.control,
    name: 'active',
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        branch_name: defaultValues.branch_name,
        address: defaultValues.address ?? '',
        poc_name: defaultValues.poc_name,
        poc_email: defaultValues.poc_email,
        poc_telephone: defaultValues.poc_telephone,
        capacity: defaultValues.capacity ?? undefined,
        venue_type: defaultValues.venue_type ?? '',
        active: defaultValues.active,
      });
    } else {
      form.reset({
        branch_name: '',
        address: '',
        poc_name: '',
        poc_email: '',
        poc_telephone: '',
        capacity: undefined,
        venue_type: '',
        active: true,
      });
    }
  }, [defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-2xl'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='space-y-4 px-6 pt-6 pb-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-primary/10 rounded-xl p-3.5'>
                <GitBranch className='text-primary h-6 w-6' />
              </div>
              <div>
                <SheetTitle className='text-2xl font-semibold'>
                  {defaultValues ? 'Edit Branch' : 'New Branch'}
                </SheetTitle>
                <SheetDescription className='mt-1.5 text-base'>
                  {defaultValues
                    ? 'Update the branch details and contact information'
                    : 'Add a new training location to your organization'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-1 flex-col overflow-hidden'
          >
            <div className='flex-1 space-y-8 overflow-y-auto px-6 pb-6'>
              {/* Branch Information Section */}
              <div className='space-y-5'>
                <div className='flex items-center gap-2.5'>
                  <Building2 className='text-muted-foreground h-5 w-5' />
                  <h3 className='text-muted-foreground text-sm font-semibold tracking-wide uppercase'>
                    Branch Details
                  </h3>
                </div>
                <div className='space-y-5 pl-7'>
                  <FormField
                    label='Branch Name'
                    name='branch_name'
                    form={form}
                    required
                    placeholder='Downtown Campus'
                  />
                  <FormField
                    label='Address'
                    name='address'
                    form={form}
                    placeholder='123 Main Street, City, State'
                    icon={<MapPin className='h-4 w-4' />}
                  />
                </div>
              </div>

              <Separator className='my-8' />

              {/* Point of Contact Section */}
              <div className='space-y-5'>
                <div className='flex items-center gap-2.5'>
                  <Users className='text-muted-foreground h-5 w-5' />
                  <h3 className='text-muted-foreground text-sm font-semibold tracking-wide uppercase'>
                    Point of Contact
                  </h3>
                </div>
                <div className='space-y-5 pl-7'>
                  <FormField
                    label='Full Name'
                    name='poc_name'
                    form={form}
                    required
                    placeholder='John Doe'
                    icon={<Users className='h-4 w-4' />}
                  />
                  <FormField
                    label='Email Address'
                    name='poc_email'
                    form={form}
                    type='email'
                    required
                    placeholder='john.doe@example.com'
                    icon={<Mail className='h-4 w-4' />}
                  />
                  <FormField
                    label='Phone Number'
                    name='poc_telephone'
                    form={form}
                    required
                    placeholder='+1 (555) 123-4567'
                    icon={<Phone className='h-4 w-4' />}
                  />
                </div>
              </div>

              <Separator className='my-8' />

              {/* Venue Details Section */}
              <div className='space-y-5'>
                <div className='flex items-center gap-2.5'>
                  <Wrench className='text-muted-foreground h-5 w-5' />
                  <h3 className='text-muted-foreground text-sm font-semibold tracking-wide uppercase'>
                    Venue Details
                  </h3>
                </div>
                <div className='grid gap-5 pl-7 sm:grid-cols-2'>
                  <FormField
                    label='Capacity'
                    name='capacity'
                    form={form}
                    type='number'
                    placeholder='30'
                    icon={<Users className='h-4 w-4' />}
                  />
                  <FormField
                    label='Venue type'
                    name='venue_type'
                    form={form}
                    placeholder='Lab, Workshop, Auditorium…'
                    icon={<MapPin className='h-4 w-4' />}
                  />
                </div>
              </div>

              <Separator className='my-8' />

              {/* Status Section */}
              <div className='space-y-5'>
                <div className='flex items-center justify-between pl-7'>
                  <div className='flex items-center gap-4'>
                    <Switch
                      checked={!!active}
                      onCheckedChange={checked => form.setValue('active', checked)}
                    />

                    <div>
                      <Label className='text-foreground text-base font-medium'>
                        Active Status
                      </Label>

                      <p className='text-muted-foreground mt-0.5 text-sm'>
                        {active
                          ? 'Branch is active and available for assignments'
                          : 'Branch is inactive and hidden from assignments'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={active ? 'secondary' : 'outline'}
                    className='text-xs'
                  >
                    {active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className='border-border flex gap-3 border-t px-6 py-4'>
              <Button
                variant='outline'
                type='button'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting} className='flex-1'>
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {defaultValues ? 'Save Changes' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </div>
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
  placeholder,
  icon,
}: {
  label: string;
  name: keyof BranchFormValues;
  form: ReturnType<typeof useForm<BranchFormValues>>;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <div className='space-y-2.5'>
      <Label className='text-foreground text-sm font-medium'>
        {label}
        {required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      <div className='relative'>
        {icon && (
          <div className='text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2'>
            {icon}
          </div>
        )}
        <Input
          type={type}
          placeholder={placeholder}
          {...form.register(name)}
          className={`h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${icon ? 'pl-11' : ''}`}
        />
      </div>
      {error && (
        <div className='text-destructive flex items-center gap-1.5 text-sm'>
          <AlertCircle className='h-3.5 w-3.5' />
          <span>{String(error)}</span>
        </div>
      )}
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
    <div className='border-border bg-muted/30 rounded-xl border p-4'>
      <h3 className='text-foreground mb-3 text-sm font-semibold'>Assign New Member</h3>
      <div className='flex flex-wrap gap-3'>
        <select
          className='border-border bg-background min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm'
          value={userUuid}
          onChange={event => setUserUuid(event.target.value)}
        >
          <option value=''>Select user...</option>
          {users.map(user => (
            <option key={user.uuid} value={user.uuid ?? ''}>
              {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
            </option>
          ))}
        </select>
        <select
          className='border-border bg-background rounded-md border px-3 py-2 text-sm'
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
          variant='default'
          size='default'
          disabled={!userUuid || isLoading}
          onClick={() => onAssign(userUuid, domain)}
        >
          {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Assign
        </Button>
      </div>
    </div>
  );
}
