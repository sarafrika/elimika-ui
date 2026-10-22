'use client';

import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { type ApplyItem, type ApplyStepId } from '../types';

export type RailLine = { label: string; status: string; tone: 'muted' | 'default' | 'success' | 'danger' };

const TONE: Record<RailLine['tone'], string> = {
  muted: 'text-muted-foreground',
  default: 'text-foreground',
  success: 'text-success font-semibold',
  danger: 'text-destructive font-semibold',
};

/** The application summary and navigation at the bottom of the current step. */
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
    <aside className='flex min-w-0 flex-col gap-4'>
      {/* <p className='bg-card text-muted-foreground rounded-2xl border px-5 py-4 text-sm leading-relaxed shadow-sm'>
        {tip}
      </p>
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
      </div> */}

      <div className='flex items-center justify-between gap-3'>
        {canBack ? (
          <Button type='button' variant='outline' className='h-11' onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button
          type='button'
          className='ml-auto h-auto min-h-11 min-w-0 shrink py-2 text-center whitespace-normal'
          onClick={onNext}
          disabled={nextDisabled || submitting}
        >
          {submitting ? <Spinner className='size-4' /> : null}
          {nextLabel}
          {submitting ? null : <ArrowRight aria-hidden />}
        </Button>
      </div>
    </aside>
  );
}
