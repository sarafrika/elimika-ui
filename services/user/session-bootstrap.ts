import type { SessionBootstrap } from '@/services/client';
import { getSessionBootstrap } from '@/services/client/sdk.gen';

// Set once the API answers 404, so later profile refetches go straight to the old calls.
let bootstrapUnavailable = false;

// The shell's one-call bootstrap: user, role profile ids, active organisation, wallet and
// unread counts. Null means "use the per-resource calls instead" (404, error or empty body).
export async function fetchSessionBootstrap(signal?: AbortSignal): Promise<SessionBootstrap | null> {
  if (bootstrapUnavailable) return null;

  const { data, error, response } = await getSessionBootstrap({
    security: [{ scheme: 'bearer', type: 'http' }],
    ...(signal ? { signal } : {}),
    next: { revalidate: 0 },
  }).catch(() => ({ data: undefined, error: true, response: undefined }));

  if (response?.status === 404) {
    bootstrapUnavailable = true;
    return null;
  }
  if (error || !data?.data?.user) return null;
  return data.data;
}
