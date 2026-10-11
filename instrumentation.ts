export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { getApiReadDispatcher, installApiDispatcher } = await import(
    '@/lib/server/api-dispatcher'
  );
  installApiDispatcher();

  // One HEAD opens the h2 session so the first visit after a restart skips the handshake.
  const dispatcher = getApiReadDispatcher();
  const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '');
  if (dispatcher && baseUrl) {
    const init: RequestInit & { dispatcher: typeof dispatcher } = { dispatcher, method: 'HEAD' };
    fetch(`${baseUrl}/v3/api-docs`, init).catch(() => undefined);
  }
}
