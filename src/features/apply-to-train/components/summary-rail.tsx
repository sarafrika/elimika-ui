'use client';

import { ArrowRight, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { APPLY_TO_TRAIN_STEPS, type ApplyItem, type ApplyStepId, ageRangeLabel } from '../types';

export type RailLine = { label: string; status: string; tone: 'muted' | 'default' | 'success' | 'danger' };

const TONE: Record<RailLine['tone'], string> = {
  muted: 'text-muted-foreground',
  default: 'text-foreground',
  success: 'text-success font-semibold',
  danger: 'text-destructive font-semibold',
};

/** The sticky "Your application" card: what is chosen, where each step stands, and the next move. */
export function SummaryRail({
  item,
  lessonCount,
  lines,
  step,
  canBack,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  submitting,
  tip,
}: {
  item: ApplyItem | null;
  lessonCount: number | null;
  lines: Record<ApplyStepId, RailLine>;
  step: ApplyStepId;
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled: boolean;
  submitting: boolean;
  tip: string;
}) {
  return (
    <aside className='flex flex-col gap-4 lg:sticky lg:top-4'>
      <div className='bg-card space-y-4 rounded-2xl border p-5 shadow-sm'>
        <h2 className='text-foreground text-base font-bold'>Your application</h2>
        {item ? (
          <div className='border-primary/30 bg-primary/5 flex gap-3 rounded-xl border p-3'>
            <span className='bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg'>
              <GraduationCap aria-hidden className='size-5' />
            </span>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-semibold'>{item.title}</p>
              <p className='text-muted-foreground text-xs'>
                {[
                  item.code,
                  lessonCount !== null ? `${lessonCount} lessons` : null,
                  `ages ${ageRangeLabel(item.ageMin, item.ageMax)}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
        ) : (
          <p className='text-muted-foreground rounded-xl border border-dashed p-3.5 text-center text-sm'>
            Choose a course or programme to start
          </p>
        )}
        <dl className='space-y-2.5 text-sm'>
          {APPLY_TO_TRAIN_STEPS.map(entry => (
            <div key={entry.id} className='flex justify-between gap-3'>
              <dt className={cn(entry.id === step && 'font-semibold')}>{entry.label}</dt>
              <dd className={TONE[lines[entry.id].tone]}>{lines[entry.id].status}</dd>
            </div>
          ))}
        </dl>
        <div className='flex gap-2'>
          {canBack ? (
            <Button type='button' variant='outline' className='h-11 flex-1' onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button
            type='button'
            className='h-11 flex-[2]'
            onClick={onNext}
            disabled={nextDisabled || submitting}
          >
            {submitting ? <Spinner className='size-4' /> : null}
            {nextLabel}
            {submitting ? null : <ArrowRight aria-hidden />}
          </Button>
        </div>
      </div>
      <p className='bg-card text-muted-foreground rounded-2xl border px-5 py-4 text-sm leading-relaxed shadow-sm'>
        {tip}
      </p>
    </aside>
  );
}
