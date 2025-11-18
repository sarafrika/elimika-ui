import type { ReactNode } from 'react';
import type { Action } from './utils';

export default async function BranchManager({
  children,
  params,
  ...props
}: {
  children: ReactNode;
  params: Promise<{ slug: Action[] }>;
  createedit: ReactNode;
}) {
  const {
    slug: [action],
  } = await params;

  if (action === 'new' || action === 'edit') {
    return <>{props.createedit}</>;
  }

  return <>{children}</>;
}
