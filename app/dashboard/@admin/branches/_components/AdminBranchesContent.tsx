'use client';

import { useEffect, useState } from 'react';
import { useAdminOrganisations, type AdminOrganisation } from '@/services/admin/organizations';
import { useAdminBranches, useBranchUsers } from '@/services/admin/branches';
import type { TrainingBranch } from '@/services/client/types.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

export function AdminBranchesContent() {
  const [orgSearch, setOrgSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganisation | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<TrainingBranch | null>(null);
  const [branchUserPage, setBranchUserPage] = useState(0);

  const {
    data: orgData,
    isLoading: isOrgLoading,
    refetch: refetchOrgs,
  } = useAdminOrganisations({
    search: orgSearch,
    size: 20,
    page: 0,
    verification: 'all',
  });

  const organizations = orgData?.items ?? [];
  const activeOrg = selectedOrg ?? organizations[0] ?? null;
  const activeOrgUuid = activeOrg?.uuid ?? null;

  const {
    data: branchesData,
    isLoading: isBranchesLoading,
    refetch: refetchBranches,
  } = useAdminBranches(
    activeOrgUuid
      ? {
          organizationUuid: activeOrgUuid,
          search: branchSearch,
        }
      : null,
    {
      enabled: Boolean(activeOrgUuid),
    }
  );

  const branches = branchesData?.items ?? [];

  useEffect(() => {
    setSelectedBranch(null);
    setBranchUserPage(0);
  }, []);

  const branchUsersParams =
    activeOrgUuid && selectedBranch?.uuid
      ? {
          organizationUuid: activeOrgUuid,
          branchUuid: selectedBranch.uuid,
          page: branchUserPage,
          size: 20,
        }
      : null;

  const { data: branchUsersData, isLoading: isBranchUsersLoading } =
    useBranchUsers(branchUsersParams);

  return (
    <div className='grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Organizations</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Input
            placeholder='Search organizations'
            value={orgSearch}
            onChange={event => setOrgSearch(event.target.value)}
          />
          <ScrollArea className='h-[520px] pr-2'>
            <div className='space-y-2'>
              {isOrgLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className='rounded-xl border border-border/60 p-4'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='mt-2 h-3 w-24' />
                  </div>
                ))}
              {!isOrgLoading &&
                organizations.map(org => {
                  const isActive = activeOrgUuid === org.uuid;
                  return (
                    <button
                      key={org.uuid}
                      type='button'
                      onClick={() => {
                        setSelectedOrg(org);
                        setBranchSearch('');
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <div>
                          <p className='font-semibold'>{org.name ?? 'Untitled org'}</p>
                          <p className='text-muted-foreground text-xs'>{org.location ?? '—'}</p>
                        </div>
                        <Badge variant={org.admin_verified ? 'success' : 'outline'}>
                          {org.admin_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground mt-2 text-xs'>
                        Updated{' '}
                        {org.updated_date
                          ? formatDistanceToNow(new Date(org.updated_date), { addSuffix: true })
                          : 'recently'}
                      </p>
                    </button>
                  );
                })}
              {!isOrgLoading && organizations.length === 0 && (
                <p className='text-muted-foreground text-sm'>No organizations found.</p>
              )}
            </div>
          </ScrollArea>
          <Button variant='outline' size='sm' onClick={() => refetchOrgs()}>
            Refresh list
          </Button>
        </CardContent>
      </Card>

      <Card className='min-h-[600px]'>
        <CardHeader>
          <div className='flex flex-col gap-1'>
            <CardTitle className='text-base font-semibold'>
              {activeOrg?.name ?? 'Select an organization'}
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Review and triage training branches, including contact ownership and activity status.
            </p>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {activeOrg && (
            <div className='flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm'>
              <span className='flex items-center gap-2 font-medium'>
                <Building2 className='h-4 w-4' />
                {activeOrg.location ?? 'No location'}
              </span>
              <span className='flex items-center gap-2 text-muted-foreground'>
                <Users className='h-4 w-4' />
                {activeOrg.admin_verified ? 'Admin verified' : 'Awaiting verification'}
              </span>
            </div>
          )}

          <div className='flex flex-wrap gap-2'>
            <Input
              placeholder='Search branches'
              value={branchSearch}
              onChange={event => setBranchSearch(event.target.value)}
              disabled={!activeOrg}
              className='flex-1'
            />
            <Button variant='outline' onClick={() => refetchBranches()} disabled={!activeOrg}>
              Refresh
            </Button>
          </div>

          <ScrollArea className='h-[480px] pr-3'>
            <div className='space-y-3'>
              {isBranchesLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className='rounded-2xl border border-border/60 p-4'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='mt-2 h-3 w-28' />
                    <Skeleton className='mt-4 h-3 w-20' />
                  </div>
                ))}

              {!isBranchesLoading &&
                branches.map(branch => {
                  const isSelected = selectedBranch?.uuid === branch.uuid;
                  return (
                    <button
                      key={branch.uuid}
                      type='button'
                      onClick={() => setSelectedBranch(branch)}
                      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
                      }`}
                    >
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div>
                          <p className='text-lg font-semibold'>{branch.branch_name}</p>
                          <p className='text-muted-foreground text-sm'>{branch.address ?? '—'}</p>
                        </div>
                        <Badge variant={branch.active ? 'success' : 'outline'}>
                          {branch.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className='mt-3 grid gap-2 text-sm md:grid-cols-2'>
                      <div>
                        <p className='text-muted-foreground text-xs uppercase'>Point of contact</p>
                        <p className='font-medium'>{branch.poc_name}</p>
                        <p className='text-muted-foreground'>{branch.poc_email}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs uppercase'>Telephone</p>
                        <p>{branch.poc_telephone}</p>
                        <p className='text-muted-foreground text-xs'>
                          Updated{' '}
                          {branch.updated_date
                            ? formatDistanceToNow(new Date(branch.updated_date), {
                                addSuffix: true,
                              })
                            : 'recently'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!isBranchesLoading && branches.length === 0 && activeOrg && (
                <p className='text-muted-foreground text-sm'>
                  No branches found for this organization.
                </p>
              )}

              {!activeOrg && (
                <p className='text-muted-foreground text-sm'>Select an organization to load branches.</p>
              )}
            </div>
          </ScrollArea>

          <div className='rounded-2xl border border-border/60 p-4'>
            {selectedBranch ? (
              <div className='space-y-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <div>
                    <p className='text-sm font-semibold'>Members</p>
                    <p className='text-muted-foreground text-xs'>
                      {selectedBranch.branch_name} · {branchUsersData?.totalItems ?? 0} records
                    </p>
                  </div>
                  <div className='ml-auto flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setBranchUserPage(prev => Math.max(prev - 1, 0))}
                      disabled={branchUserPage === 0 || !branchUsersData}
                    >
                      Prev
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setBranchUserPage(prev =>
                          branchUsersData && prev + 1 < branchUsersData.totalPages ? prev + 1 : prev
                        )
                      }
                      disabled={
                        !branchUsersData || branchUserPage + 1 >= (branchUsersData.totalPages ?? 0)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
                {branchUsersData && branchUsersData.totalPages > 1 && (
                  <p className='text-muted-foreground text-xs'>
                    Page {branchUserPage + 1} of {branchUsersData.totalPages}
                  </p>
                )}

                {isBranchUsersLoading && (
                  <div className='space-y-2'>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className='rounded-xl border border-border/60 p-3'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='mt-1 h-3 w-24' />
                      </div>
                    ))}
                  </div>
                )}

                {!isBranchUsersLoading && branchUsersData && branchUsersData.items.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No members assigned to this branch yet.
                  </p>
                )}

                {!isBranchUsersLoading && branchUsersData && branchUsersData.items.length > 0 && (
                  <div className='space-y-2'>
                    {branchUsersData.items.map(user => (
                      <div
                        key={user.uuid ?? user.email}
                        className='rounded-xl border border-border/60 p-3 text-sm'
                      >
                        <p className='font-semibold'>
                          {[user.first_name, user.last_name].filter(Boolean).join(' ') ||
                            user.username ||
                            'Unnamed user'}
                        </p>
                        <p className='text-muted-foreground text-xs'>{user.email ?? 'No email'}</p>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {(user.user_domain ?? []).map(domain => (
                            <Badge key={domain} variant='outline'>
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Select a branch to view assigned members.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
