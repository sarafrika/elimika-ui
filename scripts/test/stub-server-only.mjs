import { registerHooks } from 'node:module';

const EMPTY_MODULE = new URL('./empty-module.cjs', import.meta.url).href;

/**
 * `server-only` is resolved by Next's bundler, never installed as a package, so plain
 * Node cannot load any module that (transitively) imports it — including the generated
 * API client, whose auth token helper is a server action. Unit tests run outside Next,
 * where the guard has nothing to guard: resolve it to an empty module.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') {
      return { url: EMPTY_MODULE, format: 'commonjs', shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
