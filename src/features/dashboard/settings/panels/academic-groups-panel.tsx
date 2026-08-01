'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, GraduationCap, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { extractList, extractPage } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { AcademicTier, StudentGroup, TrainingBranch } from '@/services/client';
import {
  createGroupMutation,
  deleteGroupMutation,
  getTrainingBranchesByOrganisationOptions,
  listGroupsOptions,
  listGroupsQueryKey,
  listTiersOptions,
  updateGroupMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { GroupMembersSheet } from './group-members-sheet';

const UNASSIGNED_BRANCH = '__unassigned__';

const groupFormSchema = z.object({
  tier_uuid: z.string().min(1, 'Choose an academic tier'),
  group_type: z.string().trim().max(100).optional(),
  capacity: z
    .string()
    .trim()
    .optional()
    .refine(value => !value || /^\d+$/.test(value), 'Capacity must be a whole number'),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

/**
 * The API requires a group name but the tier/stream row layout has no name field,
 * so the name is derived from what the row does show. Existing names survive when
 * neither part is available (legacy groups created before tiers shipped).
 */
function deriveGroupName(tierName: string | undefined, stream: string | undefined, fallback = '') {
  const derived = [tierName, stream].map(part => part?.trim()).filter(Boolean).join(' · ');
  return derived || fallback.trim() || 'Untitled group';
}

function toRowValues(group: StudentGroup): GroupFormValues {
  return {
    tier_uuid: group.tier_uuid ?? '',
    group_type: group.group_type ?? '',
    capacity: group.capacity == null ? '' : String(group.capacity),
  };
}

export function AcademicGroupsPanel() {
  const queryClient = useQueryClient();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const [activeBranchId, setActiveBranchId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [membersGroup, setMembersGroup] = useState<StudentGroup | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudentGroup | null>(null);

  const branchesQuery = useQuery({
    ...getTrainingBranchesByOrganisationOptions({
      path: { uuid: organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  const groupsQuery = useQuery({
    ...listGroupsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });

  // Platform reference data: the 16 seeded schooling levels. Ordered by
  // `tier_order`, never alphabetically — alphabetical yields "Form 1, Grade 10,
  // Kindergarten", which is not how anybody reads a school ladder.
  const tiersQuery = useQuery({
    ...listTiersOptions(),
    staleTime: STALE_TIMES.reference,
  });

  const branches = extractPage<TrainingBranch>(branchesQuery.data).items;
  const groups = extractList<StudentGroup>(groupsQuery.data);

  const tiers = useMemo(
    () =>
      [...extractList<AcademicTier>(tiersQuery.data)].sort(
        (a, b) => (a.tier_order ?? 0) - (b.tier_order ?? 0)
      ),
    [tiersQuery.data]
  );

  const tierNameByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const tier of tiers) {
      if (tier.uuid) map.set(tier.uuid, tier.name ?? '');
    }
    return map;
  }, [tiers]);

  const unassignedCount = groups.filter(group => !group.branch_uuid).length;

  const chips = useMemo(() => {
    const branchChips = branches.map(branch => ({
      id: branch.uuid ?? '',
      label: branch.branch_name || 'Untitled',
      count: groups.filter(group => group.branch_uuid === branch.uuid).length,
    }));

    return unassignedCount > 0
      ? [...branchChips, { id: UNASSIGNED_BRANCH, label: 'Unassigned', count: unassignedCount }]
      : branchChips;
  }, [branches, groups, unassignedCount]);

  useEffect(() => {
    if (chips.length === 0) {
      if (activeBranchId) setActiveBranchId('');
      return;
    }
    if (!chips.some(chip => chip.id === activeBranchId)) {
      setActiveBranchId(chips[0]?.id ?? '');
    }
  }, [chips, activeBranchId]);

  const branchGroups = useMemo(() => {
    const filtered =
      activeBranchId === UNASSIGNED_BRANCH
        ? groups.filter(group => !group.branch_uuid)
        : groups.filter(group => group.branch_uuid === activeBranchId);

    return [...filtered].sort(
      (a, b) =>
        (a.tier_order ?? Number.MAX_SAFE_INTEGER) - (b.tier_order ?? Number.MAX_SAFE_INTEGER) ||
        (a.group_type ?? '').localeCompare(b.group_type ?? '')
    );
  }, [groups, activeBranchId]);

  const createGroup = useMutation(createGroupMutation());
  const deleteGroup = useMutation(deleteGroupMutation());

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: listGroupsQueryKey({ path: { organisationUuid } }) });

  const createForm = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { tier_uuid: '', group_type: '', capacity: '' },
  });

  const handleCreate = async (values: GroupFormValues) => {
    if (!organisationUuid || !activeBranchId || activeBranchId === UNASSIGNED_BRANCH) return;

    try {
      await createGroup.mutateAsync({
        path: { organisationUuid },
        body: {
          name: deriveGroupName(tierNameByUuid.get(values.tier_uuid), values.group_type),
          group_type: values.group_type || null,
          branch_uuid: activeBranchId,
          tier_uuid: values.tier_uuid,
          capacity: values.capacity ? Number(values.capacity) : null,
        },
      });
      toast.success('Group created');
      createForm.reset({ tier_uuid: '', group_type: '', capacity: '' });
      setCreateOpen(false);
      await invalidateGroups();
    } catch {
      toast.error('Could not create the group.');
    }
  };

  const handleDelete = async () => {
    const groupUuid = pendingDelete?.uuid;
    if (!groupUuid) return;

    try {
      await deleteGroup.mutateAsync({ path: { groupUuid } });
      toast.success('Group deleted', { description: pendingDelete?.name ?? undefined });
      await invalidateGroups();
    } catch {
      toast.error('Could not delete the group.');
    } finally {
      setPendingDelete(null);
    }
  };

  const canAddGroup = Boolean(activeBranchId) && activeBranchId !== UNASSIGNED_BRANCH;

  return (
    <>
      <Card className='border-border/70 rounded-md p-0 shadow-sm'>
        <CardHeader className='border-border/60 space-y-3 border-b px-4 py-4 sm:px-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <GraduationCap className='text-primary size-4 sm:size-5' />
                Academic Groups
              </CardTitle>
              <CardDescription>
                Schooling tiers (e.g. Grade 1, Form 2) configured per branch. Each stream is its own
                group.
              </CardDescription>
            </div>
            <Button size='sm' disabled={!canAddGroup} onClick={() => setCreateOpen(true)}>
              <Plus className='mr-1 h-4 w-4' /> Add group
            </Button>
          </div>

          {chips.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {chips.map(chip => {
                const active = chip.id === activeBranchId;
                return (
                  <button
                    key={chip.id}
                    type='button'
                    onClick={() => setActiveBranchId(chip.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <Building2 className='h-3.5 w-3.5' />
                    {chip.label}
                    <Badge variant='secondary' className='ml-1'>
                      {chip.count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
          {branchesQuery.isLoading || groupsQuery.isLoading ? (
            <div className='space-y-3'>
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className='h-20 w-full rounded-[16px]' />
              ))}
            </div>
          ) : branches.length === 0 && unassignedCount === 0 ? (
            <div className='border-border/70 text-muted-foreground rounded-[16px] border border-dashed p-6 text-center text-sm'>
              <Building2 className='mx-auto mb-2 h-6 w-6 opacity-60' />
              Add a branch first, then define academic tiers per branch.
            </div>
          ) : branchGroups.length === 0 ? (
            <div className='border-border/70 text-muted-foreground rounded-[16px] border border-dashed p-6 text-center text-sm'>
              <GraduationCap className='mx-auto mb-2 h-6 w-6 opacity-60' />
              No academic groups for this branch yet.
            </div>
          ) : (
            branchGroups.map(group => (
              <GroupRow
                key={group.uuid}
                group={group}
                tiers={tiers}
                tierNameByUuid={tierNameByUuid}
                organisationUuid={organisationUuid}
                onManageMembers={() => setMembersGroup(group)}
                onDelete={() => setPendingDelete(group)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={open => {
          setCreateOpen(open);
          if (!open) createForm.reset({ tier_uuid: '', group_type: '', capacity: '' });
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add academic group</DialogTitle>
            <DialogDescription>
              One group per stream. Capacity is advisory — the platform reports it but never blocks
              enrolment.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className='space-y-4'>
              <FormField
                control={createForm.control}
                name='tier_uuid'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select a schooling level' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiers.map(tier => (
                          <SelectItem key={tier.uuid} value={tier.uuid as string}>
                            {tier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name='group_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stream</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Stream A' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name='capacity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input inputMode='numeric' placeholder='40' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={createGroup.isPending}>
                  {createGroup.isPending ? 'Creating…' : 'Create group'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <GroupMembersSheet
        open={Boolean(membersGroup)}
        onOpenChange={open => {
          if (!open) setMembersGroup(null);
        }}
        organisationUuid={organisationUuid}
        group={membersGroup}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={open => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name || 'this group'}?</AlertDialogTitle>
            <AlertDialogDescription>
              The group and its membership rows are removed. Students keep their accounts and
              enrolments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroup.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? 'Deleting…' : 'Delete group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type GroupRowProps = {
  group: StudentGroup;
  tiers: AcademicTier[];
  tierNameByUuid: Map<string, string>;
  organisationUuid: string;
  onManageMembers: () => void;
  onDelete: () => void;
};

function GroupRow({
  group,
  tiers,
  tierNameByUuid,
  organisationUuid,
  onManageMembers,
  onDelete,
}: GroupRowProps) {
  const queryClient = useQueryClient();
  const updateGroup = useMutation(updateGroupMutation());

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: toRowValues(group),
  });

  const snapshot = JSON.stringify(toRowValues(group));
  const { reset } = form;
  const { isDirty } = form.formState;

  useEffect(() => {
    if (!isDirty) {
      reset(JSON.parse(snapshot) as GroupFormValues);
    }
  }, [reset, isDirty, snapshot]);

  const memberCount = Number(group.member_count ?? 0);
  const capacity = group.capacity ?? null;
  const overCapacity = capacity != null && capacity > 0 && memberCount > capacity;

  const onSubmit = async (values: GroupFormValues) => {
    if (!group.uuid) return;

    try {
      // The endpoint replaces the record — every field that should survive has to
      // be sent, including ones this row does not edit.
      await updateGroup.mutateAsync({
        path: { groupUuid: group.uuid },
        body: {
          name: deriveGroupName(
            tierNameByUuid.get(values.tier_uuid),
            values.group_type,
            group.name ?? ''
          ),
          description: group.description ?? null,
          group_type: values.group_type || null,
          branch_uuid: group.branch_uuid ?? null,
          tier_uuid: values.tier_uuid,
          capacity: values.capacity ? Number(values.capacity) : null,
        },
      });
      toast.success('Group updated');
      form.reset(values);
      await queryClient.invalidateQueries({
        queryKey: listGroupsQueryKey({ path: { organisationUuid } }),
      });
    } catch {
      toast.error('Could not update the group.');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='border-border/70 space-y-3 rounded-[16px] border p-3'
      >
        <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px] md:items-end'>
          <FormField
            control={form.control}
            name='tier_uuid'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tier</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a tier' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier.uuid} value={tier.uuid as string}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='group_type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. Stream A' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='capacity'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input inputMode='numeric' placeholder='40' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={overCapacity ? 'warning' : 'secondary'} className='gap-1'>
              <Users className='h-3 w-3' />
              {memberCount}
              {capacity != null && capacity > 0 ? `/${capacity}` : ''}
            </Badge>
            {overCapacity ? (
              <span className='text-muted-foreground text-xs'>
                Over the intended size — reported, not enforced.
              </span>
            ) : null}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onManageMembers}>
              <Users className='mr-1.5 h-3.5 w-3.5' />
              Manage members
            </Button>
            <Button type='submit' size='sm' disabled={!isDirty || updateGroup.isPending}>
              {updateGroup.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={onDelete}
              aria-label={`Delete ${group.name ?? 'group'}`}
            >
              <Trash2 className='text-destructive h-4 w-4' />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
