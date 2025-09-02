'use server';

import { fetchClient } from '@/services/api/fetch-client';
import { auth } from '@/services/auth';

export const getUserProfile = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'User not found',
      data: null,
    };
  }
  const resp = await fetchClient.GET('/api/v1/users/search', {
    params: {
      searchParams: {
        email_eq: session.user.email,
      },
      query: {
        pageable: {
          page: 0,
          size: 1,
        },
      },
    },
  });
  return resp.data;
};

export const getUserByEmail = async (email: string) => {
  const resp = await fetchClient.GET('/api/v1/users/search', {
    params: {
      query: {
        // @ts-ignore
        page: 0,
        size: 1,
        email_eq: email,
      },
    },
  });

  if (resp.error) {
    throw new Error(resp.error.message);
  }

  if (resp.data.data?.content?.length === 0) {
    throw new Error('User not found');
  }

  return resp.data.data?.content![0];
};
