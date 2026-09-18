import { Lock } from 'lucide-react';

import { PinnedPlaceCard } from '@/components/maps/pinned-place-card';
import type { TrainingBranch } from '@/services/client';

export function BranchLocationSummary({ branch }: { branch: TrainingBranch }) {
  if (typeof branch.latitude !== 'number' || typeof branch.longitude !== 'number') return null;

  return (
    <PinnedPlaceCard
      name={branch.branch_name || 'Branch'}
      address={branch.address}
      latitude={branch.latitude}
      longitude={branch.longitude}
      size='sm'
      label='Training happens here'
      sourceChip='Branch pin'
      className='shadow-none'
      footer={
        <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <Lock className='h-3 w-3 shrink-0' />
          From the branch pin. To move it, edit the branch location.
        </p>
      }
    />
  );
}
