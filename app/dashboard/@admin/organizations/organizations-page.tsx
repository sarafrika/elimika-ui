'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { extractPage } from '@/lib/api-helpers';
import {
  useUnverifyAdminOrganisation,
  useUpdateAdminOrganisation,
  useVerifyAdminOrganisation,
  type AdminOrganisation,
} from '@/services/admin';
import { useAdminBranches } from '@/services/admin/branches';
import {
  getAllOrganisationsOptions,
  getUsersByOrganisationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { zOrganisation } from '@/services/client/zod.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Shield,
  ShieldOff,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';

const organisationFormSchema = z.object({
  name: zOrganisation.shape.name,
  description: zOrganisation.shape.description.optional(),
  active: zOrganisation.shape.active,
  licence_no: zOrganisation.shape.licence_no.optional(),
  location: zOrganisation.shape.location.optional(),
  country: zOrganisation.shape.country.optional(),
});

type OrganisationFormValues = z.infer<typeof organisationFormSchema>;

function useInvalidateOrganisationList() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      predicate: query => {
        const root = (query.queryKey?.[0] ?? {}) as { _id?: string };
        return root._id === 'getAllOrganisations';
      },
    });
}

export default function AdminOrganisationsPage() {
  const [page, setPage] = useState(0);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>(
    'all'
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    ...getAllOrganisationsOptions({
      query: {
        pageable: {
          page: 0, // Fetch all from page 0
          size: 1000, // Fetch a large number to do client-side filtering
        },
      },
    }),
  });

  const { items: allOrganisations, metadata } = useMemo(
    () => extractPage<AdminOrganisation>(data),
    [data]
  );

  // Apply filters
  const filteredOrganisations = useMemo(() => {
    return allOrganisations.filter(org => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          org.name.toLowerCase().includes(searchLower) ||
          org.location?.toLowerCase().includes(searchLower) ||
          org.email?.toLowerCase().includes(searchLower) ||
          org.phone_number?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Verification filter
      if (verificationFilter === 'verified' && !org.admin_verified) {
        return false;
      }
      if (verificationFilter === 'unverified' && org.admin_verified) {
        return false;
      }

      // Active filter
      if (activeFilter === 'active' && !org.active) {
        return false;
      }
      if (activeFilter === 'inactive' && org.active) {
        return false;
      }

      return true;
    });
  }, [allOrganisations, searchQuery, verificationFilter, activeFilter]);

  // Paginate filtered results
  const paginatedOrganisations = useMemo(() => {
    const start = page * pageSize;
    return filteredOrganisations.slice(start, start + pageSize);
  }, [filteredOrganisations, page, pageSize]);

  // Calculate stats from ALL organisations (not filtered)
  const totalAvailable = allOrganisations.length;
  const verifiedCount = useMemo(
    () => allOrganisations.filter(org => org.admin_verified).length,
    [allOrganisations]
  );
  const unverifiedCount = useMemo(
    () => allOrganisations.length - verifiedCount,
    [allOrganisations, verifiedCount]
  );

  // Total pages based on filtered results
  const totalPages = Math.max(Math.ceil(filteredOrganisations.length / pageSize), 1);

  const inViewCount = paginatedOrganisations.length;

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, verificationFilter, activeFilter]);

  // Auto-select first org when list changes
  useEffect(() => {
    if (!selectedOrganisationId && paginatedOrganisations.length > 0) {
      setSelectedOrganisationId(paginatedOrganisations[0]?.uuid ?? null);
    }
  }, [paginatedOrganisations, selectedOrganisationId]);

  // Reset page if it exceeds total pages
  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(0);
    }
  }, [page, totalPages]);

  const selectedOrganisation =
    allOrganisations.find(org => org.uuid === selectedOrganisationId) ?? null;

  const handleSelectOrganisation = (organisation: AdminOrganisation | null) => {
    setSelectedOrganisationId(organisation?.uuid ?? null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] w-full flex-col overflow-hidden lg:flex-row'>
      <OrganisationListPanel
        organisations={paginatedOrganisations}
        selectedOrganisationId={selectedOrganisationId}
        onSelect={handleSelectOrganisation}
        isLoading={isLoading}
        inViewCount={inViewCount}
        verifiedCount={verifiedCount}
        unverifiedCount={unverifiedCount}
        totalAvailable={totalAvailable}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        verificationFilter={verificationFilter}
        onVerificationFilterChange={setVerificationFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
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
  isLoading: boolean;
  inViewCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  totalAvailable: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  //
  searchQuery: string;
  onSearchChange: (query: string) => void;
  verificationFilter: 'all' | 'verified' | 'unverified';
  onVerificationFilterChange: (filter: 'all' | 'verified' | 'unverified') => void;
  activeFilter: 'all' | 'active' | 'inactive';
  onActiveFilterChange: (filter: 'all' | 'active' | 'inactive') => void;
}

function OrganisationListPanel({
  organisations,
  selectedOrganisationId,
  onSelect,
  isLoading,
  inViewCount,
  verifiedCount,
  unverifiedCount,
  totalAvailable,
  page,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  verificationFilter,
  onVerificationFilterChange,
  activeFilter,
  onActiveFilterChange,
}: OrganisationListPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className='border-border/60 bg-muted/40 animate-pulse rounded-lg border p-3'
        >
          <div className='bg-muted h-3 w-1/2 rounded' />
          <div className='bg-muted mt-1.5 h-2 w-1/3 rounded' />
        </div>
      ));
    }

    if (organisations.length === 0) {
      return (
        <div className='border-border/60 bg-muted/30 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center'>
          <Building2 className='text-muted-foreground mb-2 h-8 w-8' />
          <p className='text-xs font-medium'>No organisations found</p>
          <p className='text-muted-foreground text-[11px]'>Try adjusting your filters or search.</p>
        </div>
      );
    }

    return organisations.map(org => (
      <button
        key={org.uuid ?? org.name}
        type='button'
        className={`relative w-full rounded-lg border p-3 text-left transition ${
          selectedOrganisationId === org.uuid
            ? 'border-primary bg-primary/5 ring-primary/40 shadow-sm ring-1'
            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5'
        }`}
        onClick={() => onSelect(org)}
      >
        {selectedOrganisationId === org.uuid && (
          <div className='bg-primary absolute top-2 right-2 h-2 w-2 rounded-full' />
        )}

        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold'>{org.name}</p>
            <p className='text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]'>
              <MapPin className='h-3 w-3 flex-shrink-0' />
              <span className='truncate'>{org.location || 'Location not provided'}</span>
            </p>
          </div>
          <Badge
            variant={org.active ? 'secondary' : 'outline'}
            className='flex-shrink-0 text-[10px]'
          >
            {org.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className='mt-2 flex items-center justify-between gap-2 text-[11px]'>
          <Badge
            variant={org.admin_verified ? 'default' : 'secondary'}
            className='gap-1 text-[10px]'
          >
            {org.admin_verified ? (
              <Shield className='h-2.5 w-2.5' />
            ) : (
              <ShieldOff className='h-2.5 w-2.5' />
            )}
            {org.admin_verified ? 'Verified' : 'Pending'}
          </Badge>
          <span className='text-muted-foreground truncate'>
            {org.created_date ? format(new Date(org.created_date), 'dd MMM yyyy') : '—'}
          </span>
        </div>
      </button>
    ));
  };

  return (
    <div className='border-border/60 bg-card/95 flex w-full flex-col border-b backdrop-blur lg:max-w-md lg:border-r lg:border-b-0'>
      {/* Compact Header */}
      <div className='border-border/60 border-b p-4'>
        <div className='mb-3 flex items-start justify-between gap-2'>
          <div>
            <Badge
              variant='outline'
              className='border-border/60 bg-muted/60 text-[10px] font-semibold tracking-wide uppercase'
            >
              Organisation registry
            </Badge>
            <h1 className='mt-2 text-lg font-semibold'>Trusted partners</h1>
          </div>
        </div>

        {/* Compact Stats */}
        <div className='text-muted-foreground mb-3 flex flex-wrap gap-1.5 text-xs'>
          <span className='rounded-full border px-3 py-1'>{inViewCount} in view</span>
          <span className='rounded-full border px-3 py-1'>{verifiedCount} verified</span>
          <span className='rounded-full border px-3 py-1'>{unverifiedCount} pending</span>
          <span className='rounded-full border px-3 py-1'>{totalAvailable} total</span>
        </div>

        {/* Search */}
        <div className='relative mb-2'>
          <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            placeholder='Search organisations...'
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className='h-8 pl-8 text-sm'
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className='text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className='flex gap-2'>
          <Select
            value={verificationFilter}
            onValueChange={(value: 'all' | 'verified' | 'unverified') =>
              onVerificationFilterChange(value)
            }
          >
            <SelectTrigger className='h-8 flex-1 text-xs'>
              <SelectValue placeholder='Verification' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>
                All status
              </SelectItem>
              <SelectItem value='verified' className='text-xs'>
                Verified
              </SelectItem>
              <SelectItem value='unverified' className='text-xs'>
                Unverified
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={activeFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => onActiveFilterChange(value)}
          >
            <SelectTrigger className='h-8 flex-1 text-xs'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>
                All
              </SelectItem>
              <SelectItem value='active' className='text-xs'>
                Active
              </SelectItem>
              <SelectItem value='inactive' className='text-xs'>
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {(searchQuery || verificationFilter !== 'all' || activeFilter !== 'all') && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                onSearchChange('');
                onVerificationFilterChange('all');
                onActiveFilterChange('all');
              }}
              className='h-8 px-2'
            >
              <X className='h-3.5 w-3.5' />
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchQuery || verificationFilter !== 'all' || activeFilter !== 'all') && (
          <div className='mt-2 flex flex-wrap items-center gap-1.5'>
            <span className='text-muted-foreground text-[10px]'>Active:</span>
            {searchQuery && (
              <Badge variant='secondary' className='gap-1 text-[10px]'>
                Search: {searchQuery}
                <button onClick={() => onSearchChange('')} className='hover:text-destructive'>
                  <X className='h-2.5 w-2.5' />
                </button>
              </Badge>
            )}
            {verificationFilter !== 'all' && (
              <Badge variant='secondary' className='gap-1 text-[10px]'>
                {verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
                <button
                  onClick={() => onVerificationFilterChange('all')}
                  className='hover:text-destructive'
                >
                  <X className='h-2.5 w-2.5' />
                </button>
              </Badge>
            )}
            {activeFilter !== 'all' && (
              <Badge variant='secondary' className='gap-1 text-[10px]'>
                {activeFilter === 'active' ? 'Active' : 'Inactive'}
                <button
                  onClick={() => onActiveFilterChange('all')}
                  className='hover:text-destructive'
                >
                  <X className='h-2.5 w-2.5' />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Scrollable List - More compact */}
      <ScrollArea className='h-0 flex-1 px-4 py-3'>
        <div className='flex flex-col gap-2 pb-4'>{renderContent()}</div>
      </ScrollArea>

      {/* Compact Pagination */}
      <div className='border-border/60 border-t px-4 py-3'>
        <div className='mb-2 flex items-center justify-between text-sm'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onPageChange(Math.max(page - 1, 0))}
            disabled={page === 0}
            className='h-7 px-2 text-xs'
          >
            <ChevronLeft className='h-3.5 w-3.5' />
            Previous
          </Button>

          <div className='flex items-center gap-1'>
            {(() => {
              const maxVisible = 3;
              const half = Math.floor(maxVisible / 2);
              let start = Math.max(0, page - half);
              let end = Math.min(totalPages, start + maxVisible);

              if (end - start < maxVisible) {
                start = Math.max(0, end - maxVisible);
              }

              const pages = [];

              // First page
              if (start > 0) {
                pages.push(
                  <Button
                    key={0}
                    variant={0 === page ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => onPageChange(0)}
                    className='h-7 w-7 p-0 text-xs'
                  >
                    1
                  </Button>
                );
                if (start > 1) {
                  pages.push(
                    <span key='ellipsis-start' className='text-muted-foreground px-0.5 text-xs'>
                      ...
                    </span>
                  );
                }
              }

              // Middle pages
              for (let i = start; i < end; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={i === page ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => onPageChange(i)}
                    className='h-7 w-7 p-0 text-xs'
                  >
                    {i + 1}
                  </Button>
                );
              }

              // Last page
              if (end < totalPages) {
                if (end < totalPages - 1) {
                  pages.push(
                    <span key='ellipsis-end' className='text-muted-foreground px-0.5 text-xs'>
                      ...
                    </span>
                  );
                }
                pages.push(
                  <Button
                    key={totalPages - 1}
                    variant={totalPages - 1 === page ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => onPageChange(totalPages - 1)}
                    className='h-7 w-7 p-0 text-xs'
                  >
                    {totalPages}
                  </Button>
                );
              }

              return pages;
            })()}
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className='h-7 px-2 text-xs'
          >
            Next
            <ChevronRight className='h-3.5 w-3.5' />
          </Button>
        </div>

        <div className='text-muted-foreground text-center text-[11px]'>
          Showing {inViewCount} of {totalAvailable} organizations
        </div>
      </div>
    </div>
  );
}

