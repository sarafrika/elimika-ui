const GLOBAL_DISPATCHER = Symbol.for('undici.globalDispatcher.1');

type DispatcherConstructor = new (options: Record<string, number>) => unknown;

// Keep upstream sockets alive past Node's 4 s default so proxied and SSR API calls
// reuse TLS connections. Uses Node's bundled undici; any surprise leaves fetch as is.
async function installKeepAliveDispatcher() {
  const { logger } = await import('@/lib/logger');
  try {
    await fetch('data:,');
    const store = globalThis as unknown as Record<symbol, unknown>;
    const current = store[GLOBAL_DISPATCHER];
    const Agent =
      current && typeof current === 'object'
        ? (current.constructor as DispatcherConstructor | undefined)
        : undefined;
    if (typeof Agent !== 'function' || Agent.name !== 'Agent') {
      logger.warn('keep-alive dispatcher not installed: global dispatcher is not an Agent');
      return;
    }
    store[GLOBAL_DISPATCHER] = new Agent({
      keepAliveTimeout: 30_000,
      keepAliveMaxTimeout: 120_000,
      connections: 64,
    });
  } catch (error) {
    logger.warn('keep-alive dispatcher not installed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  await installKeepAliveDispatcher();
}
