// React 19.2 holds streamed Suspense content until the first animation frame ($RT unset),
// so a page in a throttled or busy tab hydrated, and fetched, only after a paint.
// Seeding $RT reveals completed boundaries at parse time; later ones keep the 300 ms batch.
const SEED_SCRIPT = 'typeof $RT!=="number"&&(self.$RT=-1e9)';

/** Rendered in the root <head>, so it runs before any streamed boundary completes. */
export function StreamRevealSeed() {
  return <script dangerouslySetInnerHTML={{ __html: SEED_SCRIPT }} />;
}
