'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';
import { SectionError } from '@/components/data/async-section';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import { isConflict } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  createMyAgeGroupMutation,
  createOrganisationAgeGroupMutation,
  deleteAgeGroupMutation,
  listMyAgeGroupsOptions,
  listOrganisationAgeGroupsOptions,
  updateAgeGroupMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
  invalidateSavedAgeGroups,
  MAX_SAVED_AGE_GROUPS,
  type SavedAgeGroupView,
} from '@/src/features/apply-to-train/age-groups/use-saved-age-groups';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';

type Owner = 'instructor' | 'organisation';
type Draft = { name: string; minAge: string; maxAge: string };

const MANAGER_DOMAINS = new Set(['organisation_user', 'admin']);

function draftErrors(draft: Draft): Partial<Record<keyof Draft, string>> {
  const errors: Partial<Record<keyof Draft, string>> = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Give the group a name.';
  else if (name.length > 80) errors.name = 'Keep the name to 80 characters.';
  const min = /^\d{1,3}$/.test(draft.minAge) ? Number(draft.minAge) : null;
  const max = /^\d{1,3}$/.test(draft.maxAge) ? Number(draft.maxAge) : null;
  if (min === null || min > 120) errors.minAge = 'A whole age from 0 to 120.';
  if (max === null || max > 120) errors.maxAge = 'A whole age from 0 to 120.';
  else if (min !== null && min > max) errors.maxAge = 'At least the minimum age.';
  return errors;
}

/**
 * Reusable age bands (e.g. "Juniors 6–9") an instructor or organisation keeps for training
 * applications. Saved bands may overlap; applications copy them and check against the course.
 */
