'use client';

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
import { rosterDisplayName } from '@/src/features/organisation/groups/lib/roster';
import type { StudentGroupRosterEntry } from '@/services/client';

export type RemoveFromGroupDialogProps = {
  entry: StudentGroupRosterEntry | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (entry: StudentGroupRosterEntry) => void;
};

/** Destructive confirm — house convention puts these in an AlertDialog. */
export function RemoveFromGroupDialog({
  entry,
  pending,
  onClose,
  onConfirm,
}: RemoveFromGroupDialogProps) {
  return (
    <AlertDialog open={Boolean(entry)} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        {entry ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {rosterDisplayName(entry)}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the student from{' '}
                <span className='font-medium'>{entry.group_name ?? 'their group'}</span>. Their
                account and records are kept — only the group membership is removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                disabled={pending}
                onClick={event => {
                  event.preventDefault();
                  onConfirm(entry);
                }}
              >
                {pending ? 'Removing…' : 'Remove'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
