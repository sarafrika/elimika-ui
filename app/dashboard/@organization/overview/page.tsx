"use client";

import { AdminDataTable } from '@/components/admin/data-table/data-table';
import type { AdminDataTableColumn } from '@/components/admin/data-table/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTrainingCenter } from '@/context/training-center-provide';
import { useUserProfile } from '@/context/profile-context';
import { extractEntity, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import {
  deleteOrganisationMutation,
  getDashboardStatisticsOptions,
  getOrganisationByUuidOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationOptions,
  search2Options,
  updateOrganisationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Organisation, TrainingBranch, User } from '@/services/client';
import { useAdminActivityFeed } from '@/services/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Building2,
  Compass,
  GitBranch,
  Globe2,
  Loader2,
  MapPin,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import PurchasableCatalogue from '../../_components/purchasable-catalogue';

const organisationFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  active: z.boolean(),
  licence_no: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  latitude: z
    .union([z.string().optional(), z.number().optional()])
    .transform(value => (value === undefined || value === '' ? undefined : Number(value)))
    .refine(value => value === undefined || !Number.isNaN(value), 'Latitude must be a number'),
  longitude: z
    .union([z.string().optional(), z.number().optional()])
    .transform(value => (value === undefined || value === '' ? undefined : Number(value)))
    .refine(value => value === undefined || !Number.isNaN(value), 'Longitude must be a number'),
});

type OrganisationFormValues = z.infer<typeof organisationFormSchema>;

const statusColours: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  verified: { label: 'Verified', variant: 'default' },
  pending: { label: 'Pending review', variant: 'secondary' },
  inactive: { label: 'Inactive', variant: 'outline' },
};

