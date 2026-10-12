export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { getApiHedgeDispatcher, getApiReadDispatcher, installApiDispatcher } = await import(
    '@/lib/server/api-dispatcher'
  );
  installApiDispatcher();

  // One HEAD per read pool opens the h2 session and an h1 hedge socket before the first visit.
  const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    return;
  }
  for (const dispatcher of [getApiReadDispatcher(), getApiHedgeDispatcher()]) {
    if (!dispatcher) continue;
    const init: RequestInit & { dispatcher: typeof dispatcher } = { dispatcher, method: 'HEAD' };
    fetch(`${baseUrl}/v3/api-docs`, init).catch(() => undefined);
  }
}
