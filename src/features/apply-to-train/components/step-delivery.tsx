'use client';

import { MapPin, Monitor } from 'lucide-react';
import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  cellKey,
  DEFAULT_CURRENCY,
  formatRateAmount,
  getTrainingMethod,
  type MethodPrefix,
  RATE_BASES,
  type RateCard,
} from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import {
  type AgeGroupDraft,
  formatHours,
  type PlanLesson,
  totalHours,
} from '../age-groups/model';
import { type DeliveryDraft, type DeliveryValidation, hourlyRate } from '../delivery-model';
import { ErrorList } from './error-list';

/** Online first, as the cards read left to right. */
const METHOD_ORDER: readonly MethodPrefix[] = [
  'private_online',
  'group_online',
  'private_inperson',
  'group_inperson',
];

const METHOD_COPY: Record<MethodPrefix, { title: string; description: string }> = {
  private_online: { title: 'Online · Private', description: 'One learner on a live video call' },
  group_online: { title: 'Online · Group', description: 'A class of learners on a live video call' },
  private_inperson: { title: 'In person · Private', description: 'One learner, face to face' },
  group_inperson: { title: 'In person · Group', description: 'A class of learners, face to face' },
};

type StepDeliveryProps = {
  draft: DeliveryDraft;
  onChange: (draft: DeliveryDraft) => void;
  validation: DeliveryValidation;
  showErrors: boolean;
  minimumFee: number | null;
  creator: string;
  groups: AgeGroupDraft[];
  lessons: PlanLesson[];
};

export function StepDelivery({
  draft,
  onChange,
  validation,
  showErrors,
  minimumFee,
  creator,
  groups,
  lessons,
}: StepDeliveryProps) {
  const currency = draft.card.currency || DEFAULT_CURRENCY;
  const toggle = (prefix: MethodPrefix, on: boolean) =>
    onChange({
      ...draft,
      methods: on
        ? METHOD_ORDER.filter(item => item === prefix || draft.methods.includes(item))
        : draft.methods.filter(item => item !== prefix),
    });
  const setCard = (card: RateCard) => onChange({ ...draft, card });
  const onMethods = METHOD_ORDER.filter(prefix => draft.methods.includes(prefix));

  return (
    <div className='space-y-4'>
      <section className='bg-card space-y-4 rounded-2xl border p-5 shadow-sm'>
        <div>
          <h2 className='text-foreground font-semibold'>How will you deliver it?</h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Switch on every method you offer and price it per hour and per day in {currency}.
            {minimumFee ? (
              <>
                {' '}
                {creator} set a minimum of{' '}
                <strong className='text-foreground'>{formatRateAmount(minimumFee, currency)}</strong>{' '}
                for every rate.
              </>
            ) : null}
          </p>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          {METHOD_ORDER.map(prefix => (
            <MethodCard
              key={prefix}
              prefix={prefix}
              on={draft.methods.includes(prefix)}
              card={draft.card}
              currency={currency}
              errors={validation.cells}
              showErrors={showErrors}
              onToggle={on => toggle(prefix, on)}
              onCard={setCard}
            />
          ))}
        </div>
        {showErrors && validation.general.length > 0 ? (
          <ErrorList messages={validation.general} />
        ) : null}
      </section>

      {onMethods.length > 0 && groups.length > 0 ? (
        <CostTable
          draft={draft}
          methods={onMethods}
          groups={groups}
          lessons={lessons}
          currency={currency}
        />
      ) : null}
    </div>
  );
}

function MethodCard({
  prefix,
  on,
  card,
  currency,
  errors,
  showErrors,
  onToggle,
  onCard,
}: {
  prefix: MethodPrefix;
  on: boolean;
  card: RateCard;
  currency: string;
  errors: DeliveryValidation['cells'];
  showErrors: boolean;
  onToggle: (on: boolean) => void;
  onCard: (card: RateCard) => void;
}) {
  const id = useId();
  const method = getTrainingMethod(prefix);
  const Icon = method.location === 'online' ? Monitor : MapPin;
  const copy = METHOD_COPY[prefix];

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border p-4 transition-colors',
        on ? 'border-primary bg-primary/5 ring-primary ring-1' : 'bg-card'
      )}
    >
      <div className='flex items-start gap-3'>
        <span
          aria-hidden
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className='size-5' />
        </span>
        <Label htmlFor={`${id}-on`} className='block min-w-0 flex-1 cursor-pointer'>
          <span className='text-foreground block font-semibold'>{copy.title}</span>
          <span className='text-muted-foreground mt-0.5 block text-sm font-normal'>
            {copy.description}
          </span>
        </Label>
        <Switch id={`${id}-on`} checked={on} onCheckedChange={onToggle} />
      </div>

      {on ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {RATE_BASES.map(basis => {
            const key = cellKey(prefix, basis);
            const error = errors[key];
            const value = card[key];
            return (
              <div key={key} className='space-y-1'>
                <Label htmlFor={`${id}-${basis.suffix}`} className='text-xs'>
                  {basis.label}
                </Label>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-xs font-semibold'>{currency}</span>
                  <Input
                    id={`${id}-${basis.suffix}`}
                    inputMode='numeric'
                    placeholder='0'
                    value={value === null || value === undefined ? '' : String(value)}
                    aria-invalid={showErrors && Boolean(error)}
                    className={cn(showErrors && error && 'border-destructive')}
                    onChange={event => {
                      const raw = event.target.value.replace(/[^0-9.]/g, '');
                      const parsed = raw === '' ? null : Number(raw);
                      onCard({ ...card, [key]: Number.isFinite(parsed) ? parsed : null });
                    }}
                  />
                </div>
                {error && (showErrors || error.startsWith('At least')) ? (
                  <p className='text-destructive text-xs'>{error}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CostTable({
  draft,
  methods,
  groups,
  lessons,
  currency,
}: {
  draft: DeliveryDraft;
  methods: MethodPrefix[];
  groups: AgeGroupDraft[];
  lessons: PlanLesson[];
  currency: string;
}) {
  return (
    <section className='bg-card space-y-3 rounded-2xl border p-5 shadow-sm'>
      <div>
        <h2 className='text-foreground font-semibold'>What a full plan costs at your rates</h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>
          Hours in each group’s lesson plan × your hourly rate. Private is per learner; group is per
          class.
        </p>
      </div>
      <div className='overflow-x-auto rounded-xl border'>
        <table className='w-full min-w-[520px] text-sm'>
          <thead className='bg-muted/50 text-left'>
            <tr>
              <th className='px-4 py-2.5 font-semibold'>Group</th>
              <th className='px-4 py-2.5 font-semibold'>Hours</th>
              {methods.map(prefix => (
                <th key={prefix} className='px-4 py-2.5 text-right font-semibold'>
                  {getTrainingMethod(prefix).label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => {
              const hours = totalHours(group, lessons);
              return (
                <tr key={group.id} className='border-t'>
                  <td className='px-4 py-2.5'>{group.name.trim() || 'Untitled group'}</td>
                  <td className='px-4 py-2.5 font-mono'>{formatHours(hours)}</td>
                  {methods.map(prefix => {
                    const rate = hourlyRate(draft, prefix);
                    return (
                      <td key={prefix} className='px-4 py-2.5 text-right font-mono'>
                        {rate && rate > 0 ? formatRateAmount(Math.round(hours * rate), currency) : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}