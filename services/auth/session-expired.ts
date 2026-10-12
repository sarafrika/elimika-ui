/** Set by proxy.ts on the 401 it returns once a token refresh has failed. */
export const SESSION_EXPIRED_HEADER = 'x-elimika-session-expired';

let redirecting = false;

/** Sends the browser to sign in, at most once per page load, when the proxy reports a dead session. */
export function redirectIfSessionExpired(response: Response) {
  if (typeof window === 'undefined' || redirecting) return;
  if (response.status !== 401 || response.headers.get(SESSION_EXPIRED_HEADER) !== '1') return;

  redirecting = true;
  void import('next-auth/react').then(({ signIn }) =>
    signIn('keycloak', { redirectTo: window.location.href })
  );
}
