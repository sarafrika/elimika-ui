'use client';

import { Info, Plus } from 'lucide-react';
import { useState } from 'react';

import {
  BillingBasisCards,
  basisStatus,
  type Offering,
  offeringTarget,
  ServiceCards,
  type ServiceKey,
} from '@/components/class-form';
import { UpdateRatesDialog } from '@/components/rate-card/update-rates-dialog';
import { Button } from '@/components/ui/button';
import type { DeliveryMode, RateBasis, RateCard } from '@/lib/rate-card';

export function BillingStep({
  offering,
  creatorName,
  delivery,
  basis,
  onBasisChange,
  service,
  onServiceChange,
  proposedCard,
  onRatesAdded,
}: {
  offering: Offering;
  creatorName?: string;
  delivery: DeliveryMode;
  basis: RateBasis | null;
  onBasisChange: (basis: RateBasis) => void;
  service: ServiceKey | null;
  onServiceChange: (service: ServiceKey) => void;
  proposedCard: RateCard | null;
  onRatesAdded: (card: RateCard | null) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBasis, setDialogBasis] = useState<RateBasis>('per_hour');
  const [added, setAdded] = useState(false);
  const { kind, parentUuid } = offeringTarget(offering);
  const approver = creatorName?.trim() || 'the course creator';

  return (
    <div className='flex flex-col gap-6'>
      <BillingBasisCards
        value={basis}
        onChange={onBasisChange}
        hint='The instructor is paid on the same basis.'
        statusFor={candidate => basisStatus(offering.rateCard, proposedCard, delivery, candidate)}
        renderAddAction={
          offering.applicationUuid
            ? candidate => (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setDialogBasis(candidate.value);
                    setDialogOpen(true);
                  }}
                >
                  <Plus aria-hidden />
                  Add {candidate.phrase} rates
                </Button>
              )
            : undefined
        }
      />

      {added ? (
        <div
          role='status'
          className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'
        >
          <Info className='text-primary mt-0.5 size-4 shrink-0' />
          <p>
            <strong className='font-semibold'>Rates added to your rate card.</strong> They go live
            once {approver} approves them. Carry on with an approved basis, or come back then. We’ll
            notify you.
          </p>
        </div>
      ) : null}

      <ServiceCards
        value={service}
        onChange={onServiceChange}
        rateCard={offering.rateCard}
        delivery={delivery}
        basis={basis}
      />

      {offering.applicationUuid ? (
        <UpdateRatesDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          kind={kind}
          parentUuid={parentUuid}
          applicationUuid={offering.applicationUuid}
          title={offering.label}
          currentCard={offering.rateCard}
          creatorName={creatorName}
          focusBasis={dialogBasis}
          minimum={offering.minimumFee}
          onSubmitted={update => {
            setAdded(true);
            onRatesAdded(update?.proposed_rate_card ?? null);
          }}
        />
      ) : null}
    </div>
  );
}
