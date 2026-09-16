import { MapPin, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { TrainingBranch } from '@/services/client';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

export function BranchPinMissing({ branch }: { branch: TrainingBranch }) {
  const name = branch.branch_name || 'This branch';

  return (
    <div
      role='status'
      className='border-warning/60 bg-warning/10 text-foreground flex flex-col gap-3 rounded-md border p-3 text-sm sm:flex-row sm:items-center'
    >
      <TriangleAlert className='text-warning h-4 w-4 shrink-0' />
      <p className='flex-1'>
        <strong className='font-semibold'>{name} has no pin yet.</strong> Set the branch location
        before posting an in-person or hybrid job there.
      </p>
      {branch.uuid ? (
        <Button asChild variant='outline' size='sm' className='self-start sm:self-auto'>
          <Link
            href={dashboardUrl('organisation', `branches/edit/${branch.uuid}`)}
            target='_blank'
            rel='noopener noreferrer'
          >
            <MapPin className='h-4 w-4' />
            Set branch location
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
