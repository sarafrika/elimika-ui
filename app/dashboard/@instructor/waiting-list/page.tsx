'use client';

import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/context/profile-context';
import { getInvitationsSentByUser } from '@/services/client';
import InviteList from '../../@organization/invites/_components/InviteList';

export default function WaitingListPage() {
  const user = useUserProfile();
  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-end justify-between'>
        <div className='flex-grow'>
          <h2 className='text-2xl font-bold tracking-tight'>Invitations</h2>
          <p className='text-muted-foreground'>Invite instructor or user</p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        <InviteList
          queryOption={{
            queryKey: ['instructor', 'invites'],
            queryFn: () =>
              getInvitationsSentByUser({
                path: {
                  uuid: user?.uuid!,
                },
              }),
            enabled: !!user,
          }}
        />
      </div>
    </div>
  );
}
