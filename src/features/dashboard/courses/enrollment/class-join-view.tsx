'use client';

import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, Lock } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { StatCard } from '@/components/data-display/stat-tile';
import { type StatusTone, statusToneClass } from '@/components/data-display/tone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface JoinChip {
  label: string;
  tone: StatusTone;
}

export interface JoinStat {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone: StatusTone;
  icon: ComponentType<{ className?: string }>;
}

export interface JoinSession {
  id: string;
  month: string;
  day: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
}

export interface JoinCheckItem {
  id: string;
  name: string;
  detail?: string;
  required: boolean;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export interface JoinEligibility {
  state: 'loading' | 'ok' | 'blocked' | 'none';
  title: string;
  detail?: string;
}

export interface ClassJoinViewProps {
  onBack: () => void;
  title: string;
  subtitle: ReactNode;
  chips: JoinChip[];
  stats: JoinStat[];
  sessions: JoinSession[];
  eligibility: JoinEligibility;
  /** A self-confirmation the learner must tick, e.g. an age rule the profile cannot answer. */
  confirm?: JoinCheckItem | null;
  items: JoinCheckItem[];
  terms: { checked: boolean; onToggle: (checked: boolean) => void; detail: string };
  price: { isFree: boolean; totalLabel: string; rateLabel?: string | null; unitsLabel?: string | null };
  seatsBadge?: JoinChip | null;
  /** Reasons the learner cannot join at all; shown instead of the call to action. */
  blockers: string[];
  notices: JoinChip[];
  primary: { label: string; pending: boolean; onClick: () => void };
  secondary?: { label: string; onClick: () => void } | null;
}

function CheckTile({ item, flagged }: { item: JoinCheckItem; flagged: boolean }) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors',
        item.checked
          ? 'border-primary/30 bg-primary/[0.04]'
          : flagged
            ? 'border-destructive/40 bg-destructive/[0.04]'
            : 'border-border/70 bg-card hover:border-primary/30'
      )}
    >
      <input
        type='checkbox'
        className='peer sr-only'
        checked={item.checked}
        onChange={event => item.onToggle(event.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          'peer-focus-visible:ring-primary/40 flex size-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] peer-focus-visible:ring-[3px]',
          item.checked
            ? 'border-primary bg-primary text-primary-foreground'
            : flagged
              ? 'border-destructive bg-card'
              : 'border-input bg-card'
        )}
      >
        {item.checked ? <Check className='size-3.5' /> : null}
      </span>
      <span className='flex min-w-0 flex-col gap-0.5 text-sm'>
        <span className='font-semibold'>
          {item.name}
          {item.required ? null : <span className='text-muted-foreground font-normal'> · optional</span>}
        </span>
        {item.detail ? <span className='text-muted-foreground text-xs'>{item.detail}</span> : null}
        {flagged && !item.checked ? <span className='text-destructive text-xs font-semibold'>Tick this to continue</span> : null}
      </span>
    </label>
  );
}

