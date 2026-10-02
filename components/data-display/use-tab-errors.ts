'use client';

import { useCallback } from 'react';
import {
  type FieldErrors,
  type FieldValues,
  type UseFormReturn,
  useFormState,
} from 'react-hook-form';

import { errorPaths, type FieldToTab, firstTabError, tabErrorCounts } from './tab-errors';

const MAX_FOCUS_FRAMES = 30;

/**
 * Focuses a field once its tab panel is showing. The tab switch goes through the URL, so
 * the panel can stay hidden for a few frames; a hidden input cannot take focus.
 */
function focusWhenVisible(field: string) {
  if (typeof window === 'undefined') return;
  let frames = 0;
  const attempt = () => {
    const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(field)}"]`);
    const target =
      byName && byName.offsetParent !== null
        ? byName
        : Array.from(document.querySelectorAll<HTMLElement>('[aria-invalid="true"]')).find(
            element => element.offsetParent !== null
          );
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    frames += 1;
    if (frames < MAX_FOCUS_FRAMES) window.requestAnimationFrame(attempt);
  };
  window.requestAnimationFrame(attempt);
}

/**
 * Ties a react-hook-form form to its section tabs. `counts` feeds `SectionTabs`'
 * `errorCounts`, so a tab holding a failing field shows a badge; pass `onInvalid` as
 * `handleSubmit`'s second argument, so a failed save opens the first tab (in tab order)
 * with an error and focuses its first failing field.
 *
 * Keep the panels mounted (`SectionTabPanel` force-mounts them), or fields on a closed
 * tab unregister and their values and validation are lost.
 */
export function useTabErrors<TValues extends FieldValues, T extends string>(
  form: UseFormReturn<TValues>,
  {
    fieldToTab,
    tabs,
    onTabChange,
  }: {
    /** Which tab each field lives on; see `FieldToTab`. Keep it module-level. */
    fieldToTab: FieldToTab<T>;
    /** The tab ids in the order they are shown. */
    tabs: readonly T[];
    /** Opens a tab: usually `useSectionTab`'s `setValue`. */
    onTabChange: (tab: T) => void;
  }
) {
  // Subscribing here re-renders the tab strip when errors change, not the whole form.
  const { errors } = useFormState({ control: form.control });
  const counts = tabErrorCounts(errorPaths(errors), fieldToTab);

  const onInvalid = useCallback(
    (invalid: FieldErrors<TValues>) => {
      const target = firstTabError(errorPaths(invalid), tabs, fieldToTab);
      if (!target) return;
      onTabChange(target.tab);
      focusWhenVisible(target.field);
    },
    [tabs, fieldToTab, onTabChange]
  );

  return { counts, onInvalid } as const;
}
