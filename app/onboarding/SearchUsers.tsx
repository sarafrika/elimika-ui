'use client';
import { tanstackClient } from '@/services/api/tanstack-client';
import { useSession } from 'next-auth/react';

export default function SearchUsers() {
  const session = useSession();
  const { data: resp, isPending } = tanstackClient.useQuery('get', '/api/v1/users/search', {
    params: {
      query: {
        //@ts-ignore
        page: 0,
        size: 1,
        email_eq: session?.data?.user?.email,
      },
    },
  });
  console.log(resp?.data?.content);
  if (isPending) return <div>Loading...</div>;
  return <div>SearchUsers</div>;
}
