/**
 * Pure helpers behind form section tabs: which tab a failing field lives on, how many
 * errors each tab holds, and which tab a failed save should open. No React here, so the
 * mapping is unit-tested on its own; `useTabErrors` wires it to react-hook-form.
 */

/**
 * Where a field lives. A record is matched by the longest key that equals the field path
 * or prefixes it at a `.` boundary (`address` covers `address.city` and `address.0.line`);
 * a function gets the full dotted path.
 */
export type FieldToTab<T extends string> =
  | Readonly<Record<string, T>>
  | ((path: string) => T | null | undefined);

/** react-hook-form's error tree, kept structural so this file has no library import. */
type ErrorTree = { readonly [key: string]: unknown } | readonly unknown[];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** A leaf error carries a `type` (and usually a `message`); anything else is a branch. */
const isLeafError = (value: Record<string, unknown>) =>
  typeof value.type === 'string' || typeof value.message === 'string';

/**
 * Every failing field as a dotted path, in the error tree's own order (react-hook-form
 * and zod both follow the schema, so this is form order). A field array's own `root`
 * error is reported against the array.
 */
export function errorPaths(errors: ErrorTree | null | undefined, prefix = ''): string[] {
  if (!errors) return [];
  const paths: string[] = [];
  // Object.entries also walks an array's own `root` key next to its row indexes.
  for (const [key, value] of Object.entries(errors)) {
    if (!isObject(value)) continue;
    if (key === 'ref') continue;
    const path = key === 'root' && prefix ? prefix : prefix ? `${prefix}.${key}` : key;
    if (isLeafError(value)) {
      paths.push(path);
      // A field array can hold its own error next to its rows' errors.
      const nested = errorPaths(withoutLeafKeys(value), path);
      paths.push(...nested.filter(entry => entry !== path));
    } else {
      paths.push(...errorPaths(value, path));
    }
  }
  return [...new Set(paths)];
}

function withoutLeafKeys(value: Record<string, unknown>): Record<string, unknown> {
  const { type: _type, message: _message, ref: _ref, types: _types, ...rest } = value;
  return rest;
}

/** The tab a field path lives on, or null when the map does not place it. */
export function tabForField<T extends string>(path: string, fieldToTab: FieldToTab<T>): T | null {
  if (typeof fieldToTab === 'function') return fieldToTab(path) ?? null;
  let best: { key: string; tab: T } | null = null;
  for (const [key, tab] of Object.entries(fieldToTab)) {
    const matches = path === key || path.startsWith(`${key}.`);
    if (matches && (!best || key.length > best.key.length)) best = { key, tab };
  }
  return best?.tab ?? null;
}

/** How many failing fields each tab holds. Tabs without errors are left out. */
export function tabErrorCounts<T extends string>(
  paths: readonly string[],
  fieldToTab: FieldToTab<T>
): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const path of paths) {
    const tab = tabForField(path, fieldToTab);
    if (tab) counts[tab] = (counts[tab] ?? 0) + 1;
  }
  return counts;
}

/**
 * Where a failed save should land: the first tab, in the page's tab order, holding an
 * error, and the first failing field on it. Null when no failing field maps to a tab.
 */
export function firstTabError<T extends string>(
  paths: readonly string[],
  tabOrder: readonly T[],
  fieldToTab: FieldToTab<T>
): { tab: T; field: string } | null {
  const firstByTab = new Map<T, string>();
  for (const path of paths) {
    const tab = tabForField(path, fieldToTab);
    if (tab && !firstByTab.has(tab)) firstByTab.set(tab, path);
  }
  for (const tab of tabOrder) {
    const field = firstByTab.get(tab);
    if (field) return { tab, field };
  }
  return null;
}

/** "1 error" / "3 errors", for the badge's accessible description. */
export function errorCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'error' : 'errors'}`;
}