/** "Review & get ready": the class, what the learner must confirm, and one clear way to pay. */
export function ClassJoinView(props: ClassJoinViewProps) {
  const { title, subtitle, chips, stats, sessions, eligibility, confirm, items, terms, price, seatsBadge, blockers, notices, primary, secondary } =
    props;
  const [attempted, setAttempted] = useState(false);

  const requiredItems = items.filter(item => item.required);
  const total = requiredItems.length + 1 + (confirm ? 1 : 0);
  const done = requiredItems.filter(item => item.checked).length + (terms.checked ? 1 : 0) + (confirm?.checked ? 1 : 0);
  const missing = total - done;
  const ready = missing === 0;
  const blocked = blockers.length > 0;

  const helper = blocked
    ? blockers[0]
    : ready
      ? price.isFree
        ? 'You can join now — this class is free.'
        : 'Next: your M-Pesa number'
      : `Tick ${missing} more ${missing === 1 ? 'item' : 'items'} in “Get ready” to continue`;

  const go = () => {
    if (blocked || primary.pending) return;
    if (!ready) {
      setAttempted(true);
      document.getElementById('get-ready')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    primary.onClick();
  };

  const cta = (
    <Button
      size='lg'
      onClick={go}
      aria-describedby='join-cta-help'
      aria-disabled={!ready || blocked}
      className={cn('w-full', (!ready || blocked) && 'bg-primary/15 text-primary hover:bg-primary/20 border-primary/30 border')}
    >
      {primary.pending ? <Loader2 aria-hidden className='size-4 animate-spin' /> : <Lock aria-hidden className='size-4' />}
      {primary.pending ? 'Working…' : primary.label}
    </Button>
  );

  return (
    <main className={cn(surfaceTheme.pageWide, 'py-4 pb-36 sm:pb-16')}>
      <div className={surfaceTheme.pageStack}>
        <Button variant='ghost' size='sm' onClick={props.onBack} className='text-muted-foreground -ml-2 self-start'>
          <ArrowLeft aria-hidden className='size-4' />
          Back to classes
        </Button>

        <section className='border-border bg-card rounded-2xl border shadow-sm'>
          <div className='from-primary via-primary/85 to-primary/55 relative h-40 overflow-hidden rounded-t-2xl bg-gradient-to-br'>
            <span aria-hidden className='bg-primary-foreground/15 absolute -top-36 -right-16 size-80 rounded-full' />
            <span aria-hidden className='bg-primary-foreground/10 absolute right-56 -bottom-28 size-48 rotate-[22deg] rounded-[48px]' />
            <GraduationCap aria-hidden className='text-primary-foreground/30 absolute top-6 right-12 size-28' />
            <div className='absolute top-5 left-6 flex flex-wrap gap-2'>
              {chips.map(chip => (
                <span key={chip.label} className={cn('bg-card rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusToneClass[chip.tone])}>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
          <div className='relative flex flex-wrap items-end justify-between gap-4 px-6 pt-9 pb-5'>
            <span
              aria-hidden
              className='bg-primary text-primary-foreground ring-card absolute -top-7 left-6 flex size-14 items-center justify-center rounded-full shadow-md ring-[5px]'
            >
              <GraduationCap className='size-6' />
            </span>
            <div className='flex min-w-0 flex-[1_1_420px] flex-col gap-1.5'>
              <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h1>
              <p className='text-muted-foreground text-sm'>{subtitle}</p>
            </div>
            <div className='hidden text-right lg:block'>
              <div className='text-muted-foreground text-xs'>{price.isFree ? 'Price' : 'Full class price'}</div>
              <div className='text-2xl font-extrabold tracking-tight tabular-nums'>{price.totalLabel}</div>
            </div>
          </div>
          <nav aria-label='Sections' className='thin-scrollbar flex gap-6 overflow-x-auto px-6 shadow-[inset_0_-1px_0_0_var(--color-border)]'>
            <a href='#overview' className='border-primary text-primary flex h-11 flex-none items-center gap-2 border-b-2 text-sm font-semibold'>
              Overview
            </a>
            <a href='#schedule' className='text-muted-foreground hover:text-foreground flex h-11 flex-none items-center gap-2 border-b-2 border-transparent text-sm font-medium'>
              Schedule
              <span className='bg-muted text-muted-foreground inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold'>
                {sessions.length}
              </span>
            </a>
            <a href='#get-ready' className='text-muted-foreground hover:text-foreground flex h-11 flex-none items-center gap-2 border-b-2 border-transparent text-sm font-medium'>
              Get ready
              <span
                className={cn(
                  'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold',
                  ready ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                )}
              >
                {ready ? <Check aria-hidden className='size-3' /> : missing}
              </span>
            </a>
            <a href='#pay' className='text-muted-foreground hover:text-foreground flex h-11 flex-none items-center border-b-2 border-transparent text-sm font-medium'>
              {price.isFree ? 'Join' : 'Pay'}
            </a>
          </nav>
        </section>

        <section id='overview' aria-label='Key facts' className={surfaceTheme.statGrid}>
          {stats.map(stat => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} tone={stat.tone} />
          ))}
        </section>

        {notices.map(notice => (
          <div key={notice.label} className={cn('rounded-md border px-4 py-3 text-sm', statusToneClass[notice.tone])}>
            {notice.label}
          </div>
        ))}

        <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]'>
          <div className='flex min-w-0 flex-col gap-5'>
            <section
              id='get-ready'
              aria-labelledby='get-ready-title'
              className={cn(surfaceTheme.cardPadded, 'flex scroll-mt-24 flex-col gap-4', attempted && !ready && 'border-destructive/40')}
            >
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <span className={cn('flex size-10 items-center justify-center rounded-md border', statusToneClass.info)}>
                    <ClipboardCheck aria-hidden className='size-5' />
                  </span>
                  <div>
                    <h2 id='get-ready-title' className='text-base font-semibold'>
                      Get ready for class
                    </h2>
                    <p className={cn('text-[13px]', attempted && !ready ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {ready ? 'All set — you can continue.' : attempted ? 'Tick the highlighted items to continue.' : 'Confirm what you’ll bring and the class terms.'}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold',
                    ready ? statusToneClass.success : attempted ? statusToneClass.destructive : statusToneClass.info
                  )}
                >
                  {ready ? 'All set' : `${done} of ${total} ready`}
                </span>
              </div>
              <div aria-hidden className='bg-muted h-1.5 overflow-hidden rounded-full'>
                <div className={cn('h-1.5 rounded-full transition-[width]', ready ? 'bg-success' : 'bg-primary')} style={{ width: `${(done / total) * 100}%` }} />
              </div>

              <div
                className={cn(
                  'flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm',
                  eligibility.state === 'blocked'
                    ? statusToneClass.destructive
                    : eligibility.state === 'ok'
                      ? statusToneClass.success
                      : statusToneClass.neutral
                )}
              >
                {eligibility.state === 'loading' ? (
                  <Loader2 aria-hidden className='mt-0.5 size-4 shrink-0 animate-spin' />
                ) : eligibility.state === 'blocked' ? (
                  <AlertTriangle aria-hidden className='mt-0.5 size-4 shrink-0' />
                ) : (
                  <CheckCircle2 aria-hidden className='mt-0.5 size-4 shrink-0' />
                )}
                <span>
                  <strong className='font-semibold'>{eligibility.title}</strong>
                  {eligibility.detail ? <span className='block text-xs opacity-90'>{eligibility.detail}</span> : null}
                </span>
              </div>
              {confirm ? <CheckTile item={confirm} flagged={attempted} /> : null}

              {items.length > 0 ? (
                <>
                  <div className={surfaceTheme.sectionLabel}>Bring to class</div>
                  <div className='grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]'>
                    {items.map(item => (
                      <CheckTile key={item.id} item={item} flagged={attempted && item.required} />
                    ))}
                  </div>
                </>
              ) : null}

              <CheckTile
                item={{ id: 'terms', name: 'I agree to the schedule and class terms', detail: terms.detail, required: true, checked: terms.checked, onToggle: terms.onToggle }}
                flagged={attempted}
              />
            </section>

            <section id='schedule' aria-labelledby='schedule-title' className={cn(surfaceTheme.cardPadded, 'flex scroll-mt-24 flex-col')}>
              <h2 id='schedule-title' className='mb-2 text-base font-semibold'>
                Schedule
              </h2>
              {sessions.length === 0 ? (
                <p className='text-muted-foreground text-sm'>Sessions have not been scheduled yet.</p>
              ) : (
                <ol className='flex flex-col'>
                  {sessions.map(session => (
                    <li key={session.id} className='border-border/60 flex items-center gap-3 border-t py-2.5'>
                      <span className='border-primary/30 flex w-11 shrink-0 flex-col overflow-hidden rounded-md border text-center'>
                        <span className='bg-primary text-primary-foreground py-0.5 text-[9px] font-bold tracking-widest'>{session.month}</span>
                        <span className='py-0.5 text-base font-extrabold tabular-nums'>{session.day}</span>
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-semibold'>{session.title}</span>
                        <span className='text-muted-foreground block text-xs'>{session.dateLabel}</span>
                      </span>
                      <span className='text-muted-foreground text-[13px] tabular-nums'>{session.timeLabel}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside id='pay' aria-label='Price and payment' className={cn(surfaceTheme.cardPadded, 'hidden flex-col gap-4 sm:flex xl:sticky xl:top-20')}>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <div className={surfaceTheme.sectionLabel}>{price.isFree ? 'Price' : 'You pay once'}</div>
                <div className='text-3xl font-extrabold tracking-tight tabular-nums'>{price.totalLabel}</div>
              </div>
              {seatsBadge ? (
                <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusToneClass[seatsBadge.tone])}>{seatsBadge.label}</span>
              ) : null}
            </div>
            {!price.isFree && price.rateLabel ? (
              <dl className={cn(surfaceTheme.cardMuted, 'grid grid-cols-[1fr_auto] gap-2 px-3.5 py-3 text-sm')}>
                <dt className='text-muted-foreground'>Rate</dt>
                <dd className='font-semibold tabular-nums'>{price.rateLabel}</dd>
                {price.unitsLabel ? (
                  <>
                    <dt className='text-muted-foreground'>Teaching time</dt>
                    <dd className='font-semibold tabular-nums'>{price.unitsLabel}</dd>
                  </>
                ) : null}
                <dt className='border-border/70 border-t pt-2 font-bold'>Total</dt>
                <dd className='border-border/70 border-t pt-2 font-extrabold tabular-nums'>{price.totalLabel}</dd>
              </dl>
            ) : null}
            <div className='flex flex-col gap-2'>
              {cta}
              <p
                id='join-cta-help'
                className={cn('text-center text-[13px] font-semibold', (attempted && !ready) || blocked ? 'text-destructive' : 'text-muted-foreground')}
              >
                {helper}
              </p>
              {secondary ? (
                <Button variant='outline' onClick={() => (ready ? secondary.onClick() : go())} disabled={blocked}>
                  {secondary.label}
                </Button>
              ) : null}
            </div>
            {price.isFree ? null : (
              <p className='text-muted-foreground border-border/60 flex gap-2 border-t pt-3 text-xs'>
                <Lock aria-hidden className='size-3.5 shrink-0' />
                Your seat is held for 10 minutes while you pay with M-Pesa.
              </p>
            )}
          </aside>
        </div>
      </div>

      <div className='bg-card fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1.5 border-t px-4 pt-3 pb-4 shadow-[0_-12px_28px_-18px_rgba(28,31,43,.35)] sm:hidden'>
        <div className='flex items-center gap-3'>
          <div className='flex flex-col'>
            <span className='text-muted-foreground text-[11px] font-semibold'>{ready ? (price.isFree ? 'Free' : 'You pay once') : `${done} of ${total} ready`}</span>
            <span className='text-lg font-extrabold tabular-nums'>{price.totalLabel}</span>
          </div>
          <div className='flex-1'>{cta}</div>
        </div>
        {ready && !blocked ? null : (
          <p className={cn('text-center text-xs font-semibold', blocked || attempted ? 'text-destructive' : 'text-muted-foreground')}>{helper}</p>
        )}
      </div>
    </main>
  );
}
