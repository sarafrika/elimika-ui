'use client';

import { useEffect } from 'react';
import { AdminPageMetadata, useAdminLayout } from './layout-context';

export function AdminPageRegister({ meta }: { meta: AdminPageMetadata }) {
  const { setPageMeta } = useAdminLayout();

  useEffect(() => {
    setPageMeta(meta);
    return () => {
      setPageMeta(null);
    };
  }, [meta, setPageMeta]);

  return null;
}
