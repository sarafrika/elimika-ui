'use server';

import { auth } from '@/services/auth';
import { fetchCurrentUser } from '@/services/user/current-user';

/**
 * The caller's own user record.
 *
 * Previously a `?email_eq=` query against `/api/v1/users/search`, which is now restricted to
 * platform admins — identity comes from the access token instead. `getUserByEmail`, which looked
 * up an arbitrary account by address, went with it: nothing called it and no ordinary caller may
 * do that any more.
 */
export const getUserProfile = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: 'User not found',
      data: null,
    };
  }

  const user = await fetchCurrentUser();
  if (!user) {
    return {
      error: 'User not found',
      data: null,
    };
  }

  return { error: null, data: user };
};
