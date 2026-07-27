import type { ReactNode } from 'react';
import CreateEditBranchPanel from './_components/create-edit-branch-panel';
import type { Action } from './utils';

export default async function BranchManager({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: Action[] }>;
}) {
  const {
    slug: [action],
  } = await params;

  if (action === 'new' || action === 'edit') {
    return <CreateEditBranchPanel params={params} />;
  }

  return <>{children}</>;
}
