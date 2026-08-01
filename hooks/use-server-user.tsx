// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
import { redirect } from 'next/navigation';
import { auth } from '../services/auth';
import type { User } from '../services/client';
import { fetchCurrentUser } from '../services/user/current-user';

export default async function useServerUser() {
  const session = await auth();
  if (!session) {
    return redirect('/');
  }

  // Resolved from the access token rather than `?email_eq=` on the user search,
  // which is now restricted to platform admins.
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  return {
    ...user,
    id_token: session.user.id_token,
  } as User & { id_token: string };
}
