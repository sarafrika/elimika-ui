'use client';

import { AlertTriangle, ArrowRight, Check, ShieldAlert } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { buildConfirm, type ConfirmAction, type ConfirmSubject } from '../lib/confirm-effects';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ConfirmAction;
  subject: ConfirmSubject;
  /** The reason or note being sent, quoted back before the admin commits. */
  note?: string;
  /** Extra context under the effects, e.g. a before and after diff. */
  children?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Every admin write goes through here. The modal states what will change, who hears
 * about it and what the API does not do, all from the confirm-effects map. Destructive
 * actions additionally ask the admin to type the record's name.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  action,
  subject,
  note,
  children,
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  const content = buildConfirm(action, subject);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const isDanger = content.tone === 'danger';
  const needsTyping = Boolean(content.typeToConfirm);
  const canConfirm = !isPending && (!needsTyping || typed.trim() === content.typeToConfirm);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-md sm:max-w-[560px]'>
        <DialogHeader>
          <div className='flex items-start gap-3'>
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md border',
                isDanger
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-primary/30 bg-primary/10 text-primary'
              )}
            >
              {isDanger ? <ShieldAlert className='size-4' /> : <Check className='size-4' />}
            </span>
            <div className='space-y-1'>
              <DialogTitle className='text-base'>{content.title}</DialogTitle>
              {content.description || subject.detail ? (
                <DialogDescription>{content.description ?? subject.detail}</DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
              What happens
            </p>
            <ul className='space-y-2'>
              {content.effects.map(effect => (
                <li key={effect} className='text-foreground flex gap-2 text-sm'>
                  <ArrowRight className='text-primary mt-0.5 size-4 shrink-0' />
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>

          {note ? (
            <p className='bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm'>“{note}”</p>
          ) : null}

          {children}

          {content.warnings?.length ? (
            <div className='border-warning/40 bg-warning/5 flex gap-2 rounded-md border p-3'>
              <AlertTriangle className='text-warning mt-0.5 size-4 shrink-0' />
              <div className='space-y-1'>
                {content.warnings.map(warning => (
                  <p key={warning} className='text-foreground text-xs leading-relaxed'>
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {needsTyping ? (
            <div className='space-y-1.5'>
              <Label htmlFor='confirm-typed' className='text-sm font-semibold'>
                Type <span className='font-mono'>{content.typeToConfirm}</span> to confirm
              </Label>
              <Input
                id='confirm-typed'
                value={typed}
                onChange={event => setTyped(event.target.value)}
                autoComplete='off'
                className='rounded-md font-mono'
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            className='rounded-md'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isDanger ? 'destructive' : 'default'}
            className='rounded-md'
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {isPending ? 'Working…' : content.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
