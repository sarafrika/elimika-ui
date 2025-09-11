'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PhoneCall, Send, User as UserIcon } from 'lucide-react';
import { ApiResponse, getUserByUuid, User } from '../services/client';
import { Badge } from './ui/badge';

export default function UserBadge({
  user_uuid,
  showContacts,
  iconSize = 16,
}: {
  user_uuid: string;
  showContacts?: boolean;
  iconSize?: number;
}) {
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [`user-${user_uuid}`],
    queryFn: () =>
      getUserByUuid({
        path: {
          uuid: user_uuid,
        },
      }),
    staleTime: 3600,
  });

  if (isLoading) {
    return (
      <>
        <Loader2 />
      </>
    );
  }

  if (!data || !data.data) {
    return <>No User Found</>;
  }

  const user = data.data!.data as User;

  return (
    <div className='flex items-center gap-3'>
      <Avatar>
        <AvatarImage src={user.profile_image_url} alt='@shadcn' />
        <AvatarFallback>
          <div className='rounded-full bg-gray-300 p-3'>
            <UserIcon size={iconSize} />
          </div>
        </AvatarFallback>
      </Avatar>
      <div>
        <h6>{user.full_name}</h6>
        {showContacts && (
          <>
            <div className='flex gap-3'>
              <Badge variant={'outline'}>
                <PhoneCall /> {user.phone_number}
              </Badge>
              <Badge variant={'outline'}>
                <Send /> {user.email}
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