export function AgeGroupsPanel({ owner }: { owner: Owner }) {
  const queryClient = useQueryClient();
  const profile = useUserProfile();
  const organisationUuid = useOrganisation()?.uuid ?? '';
  const forOrganisation = owner === 'organisation';

  const canManage =
    !forOrganisation ||
    (profile?.organisation_affiliations ?? []).some(
      row =>
        row.active !== false &&
        row.organisation_uuid === organisationUuid &&
        MANAGER_DOMAINS.has(row.domain_in_organisation ?? '')
    );

  const mine = useQuery({
    ...listMyAgeGroupsOptions(),
    enabled: !forOrganisation,
    staleTime: STALE_TIMES.entity,
  });
  const organisation = useQuery({
    ...listOrganisationAgeGroupsOptions({ path: { organisationUuid } }),
    enabled: forOrganisation && Boolean(organisationUuid),
    staleTime: STALE_TIMES.entity,
  });
  const query = forOrganisation ? organisation : mine;
  const groups: SavedAgeGroupView[] = [...(query.data?.data ?? [])].sort(
    (a, b) => (a.min_age ?? 0) - (b.min_age ?? 0)
  );

  const [editing, setEditing] = useState<SavedAgeGroupView | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedAgeGroupView | null>(null);
  const remove = useMutation(deleteAgeGroupMutation());
  const full = groups.length >= MAX_SAVED_AGE_GROUPS;

  const confirmDelete = () => {
    const ageGroupUuid = pendingDelete?.uuid;
    if (!ageGroupUuid) return;
    remove.mutate(
      { path: { ageGroupUuid } },
      {
        onSuccess: async () => {
          await invalidateSavedAgeGroups(queryClient);
          toast.success('Age group deleted', { description: pendingDelete?.name });
          setPendingDelete(null);
        },
        onError: error => toast.error(getErrorMessage(error, 'Could not delete the age group.')),
      }
    );
  };

  return (
    <>
      <Card className='border-border/70 rounded-md p-0 shadow-sm'>
        <CardHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <CardTitle className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
                <UsersRound className='text-primary size-4 sm:size-5' />
                Age groups
              </CardTitle>
              <CardDescription>
                {forOrganisation
                  ? 'Age bands your instructors can reuse when they apply to train a course.'
                  : 'Age bands you teach often. Add them to any application in one click.'}{' '}
                Up to {MAX_SAVED_AGE_GROUPS}.
              </CardDescription>
            </div>
            {canManage ? (
              <Button size='sm' disabled={full} onClick={() => setEditing('new')}>
                <Plus aria-hidden /> Add age group
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className='space-y-3 px-4 py-5 sm:px-5'>
          {!canManage ? (
            <p className='bg-muted/50 text-muted-foreground rounded-md px-3 py-2 text-sm'>
              Only organisation managers can change these.
            </p>
          ) : null}
          {query.error ? (
            <SectionError
              title='Couldn’t load the age groups'
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          ) : query.isLoading ? (
            <div className='space-y-2'>
              {[0, 1, 2].map(row => (
                <Skeleton key={row} className='h-14 w-full rounded-md' />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className='border-border/70 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
              No age groups saved yet.
            </div>
          ) : (
            <ul className='divide-y rounded-md border'>
              {groups.map(group => (
                <li key={group.uuid} className='flex items-center gap-3 px-4 py-3'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-foreground truncate font-medium'>{group.name}</p>
                    <p className='text-muted-foreground text-sm'>
                      Ages {group.min_age}–{group.max_age}
                    </p>
                  </div>
                  {canManage ? (
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={`Edit ${group.name}`}
                        onClick={() => setEditing(group)}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={`Delete ${group.name}`}
                        onClick={() => setPendingDelete(group)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AgeGroupSheet
        key={editing === 'new' ? 'new' : (editing?.uuid ?? 'closed')}
        owner={owner}
        organisationUuid={organisationUuid}
        target={editing}
        onClose={() => setEditing(null)}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Applications that already copied it keep their own copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={event => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {remove.isPending ? <Spinner className='size-4' /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AgeGroupSheet({
  owner,
  organisationUuid,
  target,
  onClose,
}: {
  owner: Owner;
  organisationUuid: string;
  target: SavedAgeGroupView | 'new' | null;
  onClose: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const existing = target && target !== 'new' ? target : null;
  const [draft, setDraft] = useState<Draft>({
    name: existing?.name ?? '',
    minAge: existing?.min_age === undefined ? '' : String(existing.min_age),
    maxAge: existing?.max_age === undefined ? '' : String(existing.max_age),
  });
  const [tried, setTried] = useState(false);
  const createMine = useMutation(createMyAgeGroupMutation());
  const createForOrganisation = useMutation(createOrganisationAgeGroupMutation());
  const update = useMutation(updateAgeGroupMutation());
  const saving = createMine.isPending || createForOrganisation.isPending || update.isPending;
  const errors = draftErrors(draft);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.keys(errors).length > 0) return;
    const body = { name: draft.name.trim(), min_age: Number(draft.minAge), max_age: Number(draft.maxAge) };
    const callbacks = {
      onSuccess: async () => {
        await invalidateSavedAgeGroups(queryClient);
        toast.success(existing ? 'Age group updated' : 'Age group saved', { description: body.name });
        onClose();
      },
      onError: (error: unknown) =>
        toast.error(
          isConflict(error)
            ? `An age group called “${body.name}” already exists.`
            : getErrorMessage(error, 'Could not save the age group.')
        ),
    };
    if (existing?.uuid) update.mutate({ path: { ageGroupUuid: existing.uuid }, body }, callbacks);
    else if (owner === 'organisation')
      createForOrganisation.mutate({ path: { organisationUuid }, body }, callbacks);
    else createMine.mutate({ body }, callbacks);
  };

  const field = (key: keyof Draft, label: string, extra?: { inputMode: 'numeric' }) => (
    <div className='space-y-1.5'>
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      <Input
        id={`${id}-${key}`}
        value={draft[key]}
        maxLength={key === 'name' ? 80 : 3}
        inputMode={extra?.inputMode}
        aria-invalid={tried && Boolean(errors[key])}
        onChange={event =>
          setDraft(previous => ({
            ...previous,
            [key]: key === 'name' ? event.target.value : event.target.value.replace(/\D/g, ''),
          }))
        }
      />
      {tried && errors[key] ? <p className='text-destructive text-xs'>{errors[key]}</p> : null}
    </div>
  );

  return (
    <Sheet open={target !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side='right' className='w-full sm:max-w-md'>
        <form onSubmit={submit} className='flex h-full flex-col'>
          <SheetHeader className='border-b'>
            <SheetTitle>{existing ? 'Edit age group' : 'Add age group'}</SheetTitle>
            <SheetDescription>
              A named age band, e.g. “Juniors” for ages 6–9. Names are unique; bands may overlap.
            </SheetDescription>
          </SheetHeader>
          <div className='flex-1 space-y-4 px-4 py-4'>
            {field('name', 'Name')}
            <div className='grid grid-cols-2 gap-3'>
              {field('minAge', 'Min age', { inputMode: 'numeric' })}
              {field('maxAge', 'Max age', { inputMode: 'numeric' })}
            </div>
          </div>
          <SheetFooter className='border-t'>
            <Button type='submit' disabled={saving}>
              {saving ? <Spinner className='size-4' /> : null}
              {existing ? 'Save changes' : 'Save age group'}
            </Button>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
