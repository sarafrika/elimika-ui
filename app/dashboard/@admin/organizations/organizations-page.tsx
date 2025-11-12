'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AdminOrganisation,
  useAdminOrganisations,
  useUnverifyAdminOrganisation,
  useUpdateAdminOrganisation,
  useVerifyAdminOrganisation,
} from '@/services/admin';
import { useAdminBranches } from '@/services/admin/branches';
import { zOrganisation } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Building2, Loader2, MapPin, Search, Shield, ShieldOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
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

type OrganisationFormValues = z.infer<typeof organisationFormSchema>;

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
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const verifiedCount = useMemo(() => organisations.filter(org => org.admin_verified).length, [organisations]);

  useEffect(() => {
    if (!selectedOrganisationId && organisations.length > 0) {
      setSelectedOrganisationId(organisations[0]?.uuid ?? null);
    }
  }, [organisations, selectedOrganisationId]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 1)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedOrganisation = organisations.find(org => org.uuid === selectedOrganisationId) ?? null;

  const handleSelectOrganisation = (organisation: AdminOrganisation | null) => {
    setSelectedOrganisationId(organisation?.uuid ?? null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <OrganisationListPanel
        organisations={organisations}
        selectedOrganisationId={selectedOrganisationId}
        onSelect={handleSelectOrganisation}
        searchQuery={searchQuery}
        onSearchChange={value => {
          setSearchQuery(value);
          setPage(0);
        }}
        statusFilter={statusFilter}
        onStatusChange={value => {
          setStatusFilter((value as typeof statusFilter) || 'all');
          setPage(0);
        }}
        verificationFilter={verificationFilter}
        onVerificationChange={value => {
          setVerificationFilter((value as typeof verificationFilter) || 'all');
          setPage(0);
        }}
        isLoading={isLoading}
        totalItems={totalItems}
        verifiedCount={verifiedCount}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <OrganisationDetailsPanel organisation={selectedOrganisation} />

      <OrganisationDetailSheet
        organisation={selectedOrganisation}
        open={isSheetOpen && Boolean(selectedOrganisation)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

interface OrganisationListPanelProps {
  organisations: AdminOrganisation[];
  selectedOrganisationId: string | null;
  onSelect: (organisation: AdminOrganisation) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusChange: (value: string) => void;
  verificationFilter: 'all' | 'verified' | 'pending';
  onVerificationChange: (value: string) => void;
  isLoading: boolean;
  totalItems: number;
  verifiedCount: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function OrganisationListPanel({
  organisations,
  selectedOrganisationId,
  onSelect,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  verificationFilter,
  onVerificationChange,
  isLoading,
  totalItems,
  verifiedCount,
  page,
  totalPages,
  onPageChange,
}: OrganisationListPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <div key={`skeleton-${index}`} className='border-border/60 animate-pulse rounded-2xl border bg-muted/40 p-4'>
          <div className='h-4 w-1/2 rounded bg-muted' />
          <div className='mt-2 h-3 w-1/3 rounded bg-muted' />
        </div>
      ));
    }

    if (organisations.length === 0) {
      return (
        <div className='flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center'>
          <Building2 className='mb-3 h-10 w-10 text-muted-foreground' />
          <p className='text-sm font-medium'>No organisations found</p>
          <p className='text-muted-foreground text-xs'>
            Adjust search terms or verification filters to uncover additional partners.
          </p>
        </div>
      );
    }

    return organisations.map(org => (
      <button
        key={org.uuid ?? org.name}
        type='button'
        className={`w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 ${
          selectedOrganisationId === org.uuid ? 'border-primary bg-primary/5' : 'border-border/60 bg-card'
        }`}
        onClick={() => onSelect(org)}
      >
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='font-semibold'>{org.name}</p>
            <p className='text-muted-foreground text-xs flex items-center gap-1'>
              <MapPin className='h-3.5 w-3.5' />
              {org.location || 'Location not provided'}
            </p>
          </div>
          <Badge variant={org.active ? 'secondary' : 'outline'}>{org.active ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className='mt-3 flex flex-wrap gap-2 text-xs'>
          <Badge variant={org.admin_verified ? 'default' : 'outline'} className='gap-1'>
            {org.admin_verified ? <Shield className='h-3 w-3' /> : <ShieldOff className='h-3 w-3' />}
            {org.admin_verified ? 'Verified' : 'Pending'}
          </Badge>
          <span className='text-muted-foreground'>Created: {org.created_date ? format(new Date(org.created_date), 'dd MMM yyyy') : '—'}</span>
        </div>
      </button>
    ));
  };

  return (
    <div className='border-border/60 flex w-full flex-col border-b bg-card/95 backdrop-blur lg:max-w-md lg:border-b-0 lg:border-r'>
      <div className='border-border/60 border-b p-6'>
        <Badge variant='outline' className='border-border/60 bg-muted/60 text-xs font-semibold uppercase tracking-wide'>
          Organisation registry
        </Badge>
        <h1 className='mt-3 text-2xl font-semibold'>Trusted partners</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Validate onboarding requests, maintain licensing metadata, and manage platform availability for every training partner.
        </p>

        <div className='text-muted-foreground mt-6 flex flex-wrap gap-3 text-xs'>
          <span className='rounded-full border px-3 py-1'>In view: {totalItems}</span>
          <span className='rounded-full border px-3 py-1'>Verified: {verifiedCount}</span>
        </div>

        <div className='mt-6 space-y-3'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
            <Input
              value={searchQuery}
              onChange={event => onSearchChange(event.target.value)}
              placeholder='Search by name, location, or description…'
              className='pl-9'
            />
          </div>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className='bg-background/80'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={onVerificationChange}>
              <SelectTrigger className='bg-background/80'>
                <SelectValue placeholder='Verification' />
              </SelectTrigger>
              <SelectContent>
                {verificationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className='flex-1 px-6 py-4'>
        <div className='flex flex-col gap-4 pb-8'>{renderContent()}</div>
      </ScrollArea>

      <div className='border-border/60 flex items-center justify-between border-t px-6 py-4 text-sm'>
        <Button variant='ghost' size='sm' onClick={() => onPageChange(Math.max(page - 1, 0))} disabled={page === 0}>
          Previous
        </Button>
        <div className='text-muted-foreground'>
          Page {totalItems === 0 ? 0 : page + 1} / {totalPages}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface OrganisationDetailsPanelProps {
  organisation: AdminOrganisation | null;
}

function OrganisationDetailsPanel({ organisation }: OrganisationDetailsPanelProps) {
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
    <div className='border-border/60 hidden w-full flex-col bg-card p-6 lg:flex lg:max-w-3xl lg:border-l'>
      {organisation ? (
        <>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>Organisation profile</p>
              <h2 className='mt-2 text-2xl font-semibold'>{organisation.name}</h2>
              <p className='text-muted-foreground text-sm'>{organisation.location ?? 'Location not provided'}</p>
            </div>
            <Badge variant={organisation.admin_verified ? 'default' : 'outline'} className='gap-1'>
              {organisation.admin_verified ? <Shield className='h-4 w-4' /> : <ShieldOff className='h-4 w-4' />}
              {organisation.admin_verified ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          <OrganisationBranchesCard organisationUuid={organisation.uuid} />
          <OrganisationDetailsForm
            form={form}
            onSubmit={handleSubmit}
            isPending={updateOrganisation.isPending}
            organisation={organisation}
            onVerification={handleVerification}
            isVerificationPending={verifyOrganisation.isPending || unverifyOrganisation.isPending}
          />
        </>
      ) : (
        <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
          Select an organisation from the list to begin a review.
        </div>
      )}
    </div>
  );
}

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
        <ScrollArea className='mt-4 flex-1 pr-3'>
          {organisation ? (
            <>
              <OrganisationBranchesCard organisationUuid={organisation.uuid} variant='compact' />
              <OrganisationDetailsForm
                form={form}
                onSubmit={handleSubmit}
                isPending={updateOrganisation.isPending}
                organisation={organisation}
                onVerification={handleVerification}
                isVerificationPending={verifyOrganisation.isPending || unverifyOrganisation.isPending}
              />
            </>
          ) : (
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
              Select an organisation to manage details.
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface OrganisationDetailsFormProps {
  form: UseFormReturn<OrganisationFormValues>;
  onSubmit: (values: OrganisationFormValues) => void;
  isPending: boolean;
  organisation: AdminOrganisation | null;
  onVerification: (action: 'verify' | 'unverify') => void;
  isVerificationPending: boolean;
}

function OrganisationDetailsForm({
  form,
  onSubmit,
  isPending,
  organisation,
  onVerification,
  isVerificationPending,
}: OrganisationDetailsFormProps) {
  const handleVerification = () => {
    onVerification(organisation?.admin_verified ? 'unverify' : 'verify');
  };

  return (
    <Form {...form}>
      <form className='mt-6 space-y-6 pb-6' onSubmit={form.handleSubmit(onSubmit)}>
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder='Add a short summary for internal reviewers' rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
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
            <FormItem className='flex flex-row items-center justify-between rounded-xl border bg-muted/40 p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Active status</FormLabel>
                <p className='text-muted-foreground text-xs'>
                  Inactive organisations lose access to dashboards immediately.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className='rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground'>
          <div className='grid gap-2 sm:grid-cols-2'>
            <div>
              <span className='font-medium text-foreground'>Created:</span>{' '}
              {organisation?.created_date ? format(new Date(organisation.created_date), 'dd MMM yyyy, HH:mm') : '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Updated:</span>{' '}
              {organisation?.updated_date ? format(new Date(organisation.updated_date), 'dd MMM yyyy, HH:mm') : '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>Slug:</span> {organisation?.slug ?? '—'}
            </div>
            <div>
              <span className='font-medium text-foreground'>UUID:</span> {organisation?.uuid ?? '—'}
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='flex-1'
            disabled={isVerificationPending}
            onClick={handleVerification}
          >
            {isVerificationPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : organisation?.admin_verified ? (
              <ShieldOff className='mr-2 h-4 w-4' />
            ) : (
              <Shield className='mr-2 h-4 w-4' />
            )}
            {organisation?.admin_verified ? 'Remove verification' : 'Verify organisation'}
          </Button>
          <Button type='submit' className='flex-1' disabled={isPending}>
            {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
            Save changes
          </Button>
        </div>
      </form>
    </Form>
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

interface OrganisationBranchesCardProps {
  organisationUuid?: string;
  variant?: 'default' | 'compact';
}

function OrganisationBranchesCard({ organisationUuid, variant = 'default' }: OrganisationBranchesCardProps) {
  const { data, isLoading } = useAdminBranches(
    organisationUuid
      ? {
          organizationUuid: organisationUuid,
          page: 0,
          size: 5,
        }
      : null
  );

  if (!organisationUuid) return null;

  const branches = data?.items ?? [];
  const totalBranches = data?.totalItems ?? branches.length;
  const wrapperMargin = variant === 'compact' ? 'mt-4' : 'mt-6';

  return (
    <div className={`rounded-2xl border border-border/60 bg-muted/30 p-4 ${wrapperMargin}`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>Branches</p>
          <p className='text-xl font-semibold'>{isLoading ? '—' : totalBranches}</p>
          <p className='text-muted-foreground text-xs'>Organisation training locations in view</p>
        </div>
        <Badge variant='secondary' className='text-xs'>
          {isLoading ? 'Loading' : `${totalBranches} total`}
        </Badge>
      </div>

      <div className='mt-4 space-y-3'>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={`branch-skeleton-${index}`} className='rounded-xl border border-dashed border-border/60 p-3'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='mt-2 h-3 w-20' />
              </div>
            ))
          : branches.length > 0
            ? branches.map((branch, index) => (
                <div key={branch.uuid ?? `${branch.branch_name ?? 'branch'}-${index}`} className='rounded-xl border border-dashed border-border/60 p-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='font-medium leading-tight'>{branch.branch_name ?? 'Unnamed branch'}</p>
                      <p className='text-muted-foreground text-xs'>
                        {branch.location ?? branch.branch_code ?? 'Location not provided'}
                      </p>
                    </div>
                    <Badge variant={branch.active ? 'secondary' : 'outline'} className='text-xs'>
                      {branch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {branch.branch_code ? (
                    <p className='text-muted-foreground mt-2 text-xs'>Code: {branch.branch_code}</p>
                  ) : null}
                </div>
              ))
            : (
                <p className='text-muted-foreground text-sm'>No branches registered yet.</p>
              )}
      </div>
    </div>
  );
}
