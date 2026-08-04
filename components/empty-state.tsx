import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState as UiEmptyState } from '@/components/ui/empty-state';

/**
 * Back-compat adapter. The implementation lives in
 * `components/ui/empty-state.tsx` (the canonical `EmptyState` named in AGENTS.md).
 *
 * That component defaults to a dashed-border card, whereas this one has always
 * rendered a bare centred block, so it pins `variant='plain'` to keep the
 * existing call sites pixel-identical. Prefer importing the canonical component
 * directly and choosing a variant explicitly.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState(props: EmptyStateProps) {
  return <UiEmptyState {...props} variant='plain' />;
}
