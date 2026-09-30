/**
 * Whether the search index answered 503 recently. Shared by every search surface: when
 * the engine is down it is down for all of them, so one 503 keeps `q` off every request
 * for a minute instead of each list discovering it separately.
 */
export const SEARCH_UNAVAILABLE_COOLDOWN_MS = 60_000;

let unavailableUntil = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function markSearchUnavailable(now = Date.now()) {
  const until = now + SEARCH_UNAVAILABLE_COOLDOWN_MS;
  if (until <= unavailableUntil) return;
  unavailableUntil = until;
  emit();
  setTimeout(emit, SEARCH_UNAVAILABLE_COOLDOWN_MS + 50);
}

/** "Try again": let the next request carry `q` again. */
export function clearSearchUnavailable() {
  if (unavailableUntil === 0) return;
  unavailableUntil = 0;
  emit();
}

export function isSearchMarkedUnavailable(now = Date.now()) {
  return now < unavailableUntil;
}

export function subscribeSearchAvailability(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
