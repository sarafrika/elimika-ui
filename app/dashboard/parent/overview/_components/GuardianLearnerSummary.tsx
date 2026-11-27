'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GuardianShareScope } from '@/services/guardian';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { CalendarDays, Unlink } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { revokeLinkMutation } from '@/services/client/@tanstack/react-query.gen';
import { requireApiSuccess } from '@/src/features/onboarding/lib/user-onboarding';

interface GuardianLearnerSummaryProps {
  studentName?: string;
  linkUuid?: string;
  onRevoked?: () => void | Promise<void>;
  relationship?: string;
  gradeLevel?: string;
  shareScope?: GuardianShareScope;
  lastSyncedAt?: string;
}

const shareScopeDescriptions: Record<GuardianShareScope, string> = {
  FULL: 'Full academic & billing access',
  ACADEMICS: 'Academic progress only',
  ATTENDANCE: 'Attendance & announcements only',
};

export function GuardianLearnerSummary({
  studentName,
  linkUuid,
  onRevoked,
  relationship,
  gradeLevel,
  shareScope = 'FULL',
  lastSyncedAt,
}: GuardianLearnerSummaryProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const revoke = useMutation({ ...revokeLinkMutation(), retry: false });

  async function revokeAccess() {
    if (!linkUuid || revoke.isPending) return;
    setError('');
    try {
      const response = await revoke.mutateAsync({ path: { linkUuid } });
      if (response) requireApiSuccess(response);
    } catch (failure) {
      setError(getErrorMessage(failure, 'Unable to revoke your access. Please try again.'));
      return;
    }
    setConfirmOpen(false);
    toast.success(`Your access to ${studentName || 'this child'} has been revoked.`);
    await onRevoked?.();
  }

  const lastSyncedLabel =
    lastSyncedAt && !Number.isNaN(Date.parse(lastSyncedAt))
      ? formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })
      : null;

  return (
    <Card className='border-border/70'>
      <CardHeader className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <CardTitle className='text-2xl font-bold'>{studentName ?? 'Learner summary'}</CardTitle>
          <p className='text-muted-foreground text-sm'>
            {relationship ?? 'Parent portal access'}{' '}
            {gradeLevel ? (
              <>
                • <span className='text-foreground font-medium'>{gradeLevel}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='outline'>{shareScopeDescriptions[shareScope]}</Badge>
          {lastSyncedLabel ? (
            <Badge variant='secondary' className='capitalize'>
              Synced {lastSyncedLabel}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-3'>
        <Button asChild variant='outline' className='gap-2'>
          <Link href='/dashboard/parent/attendance'>
            <CalendarDays className='size-4' />
            View attendance
          </Link>
        </Button>
        <Button
          variant='destructive'
          disabled={!linkUuid || revoke.isPending}
          onClick={() => {
            setError('');
            setConfirmOpen(true);
          }}
        >
          <Unlink className='size-4' aria-hidden /> Revoke my access
        </Button>
        <AlertDialog
          open={confirmOpen}
          onOpenChange={open => {
            if (!revoke.isPending) setConfirmOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke access to {studentName || 'this child'}?</AlertDialogTitle>
              <AlertDialogDescription>
                You will lose guardian access to this child’s learning information, and they will be
                removed from your Family Hub. Their learner account will remain. You will need a new
                guardian link to regain access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <p role='alert' className='text-destructive text-sm whitespace-pre-line'>
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <Button
                variant='outline'
                disabled={revoke.isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={!linkUuid || revoke.isPending}
                onClick={() => void revokeAccess()}
              >
                {revoke.isPending && <Spinner />}
                {revoke.isPending ? 'Revoking access…' : 'Revoke my access'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
