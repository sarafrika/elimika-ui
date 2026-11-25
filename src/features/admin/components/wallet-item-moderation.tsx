'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { PersonWalletEntry } from '../hooks/use-person-skills-wallet';
import {
  type WalletItemDecision,
  type WalletModerationSection,
  useWalletItemModeration,
} from '../hooks/use-wallet-item-moderation';
import { ConfirmDialog } from './confirm-dialog';

export function WalletItemModeration({
  userUuid,
  personName,
  section,
  entry,
}: {
  userUuid: string;
  personName: string;
  section: WalletModerationSection;
  entry: PersonWalletEntry;
}) {
  const id = useId();
  const [decision, setDecision] = useState<WalletItemDecision | ''>(
    entry.status === 'VERIFIED' || entry.status === 'REJECTED' ? entry.status : ''
  );
  const [notes, setNotes] = useState(entry.notes ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { save, isPending } = useWalletItemModeration(userUuid, section, entry.uuid);
  const [validationError, setValidationError] = useState('');

  return (
    <div className='border-border space-y-3 border-t pt-4'>
      <form
        className='space-y-3'
        onSubmit={event => {
          event.preventDefault();
          if (!decision) {
            setValidationError('Select an approval or rejection decision.');
            return;
          }
          if (decision === 'REJECTED' && !notes.trim()) {
            setValidationError('Explain why this item is being rejected.');
            return;
          }
          setValidationError('');
          setConfirmOpen(true);
        }}
      >
        <div className='grid gap-3 sm:grid-cols-[200px_1fr]'>
          <div className='space-y-2'>
            <Label htmlFor={`${id}-decision`}>Review decision</Label>
            <Select
              value={decision}
              disabled={isPending || !entry.uuid}
              onValueChange={value => {
                if (value === 'VERIFIED' || value === 'REJECTED') {
                  setDecision(value);
                  setValidationError('');
                }
              }}
            >
              <SelectTrigger id={`${id}-decision`} className='w-full'>
                <SelectValue placeholder='Choose a decision' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='VERIFIED'>Approve · Verified</SelectItem>
                <SelectItem value='REJECTED'>Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`${id}-notes`}>
              Review note {decision === 'REJECTED' ? '(required)' : '(optional)'}
            </Label>
            <Textarea
              id={`${id}-notes`}
              value={notes}
              onChange={event => {
                setNotes(event.target.value);
                setValidationError('');
              }}
              disabled={isPending}
              required={decision === 'REJECTED'}
              rows={2}
              placeholder='What did you check, or what needs to be corrected?'
              aria-invalid={!!validationError}
              aria-describedby={validationError ? `${id}-error` : undefined}
            />
          </div>
        </div>
        {validationError && (
          <p id={`${id}-error`} role='alert' className='text-destructive text-sm'>
            {validationError}
          </p>
        )}
        <Button
          type='submit'
          size='sm'
          disabled={
            isPending ||
            !decision ||
            !entry.uuid ||
            (decision === entry.status && notes.trim() === (entry.notes ?? '').trim())
          }
        >
          {isPending && <Spinner className='size-4' />}
          Save review decision
        </Button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={open => {
          if (!isPending) setConfirmOpen(open);
        }}
        action={decision === 'REJECTED' ? 'rejectWalletItem' : 'approveWalletItem'}
        subject={{ name: personName || 'this applicant', detail: entry.title }}
        note={notes.trim() || undefined}
        isPending={isPending}
        onConfirm={() => {
          if (decision)
            void save(decision, notes).then(saved => {
              if (saved) setConfirmOpen(false);
            });
        }}
      />
    </div>
  );
}
