import { NextRequest, NextResponse } from 'next/server';
import { getServerApiBaseUrl } from '@/services/api/base-url';
import { auth } from '@/services/auth';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;
const MAX_EVENTS = 50;
const BACKEND_MISSING_BACKOFF_MS = 5 * 60 * 1000;
const METRIC_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;

// Set when the backend has no RUM endpoint yet (404/405): samples are dropped until it expires.
let backendMissingUntil = 0;

type RumWireEvent = Record<string, unknown>;

const optionalString = (value: unknown, max: number) =>
  typeof value === 'string' && value.length > 0 ? value.slice(0, max) : undefined;

function sanitizeEvent(raw: unknown, appVersion?: string): RumWireEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const event = raw as RumWireEvent;
  const routeTemplate = optionalString(event.route_template, 255);
  const metric = typeof event.metric === 'string' ? event.metric : '';
  const value = event.value_ms;
  const occurredAt = optionalString(event.occurred_at, 40);
  if (!routeTemplate || !METRIC_PATTERN.test(metric) || !occurredAt) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 3_600_000) {
    return null;
  }
  if (Number.isNaN(Date.parse(occurredAt))) return null;
  return {
    route_template: routeTemplate,
    domain: optionalString(event.domain, 64),
    metric,
    value_ms: value,
    section: optionalString(event.section, 128),
    network_type: optionalString(event.network_type, 32),
    device_class: optionalString(event.device_class, 32),
    app_version: appVersion,
    occurred_at: occurredAt,
  };
}

function parseEvents(body: string): RumWireEvent[] {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const events = (parsed as { events?: unknown }).events;
    if (!Array.isArray(events)) return [];
    const appVersion = optionalString(process.env.NEXT_PUBLIC_APP_VERSION, 64);
    return events
      .slice(0, MAX_EVENTS)
      .map(event => sanitizeEvent(event, appVersion))
      .filter((event): event is RumWireEvent => event !== null);
  } catch {
    return [];
  }
}

/** Beacon sink: validates the batch and forwards it to POST /api/v1/perf/rum; always 204. */
export async function POST(request: NextRequest) {
  const accepted = new NextResponse(null, { status: 204 });
  if (Date.now() < backendMissingUntil) return accepted;

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return accepted;
  const body = await request.text();
  if (body.length === 0 || body.length > MAX_BODY_BYTES) return accepted;
  const events = parseEvents(body);
  if (events.length === 0) return accepted;

  try {
    const headers = new Headers({ 'content-type': 'application/json' });
    const session = await auth().catch(() => null);
    const accessToken = session?.user?.accessToken;
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    const clientIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for');
    if (clientIp) headers.set('x-forwarded-for', clientIp);

    const response = await fetch(`${getServerApiBaseUrl()}/api/v1/perf/rum`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404 || response.status === 405) {
      backendMissingUntil = Date.now() + BACKEND_MISSING_BACKOFF_MS;
    }
  } catch {
    // Monitoring must never fail the page; a lost batch is acceptable.
  }
  return accepted;
}
