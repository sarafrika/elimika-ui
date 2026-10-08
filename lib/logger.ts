type LogContext = Record<string, unknown>;

// Project logger: the one sanctioned console sink. Quiet in production builds.
function emit(level: 'error' | 'warn' | 'info', message: string, context?: LogContext) {
  if (process.env.NODE_ENV === 'production' && level !== 'error') return;
  // biome-ignore lint/suspicious/noConsole: the logger is the single console sink
  console[level](`[elimika] ${message}`, context ?? '');
}

export const logger = {
  error: (message: string, context?: LogContext) => emit('error', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
};
