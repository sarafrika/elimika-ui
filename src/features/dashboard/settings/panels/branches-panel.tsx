'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/ui/empty-state';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { extractList, extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { StudentGroup, TrainingBranch } from '@/services/client';
import {
  deleteTrainingBranch1Mutation,
  getTrainingBranchesByOrganisationOptions,
  getTrainingBranchesByOrganisationQueryKey,
  listGroupsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import CreateEditBranchform from '@/src/features/organisation/branches/components/createedit-branch-form';

const BRANCH_PAGE = { pageable: { page: 0, size: 100 } } as const;

export function BranchesPanel() {
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
    await queryClient.invalidateQueries({
      queryKey: getTrainingBranchesByOrganisationQueryKey({
        path: { uuid: organisationUuid },
        query: BRANCH_PAGE,
      }),
    });
    await queryClient.invalidateQueries({ queryKey: ['organization'] });
  };

  const openCreate = () => {
    setEditingBranch(null);
    setEditorOpen(true);
  };

  const openEdit = (branch: TrainingBranch) => {
    setEditingBranch(branch);
    setEditorOpen(true);
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

  return (
    <Card className='border-border/70 rounded-md p-0 shadow-sm'>
      <CardHeader className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5'>
        <div className='min-w-0'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
            <Building2 className='text-primary size-4 sm:size-5' />
            Branches
          </CardTitle>
          <CardDescription>
            Each branch has its own contact details and academic groups.
          </CardDescription>
        </div>
        <Button size='sm' onClick={openCreate} disabled={!organisationUuid}>
          <Plus className='mr-1 h-4 w-4' /> Add branch
        </Button>
      </CardHeader>

      <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
        {branchesQuery.isLoading ? (
          <div className='space-y-3'>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className='h-24 w-full rounded-[16px]' />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={Building2}
            title='No branches yet'
            description='Add your first branch to start organising venues, groups and staff.'
            action={
              <Button size='sm' onClick={openCreate} disabled={!organisationUuid}>
                <Plus className='mr-1 h-4 w-4' /> Add branch
              </Button>
            }
          />
        ) : (
          branches.map(branch => {
            const groupCount = branch.uuid ? (groupCountByBranch.get(branch.uuid) ?? 0) : 0;

            return (
              <div
                key={branch.uuid}
                className='border-border/70 space-y-3 rounded-[16px] border p-4'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='flex min-w-0 flex-wrap items-center gap-2'>
                    <Building2 className='text-primary h-4 w-4 shrink-0' />
                    <span className='truncate font-medium'>
                      {branch.branch_name || 'Untitled branch'}
                    </span>
                    <Badge variant='secondary' className='shrink-0'>
                      {groupCount} {groupCount === 1 ? 'group' : 'groups'}
                    </Badge>
                    <Badge variant={branch.active ? 'success' : 'outline'} className='shrink-0'>
                      {branch.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className='flex shrink-0 items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => openEdit(branch)}
                      aria-label={`Edit ${branch.branch_name ?? 'branch'}`}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setPendingDelete(branch)}
                      aria-label={`Delete ${branch.branch_name ?? 'branch'}`}
                    >
                      <Trash2 className='text-destructive h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <div className='text-muted-foreground grid gap-2 text-xs sm:grid-cols-2 sm:text-sm'>
                  <span className='flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5 shrink-0' />
                    <span className='truncate'>{branch.address || 'No address recorded'}</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Users className='h-3.5 w-3.5 shrink-0' />
                    <span className='truncate'>
                      {branch.poc_name || 'No point of contact'}
                      {branch.capacity != null ? ` · ${branch.capacity} seats` : ''}
                    </span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Mail className='h-3.5 w-3.5 shrink-0' />
                    <span className='truncate'>{branch.poc_email || '—'}</span>
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <Phone className='h-3.5 w-3.5 shrink-0' />
                    <span className='truncate'>{branch.poc_telephone || '—'}</span>
                  </span>
                </div>

                {branch.uuid ? (
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/dashboard/organisation/branches/${branch.uuid}`}>
                      Open branch detail
                    </Link>
                  </Button>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog
        open={editorOpen}
        onOpenChange={open => {
          setEditorOpen(open);
          if (!open) setEditingBranch(null);
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit branch' : 'New branch'}</DialogTitle>
            <DialogDescription>
              {editingBranch
                ? 'Update this branch’s details and point of contact.'
                : 'Add a training location to your organisation.'}
            </DialogDescription>
          </DialogHeader>
          <CreateEditBranchform
            key={editingBranch?.uuid ?? 'new-branch'}
            variant='embedded'
            branch={editingBranch ?? undefined}
            onCancel={() => {
              setEditorOpen(false);
              setEditingBranch(null);
            }}
            onSave={() => {
              setEditorOpen(false);
              setEditingBranch(null);
            }}
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
            <AlertDialogTitle>
              Delete {pendingDelete?.branch_name || 'this branch'}?
            </AlertDialogTitle>
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
    </Card>
  );
}
