'use client';

import { AlertCircle } from 'lucide-react';
import { type FormEvent, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  getRateBasis,
  normaliseRateCard,
  offeredMethods,
  type RateBasis,
  type RateCard,
  rateCardChanges,
  validateRateCard,
} from '@/lib/rate-card';
import type { TrainingRateUpdate } from '@/services/client';
import { useSubmitRateUpdate } from '@/src/features/rate-card/hooks/use-rate-update-mutations';
import type { TrainingApplicationKind } from '@/src/features/rate-card/types';

export type UpdateRatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: TrainingApplicationKind;
  parentUuid: string;
  applicationUuid: string;
  /** Course or program name. */
  title: string;
  /** The approved card in force today; the form starts from it. */
  currentCard: RateCard | null | undefined;
  /** Who approves; falls back to "The course creator" / "The program creator". */
  creatorName?: string | null;
  /** Add-a-basis flow: highlights that column and shows only offered methods. */
  focusBasis?: RateBasis;
  /** Minimum training fee every offered rate must meet. */
  minimum?: number | null;
  onSubmitted?: (update: TrainingRateUpdate | null) => void;
};

/** Applicant-only: propose a replacement rate card for the creator to approve. */
export function UpdateRatesDialog({ open, onOpenChange, ...props }: UpdateRatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-4xl'>
        <UpdateRatesForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function UpdateRatesForm({
  kind,
  parentUuid,
  applicationUuid,
  title,
  currentCard,
  creatorName,
  focusBasis,
  minimum,
  onSubmitted,
  onClose,
}: Omit<UpdateRatesDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const noteId = useId();
  const [draft, setDraft] = useState<RateCard>(() => normaliseRateCard(currentCard));
  const [note, setNote] = useState('');
  const [attempted, setAttempted] = useState(false);
  const submit = useSubmitRateUpdate(kind, parentUuid, applicationUuid);

  const basis = focusBasis ? getRateBasis(focusBasis) : null;
  const creatorRole = kind === 'course' ? 'course creator' : 'program creator';
  const approver = creatorName?.trim() || `The ${creatorRole}`;

  const methods = useMemo(() => {
    if (!focusBasis) return undefined;
    const offered = offeredMethods(currentCard).map(method => method.prefix);
    return offered.length > 0 ? offered : undefined;
  }, [focusBasis, currentCard]);
  const validation = useMemo(() => validateRateCard(draft, minimum), [draft, minimum]);
  const unchanged = useMemo(
    () => rateCardChanges(currentCard, draft).length === 0,
    [currentCard, draft]
  );

  const cardErrors = attempted
    ? [...validation.card, ...(unchanged ? ['Change at least one rate before sending.'] : [])]
    : [];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!validation.valid || unchanged) return;
    submit.mutate(
      { rateCard: draft, note },
      {
        onSuccess: update => {
          toast.success(`Sent to ${creatorName?.trim() || `the ${creatorRole}`} for approval.`);
          onSubmitted?.(update);
          onClose();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className='grid gap-5'>
      <DialogHeader>
        <DialogTitle>
          {basis ? `Add ${basis.phrase} rates to your rate card` : 'Update your rates'}
        </DialogTitle>
        <DialogDescription>
          <span className='text-foreground font-medium'>{title}</span>. {approver} checks these
          before they go live; your current rates keep working until then.
        </DialogDescription>
      </DialogHeader>

      <RateCardGrid
        mode='edit'
        value={draft}
        onChange={setDraft}
        errors={attempted ? validation.cells : undefined}
        minimum={minimum}
        highlightBasis={focusBasis}
        methods={methods}
        currency={currentCard?.currency}
      />

      <div className='grid gap-2'>
        <Label htmlFor={noteId}>
          Note for the {creatorRole} <span className='text-muted-foreground'>(optional)</span>
        </Label>
        <Textarea
          id={noteId}
          value={note}
          onChange={event => setNote(event.target.value)}
          rows={3}
          placeholder='Why are your rates changing?'
        />
      </div>

      {cardErrors.length > 0 || submit.error ? (
        <Alert variant='destructive'>
          <AlertCircle aria-hidden />
          <AlertDescription>
            {[...cardErrors, ...(submit.error ? [submit.error.message] : [])].map(message => (
              <p key={message}>{message}</p>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter>
        <Button type='button' variant='outline' onClick={onClose} disabled={submit.isPending}>
          Cancel
        </Button>
        <Button type='submit' disabled={submit.isPending}>
          {submit.isPending ? <Spinner className='h-4 w-4' /> : null}
          {basis ? 'Add to rate card' : 'Save for approval'}
        </Button>
      </DialogFooter>
    </form>
  );
}
