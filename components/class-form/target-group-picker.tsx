// @ts-nocheck -- generated-client type drift on student-group rows
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { extractList } from '@/lib/api-helpers';
import { STALE_TIMES } from '@/lib/query-client';
import type { StudentGroup } from '@/services/client';
import {
  createGroupMutation,
  listGroupsOptions,
  listGroupsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Creates a group without leaving the class form, then selects it. Mirrors the
 * dialog on the organisation Groups page so both entry points behave the same.
 */
function NewGroupDialog({
  organisationUuid,
  onCreated,
}: {
  organisationUuid: string;
  onCreated: (groupUuid: string) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const create = useMutation(createGroupMutation());

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('tg-name') as HTMLInputElement)?.value.trim();
    const groupType = (form.elements.namedItem('tg-type') as HTMLInputElement)?.value.trim();
    const description = (form.elements.namedItem('tg-desc') as HTMLTextAreaElement)?.value.trim();
    if (!name) {
      toast.error('Group name is required.');
      return;
    }
    create.mutate(
      {
        path: { organisationUuid },
        body: { name, group_type: groupType || undefined, description: description || undefined },
      },
      {
        onSuccess: async response => {
          setOpen(false);
          toast.success('Group created', { description: name });
          await qc.invalidateQueries({ queryKey: listGroupsQueryKey({ path: { organisationUuid } }) });
          const createdUuid = response?.data?.uuid;
          if (createdUuid) onCreated(createdUuid);
        },
        onError: () => toast.error('Could not create group.'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" /> New group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create student group</DialogTitle>
          <DialogDescription>
            Groups you create here are available to every class this organisation posts.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="tg-name">Group name</Label>
            <Input id="tg-name" name="tg-name" placeholder="e.g. Grade 9 · Stream A" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tg-type">Type / stream (optional)</Label>
            <Input id="tg-type" name="tg-type" placeholder="e.g. Cohort, Stream, Level" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tg-desc">Description (optional)</Label>
            <Textarea id="tg-desc" name="tg-desc" rows={2} placeholder="What this group is for" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner className="mr-2 h-4 w-4" />}
              {create.isPending ? 'Creating…' : 'Create group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Picks the organisation student groups a class is aimed at. The selection is sent as
 * `target_group_uuids`; the backend snapshots the matching names onto the advert.
 */
export function TargetGroupPicker({
  organisationUuid,
  targetGroupUuids,
  onTargetGroupsChange,
}: {
  organisationUuid: string;
  targetGroupUuids: string[];
  onTargetGroupsChange: (next: string[]) => void;
}) {
  const groupsQuery = useQuery({
    ...listGroupsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.reference,
  });
  const groups = extractList<StudentGroup>(groupsQuery.data);

  const toggle = (uuid: string, on: boolean) =>
    onTargetGroupsChange(
      on ? Array.from(new Set([...targetGroupUuids, uuid])) : targetGroupUuids.filter(x => x !== uuid)
    );

  const select = (uuid: string) => onTargetGroupsChange(Array.from(new Set([...targetGroupUuids, uuid])));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          Target Groups
          <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
        </Label>
        {groups.length > 0 && <NewGroupDialog organisationUuid={organisationUuid} onCreated={select} />}
      </div>
      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-2.5">
        {groupsQuery.isLoading ? (
          <div className="space-y-1.5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : groupsQuery.isError ? (
          <div className="text-xs text-muted-foreground">Could not load groups.</div>
        ) : groups.length === 0 ? (
          <div className="space-y-2 py-1 text-center">
            <p className="text-xs text-muted-foreground">No student groups yet.</p>
            <NewGroupDialog organisationUuid={organisationUuid} onCreated={select} />
          </div>
        ) : (
          groups.map(g => {
            const uuid = g.uuid ?? '';
            const memberCount = Number(g.member_count ?? 0);
            return (
              <label key={uuid} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={targetGroupUuids.includes(uuid)}
                  onCheckedChange={v => toggle(uuid, v === true)}
                />
                <span className="flex-1 truncate">{g.name}</span>
                {g.group_type && (
                  <Badge variant="outline" className="text-[10px]">
                    {g.group_type}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {memberCount} member{memberCount === 1 ? '' : 's'}
                </span>
              </label>
            );
          })
        )}
      </div>
      {targetGroupUuids.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">
          Optional — select as many cohorts or streams as apply, or leave empty to open the class to
          everyone. Manage groups on the Groups page.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {targetGroupUuids.map(uuid => {
            const group = groups.find(g => g.uuid === uuid);
            return (
              <Badge key={uuid} variant="secondary" className="text-[10px]">
                {group?.name ?? uuid.slice(0, 8)}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
