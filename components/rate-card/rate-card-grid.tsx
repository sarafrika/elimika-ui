'use client';

import { TriangleAlert } from 'lucide-react';
import { type ChangeEvent, useId, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  cellKey,
  clearMethod,
  DEFAULT_CURRENCY,
  formatRateAmount,
  getTrainingMethod,
  isMethodOffered,
  type MethodPrefix,
  parseRate,
  RATE_BASES,
  type RateBasis,
  type RateBasisInfo,
  type RateCard,
  type RateCellKey,
  type RateFloorFlags,
  TRAINING_METHODS,
  type TrainingMethod,
} from '@/lib/rate-card';
import { cn } from '@/lib/utils';

export type RateCardGridMode = 'view' | 'edit' | 'diff';

export type RateCardGridProps = {
  /** view: read-only; edit: inputs + per-method offer toggles; diff: `value` against `compareTo`. */
  mode: RateCardGridMode;
  /** The card shown; in diff mode, the proposed card. */
  value: RateCard | null | undefined;
  /** Edit mode: receives the whole next card (cells may hold 0 until normalised). */
  onChange?: (next: RateCard) => void;
  /** Diff mode: the live card the proposal replaces. */
  compareTo?: RateCard | null;
  /** Owner-only below-minimum flags; flagged cells are highlighted. */
  floorFlags?: RateFloorFlags | null;
  /** Minimum training fee, shown as a hint in edit mode. */
  minimum?: number | null;
  /** Per-cell messages, e.g. `validateRateCard(card, minimum).cells`. */
  errors?: Partial<Record<RateCellKey, string>>;
  /** Draws attention to one basis column. */
  highlightBasis?: RateBasis;
  /** Which methods to show, in order; defaults to all four. */
  methods?: readonly MethodPrefix[];
  /** Defaults to the card's currency, then KES. */
  currency?: string | null;
  className?: string;
};

const ROW_GRID = 'sm:grid-cols-3 md:grid-cols-[minmax(10rem,1.1fr)_repeat(3,minmax(0,1fr))]';

