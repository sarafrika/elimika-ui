'use client';

import type { ReactNode } from 'react';
import { type Control, type FieldPath, type FieldValues, useWatch } from 'react-hook-form';

/**
 * Subscribes to a single form field and re-renders only this component when it
 * changes. Use instead of `form.watch(name)` in render — `watch` subscribes
 * the entire form component, causing a whole-form re-render per keystroke.
 */
export function WatchedValue<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  children,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  children: (value: unknown) => ReactNode;
}) {
  const value = useWatch({ control, name });
  return <>{children(value)}</>;
}

export function WatchedText<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  fallback,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  fallback: string;
}) {
  const value = useWatch({ control, name });
  return <>{typeof value === 'string' && value ? value : fallback}</>;
}
