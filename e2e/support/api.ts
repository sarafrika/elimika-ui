import type { Page, Request } from '@playwright/test';

type Handler = (request: Request, match: RegExpMatchArray) => unknown | Promise<unknown>;
type Route = { method: string; pattern: RegExp; handler: Handler };

export type ApiCall = { method: string; path: string; search: string; body: unknown };

/** Answers the browser's /api/proxy calls from fixtures and records every call for assertions. */
export class MockApi {
  private readonly routes: Route[] = [];
  readonly calls: ApiCall[] = [];
  readonly unmatched: string[] = [];

  // Overloads keep the request typed when a handler function is passed.
  on(method: string, pattern: RegExp, handler: Handler): this;
  on(method: string, pattern: RegExp, data: unknown): this;
  on(method: string, pattern: RegExp, handler: unknown) {
    const fn: Handler = typeof handler === 'function' ? (handler as Handler) : () => handler;
    this.routes.unshift({ method: method.toUpperCase(), pattern, handler: fn });
    return this;
  }

  get(pattern: RegExp, handler: Handler): this;
  get(pattern: RegExp, data: unknown): this;
  get(pattern: RegExp, handler: unknown) {
    return this.on('GET', pattern, handler);
  }

  async install(page: Page) {
    await page.route('**/api/proxy/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/api\/proxy/, '');
      let body: unknown = null;
      try {
        body = request.postDataJSON();
      } catch {
        body = request.postData();
      }
      this.calls.push({ method: request.method(), path, search: url.search, body });
      const found = this.routes.find(r => r.method === request.method() && r.pattern.test(path));
      if (!found) {
        this.unmatched.push(`${request.method()} ${path}`);
        return route.fulfill({ status: 200, json: { success: true, data: null } });
      }
      const result = await found.handler(request, path.match(found.pattern) as RegExpMatchArray);
      return route.fulfill({ status: 200, json: ok(result) });
    });
  }

  callsTo(method: string, pattern: RegExp) {
    return this.calls.filter(c => c.method === method.toUpperCase() && pattern.test(c.path));
  }
}

const RAW = Symbol('raw');

/** Sends the body exactly as given, for the few endpoints that do not use the ApiResponse envelope. */
export function raw(data: unknown) {
  return { [RAW]: data };
}

/** Wraps data in the backend's ApiResponse envelope unless it already is one, or is raw(). */
export function ok(data: unknown) {
  if (data && typeof data === 'object' && RAW in (data as Record<symbol, unknown>)) {
    return (data as Record<symbol, unknown>)[RAW];
  }
  if (data && typeof data === 'object' && 'success' in (data as Record<string, unknown>)) return data;
  return { success: true, data, message: 'ok' };
}

export function paged<T>(content: T[]) {
  return { content, metadata: { pageNumber: 0, pageSize: content.length, totalElements: content.length, totalPages: 1, hasNext: false, hasPrevious: false, first: true, last: true } };
}