interface OrganisationSummaryProps {
  organisation: AdminOrganisation;
  variant?: 'default' | 'compact';
}

function OrganisationSummary({ organisation, variant = 'default' }: OrganisationSummaryProps) {
  const gridColumns = variant === 'compact' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  const containerPadding = variant === 'compact' ? 'p-4' : 'p-5';

  return (
    <div className={`border-border/60 bg-muted/30 rounded-2xl border ${containerPadding}`}>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs tracking-wide uppercase'>
            Organisation overview
          </p>
          <p className='text-lg leading-tight font-semibold'>{organisation.name}</p>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {organisation.description || 'No internal summary has been added yet.'}
          </p>
        </div>
        <div className='flex flex-col items-end gap-2 text-right'>
          <Badge variant={organisation.active ? 'secondary' : 'outline'} className='w-fit'>
            {organisation.active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge
            variant={organisation.admin_verified ? 'success' : 'secondary'}
            className='w-fit gap-1'
          >
            {organisation.admin_verified ? (
              <Shield className='h-3.5 w-3.5' />
            ) : (
              <ShieldOff className='h-3.5 w-3.5' />
            )}
            {organisation.admin_verified ? 'Verified' : 'Pending'}
          </Badge>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${gridColumns}`}>
        <DetailTile
          label='Primary location'
          value={organisation.location ?? 'Location not provided'}
        />
        <DetailTile label='Country' value={organisation.country ?? '—'} />
        <DetailTile label='Licence number' value={organisation.licence_no ?? 'Not provided'} />
        <DetailTile label='Slug' value={organisation.slug ?? '—'} />
        <DetailTile
          label='Created'
          value={
            organisation.created_date
              ? format(new Date(organisation.created_date), 'dd MMM yyyy, HH:mm')
              : '—'
          }
        />
        <DetailTile
          label='Last updated'
          value={
            organisation.updated_date
              ? format(new Date(organisation.updated_date), 'dd MMM yyyy, HH:mm')
              : '—'
          }
        />
        <DetailTile
          label='UUID'
          value={
            <span className='text-muted-foreground text-xs font-medium break-words'>
              {organisation.uuid ?? '—'}
            </span>
          }
        />
      </div>
    </div>
  );
}

interface DetailTileProps {
  label: string;
  value: ReactNode;
}

function DetailTile({ label, value }: DetailTileProps) {
  return (
    <div className='border-border/60 bg-card/80 rounded-xl border border-dashed p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <div className='mt-1 text-sm leading-tight font-semibold break-words'>{value}</div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='border-border/60 bg-muted/20 hover:bg-muted/30 rounded-[12px] border p-3.5 transition-all'>
      <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
        {label}
      </p>
      <div className='text-foreground mt-1.5 text-sm leading-tight font-semibold'>{value}</div>
    </div>
  );
}

function OrganisationStats({ organisationUuid }: { organisationUuid?: string }) {
  const { data: branchesData, isLoading: branchesLoading } = useAdminBranches(
    organisationUuid ? { organizationUuid: organisationUuid, page: 0, size: 1 } : null
  );

  const { data: usersData, isLoading: usersLoading } = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid ?? '' },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  const totalBranches = branchesData?.totalItems ?? 0;
  const totalMembers = usersData?.data?.metadata?.totalElements ?? 0;

  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <StatCard
        icon={Building2}
        label='Branches'
        value={branchesLoading ? '—' : totalBranches.toString()}
        description='Training locations'
      />
      <StatCard
        icon={Users}
        label='Members'
        value={usersLoading ? '—' : totalMembers.toString()}
        description='Affiliated users'
      />
      <StatCard
        icon={TrendingUp}
        label='Status'
        value='Active'
        description='Organization state'
        variant='success'
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  variant = 'default',
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  description: string;
  variant?: 'default' | 'success';
}) {
  const variantClasses = {
    default: 'border-border bg-card',
    success: 'border-success/30 bg-success/5',
  };

  const iconClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success-foreground',
  };

  return (
    <div
      className={`rounded-[14px] border p-4 transition-all hover:shadow-sm ${variantClasses[variant]}`}
    >
      <div className='flex items-start justify-between'>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${iconClasses[variant]}`}
        >
          <Icon className='h-5 w-5' />
        </div>
      </div>
      <div className='mt-3'>
        <p className='text-foreground text-2xl font-bold'>{value}</p>
        <p className='text-muted-foreground mt-0.5 text-xs font-medium tracking-wider uppercase'>
          {label}
        </p>
        <p className='text-muted-foreground mt-1 text-xs'>{description}</p>
      </div>
    </div>
  );
}

