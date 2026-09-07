'use client';

/**
 * Step 4 — the applicant's own quote.
 *
 * One tier per method is opened automatically; extra tiers exist because the
 * same method is often sold at more than one session length. Each tier carries
 * three things the rate card alone cannot express — the method, the session
 * duration in the applicant's own words, and the basis the amount is charged on
 * — and `buildRateCard` folds them onto the API's grid.
 *
 * Nothing on this step reads anybody else's rates. The only figures here are
 * the ones being typed.
 */

import { Plus, Trash2 } from 'lucide-react';
import type { Dispatch } from 'react';

import { DEFAULT_RATE_BASIS, RATE_BASES, type RateBasis } from '@/components/class-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  APPLICATION_CURRENCY,
  METHOD_OPTIONS,
  methodOption,
  type ApplyAction,
  type ApplyState,
  type TrainingMethod,
} from './apply-model';

export function StepPricing({
  state,
  dispatch,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
}) {
  const selectedTitles = state.methods
    .map(method => methodOption(method)?.title)
    .filter((title): title is string => Boolean(title));
  const totalTiers = state.pricing.length;

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
        <div className='text-muted-foreground text-sm'>
          What&apos;s your{' '}
          <span className='text-foreground font-medium'>proposed fee per student</span>?
          {selectedTitles.length > 0 && (
            <>
              {' '}
              A pricing row is auto-created for each selected method. Add extra tiers if you offer
              different session durations for the same method.
            </>
          )}
          {selectedTitles.length === 0 && (
            <span className='text-destructive'> Select at least one training method first.</span>
          )}
        </div>
        <Badge variant='secondary'>
          {totalTiers} {totalTiers === 1 ? 'tier' : 'tiers'}
        </Badge>
      </div>

      <div className='space-y-3'>
        {state.pricing.map((tier, index) => {
          const option = methodOption(tier.method);
          const methodInvalid = !tier.method;
          const durationInvalid = !tier.duration.trim();
          const amount = Number.parseFloat(tier.amount);
          const amountInvalid = !tier.amount.trim() || Number.isNaN(amount) || amount <= 0;
          return (
            <div key={tier.id} className='rounded-md border p-3'>
              <div className='mb-3 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-[10px] font-normal'>
                    Training method {index + 1}
                  </Badge>
                  {option && <span className='text-muted-foreground text-xs'>{option.title}</span>}
                </div>
                {state.pricing.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => dispatch({ type: 'priceRemove', id: tier.id })}
                    aria-label={`Remove pricing tier ${index + 1}`}
                  >
                    <Trash2 className='text-muted-foreground h-4 w-4' />
                  </Button>
                )}
              </div>

              <div className='grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]'>
                <div className='space-y-1'>
                  <Label htmlFor={`p-method-${tier.id}`} className='text-muted-foreground text-xs'>
                    Training method <span className='text-destructive'>*</span>
                  </Label>
                  <select
                    id={`p-method-${tier.id}`}
                    value={tier.method}
                    onChange={event =>
                      dispatch({
                        type: 'priceUpdate',
                        id: tier.id,
                        patch: { method: event.target.value as TrainingMethod | '' },
                      })
                    }
                    aria-invalid={methodInvalid}
                    className={cn(
                      'border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1',
                      methodInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  >
                    <option value=''>Select method…</option>
                    {METHOD_OPTIONS.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  {methodInvalid && <p className='text-destructive text-[11px]'>Required.</p>}
                </div>

                <div className='space-y-1'>
                  <Label
                    htmlFor={`p-duration-${tier.id}`}
                    className='text-muted-foreground text-xs'
                  >
                    Session duration <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id={`p-duration-${tier.id}`}
                    value={tier.duration}
                    onChange={event =>
                      dispatch({
                        type: 'priceUpdate',
                        id: tier.id,
                        patch: { duration: event.target.value },
                      })
                    }
                    placeholder='e.g. 1 hour, 90 min, half-day'
                    aria-invalid={durationInvalid}
                    className={cn(
                      durationInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  />
                  {durationInvalid && <p className='text-destructive text-[11px]'>Required.</p>}
                </div>

                <div className='space-y-1'>
                  <Label htmlFor={`p-basis-${tier.id}`} className='text-muted-foreground text-xs'>
                    Charged per
                  </Label>
                  <Select
                    value={tier.basis ?? DEFAULT_RATE_BASIS}
                    onValueChange={value =>
                      dispatch({
                        type: 'priceUpdate',
                        id: tier.id,
                        patch: { basis: value as RateBasis },
                      })
                    }
                  >
                    <SelectTrigger id={`p-basis-${tier.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_BASES.map(basis => (
                        <SelectItem key={basis.value} value={basis.value}>
                          {basis.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1'>
                  <Label htmlFor={`p-amount-${tier.id}`} className='text-muted-foreground text-xs'>
                    Amount ({APPLICATION_CURRENCY} / student){' '}
                    <span className='text-destructive'>*</span>
                  </Label>
                  <div className='relative'>
                    <span className='text-muted-foreground pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs font-medium'>
                      {APPLICATION_CURRENCY}
                    </span>
                    <Input
                      id={`p-amount-${tier.id}`}
                      type='number'
                      min={0}
                      inputMode='decimal'
                      value={tier.amount}
                      onChange={event =>
                        dispatch({
                          type: 'priceUpdate',
                          id: tier.id,
                          patch: { amount: event.target.value },
                        })
                      }
                      placeholder='0'
                      aria-invalid={amountInvalid}
                      className={cn(
                        'pl-11',
                        amountInvalid && 'border-destructive focus-visible:ring-destructive/40'
                      )}
                    />
                  </div>
                  {amountInvalid && (
                    <p className='text-destructive text-[11px]'>Enter an amount greater than 0.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => dispatch({ type: 'priceAdd' })}
      >
        <Plus className='mr-2 h-4 w-4' /> Add training method pricing
      </Button>
    </div>
  );
}
