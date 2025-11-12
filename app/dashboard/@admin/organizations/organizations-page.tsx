'use client';

import { AdminDataTable, AdminDataTableColumn } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AdminOrganisation,
  useAdminOrganisations,
  useUnverifyAdminOrganisation,
  useUpdateAdminOrganisation,
  useVerifyAdminOrganisation,
} from '@/services/admin';
import { zOrganisation } from '@/services/client/zod.gen';
import { format } from 'date-fns';
import { Building2, CheckCircle2, Loader2, Shield, ShieldOff, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const organisationFormSchema = z.object({
  name: zOrganisation.shape.name,
  description: zOrganisation.shape.description.optional(),
  active: zOrganisation.shape.active,
  licence_no: zOrganisation.shape.licence_no.optional(),
  location: zOrganisation.shape.location.optional(),
  country: zOrganisation.shape.country.optional(),
});

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active organisations', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const verificationOptions = [
  { label: 'All verification states', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending review', value: 'pending' },
];

export default function AdminOrganisationsPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useAdminOrganisations({
    page,
    size: 20,
    search: searchQuery,
    status: statusFilter,
    verification: verificationFilter,
  });

  const organisations = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 0;

  useEffect(() => {
    if (!selectedOrganisationId && organisations.length > 0) {
      setSelectedOrganisationId(organisations[0]?.uuid ?? null);
    }
  }, [organisations, selectedOrganisationId]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 0)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedOrganisation = organisations.find(org => org.uuid === selectedOrganisationId) ?? null;

  const columns: AdminDataTableColumn<AdminOrganisation>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Organisation',
        className: 'min-w-[220px]'
,
        cell: org => (
          <div className='space-y-1'>
            <div className='font-semibold'>{org.name}</div>
            <div className='text-muted-foreground text-sm'>{org.location ?? 'Location not provided'}</div>
          </div>
        ),
      },
      {
        id: 'active',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: org => (
          <Badge variant={org.active ? 'default' : 'secondary'}>{org.active ? 'Active' : 'Inactive'}</Badge>
        ),
      },
      {
        id: 'verification',
        header: 'Verification',
        className: 'hidden md:table-cell',
        cell: org => (
          <Badge variant={org.admin_verified ? 'default' : 'outline'} className='gap-1'>
            {org.admin_verified ? (
              <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
            ) : (
              <ShieldOff className='h-3.5 w-3.5 text-amber-500' />
            )}
            {org.admin_verified ? 'Verified' : 'Pending'}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        className: 'hidden lg:table-cell text-muted-foreground',
        cell: org => (
          <span className='text-sm'>{org.created_date ? format(new Date(org.created_date), 'dd MMM yyyy') : '—'}</span>
        ),
      },
    ],
    []
  );

  const activeCount = useMemo(() => organisations.filter(org => org.active).length, [organisations]);
  const verifiedCount = useMemo(
    () => organisations.filter(org => org.admin_verified).length,
    [organisations]
  );

  return (
    <div className='mx-auto flex w-full max-w-7xl xl:max-w-[110rem] 2xl:max-w-[130rem] flex-col gap-6 px-4 py-10 2xl:px-10'>
      <div className='relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <Badge variant='outline' className='border-primary/60 bg-primary/10 text-xs font-semibold uppercase tracking-wide'>
              Trust & compliance
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>Organisation registry</h1>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Validate onboarding requests, maintain licensing metadata, and manage platform availability for every training partner.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <MetricCard icon={<Users className='h-5 w-5 text-primary' />} label='Organisations in scope' value={totalItems} />
            <MetricCard icon={<Shield className='h-5 w-5 text-emerald-500' />} label='Verified partners' value={verifiedCount} />
          </div>
        </div>
        <div className='mt-6 grid gap-3 sm:grid-cols-2'>
          <MetricCard
            icon={<CheckCircle2 className='h-5 w-5 text-emerald-500' />}
            label='Active organisations'
            value={activeCount}
          />
          <MetricCard
            icon={<Building2 className='h-5 w-5 text-primary' />}
            label='Awaiting verification'
            value={organisations.filter(org => !org.admin_verified).length}
          />
        </div>
      </div>

      <AdminDataTable
        title='Organisation directory'
        description='Surface critical operational metadata and control onboarding status from a single panel.'
        columns={columns}
        data={organisations}
        getRowId={org => org.uuid ?? org.name}
        selectedId={selectedOrganisationId}
        onRowClick={org => {
          setSelectedOrganisationId(org.uuid ?? null);
          setIsSheetOpen(true);
        }}
        isLoading={isLoading}
        search={{
          value: searchQuery,
          onChange: value => {
            setSearchQuery(value);
            setPage(0);
          },
          onReset: () => {
            setSearchQuery('');
            setStatusFilter('all');
            setVerificationFilter('all');
            setPage(0);
          },
          placeholder: 'Search by name, location, or description…',
        }}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onValueChange: value => {
              setStatusFilter((value as 'all' | 'active' | 'inactive') || 'all');
              setPage(0);
            },
            options: statusOptions,
          },
          {
            id: 'verification',
            label: 'Verification',
            value: verificationFilter,
            onValueChange: value => {
              setVerificationFilter((value as 'all' | 'verified' | 'pending') || 'all');
              setPage(0);
            },
            options: verificationOptions,
          },
        ]}
        pagination={{
          page,
          pageSize: 20,
          totalItems,
          totalPages: totalPages || 1,
          onPageChange: next => setPage(next),
        }}
        emptyState={{
          title: 'No organisations found',
          description: 'Adjust search terms or verification filters to uncover additional partners.',
          icon: <Building2 className='h-10 w-10 text-primary' />,
        }}
      />

      <OrganisationDetailSheet
        organisation={selectedOrganisation}
        open={isSheetOpen && Boolean(selectedOrganisation)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

type OrganisationFormValues = z.infer<typeof organisationFormSchema>;

interface OrganisationDetailSheetProps {
  organisation: AdminOrganisation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function OrganisationDetailSheet({ organisation, open, onOpenChange }: OrganisationDetailSheetProps) {
  const updateOrganisation = useUpdateAdminOrganisation();
  const verifyOrganisation = useVerifyAdminOrganisation();
  const unverifyOrganisation = useUnverifyAdminOrganisation();

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: organisation ? mapOrganisationToForm(organisation) : undefined,
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(organisation ? mapOrganisationToForm(organisation) : undefined);
  }, [organisation, form]);

  const handleSubmit = (values: OrganisationFormValues) => {
    if (!organisation?.uuid) return;

    updateOrganisation.mutate(
      {
        path: { uuid: organisation.uuid },
        body: {
          ...organisation,
          ...values,
        },
      },
      {
        onSuccess: () => {
          toast.success('Organisation updated');
          onOpenChange(false);
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update organisation');
        },
      }
    );
  };

  const handleVerification = (action: 'verify' | 'unverify') => {
    if (!organisation?.uuid) return;

    const mutation = action === 'verify' ? verifyOrganisation : unverifyOrganisation;

    mutation.mutate(
      {
        path: { uuid: organisation.uuid },
        query: { reason: '' },
      },
      {
        onSuccess: () => {
          toast.success(action === 'verify' ? 'Organisation verified' : 'Verification removed');
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update verification');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Organisation profile</SheetTitle>
          <SheetDescription>Update licensing metadata, activation status, and verification flags.</SheetDescription>
        </SheetHeader>
        {organisation ? (
          <ScrollArea className='mt-4 flex-1 pr-3'>
            <Form {...form}>
              <form className='space-y-6 pb-6' onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisation name</FormLabel>
                      <FormControl>
                        <Input placeholder='Training Centre Ltd' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder='Describe mission, scope, or primary focus' rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='location'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary location</FormLabel>
                        <FormControl>
                          <Input placeholder='Nairobi, Kenya' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='country'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder='Kenya' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='licence_no'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Licence number</FormLabel>
                        <FormControl>
                          <Input placeholder='Optional regulatory reference' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Active status</FormLabel>
                        <p className='text-muted-foreground text-sm'>Inactive organisations lose access to dashboards immediately.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div>
                      <span className='font-medium text-foreground'>Created:</span>{' '}
                      {organisation.created_date ? format(new Date(organisation.created_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Updated:</span>{' '}
                      {organisation.updated_date ? format(new Date(organisation.updated_date), 'dd MMM yyyy, HH:mm') : '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>Slug:</span> {organisation.slug ?? '—'}
                    </div>
                    <div>
                      <span className='font-medium text-foreground'>UUID:</span> {organisation.uuid ?? '—'}
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-1'
                    disabled={verifyOrganisation.isPending || unverifyOrganisation.isPending}
                    onClick={() => handleVerification(organisation.admin_verified ? 'unverify' : 'verify')}
                  >
                    {verifyOrganisation.isPending || unverifyOrganisation.isPending ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : organisation.admin_verified ? (
                      <ShieldOff className='mr-2 h-4 w-4' />
                    ) : (
                      <Shield className='mr-2 h-4 w-4' />
                    )}
                    {organisation.admin_verified ? 'Remove verification' : 'Verify organisation'}
                  </Button>
                  <Button type='submit' className='flex-1' disabled={updateOrganisation.isPending}>
                    {updateOrganisation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                    Save changes
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>Select an organisation to manage details.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function mapOrganisationToForm(organisation: AdminOrganisation): OrganisationFormValues {
  return {
    name: organisation.name ?? '',
    description: organisation.description ?? '',
    active: Boolean(organisation.active),
    licence_no: organisation.licence_no ?? '',
    location: organisation.location ?? '',
    country: organisation.country ?? '',
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className='bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='rounded-full bg-primary/10 p-2'>{icon}</div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>{label}</p>
          <p className='text-foreground text-xl font-semibold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