export default function OrganisationOverviewPage() {
  const trainingCenter = useTrainingCenter();
  const profile = useUserProfile();
  const qc = useQueryClient();

  const organisationUuid = trainingCenter?.uuid ?? null;
  const isSystemAdmin = profile?.user_domain?.includes('admin');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [searchFilters, setSearchFilters] = useState({
    query: '',
    active: '',
    adminVerified: '',
    country: '',
    location: '',
  });

  const organisationQuery = useQuery({
    ...getOrganisationByUuidOptions({
      path: { uuid: organisationUuid ?? '' },
    }),
    enabled: Boolean(organisationUuid),
  });

  const usersQuery = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const statisticsQuery = useQuery({
    ...getDashboardStatisticsOptions(),
    enabled: isSystemAdmin,
  });

  const {
    data: activityFeed,
    isLoading: isActivityFeedLoading,
    error: activityFeedError,
  } = useAdminActivityFeed({
    enabled: isSystemAdmin,
  });

  const organisation = extractEntity<Organisation>(organisationQuery.data);
  const usersPage = extractPage<User>(usersQuery.data);
  const branchesPage = extractPage<TrainingBranch>(branchesQuery.data);
  const organisationCount = getTotalFromMetadata(usersPage.metadata);
  const branchCount = getTotalFromMetadata(branchesPage.metadata);

  const organisationStatus = useMemo(() => {
    if (!organisation) return null;
    if (!organisation.active) return statusColours.inactive;
    return organisation.admin_verified ? statusColours.verified : statusColours.pending;
  }, [organisation]);

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    values: organisation
      ? {
          name: organisation.name,
          description: organisation.description ?? '',
          active: Boolean(organisation.active),
          licence_no: organisation.licence_no ?? '',
          location: organisation.location ?? '',
          country: organisation.country ?? '',
          latitude: organisation.latitude,
          longitude: organisation.longitude,
        }
      : undefined,
  });

  const updateOrganisation = useMutation(updateOrganisationMutation());
  const deleteOrganisation = useMutation(deleteOrganisationMutation());

  const handleSubmit = (values: OrganisationFormValues) => {
    if (!organisationUuid) return;

    updateOrganisation.mutate(
      {
        path: { uuid: organisationUuid },
        body: values,
      },
      {
        onSuccess: () => {
          toast.success('Organisation updated');
          qc.invalidateQueries({ queryKey: getOrganisationByUuidOptions({ path: { uuid: organisationUuid } }).queryKey });
          setIsEditOpen(false);
        },
        onError: () => toast.error('Unable to update organisation'),
      }
    );
  };

  const handleToggleActive = () => {
    if (!organisation || !organisationUuid) return;
    const nextValue = !organisation.active;

    updateOrganisation.mutate(
      {
        path: { uuid: organisationUuid },
        body: {
          name: organisation.name,
          description: organisation.description,
          licence_no: organisation.licence_no,
          location: organisation.location,
          country: organisation.country,
          latitude: organisation.latitude,
          longitude: organisation.longitude,
          active: nextValue,
        },
      },
      {
        onSuccess: () => {
          toast.success(nextValue ? 'Organisation activated' : 'Organisation deactivated');
          qc.invalidateQueries({ queryKey: getOrganisationByUuidOptions({ path: { uuid: organisationUuid } }).queryKey });
        },
        onError: () => toast.error('Unable to update status'),
      }
    );
  };

  const handleDelete = () => {
    if (!organisationUuid) return;
    deleteOrganisation.mutate(
      { path: { uuid: organisationUuid } },
      {
        onSuccess: () => {
          toast.success('Organisation archived');
          setIsDeleteOpen(false);
        },
        onError: () => toast.error('Unable to delete organisation'),
      }
    );
  };

  const showOrgSearch =
    isSystemAdmin || (profile?.organisation_affiliations?.length ?? 0) > 1;

  const organisationSearchQuery = useQuery({
    ...search2Options({
      query: {
        searchParams: {
          ...(searchFilters.query ? { name_like: searchFilters.query } : {}),
          ...(searchFilters.active ? { active_eq: searchFilters.active === 'true' } : {}),
          ...(searchFilters.adminVerified
            ? { admin_verified_eq: searchFilters.adminVerified === 'true' }
            : {}),
          ...(searchFilters.country ? { country_like: searchFilters.country } : {}),
          ...(searchFilters.location ? { location_like: searchFilters.location } : {}),
        },
        pageable: { page: 0, size: 6 },
      },
    }),
    enabled: showOrgSearch,
  });

  const searchResults = extractPage<Organisation>(organisationSearchQuery.data);
  const searchTotalItems = getTotalFromMetadata(searchResults.metadata);
  const searchTotalPages =
    (searchResults.metadata.totalPages as number | undefined) ||
    (searchTotalItems > 0 ? Math.ceil(searchTotalItems / 6) : 0);

  const overviewLoading = organisationQuery.isLoading || !organisation;

  const organisationColumns: AdminDataTableColumn<Organisation>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: org => (
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{org.name}</span>
            {org.admin_verified ? (
              <Badge variant='default' className='gap-1'>
                <ShieldCheck className='h-3 w-3' /> Verified
              </Badge>
            ) : (
              <Badge variant='secondary' className='gap-1'>
                <ShieldAlert className='h-3 w-3' /> Pending
              </Badge>
            )}
          </div>
          {org.description ? (
            <p className='text-muted-foreground text-xs line-clamp-2'>{org.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location',
      cell: org => (
        <div className='flex flex-col text-sm'>
          <span className='flex items-center gap-1'>
            <MapPin className='h-3.5 w-3.5 text-muted-foreground' />
            {org.location || '—'}
          </span>
          <span className='text-muted-foreground text-xs'>{org.country || 'Country not set'}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: org => (
        <Badge variant={org.active ? 'secondary' : 'outline'}>
          {org.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <Badge variant='outline' className='gap-2'>
            <Building2 className='h-3.5 w-3.5' />
            Organisation workspace
          </Badge>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {organisation?.name ?? 'Organisation'}
            </h1>
            {organisationStatus ? (
              <Badge variant={organisationStatus.variant} className='gap-2'>
                {organisation.admin_verified ? (
                  <ShieldCheck className='h-3.5 w-3.5' />
                ) : (
                  <ShieldAlert className='h-3.5 w-3.5' />
                )}
                {organisationStatus.label}
              </Badge>
            ) : null}
          </div>
          <p className='text-muted-foreground max-w-2xl text-sm'>
            Review compliance flags, manage locations, and keep ownership details in sync with the
            tenancy service.
          </p>
          {organisation?.slug ? (
            <p className='text-muted-foreground text-xs'>Slug: {organisation.slug}</p>
          ) : null}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link prefetch href='/dashboard/branches'>
              Branches
            </Link>
          </Button>
          <Button asChild variant='outline' size='sm'>
            <Link prefetch href='/dashboard/people'>
              People
            </Link>
          </Button>
          <Button size='sm' className='gap-2' onClick={() => setIsEditOpen(true)}>
            <Pencil className='h-4 w-4' />
            Edit profile
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_1fr]'>
        <div className='space-y-6'>
          <CardShell
            title='Profile & status'
            subtitle='Driven directly from the organisation service. Admin verification fields are read-only.'
            action={
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-muted-foreground'>Active</span>
                  <Switch
                    checked={organisation?.active ?? false}
                    disabled={updateOrganisation.isPending || !organisation}
                    onCheckedChange={handleToggleActive}
                  />
                </div>
                <Button variant='outline' size='sm' onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Soft delete
                </Button>
              </div>
            }
          >
            {overviewLoading ? (
              <Skeleton className='h-40 w-full' />
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                <MetaItem label='Name' value={organisation?.name} />
                <MetaItem label='Description' value={organisation?.description || 'Not provided'} />
                <MetaItem label='Licence number' value={organisation?.licence_no || 'Not provided'} />
                <MetaItem label='Country' value={organisation?.country || 'Not provided'} icon={<Globe2 className='h-4 w-4 text-muted-foreground' />} />
                <MetaItem label='Location' value={organisation?.location || 'Not provided'} icon={<MapPin className='h-4 w-4 text-muted-foreground' />} />
                <MetaItem
                  label='Coordinates'
                  value={
                    organisation?.latitude || organisation?.longitude
                      ? `${organisation?.latitude ?? '—'}, ${organisation?.longitude ?? '—'}`
                      : 'Not provided'
                  }
                />
                <MetaItem
                  label='Created'
                  value={organisation?.created_date ? format(new Date(organisation.created_date), 'dd MMM yyyy') : '—'}
                />
                <MetaItem
                  label='Updated'
                  value={organisation?.updated_date ? format(new Date(organisation.updated_date), 'dd MMM yyyy') : '—'}
                />
              </div>
            )}
          </CardShell>

          <CardShell
            title='Workspace overview'
            subtitle='Counts are derived from organisation users and branch endpoints.'
          >
            <div className='grid gap-4 sm:grid-cols-3'>
              <StatTile
                label='People'
                value={organisationCount}
                icon={<Users className='h-4 w-4' />}
                href='/dashboard/people'
              />
              <StatTile
                label='Training branches'
                value={branchCount}
                icon={<GitBranch className='h-4 w-4' />}
                href='/dashboard/branches'
              />
              <StatTile
                label='Invitations'
                value='View'
                icon={<Compass className='h-4 w-4' />}
                href='/dashboard/invitations'
              />
            </div>
          </CardShell>

          <CardShell
            title='Organisation search'
            subtitle='Search or filter partner organisations when you manage multiple tenants.'
            hidden={!showOrgSearch}
          >
            <div className='flex flex-col gap-4'>
              <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
                <Input
                  placeholder='Search by name'
                  value={searchFilters.query}
                  onChange={event => setSearchFilters(current => ({ ...current, query: event.target.value }))}
                />
                <SelectField
                  label='Active'
                  value={searchFilters.active}
                  onValueChange={value => setSearchFilters(current => ({ ...current, active: value }))}
                  options={[
                    { label: 'Any', value: '' },
                    { label: 'Active', value: 'true' },
                    { label: 'Inactive', value: 'false' },
                  ]}
                />
                <SelectField
                  label='Admin verified'
                  value={searchFilters.adminVerified}
                  onValueChange={value =>
                    setSearchFilters(current => ({ ...current, adminVerified: value }))
                  }
                  options={[
                    { label: 'Any', value: '' },
                    { label: 'Verified', value: 'true' },
                    { label: 'Pending', value: 'false' },
                  ]}
                />
                <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-2 lg:col-span-2'>
                  <Input
                    placeholder='Country'
                    value={searchFilters.country}
                    onChange={event =>
                      setSearchFilters(current => ({ ...current, country: event.target.value }))
                    }
                  />
                  <Input
                    placeholder='Location'
                    value={searchFilters.location}
                    onChange={event =>
                      setSearchFilters(current => ({ ...current, location: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  onClick={() => organisationSearchQuery.refetch()}
                  disabled={organisationSearchQuery.isFetching}
                >
                  <Search className='mr-2 h-4 w-4' />
                  Search
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setSearchFilters({ query: '', active: '', adminVerified: '', country: '', location: '' })
                  }
                >
                  Reset
                </Button>
              </div>

              <AdminDataTable
                title='Organisation registry'
                description='Filters map directly to /api/v1/organisations/search.'
                columns={organisationColumns}
                data={searchResults.items}
                isLoading={organisationSearchQuery.isLoading}
                pagination={{
                  page: 0,
                  pageSize: 6,
                  totalItems: searchTotalItems,
                  totalPages: Math.max(searchTotalPages, 1),
                  onPageChange: () => undefined,
                }}
                emptyState={{
                  title: 'No organisations found',
                  description: 'Adjust filters or try another country.',
                  icon: <Building2 className='h-8 w-8 text-muted-foreground' />,
                }}
              />
            </div>
          </CardShell>
        </div>

        <div className='space-y-6'>
          <PlatformHealthPanel
            isSystemAdmin={isSystemAdmin}
            statisticsQuery={statisticsQuery}
            activityEvents={activityFeed?.events ?? []}
            isActivityLoading={isActivityFeedLoading}
            activityError={activityFeedError}
          />
          <PurchasableCatalogue scope='organization' />
          <CardShell
            title='Branches + people snapshot'
            subtitle='Quick glance at recent entities.'
            hidden={!organisation}
          >
            <Tabs defaultValue='branches' className='w-full'>
              <TabsList className='w-full justify-start'>
                <TabsTrigger value='branches'>Branches</TabsTrigger>
                <TabsTrigger value='people'>People</TabsTrigger>
              </TabsList>
              <TabsContent value='branches' className='mt-4 space-y-3'>
                {branchesPage.items.slice(0, 3).map(branch => (
                  <SnapshotRow
                    key={branch.uuid}
                    title={branch.branch_name}
                    subtitle={branch.address || 'No address provided'}
                    meta={branch.poc_name ? `POC: ${branch.poc_name}` : undefined}
                    href={`/dashboard/branches`}
                  />
                ))}
                {branchesPage.items.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No branches yet.</p>
                ) : null}
              </TabsContent>
              <TabsContent value='people' className='mt-4 space-y-3'>
                {usersPage.items.slice(0, 3).map(user => (
                  <SnapshotRow
                    key={user.uuid}
                    title={`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                    subtitle={user.email}
                    meta={user.user_domain?.join(', ')}
                    href='/dashboard/people'
                  />
                ))}
                {usersPage.items.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No members found.</p>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardShell>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Edit organisation</DialogTitle>
            <DialogDescription>
              Slug and admin verification are read-only. Updates call PUT /api/v1/organisations/{'{uuid}'}.
            </DialogDescription>
          </DialogHeader>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField label='Name' name='name' form={form} />
              <FormField label='Licence number' name='licence_no' form={form} />
              <FormField label='Country' name='country' form={form} />
              <FormField label='Location' name='location' form={form} />
              <FormField label='Latitude' name='latitude' form={form} inputMode='numeric' />
              <FormField label='Longitude' name='longitude' form={form} inputMode='numeric' />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} {...form.register('description')} />
            </div>
            <div className='flex items-center gap-2'>
              <Switch checked={form.watch('active')} onCheckedChange={checked => form.setValue('active', checked)} />
              <span className='text-sm'>Active</span>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateOrganisation.isPending}>
                {updateOrganisation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soft delete organisation</DialogTitle>
            <DialogDescription>
              This calls DELETE /api/v1/organisations/{'{uuid}'} and removes the organisation from active
              listings.
            </DialogDescription>
          </DialogHeader>
          <p className='text-muted-foreground text-sm'>
            Branch ownership is enforced server-side. You can restore by re-creating the record if
            needed.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteOrganisation.isPending}>
              {deleteOrganisation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='mr-2 h-4 w-4' />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardShell({
  title,
  subtitle,
  children,
  action,
  hidden,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>{title}</h2>
          {subtitle ? <p className='text-muted-foreground text-sm'>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <Separator className='my-4' />
      {children}
    </div>
  );
}

function MetaItem({ label, value, icon }: { label: string; value?: string | number | null; icon?: ReactNode }) {
  return (
    <div className='rounded-xl border border-border/60 bg-muted/40 p-3'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
      <div className='mt-1 flex items-center gap-2 text-sm font-medium'>
        {icon}
        <span>{value ?? '—'}</span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  href?: string;
}) {
  const content = (
    <div className='rounded-xl border border-border/70 bg-muted/40 p-4 transition hover:border-primary/50 hover:bg-primary/5'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</p>
        {icon}
      </div>
      <p className='mt-2 text-2xl font-semibold'>{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link prefetch href={href} className='block'>
        {content}
      </Link>
    );
  }

  return content;
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className='space-y-2'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      <div className='rounded-md border border-border/60 bg-background'>
        <select
          className='w-full bg-transparent px-3 py-2 text-sm outline-none'
          value={value}
          onChange={event => onValueChange(event.target.value)}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PlatformHealthPanel({
  isSystemAdmin,
  statisticsQuery,
  activityEvents,
  isActivityLoading,
  activityError,
}: {
  isSystemAdmin: boolean;
  statisticsQuery: UseQueryResult;
  activityEvents: { title?: string; timestamp?: Date | string; description?: string }[];
  isActivityLoading: boolean;
  activityError: unknown;
}) {
  if (!isSystemAdmin) return null;

  const statistics = statisticsQuery.data as any;
  const organisationMetrics = statistics?.data?.organization_metrics;

  const cards = [
    {
      label: 'Total organisations',
      value: organisationMetrics?.total_organisations ?? '—',
    },
    {
      label: 'Pending approvals',
      value: organisationMetrics?.pending_approvals ?? '—',
    },
    {
      label: 'Active organisations',
      value: organisationMetrics?.active_organisations ?? '—',
    },
  ];

  return (
    <CardShell
      title='Platform health'
      subtitle='Sourced from GET /api/v1/admin/dashboard/statistics and /activity-feed.'
    >
      <div className='grid gap-3 sm:grid-cols-3'>
        {cards.map(card => (
          <div
            key={card.label}
            className='rounded-xl border border-border/60 bg-muted/40 p-3 text-sm'
          >
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>{card.label}</p>
            {statisticsQuery.isLoading ? (
              <Skeleton className='mt-2 h-6 w-16' />
            ) : (
              <p className='mt-1 text-xl font-semibold'>{card.value}</p>
            )}
          </div>
        ))}
      </div>
      <Separator className='my-4' />
      <div className='space-y-3'>
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <AlertCircle className='h-4 w-4' />
          Activity feed
        </div>
        {activityError ? (
          <p className='text-muted-foreground text-sm'>Unable to load activity feed.</p>
        ) : null}
        {isActivityLoading ? (
          <Skeleton className='h-10 w-full' />
        ) : (
          activityEvents.slice(0, 4).map(event => (
            <div
              key={`${event.title}-${event.timestamp}`}
              className='rounded-lg border border-border/60 bg-background p-3 text-sm'
            >
              <p className='font-medium'>{event.title ?? 'Admin event'}</p>
              <p className='text-muted-foreground text-xs'>
                {event.timestamp
                  ? format(new Date(event.timestamp), 'dd MMM yyyy, HH:mm')
                  : '—'}
              </p>
              {event.description ? (
                <p className='text-muted-foreground mt-1 text-xs'>{event.description}</p>
              ) : null}
            </div>
          ))
        )}
        {activityEvents.length === 0 && !isActivityLoading ? (
          <p className='text-muted-foreground text-sm'>No recent admin events.</p>
        ) : null}
      </div>
    </CardShell>
  );
}

function SnapshotRow({
  title,
  subtitle,
  meta,
  href,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  href?: string;
}) {
  const content = (
    <div className='rounded-xl border border-border/60 bg-muted/40 p-3'>
      <p className='font-medium'>{title}</p>
      {subtitle ? <p className='text-muted-foreground text-xs'>{subtitle}</p> : null}
      {meta ? <p className='text-muted-foreground text-xs'>{meta}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link prefetch href={href} className='block'>
        {content}
      </Link>
    );
  }

  return content;
}

function FormField({
  label,
  name,
  form,
  inputMode,
}: {
  label: string;
  name: keyof OrganisationFormValues;
  form: ReturnType<typeof useForm<OrganisationFormValues>>;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const errorMessage = form.formState.errors[name]?.message;

  return (
    <div className='space-y-1.5'>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} inputMode={inputMode} {...form.register(name)} />
      {errorMessage ? <p className='text-destructive text-xs'>{String(errorMessage)}</p> : null}
    </div>
  );
}
