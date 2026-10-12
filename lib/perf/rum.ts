import { domainFromPath } from '@/src/features/dashboard/lib/dashboard-url';

/** Wire shape of one sample; mirrors the backend RumEventRequest (snake_case). */
export type RumEvent = {
  route_template: string;
  domain?: string;
  metric: string;
  value_ms: number;
  section?: string;
  network_type?: string;
  device_class?: string;
  occurred_at: string;
};

export const RUM_ENDPOINT = '/api/rum';
export const RUM_MAX_BATCH = 50;

const FLUSH_AT = 20;
const FLUSH_INTERVAL_MS = 10_000;
const MAX_VALUE_MS = 3_600_000;
const SAMPLE_STORAGE_KEY = 'elimika.rum.sampled';
const ALL_SECTIONS_SETTLE_MS = 150;
const ID_SEGMENT =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|(?=.*\d)[A-Za-z0-9_-]{16,})$/i;

type RouteState = {
  pathname: string;
  template: string;
  domain?: string;
  startedAt: number;
  pending: Set<string>;
  firstSectionSent: boolean;
  allSectionsSent: boolean;
  settleTimer?: ReturnType<typeof setTimeout>;
};

type SectionState = { name: string; startedAt: number };

const isBrowser = () => typeof window !== 'undefined';

let queue: RumEvent[] = [];
let sampled: boolean | undefined;
let route: RouteState | undefined;
let navStartedAt: number | undefined;
let shellPainted = false;
let listenersInstalled = false;
const sections = new Map<string, SectionState>();

/** Replaces id-like path segments (uuids, numbers, long tokens) with `[id]`. */
export function routeTemplate(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '/';
  const template = path
    .split('/')
    .map(segment => (segment && ID_SEGMENT.test(segment) ? '[id]' : segment))
    .join('/');
  return template.length > 255 ? template.slice(0, 255) : template || '/';
}

/** NEXT_PUBLIC_RUM_SAMPLE_RATE (0..1) wins; otherwise 100% off-production and 20% in production. */
export function rumSampleRate(hostname: string): number {
  const configured = Number.parseFloat(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE ?? '');
  if (Number.isFinite(configured)) return Math.min(1, Math.max(0, configured));
  const nonProduction =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('staging');
  return nonProduction ? 1 : 0.2;
}

function isSampled(): boolean {
  if (sampled !== undefined) return sampled;
  if (!isBrowser()) return false;
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(SAMPLE_STORAGE_KEY);
  } catch {
    stored = null;
  }
  sampled = stored ? stored === '1' : Math.random() < rumSampleRate(window.location.hostname);
  try {
    window.sessionStorage.setItem(SAMPLE_STORAGE_KEY, sampled ? '1' : '0');
  } catch {
    // Storage blocked: the decision still holds for this page load.
  }
  return sampled;
}

type NavigatorExtras = Navigator & {
  connection?: { effectiveType?: string };
  deviceMemory?: number;
  userAgentData?: { mobile?: boolean };
};

function networkType(): string | undefined {
  return (navigator as NavigatorExtras).connection?.effectiveType?.slice(0, 32);
}

/** Coarse form factor plus a `-low` suffix for low-memory / low-core devices (the P99 tail). */
function deviceClass(): string {
  const nav = navigator as NavigatorExtras;
  const width = window.innerWidth;
  const form =
    nav.userAgentData?.mobile || width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
  const low =
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2);
  return low ? `${form}-low` : form;
}

function currentRoute(): RouteState {
  const pathname = window.location.pathname;
  if (route?.pathname === pathname) return route;
  const softNavigation = route !== undefined;
  if (route?.settleTimer) clearTimeout(route.settleTimer);
  const now = performance.now();
  const startedAt = softNavigation ? (navStartedAt ?? now) : 0;
  route = {
    pathname,
    template: routeTemplate(pathname),
    domain: domainFromPath(pathname) ?? undefined,
    startedAt,
    pending: new Set(),
    firstSectionSent: false,
    allSectionsSent: false,
  };
  navStartedAt = undefined;
  sections.clear();
  if (softNavigation) push('route_change_complete', now - startedAt);
  return route;
}

