// One hue per discipline, so the catalogue reads as a spectrum rather than a
// grid of one blue. Each entry only sets `--tone`; everything downstream mixes
// against it, so a wash, a dot and an ink share a single definition.
const TONE_CLASSES = [
  '[--tone:var(--el-brand-700)] dark:[--tone:var(--el-brand-300)]',
  '[--tone:color-mix(in_oklch,var(--el-accent-amber)_55%,var(--el-neutral-950))] dark:[--tone:var(--el-accent-amber)]',
  '[--tone:color-mix(in_oklch,var(--el-accent-jade)_55%,var(--el-neutral-950))] dark:[--tone:var(--el-accent-jade)]',
  '[--tone:color-mix(in_oklch,var(--el-accent-iris)_80%,var(--el-neutral-950))] dark:[--tone:var(--el-accent-iris)]',
  '[--tone:var(--el-highlight-700)] dark:[--tone:var(--el-highlight-400)]',
  '[--tone:color-mix(in_oklch,var(--el-accent-blush)_62%,var(--el-neutral-950))] dark:[--tone:var(--el-accent-blush)]',
] as const;

// The brand hue. Used for "All courses" and wherever a discipline is unknown.
export const BRAND_TONE = TONE_CLASSES[0];

// Categories arrive from the API, so a hue cannot be hardcoded per name. It is
// hashed from the name instead: stable for a category across the page and
// across renders, and spread over the ramp.
export const toneFor = (seed: string | null) => {
  if (!seed) {
    return BRAND_TONE;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return TONE_CLASSES[1 + (hash % (TONE_CLASSES.length - 1))] ?? BRAND_TONE;
};

/** Surfaces that mix against `--tone`. Paired with a `toneFor(...)` class. */
export const TONE_WASH = 'bg-[color-mix(in_oklch,var(--tone)_13%,var(--card))]';
export const TONE_DOTS =
  'bg-[radial-gradient(var(--tone)_1px,transparent_1px)] bg-[length:13px_13px] opacity-50';
export const TONE_INK = 'text-[var(--tone)]';
export const TONE_FILL = 'bg-[var(--tone)]';
export const TONE_ON_FILL = 'text-[var(--el-neutral-0)] dark:text-[var(--el-neutral-950)]';
export const TONE_PANEL =
  'bg-[color-mix(in_oklch,var(--tone)_7%,var(--card))] border-[color-mix(in_oklch,var(--tone)_28%,var(--border))]';