function OrganisationMembersCard({ organisationUuid }: { organisationUuid?: string }) {
  const { data, isLoading } = useQuery({
    ...getUsersByOrganisationOptions({
      path: { uuid: organisationUuid ?? '' },
      query: { pageable: { page: 0, size: 5 } },
    }),
    enabled: Boolean(organisationUuid),
  });

  if (!organisationUuid) return null;

  const users = data?.data?.content ?? [];
  const totalMembers = data?.data?.metadata?.totalElements ?? users.length;

  return (
    <div className='border-border/60 bg-card/50 rounded-[16px] border p-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-[10px]'>
            <Users className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-foreground text-sm font-semibold'>Members</p>
            <p className='text-muted-foreground text-xs'>
              {isLoading
                ? 'Loading...'
                : `${totalMembers} ${totalMembers === 1 ? 'member' : 'members'}`}
            </p>
          </div>
        </div>
        {totalMembers > 0 && (
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/dashboard/organizations/${organisationUuid}/users`} className='gap-1.5'>
              View all
              <ChevronRight className='h-4 w-4' />
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='mt-4 space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`member-skeleton-${index}`}
              className='border-border/60 rounded-[12px] border p-3'
            >
              <Skeleton className='h-4 w-32' />
              <Skeleton className='mt-2 h-3 w-20' />
            </div>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className='mt-4 space-y-2'>
          {users.slice(0, 5).map((user, index) => (
            <div
              key={user.uuid ?? `user-${index}`}
              className='border-border/60 bg-muted/10 hover:bg-muted/20 flex items-center justify-between rounded-[12px] border p-3 transition'
            >
              <div className='flex-1'>
                <p className='text-foreground text-sm leading-tight font-medium'>
                  {user.first_name} {user.last_name}
                </p>
                <p className='text-muted-foreground mt-0.5 text-xs'>{user.email ?? 'No email'}</p>
              </div>
              {user.organisation_affiliations && user.organisation_affiliations.length > 0 && (
                <Badge variant='outline' className='text-xs'>
                  {user.organisation_affiliations[0]?.domain_in_organisation ?? 'Member'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className='text-muted-foreground mt-4 text-sm'>No members yet</p>
      )}
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
  const invalidateOrganisations = useInvalidateOrganisationList();

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: organisation
      ? mapOrganisationToForm(organisation)
      : {
          name: '',
          description: '',
          active: false,
          licence_no: '',
          location: '',
          country: '',
        },
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
          invalidateOrganisations();
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
    const actionParam = action === 'verify' ? 'approve' : 'revoke';

    mutation.mutate(
      {
        path: { uuid: organisation.uuid },
        query: { reason: '', action: actionParam },
      },
      {
        onSuccess: () => {
          toast.success(action === 'verify' ? 'Organisation verified' : 'Verification removed');
          invalidateOrganisations();
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update verification');
        },
      }
    );
  };

  return (
    <div className='border-border/60 bg-card hidden w-full flex-col lg:flex lg:h-full lg:border-l'>
      {organisation ? (
        <div className='flex h-full min-h-0 flex-col overflow-hidden'>
          {/* Modern Header */}
          <div className='border-border/60 bg-muted/20 shrink-0 border-b px-6 py-5'>
            <div className='flex items-start gap-4'>
              <div className='bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]'>
                <Building2 className='text-primary h-7 w-7' />
              </div>
              <div className='flex-1 space-y-2'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h2 className='text-foreground text-xl leading-tight font-semibold'>
                      {organisation.name}
                    </h2>
                    <p className='text-muted-foreground mt-1 flex items-center gap-1.5 text-sm'>
                      <MapPin className='h-3.5 w-3.5' />
                      {organisation.location ?? 'Location not provided'}
                    </p>
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge
                    variant={organisation.admin_verified ? 'default' : 'secondary'}
                    className='gap-1.5'
                  >
                    {organisation.admin_verified ? (
                      <Shield className='h-3.5 w-3.5' />
                    ) : (
                      <ShieldOff className='h-3.5 w-3.5' />
                    )}
                    {organisation.admin_verified ? 'Verified' : 'Pending'}
                  </Badge>
                  <Badge variant={organisation.active ? 'secondary' : 'outline'}>
                    {organisation.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className='min-h-0 flex-1'>
            <div className='px-6 py-6'>
              <div className='space-y-6 pb-10'>
                {/* Quick Stats */}
                <OrganisationStats organisationUuid={organisation.uuid} />

                {/* Description */}
                {organisation.description && (
                  <div className='border-border/60 bg-muted/20 rounded-[16px] border p-5'>
                    <p className='text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                      <BookOpen className='h-3.5 w-3.5' />
                      Description
                    </p>
                    <p className='text-foreground text-sm leading-relaxed'>
                      {organisation.description}
                    </p>
                  </div>
                )}

                {/* Organization Details Grid */}
                <div className='space-y-3'>
                  <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                    <Building2 className='h-3.5 w-3.5' />
                    Organization Details
                  </p>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <InfoCard label='Primary location' value={organisation.location ?? '—'} />
                    <InfoCard label='Country' value={organisation.country ?? '—'} />
                    <InfoCard
                      label='Licence number'
                      value={organisation.licence_no ?? 'Not provided'}
                    />
                    <InfoCard label='Slug' value={organisation.slug ?? '—'} />
                  </div>
                </div>

                {/* Members Section */}
                <OrganisationMembersCard organisationUuid={organisation.uuid} />

                {/* Branches Section */}
                <OrganisationBranchesCard organisationUuid={organisation.uuid} />

                {/* Activity Timeline */}
                <div className='space-y-3'>
                  <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                    <Calendar className='h-3.5 w-3.5' />
                    Timeline
                  </p>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <InfoCard
                      label='Created'
                      value={
                        organisation.created_date
                          ? format(new Date(organisation.created_date), 'dd MMM yyyy, HH:mm')
                          : '—'
                      }
                    />
                    <InfoCard
                      label='Last updated'
                      value={
                        organisation.updated_date
                          ? format(new Date(organisation.updated_date), 'dd MMM yyyy, HH:mm')
                          : '—'
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Edit Form */}
                <OrganisationDetailsForm
                  form={form}
                  onSubmit={handleSubmit}
                  isPending={updateOrganisation.isPending}
                  organisation={organisation}
                  onVerification={handleVerification}
                  isVerificationPending={
                    verifyOrganisation.isPending || unverifyOrganisation.isPending
                  }
                />

                {/* Technical Details (Collapsed) */}
                <details className='group border-border/60 bg-card/50 rounded-[16px] border'>
                  <summary className='text-foreground hover:bg-muted/30 flex cursor-pointer items-center justify-between p-4 text-sm font-semibold transition'>
                    Technical Details
                    <span className='text-muted-foreground transition group-open:rotate-180'>
                      ▼
                    </span>
                  </summary>
                  <div className='border-border/60 space-y-3 border-t p-4'>
                    <InfoCard
                      label='UUID'
                      value={
                        <span className='text-muted-foreground font-mono text-xs break-all'>
                          {organisation.uuid ?? '—'}
                        </span>
                      }
                    />
                  </div>
                </details>
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className='text-muted-foreground flex h-full items-center justify-center px-6 text-sm'>
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

function OrganisationDetailSheet({
  organisation,
  open,
  onOpenChange,
}: OrganisationDetailSheetProps) {
  const updateOrganisation = useUpdateAdminOrganisation();
  const verifyOrganisation = useVerifyAdminOrganisation();
  const unverifyOrganisation = useUnverifyAdminOrganisation();
  const invalidateOrganisations = useInvalidateOrganisationList();

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationFormSchema),
    defaultValues: organisation
      ? mapOrganisationToForm(organisation)
      : {
          name: '',
          description: '',
          active: false,
          licence_no: '',
          location: '',
          country: '',
        },
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
          invalidateOrganisations();
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
    const actionParam = action === 'verify' ? 'approve' : 'revoke';

    mutation.mutate(
      {
        path: { uuid: organisation.uuid },
        query: { reason: '', action: actionParam },
      },
      {
        onSuccess: () => {
          toast.success(action === 'verify' ? 'Organisation verified' : 'Verification removed');
          invalidateOrganisations();
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update verification');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l p-0'>
        <div className='flex h-full flex-col'>
          <div className='border-b px-6 py-4'>
            <SheetHeader>
              <SheetTitle>Organisation profile</SheetTitle>
              <SheetDescription>
                Update licensing metadata, activation status, and verification flags.
              </SheetDescription>
            </SheetHeader>
          </div>
          <ScrollArea className='h-0 flex-1 px-6 py-4'>
            {organisation ? (
              <div className='space-y-6 pb-10'>
                <OrganisationSummary organisation={organisation} variant='compact' />
                <OrganisationBranchesCard organisationUuid={organisation.uuid} variant='compact' />
                <OrganisationDetailsForm
                  form={form}
                  onSubmit={handleSubmit}
                  isPending={updateOrganisation.isPending}
                  organisation={organisation}
                  onVerification={handleVerification}
                  isVerificationPending={
                    verifyOrganisation.isPending || unverifyOrganisation.isPending
                  }
                />
              </div>
            ) : (
              <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
                Select an organisation to manage details.
              </div>
            )}
          </ScrollArea>
        </div>
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
      <form className='space-y-6 pb-6' onSubmit={form.handleSubmit(onSubmit)}>
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
                <Textarea
                  placeholder='Add a short summary for internal reviewers'
                  rows={4}
                  {...field}
                />
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
            <FormItem className='bg-muted/40 flex flex-row items-center justify-between rounded-xl border p-4'>
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

function OrganisationBranchesCard({
  organisationUuid,
  variant = 'default',
}: OrganisationBranchesCardProps) {
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

  return (
    <div className='border-border/60 bg-card/50 rounded-[16px] border p-5'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-[10px]'>
            <MapPin className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-foreground text-sm font-semibold'>Branches</p>
            <p className='text-muted-foreground text-xs'>
              {isLoading
                ? 'Loading...'
                : `${totalBranches} training ${totalBranches === 1 ? 'location' : 'locations'}`}
            </p>
          </div>
        </div>
        {totalBranches > 0 && (
          <Button variant='ghost' size='sm' asChild>
            <Link
              href={`/dashboard/organizations/${organisationUuid}/branches`}
              className='gap-1.5'
            >
              View all
              <ChevronRight className='h-4 w-4' />
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='mt-4 space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`branch-skeleton-${index}`}
              className='border-border/60 rounded-[12px] border p-3'
            >
              <Skeleton className='h-4 w-32' />
              <Skeleton className='mt-2 h-3 w-20' />
            </div>
          ))}
        </div>
      ) : branches.length > 0 ? (
        <div className='mt-4 space-y-2'>
          {branches.map((branch, index) => (
            <div
              key={branch.uuid ?? `${branch.branch_name ?? 'branch'}-${index}`}
              className='border-border/60 bg-muted/10 hover:bg-muted/20 flex items-center justify-between rounded-[12px] border p-3 transition'
            >
              <div className='flex-1'>
                <p className='text-foreground text-sm leading-tight font-medium'>
                  {branch.branch_name ?? 'Unnamed branch'}
                </p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {branch.location ?? branch.branch_code ?? 'Location not provided'}
                </p>
                {branch.branch_code && (
                  <p className='text-muted-foreground mt-1 text-xs'>Code: {branch.branch_code}</p>
                )}
              </div>
              <Badge variant={branch.active ? 'secondary' : 'outline'} className='text-xs'>
                {branch.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-muted-foreground mt-4 text-sm'>No branches registered yet</p>
      )}
    </div>
  );
}
