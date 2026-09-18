'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  MapPin,
  MapPinOff,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { StaticMap } from '@/components/maps/static-map';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { extractList, extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { StudentGroup, TrainingBranch } from '@/services/client';
import {
  deleteTrainingBranch1Mutation,
  getTrainingBranchesByOrganisationOptions,
  listGroupsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import CreateEditBranchform from './createedit-branch-form';

const BRANCH_PAGE = { pageable: { page: 0, size: 100 } } as const;

function hasPin(branch: TrainingBranch) {
  return Number.isFinite(branch.latitude) && Number.isFinite(branch.longitude);
}

export function BranchesDirectory() {
  const queryClient = useQueryClient();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<TrainingBranch | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrainingBranch | null>(null);

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: BRANCH_PAGE,
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  const groupsQuery = useQuery({
    ...listGroupsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  const branches = extractPage<TrainingBranch>(branchesQuery.data).items;
  const groups = extractList<StudentGroup>(groupsQuery.data);
  const unpinnedCount = branches.filter(branch => !hasPin(branch)).length;

  const groupCountByBranch = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      if (!group.branch_uuid) continue;
      counts.set(group.branch_uuid, (counts.get(group.branch_uuid) ?? 0) + 1);
    }
    return counts;
  }, [groups]);

  const deleteBranch = useMutation(deleteTrainingBranch1Mutation());

  const invalidateBranches = async () => {
    await Promise.all([
      invalidateGeneratedQueryIds(queryClient, [
        'getTrainingBranchesByOrganisation',
        'getTrainingBranchByUuid',
        'getTrainingBranchByUuid1',
      ]),
      queryClient.invalidateQueries({ queryKey: ['organization'] }),
    ]);
  };

  const openCreate = () => {
    setEditingBranch(null);
    setEditorOpen(true);
  };

  const openEdit = (branch: TrainingBranch) => {
    setEditingBranch(branch);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingBranch(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.uuid || !organisationUuid) return;

    try {
      await deleteBranch.mutateAsync({
        path: { uuid: organisationUuid, branchUuid: pendingDelete.uuid },
      });
      toast.success('Branch deleted', { description: pendingDelete.branch_name ?? undefined });
      await invalidateBranches();
    } catch {
      toast.error('Unable to delete this branch.');
    } finally {
      setPendingDelete(null);
    }
  };

  const summary =
    branches.length === 0
      ? undefined
      : `${branches.length} ${branches.length === 1 ? 'branch' : 'branches'}${
          unpinnedCount > 0 ? ` · ${unpinnedCount} without a pin` : ''
        }`;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Branches'
        description='Your training sites. Each branch holds the pin every class and job there uses, plus its own venues, equipment and contact person.'
        actions={
          <Button onClick={openCreate} disabled={!organisationUuid}>
            <Plus className='mr-1 h-4 w-4' /> Add branch
          </Button>
        }
      />

      <AsyncSection
        loading={branchesQuery.isLoading && !branchesQuery.data}
        error={branchesQuery.error}
        onRetry={() => branchesQuery.refetch()}
        empty={branches.length === 0}
        skeleton={<BranchCardsSkeleton />}
        emptyState={
          <EmptyState
            icon={Building2}
            title='No branches yet'
            description='Add your first branch and drop its pin. Venues, equipment, jobs and classes all hang off a branch.'
            action={
              <Button onClick={openCreate} disabled={!organisationUuid}>
                <Plus className='mr-1 h-4 w-4' /> Add branch
              </Button>
            }
            variant='card'
          />
        }
      >
        <div className='space-y-3'>
          {summary ? <p className='text-muted-foreground text-sm'>{summary}</p> : null}
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {branches.map(branch => (
              <BranchCard
                key={branch.uuid}
                branch={branch}
                groupCount={branch.uuid ? (groupCountByBranch.get(branch.uuid) ?? 0) : 0}
                onEdit={() => openEdit(branch)}
                onDelete={() => setPendingDelete(branch)}
              />
            ))}
          </div>
        </div>
      </AsyncSection>

      <Dialog open={editorOpen} onOpenChange={open => (open ? setEditorOpen(true) : closeEditor())}>
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit branch' : 'New branch'}</DialogTitle>
            <DialogDescription>
              {editingBranch
                ? 'Update this branch’s pin and contact person.'
                : 'A branch is a physical training site. Its pin is where every class and job at this branch takes place.'}
            </DialogDescription>
          </DialogHeader>
          <CreateEditBranchform
            key={editingBranch?.uuid ?? 'new-branch'}
            variant='embedded'
            branch={editingBranch ?? undefined}
            onCancel={closeEditor}
            onSave={closeEditor}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.branch_name || 'this branch'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the branch from your organisation. Academic groups pointing at it become
              unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBranch.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteBranch.isPending}
            >
              {deleteBranch.isPending ? 'Deleting…' : 'Delete branch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BranchCard({
  branch,
  groupCount,
  onEdit,
  onDelete,
}: {
  branch: TrainingBranch;
  groupCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const name = branch.branch_name || 'Untitled branch';
  const detailHref = branch.uuid ? dashboardUrl('organisation', `branches/${branch.uuid}`) : null;
  const pinned = hasPin(branch);

  return (
    <article className='border-border/70 bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm'>
      <StaticMap
        latitude={branch.latitude}
        longitude={branch.longitude}
        size='sm'
        alt={pinned ? `Map of ${name}` : `${name} has no pin yet`}
        className='rounded-none'
      >
        {pinned ? null : (
          <div className='bg-muted/80 absolute inset-0 flex flex-col items-center justify-center gap-2 text-center'>
            <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
              <MapPinOff className='h-4 w-4' /> No pin yet
            </span>
            <Button size='sm' variant='outline' onClick={onEdit}>
              <MapPin className='mr-1 h-3.5 w-3.5' /> Set pin
            </Button>
          </div>
        )}
      </StaticMap>

      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 space-y-1'>
            {detailHref ? (
              <Link href={detailHref} className='block truncate font-semibold hover:underline'>
                {name}
              </Link>
            ) : (
              <span className='block truncate font-semibold'>{name}</span>
            )}
            <p className='text-muted-foreground flex items-center gap-1.5 text-sm'>
              <MapPin className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{branch.address || 'No address recorded'}</span>
            </p>
          </div>
          <Badge variant={branch.active ? 'success' : 'outline'} className='shrink-0'>
            {branch.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className='text-muted-foreground grid gap-1.5 text-sm'>
          <span className='flex items-center gap-1.5'>
            <UserRound className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>{branch.poc_name || 'No contact person'}</span>
          </span>
          {branch.poc_email ? (
            <span className='flex items-center gap-1.5'>
              <Mail className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{branch.poc_email}</span>
            </span>
          ) : null}
          {branch.poc_telephone ? (
            <span className='flex items-center gap-1.5'>
              <Phone className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{branch.poc_telephone}</span>
            </span>
          ) : null}
          <span className='flex items-center gap-1.5'>
            <UsersRound className='h-3.5 w-3.5 shrink-0' />
            {groupCount} academic {groupCount === 1 ? 'group' : 'groups'}
          </span>
        </div>

        <div className='border-border/60 mt-auto flex items-center gap-2 border-t pt-3'>
          {detailHref ? (
            <Button asChild size='sm' variant='outline' className='flex-1'>
              <Link href={detailHref}>Open branch</Link>
            </Button>
          ) : null}
          <Button variant='ghost' size='icon' onClick={onEdit} aria-label={`Edit ${name}`}>
            <Pencil className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' onClick={onDelete} aria-label={`Delete ${name}`}>
            <Trash2 className='text-destructive h-4 w-4' />
          </Button>
        </div>
      </div>
    </article>
  );
}

function BranchCardsSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {[0, 1, 2].map(index => (
        <div key={index} className='border-border/70 overflow-hidden rounded-xl border'>
          <Skeleton className='h-32 w-full rounded-none' />
          <div className='space-y-2 p-4'>
            <Skeleton className='h-5 w-2/3' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-8 w-full' />
          </div>
        </div>
      ))}
    </div>
  );
}
