'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, EyeOff, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { StatusBadge, type StatusTone } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import type { TrainingProgram } from '@/services/client';
import {
  archiveProgramMutation,
  publishProgramMutation,
  unpublishProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateContentModerationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

/**
 * A program's lifecycle is changed only through `POST /programs/{uuid}/publish`,
 * `/unpublish` and `/archive`. Create and update ignore `status`, `published` and
 * `active`, so forms never send them and show the state read-only.
 */

export type ProgramLifecycleState = 'draft' | 'awaiting_approval' | 'live' | 'archived';

type LifecycleFields = Pick<TrainingProgram, 'status' | 'published' | 'admin_approved'>;

export function programLifecycleState(program: Partial<LifecycleFields> | undefined | null) {
  const status = program?.status;
  if (status === 'archived') return 'archived' satisfies ProgramLifecycleState;
  if (status === 'published' || program?.published) {
    return program?.admin_approved ? 'live' : 'awaiting_approval';
  }
  return 'draft' satisfies ProgramLifecycleState;
}

const LIFECYCLE_LABEL: Record<ProgramLifecycleState, { label: string; tone: StatusTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  awaiting_approval: { label: 'Published · awaiting approval', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export function ProgramLifecycleBadge({
  program,
  className,
}: {
  program: Partial<LifecycleFields> | undefined | null;
  className?: string;
}) {
  const meta = LIFECYCLE_LABEL[programLifecycleState(program)];
  return <StatusBadge tone={meta.tone} label={meta.label} className={className} />;
}

export type ProgramLifecycleAction = 'publish' | 'unpublish' | 'archive';

/** The actions that make sense from each state. */
export function availableProgramActions(
  program: Partial<LifecycleFields> | undefined | null
): ProgramLifecycleAction[] {
  switch (programLifecycleState(program)) {
    case 'draft':
      return ['publish', 'archive'];
    case 'awaiting_approval':
    case 'live':
      return ['unpublish', 'archive'];
    case 'archived':
      return [];
  }
}

const ACTION_COPY: Record<ProgramLifecycleAction, { label: string; done: string; fail: string }> = {
  publish: {
    label: 'Publish',
    done: 'Program published. It goes live once an admin approves it.',
    fail: 'Could not publish this program',
  },
  unpublish: {
    label: 'Unpublish',
    done: 'Program unpublished and back in draft',
    fail: 'Could not unpublish this program',
  },
  archive: { label: 'Archive', done: 'Program archived', fail: 'Could not archive this program' },
};

/** Publish, unpublish and archive, refreshing program and moderation queries afterwards. */
export function useProgramLifecycle() {
  const queryClient = useQueryClient();
  const publish = useMutation(publishProgramMutation());
  const unpublish = useMutation(unpublishProgramMutation());
  const archive = useMutation(archiveProgramMutation());
  const mutations = { publish, unpublish, archive };

  const run = async (action: ProgramLifecycleAction, uuid: string) => {
    try {
      await mutations[action].mutateAsync({ path: { uuid } });
      toast.success(ACTION_COPY[action].done);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, ACTION_COPY[action].fail));
      return false;
    } finally {
      await invalidateContentModerationWorkflowQueries(queryClient);
    }
  };

  const pending: ProgramLifecycleAction | null = publish.isPending
    ? 'publish'
    : unpublish.isPending
      ? 'unpublish'
      : archive.isPending
        ? 'archive'
        : null;

  return { run, pending };
}

/** Archiving hides the program for good, so it is confirmed first, inside a Sheet. */
export function ArchiveProgramSheet({
  open,
  onOpenChange,
  programTitle,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programTitle?: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Archive {programTitle ? `“${programTitle}”` : 'this program'}?</SheetTitle>
          <SheetDescription>
            An archived program leaves the catalogue and can no longer be published or enrolled
            in. Existing enrolments are kept.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button variant='destructive' onClick={onConfirm} disabled={pending}>
            {pending ? <Spinner /> : <Archive />}
            Archive program
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const ACTION_ICON = { publish: Send, unpublish: EyeOff, archive: Archive } as const;

/** Buttons for a program's detail or edit page: badge, then the actions its state allows. */
export function ProgramLifecycleActions({ program }: { program: TrainingProgram }) {
  const { run, pending } = useProgramLifecycle();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const uuid = program.uuid;
  const actions = availableProgramActions(program);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <ProgramLifecycleBadge program={program} />
      {uuid &&
        actions.map(action => {
          const Icon = ACTION_ICON[action];
          return (
            <Button
              key={action}
              type='button'
              size='sm'
              variant={action === 'publish' ? 'default' : 'outline'}
              disabled={pending !== null}
              onClick={() =>
                action === 'archive' ? setConfirmArchive(true) : void run(action, uuid)
              }
            >
              {pending === action ? <Spinner /> : <Icon />}
              {ACTION_COPY[action].label}
            </Button>
          );
        })}
      {uuid && (
        <ArchiveProgramSheet
          open={confirmArchive}
          onOpenChange={setConfirmArchive}
          programTitle={program.title}
          pending={pending === 'archive'}
          onConfirm={async () => {
            if (await run('archive', uuid)) setConfirmArchive(false);
          }}
        />
      )}
    </div>
  );
}

export const PROGRAM_ACTION_COPY = ACTION_COPY;
export const PROGRAM_ACTION_ICON = ACTION_ICON;

/**
 * Create and update ignore lifecycle fields, and the generated type still lists them, so
 * they are dropped at serialization: a program form never sends `status`, `published`
 * or `active`.
 */
const LIFECYCLE_KEYS = new Set(['status', 'published', 'active']);

export function withoutProgramLifecycle(body: unknown): string {
  if (typeof body !== 'object' || body === null) return JSON.stringify(body);
  return JSON.stringify(
    Object.fromEntries(Object.entries(body).filter(([key]) => !LIFECYCLE_KEYS.has(key)))
  );
}
