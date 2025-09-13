'use client';

import menu, { MenuItem } from '@/lib/menu';
import { usePathname } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type BreadcrumbItem = {
  id: string;
  title: string;
  url: string | null;
  isLast?: boolean;
};

type BreadcrumbContextType = {
  breadcrumbs: BreadcrumbItem[];
  addBreadcrumb: (title: string, url?: string | null) => void;
  removeBreadcrumb: (id: string) => void;
  removeLastBreadcrumb: () => void;
  clearBreadcrumbs: () => void;
  replaceBreadcrumbs: (newBreadcrumbs: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

const generateId = () => `breadcrumb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const findMenuPathByUrlInSources = (
  sources: Record<string, MenuItem[]>,
  url: string
): MenuItem[] | null => {
  for (const sourceKey in sources) {
    const result = findMenuPathByUrl(sources[sourceKey] || [], url);
    if (result) return result;
  }

  return null;
};

const findMenuPathByUrl = (
  menuItems: MenuItem[],
  url: string,
  path: MenuItem[] = []
): MenuItem[] | null => {
  for (const item of menuItems) {
    const currentPath = [...path, item];

    if (item.url === url) {
      return currentPath;
    }

    if (item.items && item.items.length > 0) {
      const foundPath = findMenuPathByUrl(item.items, url, currentPath);
      if (foundPath) return foundPath;
    }
  }

  return null;
};

const convertMenuToBreadcrumbs = (menuItems: MenuItem[]): BreadcrumbItem[] => {
  return menuItems.map((item, index) => ({
    id: generateId(),
    title: item.title,
    url: item.url || null,
    isLast: index === menuItems.length - 1,
  }));
};

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const replaceBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    const dashboardBreadcrumb: BreadcrumbItem = {
      id: 'dashboard',
      title: 'Dashboard',
      url: '/dashboard/overview',
      isLast: false,
    };

    if (newBreadcrumbs.length === 1 && newBreadcrumbs[0]?.url === '/dashboard/overview') {
      setBreadcrumbs(newBreadcrumbs);
      return;
    }

    if (newBreadcrumbs[0]?.id === 'dashboard') {
      setBreadcrumbs(newBreadcrumbs);
      return;
    }

    setBreadcrumbs([dashboardBreadcrumb, ...newBreadcrumbs]);
  }, []);

  useEffect(() => {
    if (pathname) {
      const menuPath = findMenuPathByUrlInSources(menu, pathname);

      if (menuPath && menuPath.length > 0) {
        const newBreadcrumbs = convertMenuToBreadcrumbs(menuPath);
        replaceBreadcrumbs(newBreadcrumbs);
        return;
      }

      if (pathname.startsWith('/dashboard')) {
        replaceBreadcrumbs([
          {
            id: 'overview',
            title: 'Overview',
            url: '/dashboard/overview',
            isLast: true,
          },
        ]);
      }
    }
  }, [pathname, replaceBreadcrumbs]);

  const addBreadcrumb = useCallback((title: string, url?: string | null) => {
    setBreadcrumbs(prev => {
      const updatedBreadcrumbs = prev.map(breadcrumb => ({
        ...breadcrumb,
        isLast: false,
      }));

      return [
        ...updatedBreadcrumbs,
        {
          id: generateId(),
          title,
          url: url || null,
          isLast: true,
        },
      ];
    });
  }, []);

  const removeBreadcrumb = useCallback((id: string) => {
    setBreadcrumbs(prev => {
      const filteredBreadcrumbs = prev.filter(breadcrumb => breadcrumb.id !== id);

      if (filteredBreadcrumbs.length > 0) {
        return filteredBreadcrumbs.map((breadcrumb, index) => ({
          ...breadcrumb,
          isLast: index === filteredBreadcrumbs.length - 1,
        }));
      }

      return [];
    });
  }, []);

  const removeLastBreadcrumb = useCallback(() => {
    setBreadcrumbs(prev => {
      if (prev.length > 0) {
        const newBreadcrumbs = prev.slice(0, -1);

        if (newBreadcrumbs.length > 0) {
          const lastIndex = newBreadcrumbs.length - 1;
          const lastItem = newBreadcrumbs[lastIndex];
          if (lastItem) {
            newBreadcrumbs[lastIndex] = {
              ...lastItem,
              isLast: true,
            };
          }
        }

        return newBreadcrumbs;
      }
      return prev;
    });
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const value = useMemo(
    () => ({
      breadcrumbs,
      addBreadcrumb,
      removeBreadcrumb,
      removeLastBreadcrumb,
      clearBreadcrumbs,
      replaceBreadcrumbs,
    }),
    [
      breadcrumbs,
      addBreadcrumb,
      removeBreadcrumb,
      removeLastBreadcrumb,
      clearBreadcrumbs,
      replaceBreadcrumbs,
    ]
  );

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
