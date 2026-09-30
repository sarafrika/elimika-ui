/**
 * Error interceptor for the generated HeyAPI client.
 *
 * The client resolves a failed request to the parsed response body, which carries no
 * HTTP status, so callers could not tell a 403 from a 503. This interceptor stamps the
 * response `status` onto every error. Read it through `lib/api-errors.ts`.
 *
 * It is installed on the client by `services/client/client.gen.ts`; the line is added by
 * `post-generation-fix.mjs`, so it survives `pnpm openapi-ts`. It must not import the
 * client itself, or the two modules would import each other.
 */
export function attachErrorStatus(error: unknown, response: Response): unknown {
  const status = response.status;

  if (typeof error === 'object' && error !== null && !Array.isArray(error)) {
    return { ...error, status };
  }

  // A plain-text or empty body (a gateway page, a proxy timeout). Keep the text out of
  // `message` so toasts fall back to their own copy instead of printing HTML.
  return { status, body: typeof error === 'string' ? error : undefined };
}
