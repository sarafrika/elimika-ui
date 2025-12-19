'use client';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/services/client';
import OrganizationUserCard from './OrganizationUserCard';

interface OrganizationUsersListProps {
  users: User[];
  organizationUuid: string;
  selectedUser: User | null;
}

export default function OrganizationUsersList({
  users,
  organizationUuid,
  selectedUser,
}: OrganizationUsersListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSelection = (userId?: string) => {
    const params = new URLSearchParams(window.location.search);
    if (userId) {
      params.set('id', userId);
    } else {
      params.delete('id');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const isSelected = (user: User) => (!selectedUser ? true : selectedUser?.uuid === user.uuid);

  return (
    <div className='bg-background flex min-h-0 w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <div className='flex-1 overflow-y-auto'>
        {users.length === 0 ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            No members found
          </div>
        ) : (
          users.map(user => (
            <OrganizationUserCard
              key={user.uuid!}
              user={user}
              organizationUuid={organizationUuid}
              isSelected={isSelected(user)}
              onSelect={selectedUser => updateSelection(selectedUser?.uuid)}
            />
          ))
        )}
      </div>
    </div>
  );
}