/** The 4 × 3 training rate card: methods as rows, rate bases as columns. */
export function RateCardGrid({
  mode,
  value,
  onChange,
  compareTo,
  floorFlags,
  minimum,
  errors,
  highlightBasis,
  methods,
  currency,
  className,
}: RateCardGridProps) {
  const card = value ?? {};
  const money = currency || card.currency || compareTo?.currency || DEFAULT_CURRENCY;
  const rows = useMemo(
    () => (methods ? methods.map(getTrainingMethod) : [...TRAINING_METHODS]),
    [methods]
  );
  // Rows switched on, or typed in, stay open even while every cell is blank.
  const [opened, setOpened] = useState<ReadonlySet<MethodPrefix>>(() => new Set());
  const markOpen = (prefix: MethodPrefix, on: boolean) =>
    setOpened(prev => {
      if (prev.has(prefix) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(prefix);
      else next.delete(prefix);
      return next;
    });

  const setOffered = (method: TrainingMethod, on: boolean) => {
    markOpen(method.prefix, on);
    if (!on) onChange?.(clearMethod(card, method));
  };

  const setCell = (method: TrainingMethod, key: RateCellKey, raw: string) => {
    markOpen(method.prefix, true);
    const parsed = raw === '' ? null : Number(raw);
    onChange?.({ ...card, [key]: Number.isFinite(parsed) ? parsed : null });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className='border-border bg-card overflow-hidden rounded-lg border'>
        <div
          aria-hidden
          className={cn(
            'bg-muted/50 border-border hidden gap-4 border-b px-4 py-3 md:grid',
            ROW_GRID
          )}
        >
          <span className='text-muted-foreground text-xs font-medium'>Training method</span>
          {RATE_BASES.map(basis => (
            <span
              key={basis.value}
              className={cn(
                'rounded-md px-2 py-1',
                basis.value === highlightBasis && 'bg-primary/10 ring-primary/40 ring-1'
              )}
            >
              <span className='text-foreground block text-xs font-semibold'>{basis.label}</span>
              <span className='text-muted-foreground block text-xs'>{basis.description}</span>
            </span>
          ))}
        </div>

        {rows.map(method => (
          <MethodRow
            key={method.prefix}
            mode={mode}
            method={method}
            card={card}
            compareTo={compareTo}
            floorFlags={floorFlags}
            errors={errors}
            highlightBasis={highlightBasis}
            currency={money}
            open={opened.has(method.prefix)}
            onToggle={on => setOffered(method, on)}
            onCell={(key, raw) => setCell(method, key, raw)}
          />
        ))}
      </div>

      <div className='text-muted-foreground space-y-1 text-xs'>
        <p>Hybrid classes use the in-person rates.</p>
        {mode === 'edit' && typeof minimum === 'number' && minimum > 0 ? (
          <p>
            Every rate you offer must be at least {formatRateAmount(minimum, money)}, the minimum
            training fee.
          </p>
        ) : null}
      </div>
    </div>
  );
}

type MethodRowProps = {
  mode: RateCardGridMode;
  method: TrainingMethod;
  card: RateCard;
  compareTo?: RateCard | null;
  floorFlags?: RateFloorFlags | null;
  errors?: Partial<Record<RateCellKey, string>>;
  highlightBasis?: RateBasis;
  currency: string;
  open: boolean;
  onToggle: (on: boolean) => void;
  onCell: (key: RateCellKey, raw: string) => void;
};

function MethodRow({
  mode,
  method,
  card,
  compareTo,
  floorFlags,
  errors,
  highlightBasis,
  currency,
  open,
  onToggle,
  onCell,
}: MethodRowProps) {
  const id = useId();
  const offered =
    isMethodOffered(card, method) || (mode === 'diff' && isMethodOffered(compareTo, method));
  const editable = mode === 'edit' && (offered || open);
  const showCells = mode === 'edit' ? editable : offered;

  return (
    <div
      role='group'
      aria-labelledby={`${id}-label`}
      className={cn(
        'border-border grid gap-3 border-b px-4 py-4 last:border-b-0 md:items-start md:gap-4',
        ROW_GRID
      )}
    >
      <div className='flex items-start justify-between gap-3 sm:col-span-3 md:col-span-1 md:flex-col md:justify-start'>
        <div>
          <p id={`${id}-label`} className='text-foreground text-sm font-semibold'>
            {method.label}
          </p>
          <p className='text-muted-foreground text-xs'>
            {method.format === 'INDIVIDUAL' ? 'One learner' : 'Several learners'},{' '}
            {method.location === 'online' ? 'online' : 'in person'}
          </p>
        </div>
        {mode === 'edit' ? (
          <div className='flex items-center gap-2'>
            <Switch id={`${id}-offer`} checked={editable} onCheckedChange={onToggle} />
            <Label htmlFor={`${id}-offer`} className='text-xs font-normal'>
              Offer this method
            </Label>
          </div>
        ) : null}
      </div>

      {showCells ? (
        RATE_BASES.map(basis => {
          const key = cellKey(method, basis);
          const cellProps = {
            id: `${id}-${basis.suffix}`,
            method,
            basis,
            cellKey: key,
            currency,
            highlighted: basis.value === highlightBasis,
            belowFloor: floorFlags?.[key] === true,
          };
          if (mode === 'edit')
            return (
              <EditCell
                key={key}
                {...cellProps}
                value={card[key]}
                error={errors?.[key]}
                onChange={event => onCell(key, event.target.value)}
              />
            );
          if (mode === 'diff')
            return <DiffCell key={key} {...cellProps} from={compareTo?.[key]} to={card[key]} />;
          return <ViewCell key={key} {...cellProps} value={card[key]} />;
        })
      ) : (
        <p className='text-muted-foreground bg-muted/40 rounded-md px-3 py-2 text-sm sm:col-span-3'>
          Not offered
        </p>
      )}
    </div>
  );
}

type CellProps = {
  id: string;
  method: TrainingMethod;
  basis: RateBasisInfo;
  cellKey: RateCellKey;
  currency: string;
  highlighted: boolean;
  belowFloor: boolean;
};

function cellFrame(highlighted: boolean, belowFloor: boolean) {
  return cn(
    'rounded-md px-2 py-1.5',
    highlighted && 'bg-primary/5 ring-primary/30 ring-1',
    belowFloor && 'bg-warning/10 ring-warning/60 ring-1'
  );
}

function CellCaption({ id, basis }: { id: string; basis: RateBasisInfo }) {
  return (
    <span id={`${id}-caption`} className='text-muted-foreground block text-xs md:hidden'>
      {basis.label}
    </span>
  );
}

function FloorNote({ belowFloor }: { belowFloor: boolean }) {
  if (!belowFloor) return null;
  return (
    <span className='text-warning mt-1 flex items-center gap-1 text-xs font-medium'>
      <TriangleAlert aria-hidden className='size-3' />
      Below minimum
    </span>
  );
}

function ViewCell({
  id,
  basis,
  currency,
  highlighted,
  belowFloor,
  value,
}: CellProps & { value: number | null | undefined }) {
  const amount = parseRate(value);
  return (
    <div className={cellFrame(highlighted, belowFloor)}>
      <CellCaption id={id} basis={basis} />
      <span className='text-foreground text-sm font-medium tabular-nums'>
        {formatRateAmount(amount, currency)}
      </span>
      <span className='sr-only'> {basis.phrase}</span>
      <FloorNote belowFloor={belowFloor} />
    </div>
  );
}

function EditCell({
  id,
  method,
  basis,
  currency,
  highlighted,
  belowFloor,
  value,
  error,
  onChange,
}: CellProps & {
  value: number | null | undefined;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={cellFrame(highlighted, belowFloor && !error)}>
      <Label htmlFor={id} className='text-muted-foreground mb-1 text-xs font-normal md:sr-only'>
        {basis.label}
        <span className='sr-only'>
          {' '}
          rate for {method.label.toLowerCase()} ({currency})
        </span>
      </Label>
      <div className='relative'>
        <span
          aria-hidden
          className='text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs'
        >
          {currency}
        </span>
        <Input
          id={id}
          type='number'
          inputMode='decimal'
          min={0}
          step='any'
          value={typeof value === 'number' && Number.isFinite(value) ? value : ''}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className='bg-background pl-12 tabular-nums'
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className='text-destructive mt-1 text-xs'>
          {error}
        </p>
      ) : (
        <FloorNote belowFloor={belowFloor} />
      )}
    </div>
  );
}

