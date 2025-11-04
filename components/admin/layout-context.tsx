'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { AdminRouteId, AdminBreadcrumb } from '@/app/dashboard/@admin/_components/admin-navigation';

export type AdminPageMetadata = {
  id: AdminRouteId;
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumb[];
};

type AdminLayoutContextValue = {
  pageMeta: AdminPageMetadata | null;
  setPageMeta: (meta: AdminPageMetadata | null) => void;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | undefined>(undefined);

export function AdminLayoutProvider({
  children,
  initialMeta,
}: {
  children: ReactNode;
  initialMeta?: AdminPageMetadata | null;
}) {
  const [pageMeta, setPageMetaState] = useState<AdminPageMetadata | null>(initialMeta ?? null);

  const setPageMeta = useCallback((meta: AdminPageMetadata | null) => {
    setPageMetaState(meta);
  }, []);

  const value = useMemo(
    () => ({
      pageMeta,
      setPageMeta,
    }),
    [pageMeta, setPageMeta]
  );

  return <AdminLayoutContext.Provider value={value}>{children}</AdminLayoutContext.Provider>;
}

export function useAdminLayout() {
  const context = useContext(AdminLayoutContext);

  if (!context) {
    throw new Error('useAdminLayout must be used within an AdminLayoutProvider');
  }

  return context;
}
