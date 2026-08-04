import type { ReactNode } from 'react';

import {
  PageHeader as DashboardPageHeader,
  type PageHeaderProps as DashboardPageHeaderProps,
} from '@/components/dashboard/page-header';

/**
 * Back-compat adapter. The implementation lives in
 * `components/dashboard/page-header.tsx`, which is the superset (it also takes
 * `className` and accepts `ReactNode` for `description`/`eyebrow`).
 *
 * This module only exists so the existing call sites that pass the singular
 * `action` prop keep working; prefer importing the canonical component directly.
 */
export interface PageHeaderProps extends Omit<DashboardPageHeaderProps, 'actions'> {
  /** @deprecated Use `actions`. */
  action?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ action, actions, ...props }: PageHeaderProps) {
  return <DashboardPageHeader {...props} actions={actions ?? action} />;
}
