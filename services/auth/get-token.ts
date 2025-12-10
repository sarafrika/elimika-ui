/**
 * Resolve the current user's access token in both client and server environments.
 *
 * - On the server, we defer importing `auth()` to avoid bundling server-only code in the client.
 * - On the client, we fall back to `next-auth` session (which already includes the access token).
 */
export const getAuthToken = async (): Promise<string | undefined> => {
  // Server-side: use the NextAuth `auth()` helper
  if (typeof window === 'undefined') {
    const { auth } = await import('.');
    const session = await auth();
    return session?.user?.accessToken as string | undefined;
  }

  // Client-side: read the session via next-auth
  const { getSession } = await import('next-auth/react');
  const session = await getSession();
  return session?.user?.accessToken as string | undefined;
};