function DiffCell({
  id,
  basis,
  currency,
  highlighted,
  belowFloor,
  from: rawFrom,
  to: rawTo,
}: CellProps & { from: number | null | undefined; to: number | null | undefined }) {
  const from = parseRate(rawFrom);
  const to = parseRate(rawTo);
  const shown = to ?? from;

  let badge: { label: string; className: string } | null = null;
  if (from === null && to !== null)
    badge = { label: 'New', className: 'bg-success/10 text-success border-success/40' };
  else if (from !== null && to === null)
    badge = {
      label: 'Removed',
      className: 'bg-destructive/10 text-destructive border-destructive/40',
    };
  else if (from !== null && to !== null && from !== to)
    badge = {
      label: `${to > from ? '+' : '−'}${formatRateAmount(Math.abs(to - from), currency)}`,
      className:
        to > from
          ? 'bg-warning/10 text-foreground border-warning/50'
          : 'bg-success/10 text-foreground border-success/40',
    };

  return (
    <div className={cellFrame(highlighted, belowFloor)}>
      <CellCaption id={id} basis={basis} />
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            to === null && from !== null
              ? 'text-muted-foreground line-through'
              : badge
                ? 'text-foreground'
                : 'text-muted-foreground'
          )}
        >
          {formatRateAmount(shown, currency)}
        </span>
        {badge ? (
          <Badge variant='outline' className={cn('rounded-md', badge.className)}>
            {badge.label}
          </Badge>
        ) : null}
      </div>
      {from !== null && to !== null && from !== to ? (
        <span className='text-muted-foreground block text-xs tabular-nums'>
          was <span className='line-through'>{formatRateAmount(from, currency)}</span>
        </span>
      ) : null}
      <span className='sr-only'> {basis.phrase}</span>
      <FloorNote belowFloor={belowFloor} />
    </div>
  );
}

/** Shape-matching placeholder for a RateCardGrid inside an AsyncSection. */
export function RateCardGridSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className='border-border bg-card overflow-hidden rounded-lg border'>
      <div className={cn('bg-muted/50 hidden gap-4 px-4 py-3 md:grid', ROW_GRID)}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className='h-8 w-24' />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className={cn(
            'border-border grid gap-3 border-b px-4 py-4 last:border-b-0 md:gap-4',
            ROW_GRID
          )}
        >
          <div className='space-y-1.5 sm:col-span-3 md:col-span-1'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
          {Array.from({ length: 3 }, (_, cell) => (
            <Skeleton key={cell} className='h-9 w-full' />
          ))}
        </div>
      ))}
    </div>
  );
}
