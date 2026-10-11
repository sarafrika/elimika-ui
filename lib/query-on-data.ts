import { logger } from '@/lib/logger';

type QueryFnData<TOptions> = TOptions extends { queryFn?: infer TFn }
  ? TFn extends (...args: never[]) => infer TResult
    ? Awaited<TResult>
    : never
  : never;

/** Wraps a queryFn so `onData` runs as the response lands, before React renders it. */
export function withOnData<TOptions extends { queryFn?: unknown }>(
  options: TOptions,
  onData: (data: QueryFnData<TOptions>) => void
): TOptions {
  const queryFn = options.queryFn;
  if (typeof queryFn !== 'function') return options;
  return {
    ...options,
    queryFn: async (context: unknown) => {
      const data = await queryFn(context);
      try {
        onData(data);
      } catch (error) {
        logger.warn('Dependent prefetch failed to start', { error });
      }
      return data;
    },
  };
}
