'use client';

import { Button } from '../../../../../components/ui/button';
import { Separator } from '../../../../../components/ui/separator';
import { useTrainingCenter } from '../../../../../context/training-center-provide';
import { getOrganizationInvitations, } from '../../../../../services/client';
import { InviteForm } from './InviteForm';
import InviteList from './InviteList';

export default function InvitesPage() {
  const trainingCenter = useTrainingCenter();

  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-end justify-between'>
        <div className='flex-grow'>
          <h2 className='text-2xl font-bold tracking-tight'>Invitations</h2>
          <p className='text-muted-foreground'>Invite instructor or user</p>
        </div>
        <InviteForm>
          <Button>Create an Invite</Button>
        </InviteForm>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        <InviteList
          queryOption={{
            queryKey: ['organization', 'invites'],
            queryFn: () =>
              getOrganizationInvitations({
                path: { uuid: trainingCenter?.uuid! },
              }),
            enabled: !!trainingCenter,
          }}
        />
      </div>
    </div>
  );
}
