// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import {
  createResourceMutation,
  deactivateResourceMutation,
  getTrainingBranchesByOrganisationOptions,
  listResourcesOptions,
  listResourcesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const UNASSIGNED = '__unassigned__';

function AddVenueDialog({
  organisationUuid,
  branches,
  onCreated,
}: {
  organisationUuid: string;
  branches: TrainingBranch[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [branchUuid, setBranchUuid] = useState('');
  const [capacity, setCapacity] = useState('');
  const [locationName, setLocationName] = useState('');

  const create = useMutation({ ...createResourceMutation() });

  const reset = () => {
    setName('');
    setBranchUuid('');
    setCapacity('');
    setLocationName('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = Number.parseInt(capacity, 10);
    if (!name.trim()) return toast.error('Give the venue a name.');
    if (!branchUuid) return toast.error('Choose the branch this venue is in.');
    if (!Number.isFinite(seats) || seats < 1) return toast.error('Enter a seat capacity (at least 1).');

    create.mutate(
      {
        path: { organisationUuid },
        body: {
          name: name.trim(),
          resource_type: 'VENUE',
          branch_uuid: branchUuid,
          seat_capacity: seats,
          location_name: locationName.trim() || null,
          is_active: true,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Venue "${name.trim()}" added`);
          reset();
          setOpen(false);
          onCreated();
        },
        onError: () => toast.error('Could not add the venue. Please try again.'),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={branches.length === 0}>
          <Plus className='mr-2 h-4 w-4' /> Add venue
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add a venue</DialogTitle>
          <DialogDescription>
            A venue is a room, lab, studio or hall within a branch, with a set seating capacity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='venue-name'>Name</Label>
            <Input
              id='venue-name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. Computer Lab 1'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='venue-branch'>Branch</Label>
            <Select value={branchUuid} onValueChange={setBranchUuid}>
              <SelectTrigger id='venue-branch'>
                <SelectValue placeholder='Select branch' />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.uuid} value={b.uuid as string}>
                    {b.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='venue-capacity'>Seat capacity</Label>
              <Input
                id='venue-capacity'
                type='number'
                min={1}
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                placeholder='e.g. 30'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='venue-location'>Location label</Label>
              <Input
                id='venue-location'
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder='2nd floor (optional)'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' className='gap-2' disabled={create.isPending}>
              {create.isPending ? <Spinner className='h-4 w-4' /> : <Plus className='h-4 w-4' />}
              Add venue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VenuesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const branches = extractPage<TrainingBranch>(branchesQuery.data).items;
  const branchName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of branches) if (b.uuid) map[b.uuid] = b.branch_name ?? 'Untitled branch';
    return map;
  }, [branches]);

  const venuesListOptions = {
    path: { organisationUuid },
    query: { resource_type: 'VENUE', pageable: { page: 0, size: 200 } },
  };
  const venuesQuery = useQuery({
    ...listResourcesOptions(venuesListOptions),
    enabled: Boolean(organisationUuid),
  });
  const venues = extractPage<OrganisationResource>(venuesQuery.data).items;

  const deactivate = useMutation({ ...deactivateResourceMutation() });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: listResourcesQueryKey(venuesListOptions) });

  const totalSeats = venues.reduce((acc, v) => acc + (v.seat_capacity ?? 0), 0);

  const grouped = useMemo(() => {
    const groups: Record<string, OrganisationResource[]> = {};
    for (const v of venues) {
      const key = v.branch_uuid ?? UNASSIGNED;
      (groups[key] ??= []).push(v);
    }
    return groups;
  }, [venues]);

  const removeVenue = (venue: OrganisationResource) => {
    if (!venue.uuid) return;
    deactivate.mutate(
      { path: { organisationUuid, resourceUuid: venue.uuid } },
      {
        onSuccess: () => {
          toast.success(`Venue "${venue.name}" removed`);
          refresh();
        },
        onError: () => toast.error('Could not remove the venue.'),
      }
    );
  };

  const loading = branchesQuery.isLoading || venuesQuery.isLoading;

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Venues'
        description='Rooms, labs, studios and halls within your branches, each with a seating capacity.'
        action={
          <AddVenueDialog
            organisationUuid={organisationUuid}
            branches={branches}
            onCreated={refresh}
          />
        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{venues.length}</div>
            <div className='text-muted-foreground text-xs'>Total Venues</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{totalSeats.toLocaleString()}</div>
            <div className='text-muted-foreground text-xs'>Total Seats</div>
          </CardContent>
        </Card>
        <Card className='border-l-primary/60 border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{branches.length}</div>
            <div className='text-muted-foreground text-xs'>Branches</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-32 w-full rounded-lg' />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title='No venues yet'
          description={
            branches.length === 0
              ? 'Add a training branch first, then add venues to it.'
              : 'Add a venue (room, lab, studio) to one of your branches.'
          }
        />
      ) : (
        <div className='space-y-6'>
          {Object.entries(grouped).map(([branchUuid, list]) => (
            <div key={branchUuid} className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Building2 className='text-muted-foreground h-4 w-4' />
                <h2 className='text-sm font-semibold'>
                  {branchUuid === UNASSIGNED
                    ? 'Unassigned'
                    : (branchName[branchUuid] ?? 'Untitled branch')}
                </h2>
                <Badge variant='outline' className='text-[10px]'>
                  {list.length} venue{list.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {list.map(venue => (
                  <Card key={venue.uuid} className='overflow-hidden'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <h3 className='truncate font-semibold'>{venue.name}</h3>
                          {venue.location_name && (
                            <p className='text-muted-foreground text-xs'>{venue.location_name}</p>
                          )}
                        </div>
                        <Badge variant={venue.is_active ? 'default' : 'secondary'}>
                          {venue.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className='text-muted-foreground mt-3 flex items-center gap-4 text-xs'>
                        <span className='flex items-center gap-1'>
                          <Users className='h-3.5 w-3.5' />
                          {venue.seat_capacity != null ? `${venue.seat_capacity} seats` : '—'}
                        </span>
                      </div>
                      <div className='mt-4 flex justify-end'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-destructive'
                          onClick={() => removeVenue(venue)}
                          disabled={deactivate.isPending}
                        >
                          <Trash2 className='mr-1 h-3.5 w-3.5' /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