function push(metric: string, valueMs: number, section?: string) {
  if (!isBrowser() || !isSampled() || !Number.isFinite(valueMs)) return;
  installListeners();
  const state = currentRoute();
  queue.push({
    route_template: state.template,
    domain: state.domain,
    metric,
    value_ms: Math.min(MAX_VALUE_MS, Math.max(0, Math.round(valueMs * 10) / 10)),
    section: section?.slice(0, 128),
    network_type: networkType(),
    device_class: deviceClass(),
    occurred_at: new Date().toISOString(),
  });
  if (queue.length >= FLUSH_AT) flushRum();
}

/** Sends the queue with sendBeacon (falls back to keepalive fetch); safe to call any time. */
export function flushRum() {
  if (!isBrowser() || queue.length === 0) return;
  while (queue.length > 0) {
    const batch = queue.slice(0, RUM_MAX_BATCH);
    queue = queue.slice(RUM_MAX_BATCH);
    const body = JSON.stringify({ events: batch });
    let sent = false;
    try {
      sent = navigator.sendBeacon?.(RUM_ENDPOINT, new Blob([body], { type: 'application/json' }));
    } catch {
      sent = false;
    }
    if (!sent) {
      void fetch(RUM_ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'content-type': 'application/json' },
      }).catch(() => undefined);
    }
  }
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushRum();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flushRum);
  // Soft navigations start at the click/back press, before the router swaps the pathname.
  document.addEventListener(
    'click',
    event => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (anchor instanceof HTMLAnchorElement && anchor.origin === window.location.origin) {
        navStartedAt = performance.now();
      }
    },
    { capture: true }
  );
  window.addEventListener('popstate', () => {
    navStartedAt = performance.now();
  });
  setInterval(flushRum, FLUSH_INTERVAL_MS);
}

/** Records a web-vital; CLS is unitless so it is sent as score x 1000 to fit `value_ms`. */
export function reportWebVital(name: string, value: number) {
  if (name === 'CLS') push('CLS', value * 1000);
  else if (name === 'LCP' || name === 'INP' || name === 'TTFB') push(name, value);
}

/** Called by the router-aware reporter so route changes are timed even on pages without sections. */
export function notifyRouteChange() {
  if (isBrowser() && isSampled()) {
    installListeners();
    currentRoute();
  }
}

/** First paint of the dashboard shell (sidebar + header), once per hard load. */
export function markShellPainted() {
  if (shellPainted || !isBrowser()) return;
  shellPainted = true;
  requestAnimationFrame(() => push('shell_painted', performance.now()));
}

export function sectionStart(id: string, name: string) {
  if (!isBrowser() || !isSampled()) return;
  const state = currentRoute();
  if (state.settleTimer) clearTimeout(state.settleTimer);
  state.pending.add(id);
  sections.set(id, { name, startedAt: performance.now() });
}

function settle(id: string, metric: 'section_data' | 'section_error') {
  if (!isBrowser() || !isSampled()) return;
  const section = sections.get(id);
  const state = currentRoute();
  if (!section || !state.pending.delete(id)) return;
  sections.delete(id);
  const now = performance.now();
  push(metric, now - section.startedAt, section.name);
  if (metric === 'section_data' && !state.firstSectionSent) {
    state.firstSectionSent = true;
    push('first_section_data', now - state.startedAt);
  }
  if (state.pending.size === 0 && !state.allSectionsSent) {
    // Wait briefly: nested sections often mount right after their parent resolves.
    state.settleTimer = setTimeout(() => {
      if (route !== state || state.pending.size > 0 || state.allSectionsSent) return;
      state.allSectionsSent = true;
      push('all_sections_data', now - state.startedAt);
    }, ALL_SECTIONS_SETTLE_MS);
  }
}

export const sectionData = (id: string) => settle(id, 'section_data');
export const sectionError = (id: string) => settle(id, 'section_error');

/** A section unmounted before its data arrived: forget it without reporting. */
export function sectionAbandoned(id: string) {
  if (!sections.delete(id)) return;
  route?.pending.delete(id);
}

