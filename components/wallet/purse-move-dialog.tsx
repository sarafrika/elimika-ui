'use client';

import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { formatMoney } from '@/components/money/format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import {
  MOVE_SOURCES,
  moveProblem,
  moveTargets,
  type Purse,
  PURSE_LABELS,
  purseFigures,
  type WalletWithPurses,
} from '@/src/features/wallet/purses';
import { movePurseMoney } from '@/src/features/wallet/use-sale-splits';

/** Moves money between the person's own purses: out of Course creator or Instructor, into any other, Student included. */
export function PurseMoveDialog({
  open,
  onOpenChange,
  userUuid,
  wallet,
  from: preferredFrom,
  to: preferredTo,
  onMoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userUuid: string;
  wallet: WalletWithPurses | undefined;
  /** The dashboard's purse when money can leave it. */
  from?: Purse;
  /** The dashboard's purse when money is coming into it, e.g. Student. */
  to?: Purse;
  onMoved: () => void;
}) {
  const ids = { from: useId(), to: useId(), amount: useId() };
  const currency = wallet?.currency_code ?? 'KES';
  const [from, setFrom] = useState<Purse | null>(null);
  const [to, setTo] = useState<Purse | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source =
      preferredFrom && MOVE_SOURCES.includes(preferredFrom)
        ? preferredFrom
        : (MOVE_SOURCES.find(purse => (purseFigures(wallet, purse)?.available ?? 0) > 0 && purse !== preferredTo) ??
          MOVE_SOURCES.find(purse => purse !== preferredTo) ??
          null);
    setFrom(source);
    setTo(preferredTo && source && preferredTo !== source ? preferredTo : source ? (moveTargets(source)[0] ?? null) : null);
    setAmount('');
    setError('');
    // Reset only when the dialog opens; a wallet refetch must not wipe what was typed.
  }, [open]);

  const available = from ? (purseFigures(wallet, from)?.available ?? 0) : 0;
  const targets = from ? moveTargets(from) : [];

  const submit = async () => {
    const value = Number(amount || 0);
    const problem = moveProblem(from, to, value, available);
    if (problem) return setError(problem);
    if (!from || !to) return;
    setError('');
    setBusy(true);
    const result = await movePurseMoney(userUuid, {
      from_purse: from,
      to_purse: to,
      amount: value,
      currency_code: currency,
      description: `Moved from ${PURSE_LABELS[from]} to ${PURSE_LABELS[to]}`,
    });
    setBusy(false);
    if (result.error) return setError(result.error);
    toast.success(`${formatMoney(value, currency)} moved to your ${PURSE_LABELS[to].toLowerCase()}.`);
    onMoved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Move money between my purses</DialogTitle>
          <DialogDescription>
            Each role keeps its own balance. Money moved into your Student purse can be spent on Elimika but not moved
            back out or withdrawn.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={ids.from}>From</Label>
            <Select
              value={from ?? ''}
              onValueChange={value => {
                const next = value as Purse;
                setFrom(next);
                if (!to || !moveTargets(next).includes(to)) setTo(moveTargets(next)[0] ?? null);
              }}
            >
              <SelectTrigger id={ids.from} className='w-full'>
                <SelectValue placeholder='Choose a purse' />
              </SelectTrigger>
              <SelectContent>
                {MOVE_SOURCES.map(purse => (
                  <SelectItem key={purse} value={purse}>
                    {PURSE_LABELS[purse]} · {formatMoney(purseFigures(wallet, purse)?.available ?? 0, currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>Available {formatMoney(available, currency)}</p>
          </div>
          <div className='space-y-2'>
            <Label htmlFor={ids.to}>To</Label>
            <Select value={to ?? ''} onValueChange={value => setTo(value as Purse)}>
              <SelectTrigger id={ids.to} className='w-full'>
                <SelectValue placeholder='Choose a purse' />
              </SelectTrigger>
              <SelectContent>
                {targets.map(purse => (
                  <SelectItem key={purse} value={purse}>
                    {PURSE_LABELS[purse]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor={ids.amount}>Amount ({currency})</Label>
            <Input
              id={ids.amount}
              inputMode='decimal'
              placeholder='0'
              value={amount}
              onChange={event => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
            />
          </div>
          {error ? (
            <p role='alert' className='text-destructive text-sm font-medium'>
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !amount}>
            {busy && <Spinner />}Move money
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
