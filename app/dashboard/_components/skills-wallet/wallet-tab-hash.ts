/**
 * The wallet used to keep its open tab in the URL hash (`#skills`, `#credentials/<id>`).
 * It now lives in `?tab=`; this reads an old hash and says where it should go.
 */
export interface LegacyWalletHashTarget<T extends string> {
  /** The tab the hash named. */
  tab: T;
  /**
   * The hash to keep after forwarding: empty for a bare tab hash, the whole hash when it
   * points inside the tab (a credential card), so that tab can still focus it.
   */
  hash: string;
}

export function legacyWalletHashTarget<T extends string>(
  hash: string,
  tabIds: readonly T[]
): LegacyWalletHashTarget<T> | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  const [id, ...rest] = raw.split('/');
  const tab = tabIds.find(item => item === id);
  if (!tab) return null;
  const inner = rest.join('/');
  return { tab, hash: inner ? `#${raw}` : '' };
}

/** The share link for one credential card: the credentials tab, focused on that card. */
export function credentialShareHref(origin: string, pathname: string, credentialId: string) {
  return `${origin}${pathname}?tab=credentials#credentials/${encodeURIComponent(credentialId)}`;
}
